import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ItineraryStatus, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';

type AuthenticatedUser = {
  id: string;
  role: Role;
};

@Injectable()
export class ItinerariesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async invalidateItinerariesCache(): Promise<void> {
    // Limpa todo o cache (store em memória).
    // Em produção com Redis, usar SCAN + DEL por prefixo 'itineraries'.
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
        status: ItineraryStatus.RASCUNHO,
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

  /**
   * Listagem global autenticada:
   * - GUIA vê todos os roteiros (gestão/revisão).
   * - USER vê apenas roteiros PUBLICADOS (vitrine pública).
   */
  async findAll(user: AuthenticatedUser) {
    return this.prisma.itinerary.findMany({
      where:
        user.role === Role.GUIA
          ? {}
          : { status: ItineraryStatus.PUBLICADO },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  /** Lista global pública: somente roteiros publicados. */
  async findPublished() {
    return this.prisma.itinerary.findMany({
      where: { status: ItineraryStatus.PUBLICADO },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  /** Lista os roteiros do próprio autor, em qualquer status. */
  async findMine(userId: string) {
    return this.prisma.itinerary.findMany({
      where: { userId },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async findOne(id: string, user?: AuthenticatedUser) {
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

    const canView =
      !user ||
      user.role === Role.GUIA ||
      itinerary.userId === user.id ||
      itinerary.status === ItineraryStatus.PUBLICADO;

    if (!canView) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este roteiro.',
      );
    }

    return itinerary;
  }

  /** Detalhe público: somente se o roteiro estiver publicado. */
  async findPublishedOne(id: string) {
    const itinerary = await this.prisma.itinerary.findUnique({
      where: { id },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!itinerary || itinerary.status !== ItineraryStatus.PUBLICADO) {
      throw new NotFoundException(`Roteiro com ID ${id} não encontrado.`);
    }

    return itinerary;
  }

  async update(
    id: string,
    updateItineraryDto: UpdateItineraryDto,
    user: AuthenticatedUser,
  ) {
    const itinerary = await this.findOne(id, user);

    if (user.role !== Role.GUIA && itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar este roteiro.',
      );
    }

    if (itinerary.status === ItineraryStatus.EM_ANALISE) {
      throw new ConflictException(
        'Não é possível editar um roteiro em análise. Aguarde a revisão.',
      );
    }

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
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  /** RASCUNHO/REJEITADO → EM_ANALISE (somente o autor). */
  async submitForReview(id: string, user: AuthenticatedUser) {
    const itinerary = await this.findOne(id, user);

    if (itinerary.userId !== user.id) {
      throw new ForbiddenException(
        'Somente o autor pode enviar este roteiro para análise.',
      );
    }

    if (itinerary.status === ItineraryStatus.EM_ANALISE) {
      throw new ConflictException('Este roteiro já está em análise.');
    }

    if (itinerary.status === ItineraryStatus.PUBLICADO) {
      throw new ConflictException('Este roteiro já está publicado.');
    }

    const result = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: ItineraryStatus.EM_ANALISE,
        rejectionReason: null,
      },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  /** EM_ANALISE → PUBLICADO (somente GUIA). */
  async publish(id: string) {
    const itinerary = await this.findOne(id);

    if (itinerary.status !== ItineraryStatus.EM_ANALISE) {
      throw new ConflictException(
        'Somente roteiros em análise podem ser publicados.',
      );
    }

    const result = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: ItineraryStatus.PUBLICADO,
        rejectionReason: null,
      },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  /** EM_ANALISE → REJEITADO (somente GUIA). */
  async reject(id: string, reason?: string) {
    const itinerary = await this.findOne(id);

    if (itinerary.status !== ItineraryStatus.EM_ANALISE) {
      throw new ConflictException(
        'Somente roteiros em análise podem ser rejeitados.',
      );
    }

    const result = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: ItineraryStatus.REJEITADO,
        rejectionReason: reason?.trim() || null,
      },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
    });

    await this.invalidateItinerariesCache();
    return result;
  }

  /** PUBLICADO → RASCUNHO (somente GUIA). */
  async unpublish(id: string) {
    const itinerary = await this.findOne(id);

    if (itinerary.status !== ItineraryStatus.PUBLICADO) {
      throw new ConflictException(
        'Somente roteiros publicados podem ser despublicados.',
      );
    }

    const result = await this.prisma.itinerary.update({
      where: { id },
      data: {
        status: ItineraryStatus.RASCUNHO,
        rejectionReason: null,
      },
      include: {
        places: true,
        user: { select: { id: true, name: true } },
      },
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
