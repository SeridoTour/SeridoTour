// Por padrão, somente prévia. Nunca carrega automaticamente um .env.
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const backendRequire = createRequire(require('node:path').join(__dirname, '../apps/backend/package.json'));
const { PrismaClient } = backendRequire('@prisma/client');
const bcrypt = backendRequire('bcrypt');

async function main() {
  const target = new URL(process.env.DATABASE_URL || '');
  assert.equal(target.hostname, 'ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech', 'Use somente a conexão direta de development-seridotour.');
  assert.equal(target.pathname, '/northeastour', 'Banco inesperado.');
  assert.ok(!target.port || target.port === '5432', 'Porta inesperada.');
  assert.ok(['postgres:', 'postgresql:'].includes(target.protocol));
  assert.ok(['require', 'verify-full'].includes(target.searchParams.get('sslmode')), 'SSL obrigatório.');
  const apply = process.argv.includes('--apply');
  if (apply) {
    assert.ok(process.env.PREVIEW_BACKUP_REFERENCE, 'Informe a referência de backup verificada antes de aplicar.');
    assert.ok(process.env.TEST_PASSWORD_USER?.length >= 12, 'Forneça a senha USER fora do Git, com pelo menos 12 caracteres.');
    assert.ok(process.env.TEST_PASSWORD_GUIA?.length >= 12, 'Forneça a senha GUIA fora do Git, com pelo menos 12 caracteres.');
    const gate = await fetch('https://seridotour-api-preview.onrender.com/places', { signal: AbortSignal.timeout(15000) });
    assert.equal(gate.status, 503, 'A API de preview deve permanecer bloqueada para revisão.');
    assert.equal((await gate.json()).code, 'PREVIEW_NOT_READY');
  }
  const prisma = new PrismaClient();
  const keepEmails = ['Turistateste@gmail.com', 'GuiaTeste@gmail.com'];
  const hashes = apply ? await Promise.all([
    bcrypt.hash(process.env.TEST_PASSWORD_USER, 12),
    bcrypt.hash(process.env.TEST_PASSWORD_GUIA, 12),
  ]) : null;
  try {
    await prisma.$transaction(async (tx) => {
      const kept = await tx.user.findMany({ where: { email: { in: keepEmails } }, select: { id: true, email: true, role: true } });
      assert.equal(kept.length, 2, 'As duas contas exatas precisam existir.');
      assert.equal(kept.find(user => user.email === keepEmails[0])?.role, 'USER');
      assert.equal(kept.find(user => user.email === keepEmails[1])?.role, 'GUIA');
      const keepIds = kept.map(user => user.id);
      const counts = async () => ({
        users: await tx.user.count(), tokens: await tx.token.count(),
        itineraries: await tx.itinerary.count(), reviews: await tx.review.count(), places: await tx.place.count(),
      });
      const before = await counts();
      assert.deepEqual(before, { users: 12, tokens: 11, itineraries: 8, reviews: 4, places: 6 }, 'Inventário mudou: revisar novamente.');
      assert.equal(await tx.itinerary.count({ where: { userId: { in: keepIds } } }), 0);
      assert.equal(await tx.review.count({ where: { userId: { in: keepIds } } }), 1);
      const placesBefore = await tx.place.findMany({ orderBy: { id: 'asc' } });
      const reviewsBefore = await tx.review.findMany({ where: { userId: { in: keepIds } }, orderBy: { id: 'asc' } });
      console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', branch: 'development-seridotour', before,
        remove: { users: 10, tokens: 11, itineraries: 8, reviews: 3 },
        keep: kept.map(({ email, role }) => ({ email, role })) }));
      if (!apply) return;

      assert.equal((await tx.token.deleteMany({})).count, 11);
      assert.equal((await tx.review.deleteMany({ where: { userId: { notIn: keepIds } } })).count, 3);
      assert.equal((await tx.itinerary.deleteMany({ where: { userId: { notIn: keepIds } } })).count, 8);
      assert.equal((await tx.user.deleteMany({ where: { id: { notIn: keepIds } } })).count, 10);
      for (let index = 0; index < keepEmails.length; index++) {
        await tx.user.update({ where: { email: keepEmails[index] }, data: { password: hashes[index] } });
      }
      assert.deepEqual(await counts(), { users: 2, tokens: 0, itineraries: 0, reviews: 1, places: 6 });
      assert.deepEqual(await tx.place.findMany({ orderBy: { id: 'asc' } }), placesBefore, 'Locais devem ser preservados integralmente.');
      assert.deepEqual(await tx.review.findMany({ orderBy: { id: 'asc' } }), reviewsBefore, 'Avaliação mantida deve ser preservada.');
    }, { isolationLevel: 'Serializable', timeout: 30000 });
    console.log(apply ? 'Limpeza do preview confirmada. API continua bloqueada para validar logins.' : 'Prévia validada; nenhuma escrita executada.');
  } finally { await prisma.$disconnect(); }
}
main().catch(() => {
  // Erros de conexão podem conter URLs; não imprimir mensagens ou stacks com segredos.
  console.error('Operação abortada. Confira destino, inventário, bloqueio da API, backup e senhas locais. Nenhuma transação parcial é mantida.');
  process.exitCode = 1;
});
