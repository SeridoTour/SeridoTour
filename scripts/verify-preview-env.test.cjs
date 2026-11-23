const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const base = {
  DEPLOYMENT_ENV: 'preview',
  DATABASE_URL: 'postgresql://test:unused@ep-tiny-bonus-at29rygs.c-9.us-east-1.aws.neon.tech/northeastour?sslmode=require',
  CORS_ORIGIN: 'https://seridotour-git-codex-preview-example.vercel.app',
  CLOUDINARY_FOLDER_PREFIX: 'seridotour/development-seridotour',
  PREVIEW_DATA_REVIEWED: 'false',
  RENDER_SERVICE_NAME: 'seridotour-api-preview',
  RENDER_GIT_BRANCH: 'codex/preview-geoparque',
};
const run = (overrides = {}) => spawnSync(process.execPath, [
  path.join(__dirname, 'verify-preview-env.cjs'),
], { env: { ...process.env, ...base, ...overrides }, encoding: 'utf8' });

test('aceita o endpoint exclusivo em conexões direta e pooled', () => {
  assert.equal(run().status, 0);
  assert.equal(run({ DATABASE_URL: base.DATABASE_URL.replace('at29rygs.', 'at29rygs-pooler.') }).status, 0);
});

test('bloqueia outro banco/endpoint, serviço de produção e origem de produção sem revelar a URL', () => {
  for (const overrides of [
    { DATABASE_URL: base.DATABASE_URL.replace('ep-tiny-bonus-at29rygs', 'ep-production') },
    { DATABASE_URL: base.DATABASE_URL.replace('/northeastour?', '/neondb?') },
    { DATABASE_URL: base.DATABASE_URL.replace('sslmode=require', 'sslmode=disable') },
    { RENDER_SERVICE_NAME: 'northeastour' },
    { RENDER_GIT_BRANCH: 'main' },
    { CORS_ORIGIN: 'https://seridotour.vercel.app' },
    { CORS_ORIGIN: '*' },
  ]) {
    const result = run(overrides);
    assert.notEqual(result.status, 0);
    assert.ok(!result.stderr.includes('test:unused'));
  }
});
