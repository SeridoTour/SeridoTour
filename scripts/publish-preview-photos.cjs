// Sem .env automático. Só development-seridotour e assets novos no prefixo de preview.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.join(__dirname, '../apps/backend/package.json'));
const { PrismaClient } = backendRequire('@prisma/client');
const { v2: cloudinary } = backendRequire('cloudinary');
const plan = require('../docs/operacao/fotos-geossitios-preview.json');
const { rowsFromCatalog } = require('./import-preview-geosites.cjs');
const catalogPath = path.join(__dirname, '../apps/frontend/src/data/geossitios-preview.json');
const prefix = 'seridotour/development-seridotour/places/geoparque-serido';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));

function verifyDestination(env) {
  const target = new URL(env.DATABASE_URL || '');
  assert.equal(target.hostname, 'ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech');
  assert.equal(target.pathname, '/northeastour');
  assert.ok(['postgres:', 'postgresql:'].includes(target.protocol));
  assert.ok(!target.port || target.port === '5432');
  assert.ok(['require', 'verify-full'].includes(target.searchParams.get('sslmode')));
  assert.equal(env.CLOUDINARY_FOLDER_PREFIX, 'seridotour/development-seridotour');
  for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) assert.ok(env[key]);
  for (const key of ['PHOTOS_SOURCE_DIR', 'PHOTOS_RECEIPT_FILE', 'PHOTOS_BACKUP_FILE']) assert.ok(path.isAbsolute(env[key] || ''));
}

function publicId(photo) {
  assert.match(photo.sourceKey, /^geoparque-serido:[a-z0-9-]+$/);
  assert.match(photo.sha256, /^[a-f0-9]{64}$/);
  return `${prefix}/${photo.sourceKey.split(':')[1]}-${photo.sha256.slice(0, 12)}`;
}

async function readJson(filename) {
  try { return JSON.parse(await fs.readFile(filename, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function saveReceipt(filename, receipt) {
  await fs.writeFile(filename + '.tmp', JSON.stringify(receipt, null, 2));
  await fs.rename(filename + '.tmp', filename);
}

async function snapshot(db) {
  return plain({
    places: await db.place.findMany({ orderBy: { id: 'asc' } }),
    users: await db.user.findMany({ select: { id: true, email: true, role: true }, orderBy: { id: 'asc' } }),
    reviews: await db.review.findMany({ orderBy: { id: 'asc' } }),
    itineraries: await db.itinerary.findMany({ orderBy: { id: 'asc' } }),
  });
}

function checkInventory(state, baseline, catalogRows, receipt) {
  assert.ok([21, 27].includes(state.places.length));
  assert.equal(state.users.length, 2);
  assert.equal(state.reviews.length, state.places.length === 21 ? 0 : 1);
  assert.equal(state.itineraries.length, 0);
  for (const row of catalogRows) {
    const current = state.places.find(p => p.id === row.id);
    assert.ok(current, 'Geossítio ausente.');
    assert.deepEqual({ ...current, imageUrl: null }, { ...row, imageUrl: null }, 'Campos do catálogo mudaram.');
    const uploaded = receipt.assets.find(asset => asset.id === row.id);
    assert.ok(current.imageUrl === null || current.imageUrl === uploaded?.url, 'Foto anterior inesperada: não substituir.');
  }
  if (baseline) {
    assert.deepEqual(state.users, baseline.users);
    assert.deepEqual(state.reviews, baseline.reviews);
    assert.deepEqual(state.itineraries, baseline.itineraries);
    const allowed = new Set(catalogRows.map(p => p.id));
    assert.deepEqual(state.places.filter(p => !allowed.has(p.id)), baseline.places.filter(p => !allowed.has(p.id)), 'Locais anteriores devem permanecer intactos.');
    assert.deepEqual(state.places.map(p => ({ ...p, imageUrl: null })), baseline.places.map(p => ({ ...p, imageUrl: null })), 'Somente imageUrl pode mudar.');
  }
}

async function compensate(prisma, assets, destroy) {
  // Uma falha de rede pode deixar o resultado do commit incerto. Não excluir assets referenciados.
  const removed = [];
  for (const asset of assets) {
    assert.ok(asset.publicId.startsWith(prefix + '/'));
    const references = await prisma.place.count({ where: { imageUrl: asset.url } })
      + await prisma.review.count({ where: { imageUrl: asset.url } });
    if (!references) {
      const result = await destroy(asset.publicId, { resource_type: 'image', type: 'upload', invalidate: false });
      assert.ok(['ok', 'not found'].includes(result.result));
      removed.push(asset.publicId);
    }
  }
  return removed;
}

async function main() {
  verifyDestination(process.env);
  assert.equal(plan.targetEnvironment, 'preview');
  assert.equal(plan.previewOnly, true);
  assert.equal(plan.photos.length, 21);
  assert.equal(new Set(plan.photos.map(photo => photo.id)).size, 21);
  const catalogRows = rowsFromCatalog();
  const apply = process.argv.includes('--apply');
  const prepare = process.argv.includes('--prepare');
  assert.ok(!(apply && prepare));
  const planHash = digest(Buffer.from(JSON.stringify(plan)));
  const receipt = await readJson(process.env.PHOTOS_RECEIPT_FILE) || { planHash, assets: [] };
  assert.equal(receipt.planHash, planHash, 'Plano mudou depois dos uploads. Revisar os assets antes de continuar.');
  const sourceDir = path.resolve(process.env.PHOTOS_SOURCE_DIR);
  for (const photo of plan.photos) {
    assert.equal(catalogRows.find(p => p.id === photo.id)?.name, photo.name);
    assert.equal(path.basename(photo.sourceFile), photo.sourceFile);
    assert.equal(photo.visuallyReviewed, true);
    assert.ok(['licensed', 'public_domain', 'pending'].includes(photo.permissionStatus));
    assert.equal(new URL(photo.sourceUrl).protocol, 'https:');
    if (photo.permissionStatus !== 'pending') assert.ok(photo.license && photo.licenseUrl);
    assert.equal(digest(await fs.readFile(path.join(sourceDir, photo.sourceFile))), photo.sha256, 'Arquivo divergiu da foto revisada.');
    publicId(photo);
  }
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  const prisma = new PrismaClient();
  const createdNow = [];
  try {
    const before = await snapshot(prisma);
    let baseline = await readJson(process.env.PHOTOS_BACKUP_FILE);
    checkInventory(before, baseline, catalogRows, receipt);
    if (!apply && !prepare) {
      console.log(JSON.stringify({ mode: 'dry-run', branch: 'development-seridotour', photos: 21,
        uploadsAlreadyRecorded: receipt.assets.length, fieldsToChange: ['Place.imageUrl'], originalPlacesPreserved: before.places.length - catalogRows.length,
        licensed: 6, permissionPending: 15 }));
      return;
    }
    if (!baseline) {
      assert.ok(before.places.filter(p => plan.photos.some(photo => photo.id === p.id)).every(p => p.imageUrl === null));
      await fs.writeFile(process.env.PHOTOS_BACKUP_FILE, JSON.stringify(before, null, 2), { flag: 'wx' });
      baseline = before;
    }
    for (const photo of plan.photos) {
      const id = publicId(photo);
      let asset = receipt.assets.find(a => a.id === photo.id);
      if (asset) {
        assert.equal(asset.publicId, id);
        assert.equal(asset.sha256, photo.sha256);
      } else {
        // Nunca adotar ou sobrescrever um asset existente que não esteja no recibo desta operação.
        try {
          await cloudinary.api.resource(id, { resource_type: 'image', type: 'upload' });
          assert.fail('Public ID já existe sem recibo desta operação.');
        } catch (error) { if ((error.http_code ?? error.error?.http_code) !== 404) throw error; }
        const result = await cloudinary.uploader.upload(path.join(sourceDir, photo.sourceFile), {
          resource_type: 'image', type: 'upload', public_id: id, asset_folder: prefix,
          overwrite: false, unique_filename: false, use_filename: false,
          tags: ['seridotour-preview', 'geoparque-serido'],
          context: { source_sha256: photo.sha256, source_url: photo.sourceUrl,
            attribution: photo.author || 'Autoria individual não informada', permission_status: photo.permissionStatus },
        });
        assert.notEqual(result.existing, true, 'Asset concorrente encontrado; não sobrescrever.');
        assert.equal(result.public_id, id);
        asset = { id: photo.id, publicId: id, url: result.secure_url, sha256: photo.sha256,
          assetId: result.asset_id, width: result.width, height: result.height, bytes: result.bytes };
        createdNow.push(asset);
        receipt.assets.push(asset);
        await saveReceipt(process.env.PHOTOS_RECEIPT_FILE, receipt);
        console.log(JSON.stringify({ uploaded: photo.sourceKey, permissionStatus: photo.permissionStatus }));
      }
      const url = new URL(asset.url);
      assert.equal(url.hostname, 'res.cloudinary.com');
      assert.equal(url.protocol, 'https:');
      assert.ok(url.pathname.includes(`/image/upload/`) && url.pathname.includes('/' + id + '.'));
      // Conferir também o arquivo efetivamente entregue; não publicar outro conteúdo sob a URL.
      const response = await fetch(asset.url, { redirect: 'error', signal: AbortSignal.timeout(30000) });
      assert.equal(response.status, 200);
      assert.equal(digest(Buffer.from(await response.arrayBuffer())), photo.sha256, 'Cloudinary alterou os bytes da foto revisada.');
    }
    if (apply) await prisma.$transaction(async tx => {
      const current = await snapshot(tx);
      checkInventory(current, baseline, catalogRows, receipt);
      for (const asset of receipt.assets) {
        const place = current.places.find(p => p.id === asset.id);
        if (place.imageUrl === asset.url) continue;
        assert.equal(place.imageUrl, null);
        const result = await tx.place.updateMany({ where: { id: asset.id, imageUrl: null }, data: { imageUrl: asset.url } });
        assert.equal(result.count, 1);
      }
      const after = await snapshot(tx);
      checkInventory(after, baseline, catalogRows, receipt);
      for (const asset of receipt.assets) assert.equal(after.places.find(p => p.id === asset.id)?.imageUrl, asset.url);
    }, { isolationLevel: 'Serializable', timeout: 30000 });
    const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf8'));
    for (const place of catalog.places) {
      const photo = plan.photos.find(p => p.id === place.id);
      const asset = receipt.assets.find(a => a.id === place.id);
      const { id, sourceKey, name, sourceFile, ...credit } = photo;
      place.image = { ...credit, url: asset.url, publicId: asset.publicId };
      if (place.imageCandidate) place.imageCandidate.status = place.imageCandidate.originalUrl === photo.originalUrl
        ? 'reviewed_and_published_in_preview' : 'replaced_by_reviewed_alternative';
    }
    await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
    receipt.databaseApplied = apply || Boolean(receipt.databaseApplied);
    await saveReceipt(process.env.PHOTOS_RECEIPT_FILE, receipt);
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'prepare', branch: 'development-seridotour', photos: 21,
      newUploads: createdNow.length, originalPlacesPreserved: baseline.places.length - catalogRows.length, reviewsPreserved: baseline.reviews.length, licensed: 6, permissionPending: 15 }));
  } catch (error) {
    if (createdNow.length) {
      try {
        const removed = await compensate(prisma, createdNow, cloudinary.uploader.destroy.bind(cloudinary.uploader));
        receipt.assets = receipt.assets.filter(a => !removed.includes(a.publicId));
        await saveReceipt(process.env.PHOTOS_RECEIPT_FILE, receipt);
        console.error(JSON.stringify({ unusedNewAssetsCompensated: removed.length }));
      } catch { console.error('Compensação não confirmada: assets preservados no recibo para reconciliação.'); }
    }
    throw error;
  } finally { await prisma.$disconnect(); }
}
if (require.main === module) main().catch(error => {
  if (error.http_code || error.error?.http_code) console.error(JSON.stringify({ cloudinaryHttpStatus: error.http_code ?? error.error.http_code }));
  console.error(error.code === 'ERR_ASSERTION' ? error.message : 'Publicação interrompida; credenciais e respostas privadas omitidas.');
  process.exitCode = 1;
});
module.exports = { verifyDestination, publicId, compensate };
