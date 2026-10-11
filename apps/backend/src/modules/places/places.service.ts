import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FindAllPlacesQueryDto } from './dto/find-all-places-query.dto';

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidatePlacesCache(): Promise<void> {
    // Limpa todo o cache (apropriado para store em memória).
    // Em produção com Redis, usar SCAN + DEL por prefixo 'places_list'.
    await this.cacheManager.clear();
  }

  async create(createPlaceDto: CreatePlaceDto) {
    const result = await this.prisma.place.create({
      data: createPlaceDto,
    });
    await this.invalidatePlacesCache();
    return result;
  }

  async findAll(query: FindAllPlacesQueryDto) {
    const { category, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.place.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.place.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) {
      throw new NotFoundException(
        `Ponto turístico com ID ${id} não foi encontrado.`,
      );
    }
    return place;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto) {
    await this.findOne(id);
    const result = await this.prisma.place.update({
      where: { id },
      data: updatePlaceDto,
    });
    await this.invalidatePlacesCache();
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    const result = await this.prisma.place.delete({ where: { id } });
    await this.invalidatePlacesCache();
    return result;
  }
}
