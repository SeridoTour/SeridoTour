import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectItineraryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'O motivo da rejeição deve ter no máximo 500 caracteres.' })
  reason?: string;
}
