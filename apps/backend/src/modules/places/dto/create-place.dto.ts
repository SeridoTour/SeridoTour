import { IsString, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome do ponto turístico é obrigatório.' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  description!: string;

  @IsString()
  city!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @IsNotEmpty({
    message: 'A categoria (ex: natureza, historico) é obrigatória.',
  })
  category!: string;
}
