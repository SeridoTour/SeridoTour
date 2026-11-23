import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';

it('não envia senha ou hash na listagem HTTP de usuários', async () => {
  const row = { id: 'test', name: 'Teste', email: 'test@example.test', role: 'GUIA', createdAt: new Date(), password: 'sensitive-test-hash' };
  const prisma = { user: { findMany: async (args?: { select: Record<string, boolean> }) => [args?.select
    ? Object.fromEntries(Object.entries(row).filter(([key]) => args.select[key])) : row] } };
  const module = await Test.createTestingModule({
    controllers: [UsersController], providers: [UsersService,
      { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: {} }],
  }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard).useValue({ canActivate: () => true }).compile();
  const app = module.createNestApplication();
  await app.init();
  try {
    const response = await request(app.getHttpServer()).get('/users').expect(200);
    expect(response.body[0]).toMatchObject({ id: 'test', role: 'GUIA' });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(JSON.stringify(response.body)).not.toContain('sensitive-test-hash');
  } finally { await app.close(); }
});
