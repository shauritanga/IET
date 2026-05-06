import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { AuthPortal } from '../../../common/enums';

export class UserLoginDto {
  @ApiProperty()
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @ApiProperty({ description: 'password should be', minimum: 6, maximum: 30 })
  @IsNotEmpty()
  @MinLength(8, { message: 'password should be minimum 8 ' })
  @MaxLength(50, { message: 'password should be maximum 50 ' })
  password: string;

  @ApiPropertyOptional({ enum: AuthPortal, example: AuthPortal.MEMBER_PORTAL })
  @IsOptional()
  @IsEnum(AuthPortal)
  portal?: AuthPortal;
}
