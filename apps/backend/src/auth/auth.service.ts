import { Injectable } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../token/token.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  async validarUsuario(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { name: user.name, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    // const refreshToken = this.jwtService.sign(payload, {
    //   expiresIn: this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN') as never,
    // });
    await this.tokenService.saveToken(accessToken, user.id);
    return {
      access_token: accessToken,
      // refresh_token: refreshToken,
    };
  }
}
