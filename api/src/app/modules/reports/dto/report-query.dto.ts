import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsOptional,
  IsObject,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportPreviewDto {
  @ApiProperty({ example: 'members', description: 'Base entity id' })
  @IsString()
  @IsNotEmpty()
  baseId: string;

  @ApiPropertyOptional({ example: ['payments_members'], description: 'Related entity relation ids to join in, each must touch baseId' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relationIds?: string[];

  @ApiProperty({ example: ['members.membershipId', 'members.fullName', 'members.email'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  columns: string[];

  @ApiPropertyOptional({ description: 'Map of filter key -> value, validated against the base\'s filter whitelist' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class ReportExportDto extends ReportPreviewDto {
  @ApiProperty({ example: 'xlsx', enum: ['xlsx', 'csv', 'pdf'] })
  @IsIn(['xlsx', 'csv', 'pdf'])
  format: 'xlsx' | 'csv' | 'pdf';
}
