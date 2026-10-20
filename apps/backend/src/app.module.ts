// Módulos do NestJS para cache, configuração, filtros e interceptadores globais
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
// Joi: validação de variáveis de ambiente na inicialização
import * as Joi from 'joi';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './common/health/health.module';
import { ItinerariesModule } from './modules/itineraries/itineraries.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PlacesModule } from './modules/places/places.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TokenModule } from './token/token.module';
import { UsersModule } from './modules/users/users.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    // ConfigModule: carrega .env e valida variáveis obrigatórias com Joi
    ConfigModule.forRoot({
      isGlobal: true, // disponível em toda a app sem importar de novo
      validationSchema: Joi.object({
        // Banco de dados (PostgreSQL)
        DATABASE_URL: Joi.string().required(),
        // JWT para autenticação
        JWT_SECRET: Joi.string().required().min(32), // segredo mínimo 32 chars
        JWT_EXPIRES_IN: Joi.string() // ex.: "1m", "7d"
          .pattern(/^\d+[smhd]$/)
          .required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string()
          .pattern(/^\d+[smhd]$/)
          .required(),
        // Cloudinary (upload de imagens) — NOVO
        // Nome da nuvem (cloud name) no painel do Cloudinary
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        // Chave de API (pública)
        CLOUDINARY_API_KEY: Joi.string().required(),
        // Segredo de API (privado) — nunca commitar no código!
        CLOUDINARY_API_SECRET: Joi.string().required(),
      }),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // 5 minutos default
      max: 100,
    }),
    PrismaModule,
    ItinerariesModule,
    PlacesModule,
    ReviewsModule,
    AuthModule,
    TokenModule,
    WeatherModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
