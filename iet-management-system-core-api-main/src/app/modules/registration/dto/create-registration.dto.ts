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
  IsUrl,
  Matches,
} from 'class-validator';
import { Gender, Title } from '../../../common/enums';

/**
 * DTO for creating a new registration application
 * This is the initial step - Personal Details
 */
export class CreateRegistrationDto {
  // Personal Details (Step 1)
  @ApiPropertyOptional({
    example: 'Eng.',
    description: 'Professional title',
    enum: Title,
  })
  @IsOptional()
  @IsEnum(Title, { message: 'Invalid title' })
  title?: Title;

  @ApiProperty({
    example: 'Joram',
    description: 'First name',
  })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiPropertyOptional({
    example: 'Allan',
    description: 'Middle name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @ApiProperty({
    example: 'Jackson',
    description: 'Last name',
  })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiProperty({
    example: 'MALE',
    description: 'Gender',
    enum: Gender,
  })
  @IsNotEmpty({ message: 'Gender is required' })
  @IsEnum(Gender, { message: 'Invalid gender' })
  gender: Gender;

  @ApiProperty({
    example: 'joram@gmail.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: '+255657000000',
    description: 'Phone number with country code',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (e.g., +255657000000)',
  })
  phoneNumber: string;

  @ApiProperty({
    example: '1987-09-12',
    description: 'Date of birth (YYYY-MM-DD or ISO 8601)',
  })
  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsDateString(
    { strict: false },
    { message: 'Date of birth must be a valid date' },
  )
  dateOfBirth: string;

  @ApiProperty({
    example: 'Tanzanian',
    description: 'Nationality',
  })
  @IsNotEmpty({ message: 'Nationality is required' })
  @IsString()
  @MaxLength(100)
  nationality: string;

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
    example: 'https://eit-bucket.sfo3.digitaloceanspaces.com/images/uuid.jpg',
    description: 'Profile photo URL — upload via POST /api/v1/uploads first to get this URL',
  })
  @IsOptional()
  @IsUrl(
    { require_tld: false },
    { message: 'profilePhotoUrl must be a valid URL' },
  )
  profilePhotoUrl?: string;

}
