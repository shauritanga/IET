import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export const COMMUNICATION_TYPES = ['SMS', 'EMAIL'] as const;
export const COMMUNICATION_TARGETS = ['ALL', 'GROUP'] as const;
export const COMMUNICATION_STATUSES = ['PENDING', 'SENT', 'FAILED'] as const;

export class SendCommunicationDto {
  @ApiProperty({ example: 'SMS', enum: COMMUNICATION_TYPES })
  @IsIn(COMMUNICATION_TYPES)
  type: (typeof COMMUNICATION_TYPES)[number];

  @ApiProperty({ example: 'ALL', enum: COMMUNICATION_TARGETS })
  @IsIn(COMMUNICATION_TARGETS)
  recipients: (typeof COMMUNICATION_TARGETS)[number];

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Membership category id when recipients is GROUP',
  })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ example: 'Reminder: renew your membership' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'Please renew your membership before 10 July.' })
  @IsString()
  @MaxLength(4000)
  message: string;
}

export class CommunicationHistoryQueryDto {
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

  @ApiPropertyOptional({ example: 'EMAIL', enum: COMMUNICATION_TYPES })
  @IsOptional()
  @IsIn(COMMUNICATION_TYPES)
  type?: (typeof COMMUNICATION_TYPES)[number];

  @ApiPropertyOptional({ example: 'ALL', enum: COMMUNICATION_TARGETS })
  @IsOptional()
  @IsIn(COMMUNICATION_TARGETS)
  target?: (typeof COMMUNICATION_TARGETS)[number];

  @ApiPropertyOptional({ example: 'SENT', enum: COMMUNICATION_STATUSES })
  @IsOptional()
  @IsIn(COMMUNICATION_STATUSES)
  status?: (typeof COMMUNICATION_STATUSES)[number];

  @ApiPropertyOptional({ example: 'renewal' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CommunicationTemplateQueryDto {
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

  @ApiPropertyOptional({ example: 'EMAIL', enum: COMMUNICATION_TYPES })
  @IsOptional()
  @IsIn(COMMUNICATION_TYPES)
  type?: (typeof COMMUNICATION_TYPES)[number];
}

export class CreateCommunicationTemplateDto {
  @ApiProperty({ example: 'Renewal reminder' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'EMAIL', enum: COMMUNICATION_TYPES })
  @IsIn(COMMUNICATION_TYPES)
  type: (typeof COMMUNICATION_TYPES)[number];

  @ApiPropertyOptional({ example: 'Membership renewal reminder' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'Please renew your membership.' })
  @IsString()
  @MaxLength(8000)
  body: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCommunicationTemplateDto {
  @ApiPropertyOptional({ example: 'Renewal reminder' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'EMAIL', enum: COMMUNICATION_TYPES })
  @IsOptional()
  @IsIn(COMMUNICATION_TYPES)
  type?: (typeof COMMUNICATION_TYPES)[number];

  @ApiPropertyOptional({ example: 'Membership renewal reminder' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({ example: 'Please renew your membership.' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  body?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
