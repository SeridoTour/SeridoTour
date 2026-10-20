// Module do NestJS: agrupa providers e controllers relacionados
import { Module } from '@nestjs/common';
// Importa o service que criamos acima
import { CloudinaryService } from './cloudinary.service';

@Module({
  // Providers: classes que o NestJS pode injetar (aqui só o CloudinaryService)
  providers: [CloudinaryService],
  // Exports: torna o CloudinaryService disponível para outros módulos que importarem este
  exports: [CloudinaryService],
})
// Este módulo será importado em PlacesModule e ReviewsModule
export class CloudinaryModule {}