// Imports do NestJS para cache, injeção, exceções
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
// Prisma para banco de dados
import { PrismaService } from 'src/prisma/prisma.service';
// DTOs de validação dos dados do place
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FindAllPlacesQueryDto } from './dto/find-all-places-query.dto';
// CloudinaryService para upload de imagem
import { CloudinaryService } from '../cloudinary/cloudinary.service';
// Tipo do arquivo Multer (vem do Express)
import type { Express } from 'express';

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly cloudinary: CloudinaryService, // upload de imagem
  ) {}

  private async invalidatePlacesCache(): Promise<void> {
    // Limpa todo o cache (apropriado para store em memória).
    // Em produção com Redis, usar SCAN + DEL por prefixo 'places_list'.
    await this.cacheManager.clear();
  }

  // Cria place; se vier imagem, faz upload no Cloudinary e salva a URL
  async create(
    createPlaceDto: CreatePlaceDto,
    image?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    if (image) {
      // Envia buffer da imagem para o Cloudinary na pasta 'places'
      imageUrl = await this.cloudinary.uploadImage(image, 'places');
    }

    const result = await this.prisma.place.create({
      data: {
        ...createPlaceDto,
        imageUrl, // será undefined se não enviou imagem (campo opcional)
      },
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

  // Atualiza place; se vier imagem nova, faz upload e substitui imageUrl
  async update(
    id: string,
    updatePlaceDto: UpdatePlaceDto,
    image?: Express.Multer.File,
  ) {
    await this.findOne(id);

    let imageUrl: string | undefined;

    if (image) {
      // Upload da nova imagem
      imageUrl = await this.cloudinary.uploadImage(image, 'places');
    }

    const result = await this.prisma.place.update({
      where: { id },
      data: {
        ...updatePlaceDto,
        // Só atualiza imageUrl se veio imagem nova; senão mantém a antiga
        ...(imageUrl && { imageUrl }),
      },
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
