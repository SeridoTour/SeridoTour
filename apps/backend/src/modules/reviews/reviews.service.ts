import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlace(placeId: string) {
    return this.prisma.review.findMany({
      where: { placeId },
      include: { 
        user: { 
          select: { id: true, name: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateReviewDto, userId: string) {
    const place = await this.prisma.place.findUnique({ 
      where: { id: data.placeId } 
    });
    
    if (!place) throw new NotFoundException('Ponto turístico não encontrado.');

    return this.prisma.review.create({
      data: {
        placeId: data.placeId,
        userId,
        rating: data.rating,
        comment: data.comment,
        photoUrl: data.photoUrl || null,     // ← Adicionado aqui
      },
      include: { 
        user: { 
          select: { id: true, name: true } 
        } 
      },
    });
  }
}