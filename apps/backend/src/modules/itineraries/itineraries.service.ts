import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

@Injectable()
export class ItinerariesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateItinerariesCache(): Promise<void> {
    // Limpa todo o cache (store em memória).
    // Em produção com Redis, usar SCAN + DEL por prefixo 'itineraries_list'.
    await this.cacheManager.clear();
  }

  async create(createItineraryDto: CreateItineraryDto, userId: string) {
    const { title, description, duracaoDias, placeIds } = createItineraryDto;

    const userExists = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userExists)
      throw new NotFoundException('Usuário criador não encontrado.');

    const result = await this.prisma.itinerary.create({
      data: {
        title,
        description,
        duracaoDias,
        userId,
        places: {
          connect: placeIds.map((id) => ({ id })),
        },
      },
      include: {
        places: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  async findAll(user: { id: string; role: Role }) {
    return this.prisma.itinerary.findMany({
      where: user.role === Role.GUIA ? {} : { userId: user.id },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string, user?: { id: string; role: Role }) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!itinerary) {
      throw new NotFoundException(`Roteiro com ID ${id} não encontrado.`);
    }
    if (user && user.role !== Role.GUIA && itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este roteiro.',
      );
    }
    return itinerary;
  }

  async update(id: string, updateItineraryDto: UpdateItineraryDto) {
    await this.findOne(id);
    const { title, description, duracaoDias, placeIds } = updateItineraryDto;

    const result = await this.prisma.itinerary.update({
      where: { id },
      data: {
        title,
        description,
        duracaoDias,
        ...(placeIds && {
          places: {
            set: placeIds.map((placeId) => ({ id: placeId })),
          },
        }),
      },
      include: { places: true },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    const result = await this.prisma.itinerary.delete({ where: { id } });
    await this.invalidateItinerariesCache();
    return result;
  }
}
