import type { ExecutionContext } from '@nestjs/common';
import { TokenService } from '../../apps/backend/src/token/token.service';
import { RolesGuard } from '../../apps/backend/src/auth/roles.guard';
import { tokenDigest } from '../../apps/backend/src/token/token-digest';

describe('BE-TOKEN | Persistência e renovação', () => {
  const prisma = { token: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() } };
  const users = { findById: jest.fn() };
  const auth = { login: jest.fn() };
  const jwt = { verify: jest.fn() };
  const config = { getOrThrow: jest.fn(), get: jest.fn() };
  let service: TokenService;
  beforeEach(() => {
    jest.resetAllMocks();
    jwt.verify.mockReturnValue({ sub: 'user-1' });
    config.getOrThrow.mockReturnValue('segredo-exclusivo-de-teste');
    config.get.mockReturnValue('7d');
    prisma.token.deleteMany.mockResolvedValue({ count: 1 });
    service = new TokenService(prisma as any, users as any, auth as any, jwt as any, config as any);
  });

  it('BE-TOKEN-01 cria token quando o usuário ainda não tem sessão', async () => {
    await service.saveToken('novo', 'user-1');
    expect(prisma.token.create).toHaveBeenCalledWith({ data: { hash: tokenDigest('novo'), userId: 'user-1' } });
    expect(prisma.token.update).not.toHaveBeenCalled();
  });

  it('BE-TOKEN-02 substitui o token da sessão existente', async () => {
    prisma.token.findFirst.mockResolvedValue({ id: 'token-1' });
    await service.saveToken('novo', 'user-1');
    expect(prisma.token.update).toHaveBeenCalledWith({ where: { id: 'token-1' }, data: { hash: tokenDigest('novo') } });
    expect(prisma.token.create).not.toHaveBeenCalled();
  });

  it('BE-TOKEN-03 renova a sessão do titular do token', async () => {
    prisma.token.findFirst.mockResolvedValue({ id: 'token-1', userId: 'user-1' });
    const user = { id: 'user-1', role: 'USER' };
    users.findById.mockResolvedValue(user);
    auth.login.mockResolvedValue({ access_token: 'renovado' });
    await expect(service.atualizarToken('anterior')).resolves.toEqual({ access_token: 'renovado' });
    expect(prisma.token.findFirst).toHaveBeenCalledWith({ where: { hash: tokenDigest('anterior'), userId: 'user-1' } });
    expect(prisma.token.deleteMany).toHaveBeenCalledWith({ where: { id: 'token-1', hash: tokenDigest('anterior') } });
    expect(users.findById).toHaveBeenCalledWith('user-1');
    expect(auth.login).toHaveBeenCalledWith(user);
  });

  it('BE-TOKEN-04 retorna 401 para token desconhecido', async () => {
    prisma.token.findFirst.mockResolvedValue(null);
    await expect(service.atualizarToken('inexistente')).rejects.toMatchObject({ status: 401 });
    expect(auth.login).not.toHaveBeenCalled();
  });
});

describe('BE-ROLE | Autorização por perfil', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as any);
  const context = (role: string) => ({
    getHandler: () => 'handler', getClass: () => 'controller',
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  }) as unknown as ExecutionContext;

  it('BE-ROLE-01 permite rota sem restrição de perfil', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(context('USER'))).toBe(true);
  });
  it('BE-ROLE-02 permite GUIA em rota de guia', () => {
    reflector.getAllAndOverride.mockReturnValue(['GUIA']);
    expect(guard.canActivate(context('GUIA'))).toBe(true);
  });
  it('BE-ROLE-03 bloqueia USER em rota de guia', () => {
    reflector.getAllAndOverride.mockReturnValue(['GUIA']);
    expect(guard.canActivate(context('USER'))).toBe(false);
  });
});
