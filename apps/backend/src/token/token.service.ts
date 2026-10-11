import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../auth/auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly UsersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly AuthService: AuthService,
  ) {}

  async saveToken(hash: string, userId: string) {
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
    const existingToken = await this.prisma.token.findFirst({
      where: {
        hash: tokenAnterior,
      },
    });
    if (existingToken) {
      const user = await this.UsersService.findById(existingToken.userId);
      return await this.AuthService.login(user);
    } else {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }
  }
}
