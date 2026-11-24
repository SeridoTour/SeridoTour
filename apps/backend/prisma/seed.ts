import { ItineraryStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const { assertLocalDatabase } = require('../../../scripts/local-database.cjs');

const prisma = new PrismaClient();

async function main() {
  assertLocalDatabase(process.env.DATABASE_URL, { seed: true });
  const password = process.env.LOCAL_DEMO_PASSWORD;
  if (!password || password.length < 12) throw new Error('Senha local de demonstração obrigatória.');
  console.log('Iniciando seed somente de demonstração local...');

  // Usuário
  const user = await prisma.user.upsert({
    where: {
      email: 'turista@local.example.test',
    },
    update: {},
    create: {
      name: 'Turista Demo Local',
      email: 'turista@local.example.test',
      password: await bcrypt.hash(password, 12),
    },
  });

  // Praia 1
  const place1 = await prisma.place.upsert({
    where: { id: '00000000-0000-4000-8000-000000000101' }, update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000101',
      name: 'Praia de Ponta Negra',
      description:
        'Uma das praias mais famosas do Rio Grande do Norte.',
      city: 'Natal',
      category: 'Praia',
      latitude: -5.79448,
      longitude: -35.211,
    },
  });

  // Praia 2
  const place2 = await prisma.place.upsert({
    where: { id: '00000000-0000-4000-8000-000000000102' }, update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000102',
      name: 'Galinhos',
      description:
        'Destino turístico com praias, dunas e paisagens naturais.',
      city: 'Galinhos',
      category: 'Praia',
      latitude: -5.0914,
      longitude: -35.0267,
    },
  });

  // Itinerário
  await prisma.itinerary.upsert({
    where: { id: '00000000-0000-4000-8000-000000000201' }, update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000201',
      title: 'Conhecendo o litoral potiguar',
      description:
        'Roteiro de demonstração pelo litoral do Rio Grande do Norte.',
      duracaoDias: 3,
      status: ItineraryStatus.RASCUNHO,
      user: {
        connect: {
          id: user.id,
        },
      },
      places: {
        connect: [
          { id: place1.id },
          { id: place2.id },
        ],
      },
    },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch(() => {
    console.error('Seed recusado ou não concluído. Use banco local de demonstração/teste e LOCAL_DEMO_PASSWORD com pelo menos 12 caracteres.');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
