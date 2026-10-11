import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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

  async create(data: CreateReviewDto, userId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: data.placeId },
    });

    if (!place) throw new NotFoundException('Ponto turístico não encontrado.');

    const result = await this.prisma.review.create({
      data: {
        placeId: data.placeId,
        userId,
        rating: data.rating,
        comment: data.comment,
        photoUrl: data.photoUrl || null,
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
