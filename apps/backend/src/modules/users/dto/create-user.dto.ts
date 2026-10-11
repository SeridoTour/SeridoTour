import {
  IsNotEmpty,
  IsString,
  IsEmail,
  Matches,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'A senha deve conter pelo menos uma letra maiúscula e um caractere especial',
  })
  password!: string;

  @IsString()
  @IsOptional()
  codigoguia?: string;
}
