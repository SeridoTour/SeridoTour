import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/modules/cloudinary/cloudinary.service';
const { assertLocalDatabase } = require('../../../scripts/local-database.cjs');
const {
  planRole,
  applyRole,
} = require('../../../scripts/manage-preview-guide.cjs');

describe('API com PostgreSQL descartável real', () => {
  let app: INestApplication;
  let db: PrismaService;
  let tourist: string;
  let guide: string;
  let placeA: string;
  let placeB: string;
  const password = randomUUID();
  const uploadImage = jest
    .fn()
    .mockResolvedValue('https://media.example.test/local.png');
  beforeAll(async () => {
    const url = assertLocalDatabase(process.env.TEST_DATABASE_URL);
    if (!url.pathname.startsWith('/seridotour_test_'))
      throw Error('Banco exclusivo de teste obrigatório.');
    Object.assign(process.env, {
      DATABASE_URL: url.href,
      NODE_ENV: 'test',
      DEPLOYMENT_ENV: 'test',
      JWT_SECRET: randomUUID() + randomUUID(),
      JWT_EXPIRES_IN: '15m',
      CLOUDINARY_CLOUD_NAME: 'test-only',
      CLOUDINARY_API_KEY: 'test-only',
      CLOUDINARY_API_SECRET: 'test-only',
      CLOUDINARY_FOLDER_PREFIX: 'seridotour/test',
    });
    // Import after the destination guard; never use the developer .env database.
    const { AppModule } = require('../src/app.module');
    const mod = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CloudinaryService)
      .useValue({ uploadImage })
      .compile();
    app = mod.createNestApplication({ logger: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    db = app.get(PrismaService);
    if ((await db.user.count()) || (await db.place.count()))
      throw Error('O runner deve fornecer banco vazio.');
    for (const role of ['USER', 'GUIA'] as const)
      await db.user.create({
        data: {
          name: role,
          email: `${role}@example.test`,
          role,
          password: await bcrypt.hash(password, 4),
        },
      });
    for (const category of ['A', 'B']) {
      const p = await db.place.create({
        data: {
          name: category + ' Local',
          description: 'Teste',
          city: 'Local',
          category,
          latitude: 0,
          longitude: 0,
        },
      });
      if (category === 'A') placeA = p.id;
      else placeB = p.id;
    }
    tourist = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'USER@example.test', password })
        .expect(201)
    ).body.access_token;
    guide = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'GUIA@example.test', password })
        .expect(201)
    ).body.access_token;
  }, 60000);
  afterAll(async () => {
    if (app) await app.close();
  });
  it('cadastro público recusa código/papel e concessão administrativa revoga sessões', async () => {
    const s = app.getHttpServer();
    const data = {
      name: 'Cadastro local',
      email: 'new-user@example.test',
      password: 'Only-test-Secret12!',
    };
    for (const extra of [{ codigoguia: 'old-code' }, { role: 'GUIA' }]) {
      await request(s)
        .post('/users/cadastrar')
        .send({ ...data, ...extra })
        .expect(400);
      expect(
        await db.user.findUnique({ where: { email: data.email } }),
      ).toBeNull();
    }
    const created = await request(s)
      .post('/users/cadastrar')
      .send(data)
      .expect(201);
    expect(created.body.role).toBe('USER');
    expect(created.body.password).toBeUndefined();
    const login = async () =>
      (
        await request(s)
          .post('/auth/login')
          .send({ email: data.email, password: data.password })
          .expect(201)
      ).body.access_token;
    const oldToken = await login();
    const change = { email: data.email, from: 'USER', to: 'GUIA' };
    const plan = await planRole(db, change);
    expect(plan.sessionsToRevoke).toBe(1);
    expect(
      (await db.user.findUniqueOrThrow({ where: { email: data.email } })).role,
    ).toBe('USER');
    await applyRole(db, change, plan);
    expect(
      (await db.user.findUniqueOrThrow({ where: { email: data.email } })).role,
    ).toBe('GUIA');
    await request(s)
      .get('/users')
      .auth(oldToken, { type: 'bearer' })
      .expect(401);
    const guideToken = await login();
    await request(s)
      .get('/users')
      .auth(guideToken, { type: 'bearer' })
      .expect(200);
    const repeated = await planRole(db, change);
    expect(repeated.alreadyApplied).toBe(true);
    expect((await applyRole(db, change, repeated)).sessionsRevoked).toBe(0);
    const revoke = { email: data.email, from: 'GUIA', to: 'USER' };
    await applyRole(db, revoke, await planRole(db, revoke));
    await request(s)
      .get('/users')
      .auth(guideToken, { type: 'bearer' })
      .expect(401);
    await request(s)
      .get('/users')
      .auth(await login(), { type: 'bearer' })
      .expect(403);
    await expect(
      planRole(db, { email: 'GUIA@example.test', from: 'GUIA', to: 'USER' }),
    ).rejects.toThrow('último guia');
  });
  it('protege papéis e separa páginas e filtros', async () => {
    const s = app.getHttpServer();
    await request(s)
      .post('/places')
      .auth(tourist, { type: 'bearer' })
      .send({})
      .expect(403);
    const a = await request(s).get('/places?page=1&limit=1').expect(200);
    const b = await request(s).get('/places?page=2&limit=1').expect(200);
    expect(a.body.data[0].id).not.toBe(b.body.data[0].id);
    expect(
      (await request(s).get('/places?category=B').expect(200)).body.data.map(
        (p) => p.id,
      ),
    ).toEqual([placeB]);
    await request(s).get('/places?page=0').expect(400);
  });
  it('valida imagem antes de chamar o provedor isolado e persiste a URL', async () => {
    const s = app.getHttpServer();
    await request(s)
      .patch(`/places/${placeA}`)
      .auth(guide, { type: 'bearer' })
      .attach('image', Buffer.from('invalid'), {
        filename: 'bad.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(uploadImage).not.toHaveBeenCalled();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=',
      'base64',
    );
    await request(s)
      .patch(`/places/${placeA}`)
      .auth(guide, { type: 'bearer' })
      .attach('image', png, 'local.png')
      .expect(200);
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(
      (await db.place.findUniqueOrThrow({ where: { id: placeA } })).imageUrl,
    ).toBe('https://media.example.test/local.png');
  });
  it('isola avaliações e invalida cache após escrita sem expor senha', async () => {
    const s = app.getHttpServer();
    await request(s).get(`/reviews/place/${placeA}`).expect(200, []);
    await request(s)
      .post('/reviews')
      .auth(tourist, { type: 'bearer' })
      .send({ placeId: placeA, rating: 5, comment: 'Local' })
      .expect(201);
    const r = await request(s).get(`/reviews/place/${placeA}`).expect(200);
    expect(r.body).toHaveLength(1);
    expect(JSON.stringify(r.body)).not.toContain('password');
    await request(s).get(`/reviews/place/${placeB}`).expect(200, []);
  });
  it('modera roteiro e impede publicação pelo turista', async () => {
    const s = app.getHttpServer();
    const created = await request(s)
      .post('/itineraries')
      .auth(tourist, { type: 'bearer' })
      .send({
        title: 'Local',
        description: 'Teste',
        duracaoDias: 1,
        placeIds: [placeA],
      })
      .expect(201);
    const id = created.body.id;
    expect(created.body.status).toBe('RASCUNHO');
    await request(s)
      .patch(`/itineraries/${id}/submit`)
      .auth(tourist, { type: 'bearer' })
      .expect(200);
    await request(s)
      .patch(`/itineraries/${id}/publish`)
      .auth(tourist, { type: 'bearer' })
      .expect(403);
    await request(s)
      .patch(`/itineraries/${id}/publish`)
      .auth(guide, { type: 'bearer' })
      .expect(200);
    expect(
      (await request(s).get(`/itineraries/public/${id}`).expect(200)).body
        .status,
    ).toBe('PUBLICADO');
  });
  it('rotaciona a sessão, recusa replay e revoga no logout', async () => {
    const s = app.getHttpServer();
    const r = await request(s)
      .put('/token/refresh')
      .send({ tokenAnterior: tourist })
      .expect(200);
    const token = r.body.access_token;
    expect(token).toBeTruthy();
    await request(s)
      .put('/token/refresh')
      .send({ tokenAnterior: tourist })
      .expect(401);
    await request(s)
      .get('/itineraries/meus')
      .auth(tourist, { type: 'bearer' })
      .expect(401);
    await request(s)
      .post('/auth/logout')
      .auth(token, { type: 'bearer' })
      .expect(201);
    await request(s)
      .get('/itineraries/meus')
      .auth(token, { type: 'bearer' })
      .expect(401);
  });
});
