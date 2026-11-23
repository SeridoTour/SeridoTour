import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { tokenDigest } from '../token/token-digest';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: { sub?: string }) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token || typeof payload.sub !== 'string') throw new UnauthorizedException();
    const session = await this.prisma.token.findFirst({
      where: { userId: payload.sub, hash: tokenDigest(token) },
      select: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!session?.user) throw new UnauthorizedException('Sessão revogada. Entre novamente.');
    return session.user;
  }
}
