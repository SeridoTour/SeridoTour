import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  WeatherByCityQueryDto,
  WeatherByCoordsQueryDto,
} from './dto/weather-query.dto';
import { WeatherService } from './weather.service';

/**
 * Controller de exemplo para demonstrar o uso do WeatherService.
 * Pode ser removido/adaptado caso o serviço seja consumido apenas
 * internamente por outro módulo (ex: RoteirosService).
 */
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('city')
  async getByCity(@Query() query: WeatherByCityQueryDto, @Res() res: Response) {
    const result = await this.weatherService.getWeatherByCity(query.cidade);

    if (!result.success) {
      // Falha tratada de forma coerente: resposta HTTP adequada,
      // sem exceção não controlada e sem derrubar a aplicação.
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: result.error,
      });
    }

    return res.status(HttpStatus.OK).json(result.data);
  }

  @Get('coords')
  async getByCoords(
    @Query() query: WeatherByCoordsQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.weatherService.getWeatherByCoords(
      query.lat,
      query.lon,
    );

    if (!result.success) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        message: result.error,
        ponto: query.pontoNome,
      });
    }

    return res.status(HttpStatus.OK).json({
      ponto: query.pontoNome,
      ...result.data,
    });
  }
}
