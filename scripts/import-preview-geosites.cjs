// Importação aditiva exclusiva de development-seridotour. Sem .env automático ou DDL.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.join(__dirname, '../apps/backend/package.json'));
const { PrismaClient } = backendRequire('@prisma/client');
const catalog = require('../apps/frontend/src/data/geossitios-preview.json');
const originalIds = [
  'fa163d91-ca6e-4160-9683-fd5dd5be4d60', '9cfc7d76-6227-47eb-a1ac-4d9bd8025290',
  '4636cf20-962d-4d4a-8370-27f35e0c4b52', 'a6f1c1ab-695c-4404-81c0-71ac90e30526',
  '99b7e56b-080c-4ea5-bf70-857a61c49b55', 'f380d9dd-bbe8-41a9-8192-56d0ac71ebba',
];
const jsonValue = value => JSON.parse(JSON.stringify(value));

function stableId(sourceKey) {
  const namespace = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex'); // UUID namespace URL
  const hash = crypto.createHash('sha1').update(namespace)
    .update(`https://seridotour.vercel.app/catalog/${sourceKey}`).digest();
  hash[6] = (hash[6] & 15) | 80;
  hash[8] = (hash[8] & 63) | 128;
  const h = hash.subarray(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function rowsFromCatalog() {
  assert.equal(catalog.targetEnvironment, 'preview');
  assert.equal(catalog.status, 'reviewed_for_preview');
  assert.equal(catalog.places.length, 21);
  assert.equal(new Set(catalog.places.map(p => p.sourceKey)).size, 21);
  return catalog.places.map((p, index) => {
    assert.equal(p.sourceOrder, index + 1);
    assert.equal(p.id, stableId(p.sourceKey), 'Identificador estável divergente.');
    assert.ok(!originalIds.includes(p.id));
    assert.ok(p.coordinates.latitude > -7 && p.coordinates.latitude < -5);
    assert.ok(p.coordinates.longitude > -37 && p.coordinates.longitude < -36);
    assert.equal(p.coordinates.datum, 'WGS84');
    assert.equal(p.source.url, 'https://rigeo.sgb.gov.br/handle/doc/25001');
    assert.ok(['Natureza', 'Histórico'].includes(p.category));
    assert.ok(p.description.length >= 30);
    if (p.image) {
      assert.equal(p.image.visuallyReviewed, true);
      assert.ok(p.image.publicId.startsWith('seridotour/development-seridotour/places/geoparque-serido/'));
      const imageUrl = new URL(p.image.url);
      assert.equal(imageUrl.protocol, 'https:');
      assert.equal(imageUrl.hostname, 'res.cloudinary.com');
      assert.ok(imageUrl.pathname.includes('/' + p.image.publicId + '.'));
      assert.ok(['licensed', 'public_domain', 'pending'].includes(p.image.permissionStatus));
    }
    return { id: p.id, name: p.name, city: p.city, description: p.description,
      category: p.category, latitude: p.coordinates.latitude, longitude: p.coordinates.longitude, imageUrl: p.image?.url || null };
  });
}

async function inventory(db, rows) {
  const original = await db.place.findMany({ where: { id: { in: originalIds } }, orderBy: { id: 'asc' } });
  assert.ok([0, 6].includes(original.length), 'Limpeza parcial de locais antigos: revisar.');
  const existing = await db.place.findMany({ where: { id: { in: rows.map(p => p.id) } } });
  assert.ok(existing.length === 0 || existing.length === 21, 'Carga parcial inesperada: revisar antes de continuar.');
  assert.equal(await db.place.count(), original.length + existing.length, 'Inventário de locais mudou.');
  for (const place of existing) assert.deepEqual(place, rows.find(p => p.id === place.id), 'Local importado foi editado; não sobrescrever.');
  const users = await db.user.findMany({ select: { id: true, email: true, role: true }, orderBy: { email: 'asc' } });
  assert.deepEqual(users.map(({ email, role }) => ({ email, role })), [
    { email: 'GuiaTeste@gmail.com', role: 'GUIA' }, { email: 'Turistateste@gmail.com', role: 'USER' },
  ]);
  assert.equal(await db.itinerary.count(), 0);
  const reviews = await db.review.findMany({ orderBy: { id: 'asc' } });
  assert.equal(reviews.length, original.length ? 1 : 0);
  return { original, existing, users, reviews };
}

async function main() {
  const target = new URL(process.env.DATABASE_URL || '');
  assert.equal(target.hostname, 'ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech');
  assert.equal(target.pathname, '/northeastour');
  assert.ok(['postgres:', 'postgresql:'].includes(target.protocol));
  assert.ok(!target.port || target.port === '5432');
  assert.ok(['require', 'verify-full'].includes(target.searchParams.get('sslmode')));
  const rows = rowsFromCatalog();
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    const before = await inventory(prisma, rows);
    const baseline = jsonValue({ original: before.original, users: before.users, reviews: before.reviews });
    if (apply) {
      const filename = process.env.PREVIEW_CATALOG_BACKUP_FILE;
      assert.ok(filename && path.isAbsolute(filename), 'Informe arquivo absoluto privado para preservar o estado anterior.');
      try {
        const saved = JSON.parse(await fs.readFile(filename, 'utf8'));
        assert.deepEqual(saved, baseline, 'Estado anterior divergiu do registro preservado.');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        assert.equal(before.existing.length, 0, 'Reexecução exige o registro anterior original.');
        await fs.writeFile(filename, JSON.stringify(baseline, null, 2), { flag: 'wx' });
      }
      await prisma.$transaction(async tx => {
        const current = await inventory(tx, rows);
        assert.deepEqual(jsonValue({ original: current.original, users: current.users, reviews: current.reviews }), baseline);
        if (!current.existing.length) {
          for (const row of rows) await tx.place.create({ data: row });
        }
        const after = await inventory(tx, rows);
        assert.equal(after.existing.length, 21);
        assert.deepEqual(jsonValue({ original: after.original, users: after.users, reviews: after.reviews }), baseline);
      }, { isolationLevel: 'Serializable', timeout: 30000 });
    }
    console.log(JSON.stringify({ branch: 'development-seridotour', mode: apply ? 'apply' : 'dry-run',
      created: apply && !before.existing.length ? 21 : 0, wouldCreate: before.existing.length ? 0 : 21,
      alreadyPresent: before.existing.length, originalPlacesPreserved: before.original.length, reviewsPreserved: before.reviews.length, mediaUploaded: 0 }));
  } finally { await prisma.$disconnect(); }
}
if (require.main === module) main().catch(error => {
  // Mensagens de Prisma podem conter conexão; imprimir somente falhas de asserção conhecidas.
  console.error(error.code === 'ERR_ASSERTION' ? error.message : 'Importação abortada; credenciais omitidas.');
  process.exitCode = 1;
});
module.exports = { rowsFromCatalog, stableId };
