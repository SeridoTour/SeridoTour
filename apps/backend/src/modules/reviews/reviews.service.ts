// Imports do NestJS para cache, injeção, exceções
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
// Prisma para banco de dados
import { PrismaService } from '../../prisma/prisma.service';
// DTO de validação
import { CreateReviewDto } from './dto/create-review.dto';
// CloudinaryService para upload de imagem
import { CloudinaryService } from '../cloudinary/cloudinary.service';
// Tipo do arquivo Multer (vem do Express)
import type { Express } from 'express';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly cloudinary: CloudinaryService, // upload de imagem
  ) {}

  private async invalidateReviewsCache(placeId: string): Promise<void> {
    // Em memória: limpa tudo. Em Redis: DEL por prefixo 'reviews_place::placeId_<placeId>'
    await this.cacheManager.clear();
  }

  async findByPlace(placeId: string) {
    return this.prisma.review.findMany({
      where: { placeId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cria review; se vier imagem, faz upload no Cloudinary e salva a URL
  // PRIMEIRO confere se o Place existe, DEPOIS envia a imagem
  async create(
    data: CreateReviewDto,
    userId: string,
    image?: Express.Multer.File,
  ) {
    const place = await this.prisma.place.findUnique({
      where: { id: data.placeId },
    });

    if (!place) throw new NotFoundException('Ponto turístico não encontrado.');

    let imageUrl: string | undefined;

    if (image) {
      // Envia buffer da imagem para o Cloudinary na pasta 'reviews'
      imageUrl = await this.cloudinary.uploadImage(image, 'reviews');
    }

    const result = await this.prisma.review.create({
      data: {
        placeId: data.placeId,
        userId,
        rating: data.rating,
        comment: data.comment,
        imageUrl, // será undefined se não enviou imagem (campo opcional)
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    await this.invalidateReviewsCache(data.placeId);
    return result;
  }
}
