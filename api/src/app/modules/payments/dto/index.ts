import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentType } from '../../../common/enums';
import { RegistrationCategory } from '../../../common/enums';

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'MEMBERSHIP_FEE',
    description: 'Payment type',
    enum: PaymentType,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ example: 10000, description: 'Amount in TZS' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'MPESA', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: '+255657000000' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Annual Membership Fee 2025' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ example: 'membership_fee' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({
    example: { year: 2025, membershipClass: 'SENIOR_MEMBER' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: 'MEMBERSHIP_FEE' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;
}

export class InitiateApplicationPaymentDto {
  @ApiProperty({
    example: 'GRADUATE',
    enum: RegistrationCategory,
    description: 'Registration category used to determine application fee',
  })
  @IsNotEmpty()
  @IsEnum(RegistrationCategory)
  applicationType: RegistrationCategory;

  @ApiProperty({ example: 'MPESA', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: '+255712000000' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

// M-Pesa Callback DTO
export class MpesaCallbackDto {
  @ApiProperty()
  TransactionType: string;

  @ApiProperty()
  TransID: string;

  @ApiProperty()
  TransTime: string;

  @ApiProperty()
  TransAmount: string;

  @ApiProperty()
  BusinessShortCode: string;

  @ApiProperty()
  BillRefNumber: string;

  @ApiPropertyOptional()
  InvoiceNumber?: string;

  @ApiPropertyOptional()
  OrgAccountBalance?: string;

  @ApiPropertyOptional()
  ThirdPartyTransID?: string;

  @ApiProperty()
  MSISDN: string;

  @ApiPropertyOptional()
  FirstName?: string;

  @ApiPropertyOptional()
  MiddleName?: string;

  @ApiPropertyOptional()
  LastName?: string;
}

// Selcom Callback DTO (legacy flat format)
export class SelcomCallbackDto {
  @ApiProperty()
  transid: string;

  @ApiProperty()
  reference: string;

  @ApiProperty()
  resultcode: string;

  @ApiProperty()
  result: string;

  @ApiProperty()
  amount: string;

  @ApiPropertyOptional()
  msisdn?: string;
}

// Selcom C2B Callback DTO (lookup / validation / notification)
export class SelcomC2bCallbackDto {
  @ApiProperty({ description: 'Mobile operator channel name' })
  @IsNotEmpty()
  @IsString()
  operator: string;

  @ApiProperty({ description: 'Selcom transaction ID' })
  @IsNotEmpty()
  @IsString()
  transid: string;

  @ApiProperty({ description: 'Selcom gateway reference' })
  @IsNotEmpty()
  @IsString()
  reference: string;

  @ApiProperty({ description: 'IET payment ID (order_id echoed back)' })
  @IsNotEmpty()
  @IsString()
  utilityref: string;

  @ApiPropertyOptional({ description: 'Transaction amount' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ description: 'Customer mobile number' })
  @IsOptional()
  @IsString()
  msisdn?: string;
}

/**
 * Selcom hosted-checkout webhook payload (fires on successful transactions).
 * Matches Selcom's documented "Webhook Callback" body. Values are validated as
 * plain strings with no transforms so the HMAC signature stays verifiable.
 */
export class SelcomWebhookDto {
  @ApiProperty()
  @IsString()
  transid: string;

  @ApiProperty({ description: 'Order id echoed back (IET-<paymentId>)' })
  @IsString()
  order_id: string;

  @ApiProperty()
  @IsString()
  reference: string;

  @ApiProperty({ description: 'SUCCESS | FAIL' })
  @IsString()
  result: string;

  @ApiProperty({ description: 'Selcom result code, 000 on success' })
  @IsString()
  resultcode: string;

  @ApiProperty({ description: 'COMPLETED | CANCELLED | PENDING' })
  @IsString()
  payment_status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
