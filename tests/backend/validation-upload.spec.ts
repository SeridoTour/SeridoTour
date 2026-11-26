import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from '../../apps/backend/src/modules/users/dto/create-user.dto';
import { CreateReviewDto } from '../../apps/backend/src/modules/reviews/dto/create-review.dto';
import { CreateItineraryDto } from '../../apps/backend/src/modules/itineraries/dto/create-itinerary.dto';
import { UpdateItineraryDto } from '../../apps/backend/src/modules/itineraries/dto/update-itinerary.dto';
import { CreatePlaceDto } from '../../apps/backend/src/modules/places/dto/create-place.dto';
import { FindAllPlacesQueryDto } from '../../apps/backend/src/modules/places/dto/find-all-places-query.dto';
import { detectImageMime } from '../../apps/backend/src/common/upload/image-signature.util';
import { ImageValidationPipe } from '../../apps/backend/src/common/upload/image-validation.pipe';
import { MAX_FILE_SIZE_BYTES } from '../../apps/backend/src/common/upload/image-upload.config';

const placeId = '11111111-1111-4111-8111-111111111111';

describe('BE-DTO | Validação de entradas reais', () => {
  it('BE-DTO-01 aceita cadastro com senha forte', async () => {
    const dto = plainToInstance(CreateUserDto, { name: 'Ana', email: 'ana@example.test', password: 'Senha1!' });
    await expect(validate(dto)).resolves.toEqual([]);
  });
  it.each(['abc', 'senha123', 'SENHA!', 'Senha123'])('BE-DTO-02 recusa senha fora da política: %s', async (password) => {
    const errors = await validate(plainToInstance(CreateUserDto, { name: 'Ana', email: 'ana@example.test', password }));
    expect(errors.map((error) => error.property)).toContain('password');
  });
  it('BE-DTO-03 recusa e-mail inválido', async () => {
    const errors = await validate(plainToInstance(CreateUserDto, { name: 'Ana', email: 'invalido', password: 'Senha1!' }));
    expect(errors.map((error) => error.property)).toContain('email');
  });
  it.each([0, 6, 2.5])('BE-DTO-04 recusa nota inválida: %s', async (rating) => {
    const errors = await validate(plainToInstance(CreateReviewDto, { placeId, rating, comment: 'Visita' }));
    expect(errors.map((error) => error.property)).toContain('rating');
  });
  it.each([1, 5])('BE-DTO-05 aceita limite de nota: %s', async (rating) => {
    await expect(validate(plainToInstance(CreateReviewDto, { placeId, rating, comment: 'Visita' }))).resolves.toEqual([]);
  });
  it('BE-DTO-06 transforma parâmetros de paginação de texto para número', async () => {
    const dto = plainToInstance(FindAllPlacesQueryDto, { page: '2', limit: '10' });
    expect(dto).toMatchObject({ page: 2, limit: 10 });
    await expect(validate(dto)).resolves.toEqual([]);
  });
  it.each([{ page: 0 }, { limit: -1 }])('BE-DTO-07 recusa paginação inválida: %j', async (query) => {
    expect((await validate(plainToInstance(FindAllPlacesQueryDto, query))).length).toBeGreaterThan(0);
  });
  it.each([{ latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }])('BE-DTO-08 recusa coordenadas fora dos limites: %j', async (coords) => {
    const dto = plainToInstance(CreatePlaceDto, { name: 'Local', description: 'Descrição', city: 'Caicó', category: 'Natureza', ...coords });
    expect((await validate(dto)).some((error) => ['latitude', 'longitude'].includes(error.property))).toBe(true);
  });
  it('BE-DTO-09 recusa duração de roteiro menor que um dia', async () => {
    const dto = plainToInstance(CreateItineraryDto, { title: 'Roteiro', description: 'Viagem', duracaoDias: 0, placeIds: [placeId] });
    expect((await validate(dto)).map((error) => error.property)).toContain('duracaoDias');
  });
  it('BE-DTO-10 exige pelo menos um destino no roteiro', async () => {
    const dto = plainToInstance(CreateItineraryDto, { title: 'Roteiro', description: 'Viagem', duracaoDias: 1, placeIds: [] });
    expect((await validate(dto)).map((error) => error.property)).toContain('placeIds');
  });
  it.each([placeId, '11111111-1111-5111-8111-111111111111'])('BE-DTO-11 aceita UUID v4/v5 do catálogo: %s', async (id) => {
    const itinerary = plainToInstance(CreateItineraryDto, { title: 'Roteiro', description: 'Visita', duracaoDias: 1, placeIds: [id] });
    const review = plainToInstance(CreateReviewDto, { placeId: id, rating: 5, comment: 'Visita ao geossítio' });
    await expect(validate(itinerary)).resolves.toEqual([]);
    await expect(validate(review)).resolves.toEqual([]);
  });
  it('BE-DTO-12 permite omitir destinos na edição, mas recusa esvaziá-los', async () => {
    await expect(validate(plainToInstance(UpdateItineraryDto, { title: 'Novo título' }))).resolves.toEqual([]);
    const errors = await validate(plainToInstance(UpdateItineraryDto, { placeIds: [] }));
    expect(errors.map((error) => error.property)).toContain('placeIds');
  });
});

describe('BE-UPLOAD | Conteúdo e tamanho de imagens', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, ...Array(9).fill(0)]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const webp = Buffer.from('RIFF0000WEBP');
  const pipe = new ImageValidationPipe();
  const file = (buffer: Buffer, size = buffer.length) => ({ buffer, size, mimetype: 'image/jpeg', originalname: 'foto.jpg' }) as Express.Multer.File;

  it.each([['JPEG', jpeg, 'image/jpeg'], ['PNG', png, 'image/png'], ['WEBP', webp, 'image/webp']] as const)('BE-UPLOAD-01 reconhece assinatura de %s', (_format, buffer, mime) => {
    expect(detectImageMime(buffer)).toBe(mime);
  });
  it.each([['vazio', Buffer.alloc(0)], ['truncado', Buffer.from('curto')], ['texto disfarçado', Buffer.from('texto disfarçado de imagem')]] as const)('BE-UPLOAD-02 recusa conteúdo inválido: %s', (_description, buffer) => {
    expect(detectImageMime(buffer)).toBeNull();
    expect(() => pipe.transform(file(buffer))).toThrow(BadRequestException);
  });
  it('BE-UPLOAD-03 permite não enviar a imagem opcional', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });
  it('BE-UPLOAD-04 aceita exatamente o tamanho máximo', () => {
    const image = file(jpeg, MAX_FILE_SIZE_BYTES);
    expect(pipe.transform(image)).toBe(image);
  });
  it('BE-UPLOAD-05 bloqueia imagem acima de 5 MB', () => {
    expect(() => pipe.transform(file(jpeg, MAX_FILE_SIZE_BYTES + 1))).toThrow('Imagem excede o limite de 5 MB.');
  });
});
