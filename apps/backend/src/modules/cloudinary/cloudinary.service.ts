// Importa o ConfigService para ler variáveis de ambiente (.env)
import { ConfigService } from '@nestjs/config';
// Injectable: permite que o NestJS injete este service em outros lugares
// InternalServerErrorException: erro 500 com mensagem amigável
import { Injectable, InternalServerErrorException } from '@nestjs/common';
// SDK do Cloudinary v2; UploadApiResponse é o tipo da resposta de upload
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
// Tipo do arquivo que o Multer nos dá (tem .buffer com os bytes da imagem)
import type { Express } from 'express';

@Injectable()
export class CloudinaryService {
  // Construtor roda uma vez quando o service é criado
  constructor(private readonly config: ConfigService) {
    // Configura o SDK do Cloudinary com as credenciais do .env
    // getOrThrow: lança erro se a variável não existir (falha rápido, seguro)
    cloudinary.config({
      cloud_name: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  // Envia a imagem para o Cloudinary e retorna a URL pública (HTTPS)
  // file: arquivo vindo do Multer (em memória, tem .buffer)
  // folder: 'places' ou 'reviews' — organiza as imagens no painel do Cloudinary
  async uploadImage(
    file: Express.Multer.File,
    folder: 'places' | 'reviews',
  ): Promise<string> {
    // Usamos Promise + stream porque o Cloudinary aceita upload via stream
    // (não precisa salvar arquivo temporário em disco)
    return new Promise((resolve, reject) => {
      // Abre um stream de upload para o Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder, // pasta no Cloudinary (ex.: "places" ou "reviews")
          resource_type: 'image', // tipo do recurso: imagem
        },
        // Callback quando o upload termina (sucesso ou erro)
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            // Se deu erro ou não veio resultado, rejeita a Promise com erro 500
            reject(
              new InternalServerErrorException(
                'Falha ao enviar imagem para o Cloudinary.',
              ),
            );
            return;
          }
          // Sucesso: resolve a Promise com a URL segura (HTTPS) da imagem
          resolve(result.secure_url);
        },
      );

      // Escreve os bytes da imagem (file.buffer) no stream e fecha
      // O stream envia os dados para o Cloudinary enquanto escrevemos
      uploadStream.end(file.buffer);
    });
  }
}