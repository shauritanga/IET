import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpgradeApplicationStatus } from '../../../common/enums';

// ─── Submit Upgrade Application ─────────────────────────────────────────────

export class SubmitUpgradeApplicationDto {
  @ApiProperty({
    description: 'Target membership category ID to upgrade to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  toCategoryId: string;

  @ApiPropertyOptional({
    description: 'Optional notes from the applicant',
    example: 'I have completed 5 years of professional experience.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  applicantNotes?: string;
}

// ─── Admin Review Upgrade Application ───────────────────────────────────────

export class ReviewUpgradeApplicationDto {
  @ApiProperty({
    enum: [UpgradeApplicationStatus.APPROVED, UpgradeApplicationStatus.REJECTED],
    description: 'Decision on the upgrade application',
    example: 'APPROVED',
  })
  @IsEnum(UpgradeApplicationStatus)
  @IsNotEmpty()
  status: UpgradeApplicationStatus.APPROVED | UpgradeApplicationStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required when status is REJECTED)',
    example: 'Insufficient years of experience documented.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejectionReason?: string;
}

// ─── Query Upgrade Applications (Admin) ─────────────────────────────────────

export class UpgradeApplicationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ enum: UpgradeApplicationStatus })
  @IsOptional()
  @IsEnum(UpgradeApplicationStatus)
  status?: UpgradeApplicationStatus;

  @ApiPropertyOptional({ description: 'Search by member name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ─── Create Upgrade Rule (Admin) ─────────────────────────────────────────────

export class CreateUpgradeRuleDto {
  @ApiProperty({ description: 'Source category ID' })
  @IsUUID()
  @IsNotEmpty()
  fromCategoryId: string;

  @ApiProperty({ description: 'Target category ID' })
  @IsUUID()
  @IsNotEmpty()
  toCategoryId: string;

  @ApiPropertyOptional({ example: 3, description: 'Minimum years of professional experience' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minYearsExperience?: number;

  @ApiPropertyOptional({ example: 24, description: 'Minimum CPD points required' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCpdPoints?: number;

  @ApiPropertyOptional({ description: 'Whether active membership is required' })
  @IsOptional()
  @IsBoolean()
  requiresActiveMembership?: boolean;

  @ApiPropertyOptional({ description: 'Whether no pending upgrade application is required' })
  @IsOptional()
  @IsBoolean()
  requiresNoPendingApplication?: boolean;

  @ApiPropertyOptional({ description: 'Required document types', example: ['CV'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredDocuments?: string[];

  @ApiPropertyOptional({ description: 'Whether admin approval is required' })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Description of this upgrade path' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this rule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUpgradeRuleDto extends PartialType(CreateUpgradeRuleDto) {}
