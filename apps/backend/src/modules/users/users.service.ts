import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException } from '@nestjs/common/exceptions/conflict.exception';
import { RespostaDto } from './dto/resposta.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { User } from '@prisma/client';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async listUsers(): Promise<RespostaDto[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return users;
  }

  async create(createUserDto: CreateUserDto): Promise<RespostaDto> {
    let role: Role = Role.USER;
    if (createUserDto.codigoguia !== undefined) {
      const expected = this.config.get<string>('CODIGO_GUIA');
      const preview = this.config.get<string>('DEPLOYMENT_ENV') === 'preview';
      const digest = (value: string) => createHash('sha256').update(value).digest();
      if (!preview || !expected || !timingSafeEqual(digest(createUserDto.codigoguia), digest(expected))) {
        throw new ForbiddenException('Código de guia inválido ou cadastro de guia indisponível.');
      }
      role = Role.GUIA;
    }
    const existeEmail = await this.prisma.user.findUnique({
      where: {
        email: createUserDto.email,
      },
    });

    if (existeEmail) {
      throw new ConflictException('Email já existe');
    }

    const existeUsername = await this.prisma.user.findFirst({
      where: {
        name: createUserDto.name,
      },
    });

    if (existeUsername) {
      throw new ConflictException('Nome de usuário já existe');
    }

    const senhaCriptografada = await bcrypt.hash(createUserDto.password, 8);

    const newUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: senhaCriptografada,
        role,
      },
      select: {
        name: true,
        email: true,
        role: true,
      },
    });

    return newUser;
  }

  async findOne(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }
}
