// Imports do NestJS para rotas, validação, interceptors, guards
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
  UseFilters,
  UploadedFile,
} from '@nestjs/common';
// Cache para listagem de places
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
// Multer: FileInterceptor para receber arquivo único no multipart/form-data
import { FileInterceptor } from '@nestjs/platform-express';
// Guards de autenticação e roles
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
// Service e DTOs do módulo
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { FindAllPlacesQueryDto } from './dto/find-all-places-query.dto';
// Config do Multer (memoryStorage, limite 5MB, fileFilter por mime-type)
import { imageUploadMulterOptions } from '../../common/upload/image-upload.config';
// Pipe que valida magic numbers e tamanho do arquivo
import { ImageValidationPipe } from '../../common/upload/image-validation.pipe';
// Filtro que traduz erros do Multer (ex.: arquivo grande) em JSON limpo
import { MulterExceptionFilter } from '../../modules/reviews/filters/multer-exception.filter';

@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  // POST /places — cria place (apenas GUIA)
  // @UseGuards: roda ANTES do upload (protege a rota, não o arquivo)
  //   JwtAuthGuard: precisa estar logado (token JWT válido)
  //   RolesGuard + @Roles(GUIA): precisa ter role GUIA
  // @UseFilters(MulterExceptionFilter): traduz erros do Multer (ex.: LIMIT_FILE_SIZE)
  // @UseInterceptors(FileInterceptor('image', imageUploadMulterOptions)):
  //   recebe campo "image" no multipart, usa memoryStorage + validações básicas
  // @UploadedFile(new ImageValidationPipe()) image:
  //   pega o arquivo validado pelo Pipe (magic numbers + tamanho) ou undefined
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', imageUploadMulterOptions))
  @Post()
  create(
    @Body() createPlaceDto: CreatePlaceDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File | undefined,
  ) {
    return this.placesService.create(createPlaceDto, image);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutos
  @CacheKey('places_list')
  findAll(@Query() query: FindAllPlacesQueryDto) {
    // A chave de cache inclui os parâmetros de query para evitar colisões
    // entre diferentes filtros/paginações. O CacheInterceptor usa o
    // CacheKey como prefixo e adiciona automaticamente os query params.
    return this.placesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.placesService.findOne(id);
  }

  // PATCH /places/:id — atualiza place (apenas GUIA)
  // Mesma estrutura de guards/filters/interceptors do POST
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('image', imageUploadMulterOptions))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePlaceDto: UpdatePlaceDto,
    @UploadedFile(new ImageValidationPipe()) image: Express.Multer.File | undefined,
  ) {
    return this.placesService.update(id, updatePlaceDto, image);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }
}
