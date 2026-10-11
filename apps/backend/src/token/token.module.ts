import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TokenController } from './token.controller';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [PrismaModule, UsersModule, forwardRef(() => AuthModule)],
  providers: [TokenService],
  exports: [TokenService],
  controllers: [TokenController],
})
export class TokenModule {}
