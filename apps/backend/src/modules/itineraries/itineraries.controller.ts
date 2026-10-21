import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ItinerariesService } from './itineraries.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { RejectItineraryDto } from './dto/reject-itinerary.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('itineraries')
export class ItinerariesController {
  constructor(private readonly itinerariesService: ItinerariesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createItineraryDto: CreateItineraryDto, @Request() req) {
    return this.itinerariesService.create(createItineraryDto, req.user.id);
  }

  // Roteiros do próprio usuário (qualquer status) — usado em "Meus roteiros".
  @UseGuards(JwtAuthGuard)
  @Get('meus')
  findMine(@Request() req) {
    return this.itinerariesService.findMine(req.user.id);
  }

  // Vitrine pública: não exige autenticação e lista apenas PUBLICADOS.
  @Get('public')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @CacheKey('itineraries_public')
  findPublished() {
    return this.itinerariesService.findPublished();
  }

  @Get('public/:id')
  findPublishedOne(@Param('id') id: string) {
    return this.itinerariesService.findPublishedOne(id);
  }

  // Listagem global autenticada: GUIA vê todos; USER vê apenas publicados.
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req) {
    return this.itinerariesService.findAll(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.itinerariesService.findOne(id, req.user);
  }

  // RASCUNHO/REJEITADO → EM_ANALISE (autor)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/submit')
  submitForReview(@Param('id') id: string, @Request() req) {
    return this.itinerariesService.submitForReview(id, req.user);
  }

  // EM_ANALISE → PUBLICADO (GUIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.itinerariesService.publish(id);
  }

  // EM_ANALISE → REJEITADO (GUIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() rejectItineraryDto: RejectItineraryDto,
  ) {
    return this.itinerariesService.reject(id, rejectItineraryDto.reason);
  }

  // PUBLICADO → RASCUNHO (GUIA)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.itinerariesService.unpublish(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItineraryDto: UpdateItineraryDto,
    @Request() req,
  ) {
    return this.itinerariesService.update(id, updateItineraryDto, req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GUIA)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itinerariesService.remove(id);
  }
}
