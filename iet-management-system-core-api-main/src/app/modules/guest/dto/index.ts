import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums';

// ============================================
// GUEST EVENT REGISTRATION DTOs
// ============================================

export class GuestEventRegistrationDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+255712345678', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'ABC Company Ltd',
    description: 'Organization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
    description: 'Position',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: 'Tanzanian', description: 'Nationality' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nationality?: string;

  @ApiPropertyOptional({
    example: 'Vegetarian meal',
    description: 'Special requirements',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequirements?: string;
}

export class GuestPaymentDto {
  @ApiProperty({ example: 'MPESA', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '+255712345678',
    description: 'Phone number for mobile money',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class GuestRegistrationQueryDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+255712345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'TKT-2025-0001' })
  @IsOptional()
  @IsString()
  ticketNumber?: string;
}

// ============================================
// DEVELOPMENT FEE DTOs
// ============================================

export class CreateDevelopmentFeeDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+255712345678', description: 'Phone number' })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'ABC Company Ltd',
    description: 'Organization',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  organization?: string;

  @ApiProperty({
    example: 'Building Fund',
    description: 'Purpose of contribution',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  purpose: string;

  @ApiProperty({ example: 100000, description: 'Amount in TZS' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiPropertyOptional({
    example: 'In memory of...',
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class DevelopmentFeePaymentDto {
  @ApiProperty({ example: 'MPESA', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '+255712345678',
    description: 'Phone number for mobile money',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

// ============================================
// PUBLIC CALENDAR DTOs
// ============================================

export class CalendarQueryDto {
  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  month?: number;
}

// ============================================
// CHECK-IN DTOs
// ============================================

export class GuestCheckInDto {
  @ApiProperty({ description: 'Ticket number or QR code data' })
  @IsNotEmpty()
  @IsString()
  ticketNumber: string;
}
