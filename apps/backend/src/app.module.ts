import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import * as Joi from 'joi';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { ItinerariesModule } from './modules/itineraries/itineraries.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PlacesModule } from './modules/places/places.module';
import { PontosTuristicosModule } from './pontos-turisticos/pontos-turisticos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReviewsUploadModule } from './modules/reviews/reviews-upload.module';
import { TokenModule } from './token/token.module';
import { UsersModule } from './modules/users/users.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required().min(32),
        JWT_EXPIRES_IN: Joi.string().pattern(/^\d+[smhd]$/).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().pattern(/^\d+[smhd]$/).required(),
      }),
    }),
    PrismaModule,
    ItinerariesModule,
    PlacesModule,
    ReviewsModule,
    AuthModule,
    TokenModule,
    WeatherModule,
    PontosTuristicosModule,
    HealthModule,
    ReviewsUploadModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
