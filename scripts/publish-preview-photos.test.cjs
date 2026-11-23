const { test } = require('node:test');
const assert = require('node:assert/strict');
const { verifyDestination, compensate } = require('./publish-preview-photos.cjs');

test('recusa destino diferente antes de qualquer conexão/upload', () => {
  assert.throws(() => verifyDestination({ DATABASE_URL: 'postgresql://user:password@production.invalid/northeastour?sslmode=require' }));
});

test('não compensa uma imagem já referenciada depois de commit incerto', async () => {
  const destroyed = [];
  const prisma = { place: { count: async () => 1 }, review: { count: async () => 0 } };
  const removed = await compensate(prisma, [{ publicId: 'seridotour/development-seridotour/places/geoparque-serido/example-0123456789ab', url: 'https://example.invalid/image.jpg' }], async id => { destroyed.push(id); return { result: 'ok' }; });
  assert.deepEqual(removed, []);
  assert.deepEqual(destroyed, []);
});

test('compensa apenas o asset novo fornecido e sem referências', async () => {
  const id = 'seridotour/development-seridotour/places/geoparque-serido/example-0123456789ab';
  const destroyed = [];
  const prisma = { place: { count: async () => 0 }, review: { count: async () => 0 } };
  assert.deepEqual(await compensate(prisma, [{ publicId: id, url: 'https://example.invalid/image.jpg' }], async (publicId, options) => {
    destroyed.push({ publicId, options }); return { result: 'ok' };
  }), [id]);
  assert.equal(destroyed.length, 1);
  assert.equal(destroyed[0].publicId, id);
  assert.equal(destroyed[0].options.resource_type, 'image');
});

test('nunca permite compensar publicId de produção', async () => {
  await assert.rejects(() => compensate({}, [{ publicId: 'places/original' }], async () => { throw Error('Não deveria executar.'); }));
});
