import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { sanitizeForLog } from '../utils/sanitize-log.util';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

/**
 * Filtro de exceção global: captura QUALQUER erro não tratado
 * (HttpException do Nest ou erro genérico do JS) em qualquer
 * controller/rota da aplicação.
 *
 * Objetivos:
 * 1. Nunca deixar a aplicação "explodir" sem resposta ao cliente.
 * 2. Padronizar o formato de erro retornado.
 * 3. Logar de forma estruturada e ÚTIL para debug, sem expor segredos
 *    (senhas, tokens, chaves de API) nem dados sensíveis do usuário.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, error } = this.resolveHttpDetails(exception);

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logError(exception, request, statusCode);

    response.status(statusCode).json(body);
  }

  private resolveHttpDetails(exception: unknown): {
    statusCode: number;
    message: string | string[];
    error?: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return { statusCode: status, message: response };
      }

      const responseObj = response as Record<string, unknown>;
      return {
        statusCode: status,
        message:
          (responseObj.message as string | string[]) ?? exception.message,
        error: responseObj.error as string | undefined,
      };
    }

    // Erro não previsto (bug, exceção de biblioteca, etc.) — não expor
    // detalhes internos ao cliente, apenas uma mensagem genérica.
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Erro interno inesperado. Nossa equipe já foi notificada.',
      error: 'InternalServerError',
    };
  }

  /**
   * Loga o erro de forma estruturada, sanitizando headers, body e query
   * antes de gravar — assim nenhum segredo ou dado sensível vai parar
   * no log (ex: Authorization header, senha em um body de login, etc).
   */
  private logError(
    exception: unknown,
    request: Request,
    statusCode: number,
  ): void {
    const logContext = {
      method: request.method,
      path: request.url,
      statusCode,
      headers: sanitizeForLog(request.headers),
      body: sanitizeForLog(request.body),
      query: sanitizeForLog(request.query),
    };

    const isServerError = statusCode >= 500;
    const stack = exception instanceof Error ? exception.stack : undefined;
    const messagePrefix = isServerError ? 'Erro interno' : 'Erro de requisição';

    if (isServerError) {
      // Erros 5xx: nível "error", com stack trace, pois exigem investigação.
      this.logger.error(
        `${messagePrefix} [${request.method} ${request.url}] — ${JSON.stringify(logContext)}`,
        stack,
      );
    } else {
      // Erros 4xx: nível "warn" — são esperados (validação, não encontrado, etc.),
      // não precisam de stack trace nem de alarde no log.
      this.logger.warn(
        `${messagePrefix} [${request.method} ${request.url}] — ${JSON.stringify(logContext)}`,
      );
    }
  }
}
