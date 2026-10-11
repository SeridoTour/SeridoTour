import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exceção específica para falhas na integração com a API externa de clima.
 * Usar uma exceção própria (em vez de deixar o erro do Axios "vazar")
 * permite tratar o cenário de forma coerente em toda a aplicação,
 * sem derrubar o processo principal do NestJS.
 */
export class WeatherIntegrationException extends HttpException {
  constructor(message: string, cause?: unknown) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `Falha ao consultar o serviço de previsão do tempo: ${message}`,
        error: 'WeatherServiceUnavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    if (cause instanceof Error) {
      this.stack += `\nCausa original: ${cause.stack}`;
    }
  }
}
