// Pipe do NestJS que valida o arquivo de imagem ANTES de chegar no controller
// Roda depois do Multer (que já pôs o arquivo em file.buffer)
// Se a imagem for opcional e não vier arquivo, devolve undefined (não bloqueia)
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { Express } from 'express';
import { MAX_FILE_SIZE_BYTES } from './image-upload.config';
import { detectImageMime } from './image-signature.util';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  // Recebe o arquivo (ou undefined se não enviaram)
  transform(file: Express.Multer.File | undefined): Express.Multer.File | undefined {
    // Imagem é opcional: se não veio arquivo, passa adiante (undefined)
    if (!file) return undefined;

    // 1) Limite de tamanho (segunda barreira — Multer já confere, mas garantimos aqui)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Imagem excede o limite de 5 MB.');
    }

    // 2) Validação pelo conteúdo (magic numbers) — barra disfarces simples,
    // mas não é garantia absoluta (é uma camada de defesa junto com as outras)
    const realMime = detectImageMime(file.buffer);
    if (!realMime) {
      throw new BadRequestException('O arquivo não é uma imagem válida.');
    }

    // Opcional: poderia conferir se realMime bate com file.mimetype declarado
    // Tudo ok: devolve o arquivo para o controller usar
    return file;
  }
}