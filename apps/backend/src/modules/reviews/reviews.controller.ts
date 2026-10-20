// Imports do NestJS para rotas, validação, interceptors, guards
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  UseFilters,
  UploadedFile,
} from '@nestjs/common';
// Cache para listagem de reviews
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
// Multer: FileInterceptor para receber arquivo único no multipart/form-data
import { FileInterceptor } from '@nestjs/platform-express';
// Guard de autenticação
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
// Service e DTO do módulo
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
// Config do Multer (memoryStorage, limite 5MB, fileFilter por mime-type)
import { imageUploadMulterOptions } from '../../common/upload/image-upload.config';
// Pipe que valida magic numbers e tamanho do arquivo
import { ImageValidationPipe } from '../../common/upload/image-validation.pipe';
// Filtro que traduz erros do Multer (ex.: arquivo grande) em JSON limpo
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('place/:placeId')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutos (reviews mudam pouco)
  @CacheKey('reviews_place')
  findByPlace(@Param('placeId') placeId: string) {
    // Cache por placeId: chave será 'reviews_place::placeId_<uuid>'
    return this.reviewsService.findByPlace(placeId);
  }

  // POST /reviews — cria review (usuário logado)
  // @UseGuards(JwtAuthGuard): roda ANTES do upload (protege a rota)
  // @UseFilters(MulterExceptionFilter): traduz erros do Multer (ex.: LIMIT_FILE_SIZE)
  // @UseInterceptors(FileInterceptor('image', imageUploadMulterOptions)):
  //   recebe campo "image" no multipart, usa memoryStorage + validações básicas
  // @UploadedFile(new ImageValidationPipe()) image:
  //   pega o arquivo validado pelo Pipe (magic numbers + tamanho) ou undefined
  // @Body(): usa o ValidationPipe GLOBAL do main.ts (converte rating de texto para número)
  @UseGuards(JwtAuthGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', imageUploadMulterOptions))
  @Post()
  create(
    @Body() data: CreateReviewDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File | undefined,
    @Request() req,
  ) {
    return this.reviewsService.create(data, req.user.id, image);
  }
}
