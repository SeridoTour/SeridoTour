import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../auth/auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { tokenDigest } from './token-digest';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly UsersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly AuthService: AuthService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async saveToken(token: string, userId: string) {
    const hash = tokenDigest(token);
    const existingToken = await this.prisma.token.findFirst({
      where: {
        userId: userId,
      },
    });
    if (existingToken) {
      await this.prisma.token.update({
        where: {
          id: existingToken.id,
        },
        data: {
          hash: hash,
        },
      });
    } else {
      await this.prisma.token.create({
        data: {
          hash: hash,
          userId: userId,
        },
      });
    }
  }

  async atualizarToken(tokenAnterior: string) {
    let payload: { sub?: string };
    try {
      // Compatível com o hotfix da main: o cliente renova usando o access token.
      // A expiração de acesso pode ter passado, mas a janela de renovação é finita.
      payload = this.jwt.verify(tokenAnterior, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        ignoreExpiration: true,
        maxAge: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      });
      if (typeof payload.sub !== 'string') throw new Error('sub ausente');
    } catch {
      throw new HttpException('Token inválido ou expirado', HttpStatus.UNAUTHORIZED);
    }
    const existingToken = await this.prisma.token.findFirst({
      where: {
        hash: tokenDigest(tokenAnterior),
        userId: payload.sub,
      },
    });
    if (existingToken) {
      const user = await this.UsersService.findById(existingToken.userId);
      // Consumo condicional: só uma renovação pode utilizar este token.
      const consumed = await this.prisma.token.deleteMany({
        where: { id: existingToken.id, hash: tokenDigest(tokenAnterior) },
      });
      if (consumed.count !== 1) {
        throw new HttpException('Sessão já renovada', HttpStatus.UNAUTHORIZED);
      }
      return await this.AuthService.login(user);
    } else {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }
  }

  async revokeToken(token: string) {
    await this.prisma.token.deleteMany({ where: { hash: tokenDigest(token) } });
    return { message: 'Sessão encerrada.' };
  }
}
