// Configuração do Multer para upload de imagens em MEMÓRIA (não salva em disco)
// memoryStorage: mantém o arquivo no buffer (RAM) — rápido e evita arquivos temporários
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Tipos de imagem permitidos (pelo content-type declarado pelo cliente)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const imageUploadMulterOptions = {
  // memoryStorage: arquivo fica em file.buffer (memória), não escreve no disco
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES, // rejeita se passar de 5 MB
    files: 1, // aceita no máximo 1 arquivo por requisição
  },
  // Primeira barreira: confere o content-type DECLARADO pelo cliente
  // (ainda pode ser falsificado, por isso validamos os bytes depois no Pipe)
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.mimetype);

    if (!hasValidMimeType) {
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