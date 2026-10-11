import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

export class CreateItineraryDto {
  @IsString()
  @IsNotEmpty({ message: 'O título do roteiro é obrigatório.' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'A descrição do roteiro é obrigatória.' })
  description!: string;

  @IsInt()
  @Min(1)
  duracaoDias!: number;

  @IsArray({
    message: 'Os locais devem ser enviados em formato de lista (array).',
  })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de local deve ser um UUID válido.',
  })
  @IsNotEmpty({
    message: 'O roteiro precisa ter pelo menos um ponto turístico associado.',
  })
  placeIds!: string[];
}
