import express from 'express';
import request from 'supertest';
import { previewMiddleware } from './preview.middleware';

describe('Proteção do preview durante a revisão dos dados', () => {
  const originalEnv = process.env;
  const app = express();
  app.use(previewMiddleware);
  app.use((_request, response) => response.status(200).json({ ok: true }));

  beforeEach(() => {
    process.env = { ...originalEnv, DEPLOYMENT_ENV: 'preview' };
  });
  afterEach(() => { process.env = originalEnv; });

  it('permite apenas o health check enquanto a revisão não estiver concluída', async () => {
    await request(app).get('/health').expect(200);
    await request(app).head('/health').expect(200);
    for (const route of ['/places', '/users', '/health/other', '/api-docs']) {
      await request(app).get(route)
        .expect(503)
        .expect('X-Robots-Tag', 'noindex, nofollow, noarchive')
        .expect('Cache-Control', 'no-store');
    }
    const login = await request(app).post('/auth/login').expect(503);
    expect(login.body.code).toBe('PREVIEW_NOT_READY');
  });

  it('libera as rotas após a revisão, mantendo a proibição de indexação', async () => {
    process.env.PREVIEW_DATA_REVIEWED = 'true';
    await request(app).get('/places').expect(200)
      .expect('X-Robots-Tag', 'noindex, nofollow, noarchive');
  });

  it('preserva o comportamento fora do preview', async () => {
    delete process.env.DEPLOYMENT_ENV;
    const response = await request(app).get('/places').expect(200);
    expect(response.headers['x-robots-tag']).toBeUndefined();
  });
});
