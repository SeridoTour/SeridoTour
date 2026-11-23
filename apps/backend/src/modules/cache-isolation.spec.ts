import { Test } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PlacesController } from './places/places.controller';
import { PlacesService } from './places/places.service';
import { ReviewsController } from './reviews/reviews.controller';
import { ReviewsService } from './reviews/reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('Cache HTTP por query e local', () => {
  let app: INestApplication;
  let places: any[];
  beforeEach(async () => {
    places = ['A', 'B', 'C', 'D'].map((name, id) => ({ id: String(id), name, category: id % 2 ? 'cultura' : 'natureza' }));
    const filtered = (where: any) => places.filter(place => !where.category || place.category === where.category.equals);
    const prisma = {
      place: {
        findMany: jest.fn(async ({ where, skip, take }) => filtered(where).slice(skip, skip + take)),
        count: jest.fn(async ({ where }) => filtered(where).length),
        create: jest.fn(async ({ data }) => { const place = { id: 'new', ...data }; places.push(place); return place; }),
      },
      review: { findMany: jest.fn(async ({ where }) => [{ placeId: where.placeId, comment: `Review ${where.placeId}` }]) },
    };
    const module = await Test.createTestingModule({
      imports: [CacheModule.register({ isGlobal: true })],
      controllers: [PlacesController, ReviewsController],
      providers: [PlacesService, ReviewsService,
        { provide: PrismaService, useValue: prisma }, { provide: CloudinaryService, useValue: {} }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });
  afterEach(async () => { await app.close(); });

  it('separa páginas, limites e filtros e invalida após criação', async () => {
    const first = await request(app.getHttpServer()).get('/places?limit=1&page=1').expect(200);
    const second = await request(app.getHttpServer()).get('/places?limit=2&page=2').expect(200);
    expect(first.body.data.map((place: any) => place.name)).toEqual(['A']);
    expect(second.body.data.map((place: any) => place.name)).toEqual(['C', 'D']);
    const category = await request(app.getHttpServer()).get('/places?category=cultura').expect(200);
    expect(category.body.data.map((place: any) => place.name)).toEqual(['B', 'D']);
    await request(app.getHttpServer()).get('/places?limit=1&page=1').expect('X-Cache', 'HIT');
    await app.get(PlacesService).create({ name: 'E', description: 'Teste', city: 'Acari', latitude: -6, longitude: -36, category: 'cultura' });
    const fresh = await request(app.getHttpServer()).get('/places?limit=1&page=1').expect('X-Cache', 'MISS');
    expect(fresh.body.meta.total).toBe(5);
  });

  it('separa avaliações de locais diferentes', async () => {
    const first = await request(app.getHttpServer()).get('/reviews/place/one').expect(200);
    const second = await request(app.getHttpServer()).get('/reviews/place/two').expect(200);
    expect(first.body[0].placeId).toBe('one');
    expect(second.body[0].placeId).toBe('two');
    await request(app.getHttpServer()).get('/reviews/place/one').expect('X-Cache', 'HIT');
  });
});
