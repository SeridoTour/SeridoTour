import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { sanitizeForLog } from '../utils/sanitize-log.util';

/**
 * Loga toda requisição HTTP (método, rota, status, tempo de resposta),
 * de forma sanitizada. Complementa o AllExceptionsFilter: enquanto o
 * filtro cobre os erros, este interceptor dá visibilidade também das
 * requisições que terminam com sucesso — útil para depuração e para
 * observar o comportamento do cache (ex: tempo de resposta menor em
 * cache hits).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(
            `${method} ${url} ${response.statusCode} — ${duration}ms — query=${JSON.stringify(
              sanitizeForLog(request.query),
            )}`,
          );
        },
        error: () => {
          // Erros já são logados com detalhe pelo AllExceptionsFilter;
          // aqui só registramos o tempo até a falha, sem duplicar o log.
          const duration = Date.now() - start;
          this.logger.debug(`${method} ${url} falhou após ${duration}ms`);
        },
      }),
    );
  }
}
