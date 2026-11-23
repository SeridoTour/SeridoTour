import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { TokenService } from '../token/token.service';
import { tokenDigest } from '../token/token-digest';

describe('Sessões com o contrato de refresh da main', () => {
  const secret = 'test-only-secret-with-more-than-32-characters';
  const jwt = new JwtService({ secret, signOptions: { expiresIn: '15m' } });
  const config = new ConfigService({ JWT_SECRET: secret, JWT_REFRESH_EXPIRES_IN: '7d' });
  let rows: any[];
  let profile: any;
  let prisma: any;
  let auth: AuthService;
  let tokens: TokenService;
  let strategy: JwtStrategy;
  const requestFor = (token: string) => ({ headers: { authorization: `Bearer ${token}` } }) as any;

  beforeEach(() => {
    rows = [];
    profile = { id: 'user-1', name: 'Teste', email: 'teste@example.test', role: 'USER' };
    const matches = (row: any, where: any) => Object.entries(where).every(([key, value]) => row[key] === value);
    prisma = { token: {
      findFirst: jest.fn(async ({ where, select }) => {
        const row = rows.find(row => matches(row, where));
        return row ? (select ? { user: profile } : { ...row }) : null;
      }),
      create: jest.fn(async ({ data }) => { rows.push({ id: `session-${rows.length}`, ...data }); }),
      update: jest.fn(async ({ where, data }) => { Object.assign(rows.find(row => row.id === where.id), data); }),
      deleteMany: jest.fn(async ({ where }) => {
        const count = rows.filter(row => matches(row, where)).length;
        rows = rows.filter(row => !matches(row, where));
        return { count };
      }),
    } };
    const users = { findById: jest.fn(async () => profile) } as any;
    const authProxy = { login: (user: any) => auth.login(user) } as any;
    tokens = new TokenService(prisma, users, authProxy, jwt, config);
    auth = new AuthService(users, jwt, tokens, config);
    strategy = new JwtStrategy(config, prisma);
  });

  it('grava somente digest, usa permissões atuais e revoga no logout', async () => {
    const login = await auth.login(profile);
    expect(rows[0].hash).toBe(tokenDigest(login.access_token));
    expect(rows[0].hash).not.toBe(login.access_token);
    profile.role = 'GUIA';
    expect(await strategy.validate(requestFor(login.access_token), jwt.verify(login.access_token))).toEqual(profile);
    await auth.logout(login.access_token);
    await expect(strategy.validate(requestFor(login.access_token), jwt.verify(login.access_token))).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(tokens.atualizarToken(login.access_token)).rejects.toThrow();
  });

  it('aceita renovação após expirar o acesso e rejeita reutilização do token anterior', async () => {
    const expired = jwt.sign({ sub: profile.id, iat: Math.floor(Date.now() / 1000) - 120, jti: 'old' }, { expiresIn: '1s' });
    await tokens.saveToken(expired, profile.id);
    const renewed = await tokens.atualizarToken(expired);
    expect(jwt.verify(renewed.access_token).sub).toBe(profile.id);
    expect(renewed.access_token).not.toBe(expired);
    await expect(tokens.atualizarToken(expired)).rejects.toThrow();
    await expect(strategy.validate(requestFor(expired), { sub: profile.id })).rejects.toThrow();
  });

  it('rejeita assinatura falsa, janela de renovação vencida e usuário excluído', async () => {
    const tooOld = jwt.sign({ sub: profile.id, iat: Math.floor(Date.now() / 1000) - 8 * 86400 }, { expiresIn: '1s' });
    await tokens.saveToken(tooOld, profile.id);
    await expect(tokens.atualizarToken(tooOld)).rejects.toThrow();
    await expect(tokens.atualizarToken(tooOld + 'invalid')).rejects.toThrow();
    const { access_token } = await auth.login(profile);
    profile = null;
    await expect(strategy.validate(requestFor(access_token), jwt.verify(access_token))).rejects.toThrow();
  });

  it('gera tokens distintos mesmo em dois logins no mesmo segundo', async () => {
    const first = await auth.login(profile);
    const second = await auth.login(profile);
    expect(first.access_token).not.toBe(second.access_token);
    await expect(strategy.validate(requestFor(first.access_token), jwt.verify(first.access_token))).rejects.toThrow();
  });
});
