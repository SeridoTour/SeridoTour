import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../apps/backend/src/auth/auth.service';
import { UsersService } from '../../apps/backend/src/modules/users/users.service';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));

describe('BE-AUTH | Autenticação', () => {
  const users = { findOne: jest.fn() };
  const jwt = { sign: jest.fn() };
  const tokens = { saveToken: jest.fn() };
  const user = { id: 'user-1', name: 'Ana', email: 'ana@example.test', role: 'USER', password: 'hash' };
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AuthService(users as any, jwt as any, tokens as any, {} as any);
  });

  it('BE-AUTH-01 aceita senha válida e remove a senha da resposta', async () => {
    users.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    const result = await service.validarUsuario(user.email, 'Senha1!');
    expect(bcrypt.compare).toHaveBeenCalledWith('Senha1!', 'hash');
    expect(result).toEqual({ id: user.id, name: user.name, email: user.email, role: user.role });
    expect(result).not.toHaveProperty('password');
  });

  it('BE-AUTH-02 recusa senha incorreta', async () => {
    users.findOne.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.validarUsuario(user.email, 'errada')).resolves.toBeNull();
  });

  it('BE-AUTH-03 propaga usuário inexistente sem comparar senha', async () => {
    users.findOne.mockRejectedValue(new NotFoundException());
    await expect(service.validarUsuario('ausente@example.test', 'Senha1!')).rejects.toBeInstanceOf(NotFoundException);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it('BE-AUTH-04 assina identidade e persiste o token antes de retornar', async () => {
    jwt.sign.mockReturnValue('jwt-de-teste');
    await expect(service.login(user)).resolves.toEqual({ access_token: 'jwt-de-teste' });
    expect(jwt.sign).toHaveBeenCalledWith({ name: 'Ana', sub: 'user-1', role: 'USER', jti: expect.any(String) });
    expect(tokens.saveToken).toHaveBeenCalledWith('jwt-de-teste', user.id);
  });

  it('BE-AUTH-05 não entrega o token quando a persistência falha', async () => {
    jwt.sign.mockReturnValue('jwt-de-teste');
    tokens.saveToken.mockRejectedValue(new Error('persistência indisponível'));
    await expect(service.login(user)).rejects.toThrow('persistência indisponível');
  });
});

describe('BE-USER | Cadastro e consulta de usuários', () => {
  const prisma = { user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() } };
  const input = { name: 'Ana', email: 'ana@example.test', password: 'Senha1!' };
  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('senha-criptografada');
    service = new UsersService(prisma as any);
  });

  it('BE-USER-01 impede e-mail duplicado antes de gravar', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existente' });
    await expect(service.create(input)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('BE-USER-02 impede nome de usuário duplicado', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'existente' });
    await expect(service.create(input)).rejects.toThrow('Nome de usuário já existe');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('BE-USER-03 cadastra USER e guarda somente hash', async () => {
    const saved = { name: input.name, email: input.email, role: Role.USER };
    prisma.user.create.mockResolvedValue(saved);
    await expect(service.create(input)).resolves.toEqual(saved);
    expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 8);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: input.name, email: input.email, password: 'senha-criptografada', role: Role.USER },
      select: { name: true, email: true, role: true },
    });
  });

  it('BE-USER-04 não concede GUIA mesmo com campos privilegiados no objeto', async () => {
    await service.create({ ...input, codigoguia: 'codigo-legado', role: Role.GUIA } as any);
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role: Role.USER }),
    }));
  });

  it.each(['findOne', 'findById'] as const)('BE-USER-05 %s informa usuário inexistente', async (method) => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service[method]('ausente')).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([['findOne', 'email'], ['findById', 'id']] as const)('BE-USER-06 %s consulta pela chave correta', async (method, field) => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    await expect(service[method]('valor')).resolves.toEqual({ id: 'user-1' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { [field]: 'valor' } });
  });
});
