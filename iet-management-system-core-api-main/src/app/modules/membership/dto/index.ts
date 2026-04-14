import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { PaymentMethod } from '../../../common/enums';

export class InitiateFeePaymentDto {
  @ApiProperty({
    example: 2025,
    description: 'Year for which fee is being paid',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number;

  @ApiProperty({
    example: 'MPESA',
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '+255657000000',
    description: 'Phone number for mobile money payments',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class FeeQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Page size' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 2025, description: 'Filter by year' })
  @IsOptional()
  @IsNumber()
  year?: number;
}
