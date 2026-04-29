import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  MaxLength,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MembershipStatus,
  ApplicationStatus,
  ApplicationReviewStage,
  MembershipClass,
  EngineeringDiscipline,
} from '../../../common/enums';

export class MemberQueryDto {
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

  @ApiPropertyOptional({ example: 'ACTIVE', enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ example: 'MIET', enum: MembershipClass })
  @IsOptional()
  @IsEnum(MembershipClass)
  membershipClass?: MembershipClass;

  @ApiPropertyOptional({ example: 'joram' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Mechanical', enum: EngineeringDiscipline })
  @IsOptional()
  @IsEnum(EngineeringDiscipline)
  discipline?: EngineeringDiscipline;
}

export class ApplicationQueryDto {
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

  @ApiPropertyOptional({ example: 'PENDING_REVIEW', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({
    example: 'SECRETARIAT_REVIEW',
    enum: ApplicationReviewStage,
  })
  @IsOptional()
  @IsEnum(ApplicationReviewStage)
  reviewStage?: ApplicationReviewStage;
}

export class UpdateApplicationStageDto {
  @ApiProperty({
    example: 'ASSIGN_EVALUATOR',
    description: 'Workflow action',
    enum: [
      'ASSIGN_EVALUATOR',
      'ADVANCE_TO_MPDC',
      'ADVANCE_TO_COUNCIL',
      'APPROVE',
      'REJECT',
      'RETURN_FOR_CHANGES',
    ],
  })
  @IsNotEmpty()
  @IsString()
  action:
    | 'ASSIGN_EVALUATOR'
    | 'ADVANCE_TO_MPDC'
    | 'ADVANCE_TO_COUNCIL'
    | 'APPROVE'
    | 'REJECT'
    | 'RETURN_FOR_CHANGES';

  @ApiPropertyOptional({
    example: 'All documents verified and ready for the next stage.',
    description: 'Workflow comments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comments?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440010',
    description: 'Evaluator to assign during secretariat review',
  })
  @IsOptional()
  @IsString()
  evaluatorId?: string;

  @ApiPropertyOptional({
    example: 'MIET',
    description: 'Membership class (if approved)',
    enum: MembershipClass,
  })
  @IsOptional()
  @IsEnum(MembershipClass)
  membershipClass?: MembershipClass;
}

export class UpdateMemberStatusDto {
  @ApiProperty({ example: 'ACTIVE', enum: MembershipStatus })
  @IsNotEmpty()
  @IsEnum(MembershipStatus)
  status: MembershipStatus;

  @ApiPropertyOptional({ example: 'Membership renewed after payment' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class BulkEmailDto {
  @ApiProperty({
    example: 'ALL_MEMBERS',
    description: 'Recipient group',
    enum: ['ALL_MEMBERS', 'ACTIVE_MEMBERS', 'EXPIRED_MEMBERS', 'CUSTOM'],
  })
  @IsNotEmpty()
  @IsString()
  recipients: 'ALL_MEMBERS' | 'ACTIVE_MEMBERS' | 'EXPIRED_MEMBERS' | 'CUSTOM';

  @ApiPropertyOptional({ example: ['user1@example.com', 'user2@example.com'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customEmails?: string[];

  @ApiProperty({ example: 'Annual General Meeting Notice' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: '<html>...</html>' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: ['file-id-1', 'file-id-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-01-27' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    example: 'MONTH',
    enum: ['DAY', 'WEEK', 'MONTH', 'YEAR'],
  })
  @IsOptional()
  @IsString()
  groupBy?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
}
