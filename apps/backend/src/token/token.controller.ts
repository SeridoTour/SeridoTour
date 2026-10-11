import { Controller } from '@nestjs/common';
import { Put, Body } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refrechtoken.dto';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Put('refresh')
  async atualizarToken(@Body() data: RefreshTokenDto) {
    return await this.tokenService.atualizarToken(data.tokenAnterior);
  }
}
