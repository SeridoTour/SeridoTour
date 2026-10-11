import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

/**
 * Traduz erros do Multer (ex.: LIMIT_FILE_SIZE) em respostas HTTP limpas,
 * sem vazar stack trace, caminhos de disco ou detalhes internos.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const messages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'Arquivo excede o tamanho máximo permitido (5MB).',
      LIMIT_UNEXPECTED_FILE: 'Campo de arquivo inesperado ou não permitido.',
      LIMIT_FILE_COUNT: 'Apenas um arquivo é permitido por envio.',
    };

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: messages[exception.code] ?? 'Falha no envio do arquivo.',
    });
  }
}
