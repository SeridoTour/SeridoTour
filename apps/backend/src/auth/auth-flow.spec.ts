import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthModule } from './auth.module';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  get(@Request() req) { return req.user; }
}

it('integra login, autenticação, permissões atuais, refresh e logout pelos módulos reais', async () => {
  let row: any = null;
  let sequence = 0;
  const profile = { id: 'test-user', name: 'Teste', email: 'test@example.test', role: 'USER' };
  const password = await bcrypt.hash('test-password-only', 4);
  const matches = (where: any) => row && Object.entries(where).every(([key, value]) => row[key] === value);
  const prisma = {
    user: { findUnique: async () => ({ ...profile, password }) },
    token: {
      findFirst: async ({ where, select }) => matches(where) ? (select ? { user: { ...profile } } : { ...row }) : null,
      create: async ({ data }) => { row = { id: String(++sequence), ...data }; return row; },
      update: async ({ data }) => { row = { ...row, ...data }; return row; },
      deleteMany: async ({ where }) => { const count = matches(where) ? 1 : 0; if (count) row = null; return { count }; },
    },
  };
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({
      JWT_SECRET: 'test-only-secret-with-more-than-32-characters', JWT_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d',
    })] }), AuthModule], controllers: [ProtectedController],
  }).overrideProvider(PrismaService).useValue(prisma).compile();
  const app = module.createNestApplication();
  await app.init();
  try {
    const http = app.getHttpServer();
    await request(http).get('/protected').expect(401);
    const login = await request(http).post('/auth/login').send({ email: profile.email, password: 'test-password-only' }).expect(201);
    const first = login.body.access_token;
    profile.role = 'GUIA';
    const guarded = await request(http).get('/protected').auth(first, { type: 'bearer' }).expect(200);
    expect(guarded.body.role).toBe('GUIA');
    expect(guarded.body.password).toBeUndefined();
    const refreshed = await request(http).put('/token/refresh').send({ tokenAnterior: first }).expect(200);
    const second = refreshed.body.access_token;
    expect(second).not.toBe(first);
    await request(http).get('/protected').auth(first, { type: 'bearer' }).expect(401);
    await request(http).put('/token/refresh').send({ tokenAnterior: first }).expect(401);
    await request(http).get('/protected').auth(second, { type: 'bearer' }).expect(200);
    await request(http).post('/auth/logout').auth(second, { type: 'bearer' }).expect(201);
    await request(http).get('/protected').auth(second, { type: 'bearer' }).expect(401);
  } finally { await app.close(); }
});
