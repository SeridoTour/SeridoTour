import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import {
  MAX_FILE_SIZE_BYTES,
  REVIEWS_PHOTOS_STORAGE_DIR,
  reviewPhotoMulterOptions,
} from './config/multer.config';
import { UploadPhotoResponseDto } from './dto/upload-photo-response.dto';
import { isValidImageSignature } from './utils/image-signature.util';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('reviews/photos')
export class ReviewsUploadController {
  /**
   * POST /reviews/photos
   * Recebe multipart/form-data com o campo "photo".
   */
@Post()
@UseFilters(MulterExceptionFilter)
@UseInterceptors(FileInterceptor('photo', reviewPhotoMulterOptions))
async uploadReviewPhoto(
  @UploadedFile() file: Express.Multer.File,   // ← Removemos o ParseFilePipe por enquanto
): Promise<UploadPhotoResponseDto> {
  
  if (!file) {
    throw new BadRequestException('Nenhum arquivo enviado.');
  }

  // Validação manual simples por enquanto
  if (!file.mimetype.startsWith('image/')) {
    throw new BadRequestException('Arquivo deve ser uma imagem.');
  }

  const fileBuffer = readFileSync(file.path);
  if (!isValidImageSignature(fileBuffer)) {
    throw new BadRequestException('O arquivo não é uma imagem válida.');
  }

  return {
    fileId: file.filename,
    url: `/reviews/photos/${file.filename}`,
    sizeInBytes: file.size,
    mimeType: file.mimetype,
  };
}

  /**
   * GET /reviews/photos/:fileId
   * Serve o arquivo sem nunca expor o caminho físico do servidor na resposta.
   */
  @Get(':fileId')
  getReviewPhoto(@Param('fileId') fileId: string, @Res() res: Response) {
    // basename() elimina qualquer tentativa de path traversal (ex.: ../../etc/passwd)
    const safeFileId = basename(fileId);
    const filePath = join(REVIEWS_PHOTOS_STORAGE_DIR, safeFileId);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Arquivo não encontrado.');
    }

    return res.sendFile(safeFileId, { root: REVIEWS_PHOTOS_STORAGE_DIR });
  }
}
