import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ReviewsUploadController } from './reviews-upload.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, ReviewsUploadController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
