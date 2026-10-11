import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

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

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body(ValidationPipe) data: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(data, req.user.id);
  }
}
