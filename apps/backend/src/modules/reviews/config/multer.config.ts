import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { buildSafeFilename } from '../utils/safe-filename.util';

// Diretório físico de armazenamento (fora de qualquer rota estática pública
// direta — o acesso ao arquivo deve sempre passar por uma rota controlada,
// nunca pelo caminho real do disco).
export const REVIEWS_PHOTOS_STORAGE_DIR = './storage/reviews-photos';

// Allowlist estrita de tipos de imagem aceitos.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const reviewPhotoMulterOptions = {
  storage: diskStorage({
    destination: REVIEWS_PHOTOS_STORAGE_DIR,
    filename: (_req, file, callback) => {
      callback(null, buildSafeFilename(file.originalname));
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const ext = extname(file.originalname).toLowerCase();

    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const hasValidExtension = ALLOWED_EXTENSIONS.includes(ext);

    if (!hasValidMimeType || !hasValidExtension) {
      return callback(
        new BadRequestException(
          'Arquivo inválido: apenas imagens JPEG, PNG ou WEBP são permitidas.',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
