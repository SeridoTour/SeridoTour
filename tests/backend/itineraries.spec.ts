import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ItineraryStatus, Role } from '@prisma/client';
import { ItinerariesService } from '../../apps/backend/src/modules/itineraries/itineraries.service';

describe('BE-ITIN | Roteiros, autoria e moderação', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    itinerary: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const cache = { clear: jest.fn() };
  const author = { id: 'author-1', role: Role.USER };
  const input = { title: 'Seridó em dois dias', description: 'Natureza e cultura', duracaoDias: 2, placeIds: ['place-1', 'place-2'] };
  const itinerary = { id: 'itinerary-1', userId: author.id, status: ItineraryStatus.RASCUNHO, ...input };
  let service: ItinerariesService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new ItinerariesService(prisma as any, cache as any);
    prisma.user.findUnique.mockResolvedValue(author);
    prisma.itinerary.findUnique.mockResolvedValue(itinerary);
    prisma.itinerary.create.mockResolvedValue(itinerary);
    prisma.itinerary.update.mockResolvedValue(itinerary);
    prisma.itinerary.delete.mockResolvedValue(itinerary);
  });

  it('BE-ITIN-01 cria rascunho com autor e destinos associados', async () => {
    await expect(service.create(input, author.id)).resolves.toEqual(itinerary);
    expect(prisma.itinerary.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        title: input.title, description: input.description, duracaoDias: 2, userId: author.id,
        status: ItineraryStatus.RASCUNHO, places: { connect: [{ id: 'place-1' }, { id: 'place-2' }] },
      },
    }));
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it('BE-ITIN-02 recusa criação por usuário inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.create(input, 'ausente')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.itinerary.create).not.toHaveBeenCalled();
    expect(cache.clear).not.toHaveBeenCalled();
  });
  it('BE-ITIN-03 lista somente os roteiros do autor na consulta pessoal', async () => {
    prisma.itinerary.findMany.mockResolvedValue([itinerary]);
    await expect(service.findMine(author.id)).resolves.toEqual([itinerary]);
    expect(prisma.itinerary.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: author.id } }));
  });
  it('BE-ITIN-04 bloqueia leitura de rascunho alheio', async () => {
    await expect(service.findOne(itinerary.id, { id: 'outro', role: Role.USER })).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('BE-ITIN-05 permite leitura de roteiro publicado por outro turista', async () => {
    prisma.itinerary.findUnique.mockResolvedValue({ ...itinerary, status: ItineraryStatus.PUBLICADO });
    await expect(service.findOne(itinerary.id, { id: 'outro', role: Role.USER })).resolves.toMatchObject({ status: ItineraryStatus.PUBLICADO });
  });
  it.each([ItineraryStatus.RASCUNHO, ItineraryStatus.REJEITADO, ItineraryStatus.EM_ANALISE])(
    'BE-ITIN-06 esconde roteiro %s na consulta pública', async (status) => {
      prisma.itinerary.findUnique.mockResolvedValue({ ...itinerary, status });
      await expect(service.findPublishedOne(itinerary.id)).rejects.toBeInstanceOf(NotFoundException);
    },
  );
  it('BE-ITIN-07 retorna detalhe público de roteiro publicado', async () => {
    prisma.itinerary.findUnique.mockResolvedValue({ ...itinerary, status: ItineraryStatus.PUBLICADO });
    await expect(service.findPublishedOne(itinerary.id)).resolves.toMatchObject({ id: itinerary.id });
  });
  it('BE-ITIN-08 informa roteiro inexistente', async () => {
    prisma.itinerary.findUnique.mockResolvedValue(null);
    await expect(service.findOne('ausente', author)).rejects.toBeInstanceOf(NotFoundException);
  });
  it('BE-ITIN-09 substitui a seleção de locais na edição', async () => {
    await service.update(itinerary.id, { placeIds: ['place-3'] }, author);
    expect(prisma.itinerary.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ places: { set: [{ id: 'place-3' }] } }),
    }));
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it('BE-ITIN-10 impede guia de enviar roteiro de outro autor para análise', async () => {
    await expect(service.submitForReview(itinerary.id, { id: 'guia', role: Role.GUIA })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.itinerary.update).not.toHaveBeenCalled();
  });
  it('BE-ITIN-11 impede reenviar roteiro já em análise', async () => {
    prisma.itinerary.findUnique.mockResolvedValue({ ...itinerary, status: ItineraryStatus.EM_ANALISE });
    await expect(service.submitForReview(itinerary.id, author)).rejects.toBeInstanceOf(ConflictException);
    expect(cache.clear).not.toHaveBeenCalled();
  });
  it.each(['reject', 'unpublish'] as const)('BE-ITIN-12 impede transição %s a partir de rascunho', async (method) => {
    await expect(service[method](itinerary.id)).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.itinerary.update).not.toHaveBeenCalled();
  });
  it.each([['  Ajustar descrição  ', 'Ajustar descrição'], ['   ', null], [undefined, null]])(
    'BE-ITIN-13 normaliza motivo de rejeição %s', async (reason, expected) => {
      prisma.itinerary.findUnique.mockResolvedValue({ ...itinerary, status: ItineraryStatus.EM_ANALISE });
      await service.reject(itinerary.id, reason as string | undefined);
      expect(prisma.itinerary.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: ItineraryStatus.REJEITADO, rejectionReason: expected },
      }));
      expect(cache.clear).toHaveBeenCalledTimes(1);
    },
  );
  it('BE-ITIN-14 remove roteiro existente e limpa cache', async () => {
    await expect(service.remove(itinerary.id)).resolves.toEqual(itinerary);
    expect(prisma.itinerary.delete).toHaveBeenCalledWith({ where: { id: itinerary.id } });
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
});
