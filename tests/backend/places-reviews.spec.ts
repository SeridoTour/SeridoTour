import { NotFoundException } from '@nestjs/common';
import { PlacesService } from '../../apps/backend/src/modules/places/places.service';
import { ReviewsService } from '../../apps/backend/src/modules/reviews/reviews.service';

describe('BE-PLACE | Destinos turísticos', () => {
  const prisma = { place: {
    create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn(),
  } };
  const cache = { clear: jest.fn() };
  const cloudinary = { uploadImage: jest.fn() };
  const input = { name: 'Açude', description: 'Paisagem do Seridó', category: 'Natureza', city: 'Caicó', latitude: -6.45, longitude: -37.1 };
  const saved = { ...input, id: 'place-1', imageUrl: '/anterior.png' };
  const image = { buffer: Buffer.from('imagem') } as Express.Multer.File;
  let service: PlacesService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new PlacesService(prisma as any, cache as any, cloudinary as any);
    prisma.place.findUnique.mockResolvedValue(saved);
    prisma.place.create.mockResolvedValue(saved);
    prisma.place.update.mockResolvedValue(saved);
    prisma.place.delete.mockResolvedValue(saved);
    cloudinary.uploadImage.mockResolvedValue('https://images.example.test/nova.png');
  });

  it('BE-PLACE-01 cria destino sem imagem e invalida cache', async () => {
    await expect(service.create(input)).resolves.toEqual(saved);
    expect(prisma.place.create).toHaveBeenCalledWith({ data: { ...input, imageUrl: undefined } });
    expect(cache.clear).toHaveBeenCalledTimes(1);
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });
  it('BE-PLACE-02 salva a URL retornada pelo upload', async () => {
    await service.create(input, image);
    expect(cloudinary.uploadImage).toHaveBeenCalledWith(image, 'places');
    expect(prisma.place.create).toHaveBeenCalledWith({ data: { ...input, imageUrl: 'https://images.example.test/nova.png' } });
  });
  it('BE-PLACE-03 não grava nem limpa cache quando o upload falha', async () => {
    cloudinary.uploadImage.mockRejectedValue(new Error('upload indisponível'));
    await expect(service.create(input, image)).rejects.toThrow('upload indisponível');
    expect(prisma.place.create).not.toHaveBeenCalled();
    expect(cache.clear).not.toHaveBeenCalled();
  });
  it('BE-PLACE-04 pagina e filtra categoria ignorando maiúsculas', async () => {
    prisma.place.findMany.mockResolvedValue([saved]);
    prisma.place.count.mockResolvedValue(21);
    const result = await service.findAll({ category: 'natureza', page: 2, limit: 10 });
    const where = { category: { equals: 'natureza', mode: 'insensitive' } };
    expect(prisma.place.findMany).toHaveBeenCalledWith({ where, skip: 10, take: 10, orderBy: { name: 'asc' } });
    expect(prisma.place.count).toHaveBeenCalledWith({ where });
    expect(result).toEqual({ data: [saved], meta: { total: 21, page: 2, limit: 10, totalPages: 3 } });
  });
  it('BE-PLACE-05 retorna página vazia com os padrões de paginação', async () => {
    prisma.place.findMany.mockResolvedValue([]);
    prisma.place.count.mockResolvedValue(0);
    await expect(service.findAll({})).resolves.toEqual({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } });
  });
  it('BE-PLACE-06 informa destino inexistente', async () => {
    prisma.place.findUnique.mockResolvedValue(null);
    await expect(service.findOne('ausente')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('BE-PLACE-07 preserva a imagem anterior na edição sem arquivo', async () => {
    await service.update(saved.id, { name: 'Novo nome' });
    expect(prisma.place.update).toHaveBeenCalledWith({ where: { id: saved.id }, data: { name: 'Novo nome' } });
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it('BE-PLACE-08 substitui imagem na edição com arquivo', async () => {
    await service.update(saved.id, {}, image);
    expect(prisma.place.update).toHaveBeenCalledWith({ where: { id: saved.id }, data: { imageUrl: 'https://images.example.test/nova.png' } });
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it('BE-PLACE-09 remove destino e invalida cache', async () => {
    await expect(service.remove(saved.id)).resolves.toEqual(saved);
    expect(prisma.place.delete).toHaveBeenCalledWith({ where: { id: saved.id } });
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it.each(['update', 'remove'] as const)('BE-PLACE-10 impede %s de destino inexistente', async (method) => {
    prisma.place.findUnique.mockResolvedValue(null);
    await expect(method === 'update' ? service.update('ausente', {}, image) : service.remove('ausente')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.place.update).not.toHaveBeenCalled();
    expect(prisma.place.delete).not.toHaveBeenCalled();
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });
});

describe('BE-REVIEW | Avaliações', () => {
  const prisma = { place: { findUnique: jest.fn() }, review: { create: jest.fn(), findMany: jest.fn() } };
  const cache = { clear: jest.fn() };
  const cloudinary = { uploadImage: jest.fn() };
  const input = { placeId: 'place-1', rating: 5, comment: 'Ótima visita!' };
  const image = { buffer: Buffer.from('imagem') } as Express.Multer.File;
  let service: ReviewsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ReviewsService(prisma as any, cache as any, cloudinary as any);
    prisma.place.findUnique.mockResolvedValue({ id: input.placeId });
    prisma.review.create.mockResolvedValue({ id: 'review-1', ...input });
  });

  it('BE-REVIEW-01 verifica o destino antes de enviar imagem', async () => {
    prisma.place.findUnique.mockResolvedValue(null);
    await expect(service.create(input, 'user-1', image)).rejects.toBeInstanceOf(NotFoundException);
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(prisma.review.create).not.toHaveBeenCalled();
    expect(cache.clear).not.toHaveBeenCalled();
  });
  it('BE-REVIEW-02 associa avaliação ao autor autenticado e limpa cache', async () => {
    await expect(service.create(input, 'user-1')).resolves.toEqual({ id: 'review-1', ...input });
    expect(prisma.review.create).toHaveBeenCalledWith({
      data: { ...input, userId: 'user-1', imageUrl: undefined },
      include: { user: { select: { id: true, name: true } } },
    });
    expect(cache.clear).toHaveBeenCalledTimes(1);
  });
  it('BE-REVIEW-03 associa imagem à avaliação', async () => {
    cloudinary.uploadImage.mockResolvedValue('https://images.example.test/review.png');
    await service.create(input, 'user-1', image);
    expect(cloudinary.uploadImage).toHaveBeenCalledWith(image, 'reviews');
    expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: 'https://images.example.test/review.png' }),
    }));
  });
  it('BE-REVIEW-04 lista somente avaliações do destino em ordem recente', async () => {
    prisma.review.findMany.mockResolvedValue([]);
    await expect(service.findByPlace('place-1')).resolves.toEqual([]);
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { placeId: 'place-1' }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' },
    });
  });
});
