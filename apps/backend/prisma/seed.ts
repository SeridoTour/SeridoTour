import { ItineraryStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Usuário
  const user = await prisma.user.upsert({
    where: {
      email: 'turista@northeastour.com',
    },
    update: {},
    create: {
      name: 'Turista Demo',
      email: 'turista@northeastour.com',
      password:
        '$2b$08$qVuP48LeJdhEb//xwSN3COOe/i4DlQeV26FEMYZHqcHk1B/2A9hgq', // Senha: 'Turista123@'
    },
  });

  // Praia 1
  const place1 = await prisma.place.create({
    data: {
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
  const place2 = await prisma.place.create({
    data: {
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
  await prisma.itinerary.create({
    data: {
      title: 'Conhecendo o litoral potiguar',
      description:
        'Roteiro de demonstração pelo litoral do Rio Grande do Norte.',
      duracaoDias: 3,
      status: ItineraryStatus.PUBLICADO,
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

  // Avaliação
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Lugar incrível, recomendo a visita!',
      user: {
        connect: {
          id: user.id,
        },
      },
      place: {
        connect: {
          id: place1.id,
        },
      },
    },
  });

  console.log('Seed executado com sucesso!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
