import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import {
  OpenWeatherMapResponse,
  WeatherForecast,
  WeatherResult,
} from './interfaces/weather-response.interface';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private readonly apiKey: string;
  private readonly requestTimeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Chave e timeout vêm do .env — nunca hardcoded no código.
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY', '');
    this.requestTimeoutMs = Number(
      this.configService.get<string>('OPENWEATHER_TIMEOUT_MS', '5000'),
    );

    if (!this.apiKey) {
      // Não derruba a aplicação: apenas avisa. As chamadas ao serviço
      // vão falhar de forma controlada (success: false) até a chave ser configurada.
      this.logger.warn(
        'OPENWEATHER_API_KEY não configurada no .env. O WeatherService retornará falhas controladas até que a variável seja definida.',
      );
    }
  }

  /**
   * Busca a previsão do tempo atual para uma cidade.
   * Nunca lança exceção para quem chama: sempre retorna um WeatherResult.
   */
  async getWeatherByCity(cidade: string): Promise<WeatherResult> {
    return this.fetchWeather({ q: cidade });
  }

  /**
   * Busca a previsão do tempo atual para coordenadas (lat/lon).
   * Ideal para pontos específicos de um roteiro.
   */
  async getWeatherByCoords(lat: number, lon: number): Promise<WeatherResult> {
    return this.fetchWeather({ lat, lon });
  }

  /**
   * Método interno que efetivamente chama a API externa.
   * Centraliza timeout + try/catch para manter o tratamento coerente
   * em um único lugar, independente do tipo de consulta (cidade ou coords).
   */
  private async fetchWeather(
    params: Record<string, string | number>,
  ): Promise<WeatherResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Serviço de clima indisponível: chave de API não configurada.',
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<OpenWeatherMapResponse>(this.baseUrl, {
            params: {
              ...params,
              appid: this.apiKey,
              units: 'metric',
              lang: 'pt_br',
            },
          })
          .pipe(
            timeout(this.requestTimeoutMs),
            catchError((error: unknown) => {
              // Repassa o erro para o catch externo, já classificado.
              throw error;
            }),
          ),
      );

      return {
        success: true,
        data: this.normalizeResponse(response.data),
      };
    } catch (error) {
      return this.handleError(error, params);
    }
  }

  /**
   * Trata qualquer falha (timeout, rede, 4xx/5xx, resposta inválida)
   * sem deixar a exceção subir e derrubar a aplicação.
   */
  private handleError(
    error: unknown,
    params: Record<string, string | number>,
  ): WeatherResult {
    const contexto = JSON.stringify(params);

    if (error instanceof TimeoutError) {
      this.logger.error(
        `Timeout ao consultar a API de clima (contexto: ${contexto})`,
      );
      return {
        success: false,
        error:
          'Tempo limite excedido ao consultar o serviço de clima. Tente novamente em instantes.',
      };
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status;

      if (status === 404) {
        this.logger.warn(
          `Local não encontrado na API de clima (contexto: ${contexto})`,
        );
        return {
          success: false,
          error: 'Local não encontrado para consulta de clima.',
        };
      }

      if (status === 401) {
        this.logger.error('Chave de API inválida ou não autorizada.');
        return {
          success: false,
          error: 'Falha de autenticação com o serviço de clima.',
        };
      }

      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
        this.logger.error(
          `Falha de conexão com a API de clima (${error.code}, contexto: ${contexto})`,
        );
        return {
          success: false,
          error: 'Não foi possível conectar ao serviço de clima no momento.',
        };
      }

      this.logger.error(
        `Erro inesperado da API de clima (status ${status}, contexto: ${contexto}): ${error.message}`,
      );
      return {
        success: false,
        error: 'Erro inesperado ao consultar o serviço de clima.',
      };
    }

    // Qualquer outro erro não previsto: logamos e devolvemos resposta controlada.
    this.logger.error(
      `Erro desconhecido ao consultar a API de clima (contexto: ${contexto})`,
      error instanceof Error ? error.stack : String(error),
    );
    return {
      success: false,
      error: 'Erro desconhecido ao consultar o serviço de clima.',
    };
  }

  /**
   * Converte a resposta bruta da OpenWeatherMap para o formato
   * usado internamente pela aplicação (desacopla o resto do sistema
   * do formato específico do provedor externo).
   */
  private normalizeResponse(raw: OpenWeatherMapResponse): WeatherForecast {
    return {
      local: raw.name,
      temperatura: raw.main.temp,
      sensacaoTermica: raw.main.feels_like,
      temperaturaMin: raw.main.temp_min,
      temperaturaMax: raw.main.temp_max,
      umidade: raw.main.humidity,
      vento: raw.wind.speed,
      condicao: raw.weather[0]?.main ?? 'Desconhecido',
      descricao: raw.weather[0]?.description ?? '',
      icone: raw.weather[0]?.icon ?? '',
      atualizadoEm: new Date(raw.dt * 1000),
    };
  }
}
