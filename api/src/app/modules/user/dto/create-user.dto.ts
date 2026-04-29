import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';
import { Gender, Title, EngineeringDiscipline } from '../../../common/enums';

const normalizePhoneNumber = (value?: string) =>
  typeof value === 'string'
    ? value.replace(/[\s()-]/g, '').trim()
    : value;

export class CreateUserDto {
  @ApiProperty({
    example: 'joram@gmail.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  // Internal field — password is validated in RegisterDto before reaching here
  password?: string;

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
  @Transform(({ value }) => normalizePhoneNumber(value))
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

  @ApiPropertyOptional({
    example: 'Mechanical',
    description: 'Engineering discipline',
    enum: EngineeringDiscipline,
  })
  @IsOptional()
  @IsEnum(EngineeringDiscipline, { message: 'Invalid engineering discipline' })
  engineeringDiscipline?: EngineeringDiscipline;
}
