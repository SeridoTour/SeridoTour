import { Body, Controller, Get, Param, Post, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('place/:placeId')
  findByPlace(@Param('placeId') placeId: string) {
    return this.reviewsService.findByPlace(placeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body(ValidationPipe) data: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(data, req.user.id);
  }
}
