// Module do NestJS: agrupa imports, controllers e providers
import { Module } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
// CloudinaryModule: traz o CloudinaryService para upload de imagens
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule, // disponibiliza CloudinaryService para injeção
  ],
  controllers: [PlacesController],
  providers: [PlacesService],
})
export class PlacesModule {}
