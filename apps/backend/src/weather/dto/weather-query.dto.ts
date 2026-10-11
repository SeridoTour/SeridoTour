import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Consulta por cidade (nome do ponto/roteiro)
 */
export class WeatherByCityQueryDto {
  @IsString()
  @IsNotEmpty()
  cidade!: string;
}

/**
 * Consulta por coordenadas (mais precisa para pontos de um roteiro)
 */
export class WeatherByCoordsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lon!: number;

  @IsOptional()
  @IsString()
  pontoNome?: string;
}
