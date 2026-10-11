import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000, // timeout padrão de 5s para qualquer chamada feita via este módulo
      maxRedirects: 5,
    }),
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService], // exportado para ser injetável em outros módulos (ex: RoteirosModule)
})
export class WeatherModule {}
