import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ItineraryStatus, Role } from '@prisma/client';
import { ItinerariesService } from './itineraries.service';

describe('ItinerariesService — máquina de estados', () => {
  const prisma = {
    itinerary: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const cacheManager = {
    clear: jest.fn(),
  };

  const service = new ItinerariesService(prisma as any, cacheManager as any);
  const autor = { id: 'user-1', role: Role.USER };
  const guia = { id: 'guia-1', role: Role.GUIA };

  const itinerary = (status: ItineraryStatus, userId = autor.id) => ({
    id: 'itinerary-1',
    title: 'Roteiro',
    description: 'Descrição',
    duracaoDias: 2,
    userId,
    status,
    rejectionReason: null,
    places: [],
    user: { id: userId, name: 'Autor' },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ id: autor.id });
    prisma.itinerary.findMany.mockResolvedValue([]);
    prisma.itinerary.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ ...itinerary(ItineraryStatus.RASCUNHO), ...data }),
    );
  });

  describe('listagens', () => {
    it('lista apenas roteiros publicados para turistas', async () => {
      await service.findAll(autor);

      expect(prisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ItineraryStatus.PUBLICADO },
        }),
      );
    });

    it('lista todos os roteiros para guias', async () => {
      await service.findAll(guia);

      expect(prisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('a listagem pública filtra somente publicados', async () => {
      await service.findPublished();

      expect(prisma.itinerary.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ItineraryStatus.PUBLICADO },
        }),
      );
    });
  });

  describe('edição', () => {
    it('retorna 409 ao tentar editar roteiro em análise', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.EM_ANALISE),
      );

      await expect(
        service.update(
          'itinerary-1',
          { title: 'Novo título' },
          autor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.itinerary.update).not.toHaveBeenCalled();
    });

    it('permite editar roteiro em rascunho do próprio autor', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.RASCUNHO),
      );

      await service.update('itinerary-1', { title: 'Novo título' }, autor);

      expect(prisma.itinerary.update).toHaveBeenCalled();
    });

    it('bloqueia edição de roteiro de outro autor', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.RASCUNHO, 'outro-user'),
      );

      await expect(
        service.update('itinerary-1', { title: 'Novo título' }, autor),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('transições', () => {
    it('envia rascunho para análise', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.RASCUNHO),
      );

      await service.submitForReview('itinerary-1', autor);

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ItineraryStatus.EM_ANALISE,
            rejectionReason: null,
          }),
        }),
      );
    });

    it('reenvia roteiro rejeitado para análise', async () => {
      prisma.itinerary.findUnique.mockResolvedValue({
        ...itinerary(ItineraryStatus.REJEITADO),
        rejectionReason: 'Faltou descrição',
      });

      await service.submitForReview('itinerary-1', autor);

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ItineraryStatus.EM_ANALISE }),
        }),
      );
    });

    it('impede envio para análise de roteiro já publicado', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.PUBLICADO),
      );

      await expect(
        service.submitForReview('itinerary-1', autor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('publica roteiro em análise', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.EM_ANALISE),
      );

      await service.publish('itinerary-1');

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ItineraryStatus.PUBLICADO }),
        }),
      );
    });

    it('impede publicar roteiro que não está em análise', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.RASCUNHO),
      );

      await expect(service.publish('itinerary-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejeita roteiro em análise com motivo', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.EM_ANALISE),
      );

      await service.reject('itinerary-1', 'Informações incompletas');

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            status: ItineraryStatus.REJEITADO,
            rejectionReason: 'Informações incompletas',
          },
        }),
      );
    });

    it('despublica roteiro publicado', async () => {
      prisma.itinerary.findUnique.mockResolvedValue(
        itinerary(ItineraryStatus.PUBLICADO),
      );

      await service.unpublish('itinerary-1');

      expect(prisma.itinerary.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ItineraryStatus.RASCUNHO }),
        }),
      );
    });
  });
});
