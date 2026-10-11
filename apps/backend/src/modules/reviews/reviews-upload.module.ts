import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ReviewsUploadController } from './reviews-upload.controller';
import { MAX_FILE_SIZE_BYTES } from './config/multer.config';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  ],
  controllers: [ReviewsUploadController],
})
export class ReviewsUploadModule {}
