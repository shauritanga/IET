import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { Gender, Title } from '../../../common/enums';

/**
 * DTO for updating personal details (Step 1)
 * All fields are optional for partial updates
 */
export class UpdatePersonalDetailsDto {
  @ApiPropertyOptional({
    example: 'Eng.',
    description: 'Professional title',
    enum: Title,
  })
  @IsOptional()
  @IsEnum(Title, { message: 'Invalid title' })
  title?: Title;

  @ApiPropertyOptional({
    example: 'Joram',
    description: 'First name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Allan',
    description: 'Middle name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @ApiPropertyOptional({
    example: 'Jackson',
    description: 'Last name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    description: 'Gender',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Invalid gender' })
  gender?: Gender;

  @ApiPropertyOptional({
    example: '+255657000000',
    description: 'Phone number with country code',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (e.g., +255657000000)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '1987-09-12',
    description: 'Date of birth (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Date of birth must be a valid date (YYYY-MM-DD)' },
  )
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'Tanzanian',
    description: 'Nationality',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    example: 'ALAF Limited',
    description: 'Employer/Organization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  employer?: string;

  @ApiPropertyOptional({
    example: 'Mechanical Engineer',
    description: 'Position/Designation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
}
