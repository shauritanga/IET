import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsEmail,
  MaxLength,
  IsArray,
  IsBoolean,
  MinLength,
  Matches,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  MembershipStatus,
  ApplicationStatus,
  ApplicationReviewStage,
  MembershipClass,
  EngineeringDiscipline,
  UserRole,
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

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Membership category selected from the admin directory',
  })
  @IsOptional()
  @IsUUID()
  membershipCategoryId?: string;

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
      'EVALUATOR_RECOMMEND',
      'SECRETARIAT_ADVANCE_TO_MPDC',
      'MPDC_RECOMMEND',
      'SECRETARIAT_ADVANCE_TO_COUNCIL',
      'COUNCIL_RECOMMEND',
      'APPROVE',
      'REJECT',
      'RETURN_FOR_CHANGES',
    ],
  })
  @IsNotEmpty()
  @IsString()
  action:
    | 'ASSIGN_EVALUATOR'
    | 'EVALUATOR_RECOMMEND'
    | 'SECRETARIAT_ADVANCE_TO_MPDC'
    | 'MPDC_RECOMMEND'
    | 'SECRETARIAT_ADVANCE_TO_COUNCIL'
    | 'COUNCIL_RECOMMEND'
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

export class RenewMemberDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ example: 150000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;
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

export class PaymentQueryDto {
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

  @ApiPropertyOptional({ example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;

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

export class CreateMemberDto {
  @ApiProperty({ example: 'joram@example.co.tz' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiPropertyOptional({ example: 'Joram' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({ example: 'Allan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  middleName?: string;

  @ApiPropertyOptional({ example: 'Jackson' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({ example: '+255712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'MIET', enum: MembershipClass })
  @IsOptional()
  @IsEnum(MembershipClass)
  membershipClass?: MembershipClass;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Membership category chosen in the admin form',
  })
  @IsOptional()
  @IsUUID()
  membershipCategoryId?: string;

  @ApiPropertyOptional({ example: 'Civil', enum: EngineeringDiscipline })
  @IsOptional()
  @IsEnum(EngineeringDiscipline)
  engineeringDiscipline?: EngineeringDiscipline;
}

export class AdminUserQueryDto {
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

  @ApiPropertyOptional({ example: 'ADMIN', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'joram' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateAdminUserDto {
  @ApiProperty({ example: 'secretariat@iet.or.tz' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsNotEmpty()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Secretariat' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Officer' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({ example: '+255712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ example: 'SECRETARIAT', enum: UserRole })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'AdminPass123!' })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password: string;
}

export class UpdateAdminUserDto {
  @ApiPropertyOptional({ example: 'Secretariat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @ApiPropertyOptional({ example: 'Officer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({ example: '+255712345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'SECRETARIAT', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FiscalYearSettingsDto {
  @ApiProperty({ example: 7, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  startMonth: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 31 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(31)
  startDay: number;

  @ApiProperty({ example: 7, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  endMonth: number;

  @ApiProperty({ example: 10, minimum: 1, maximum: 31 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(31)
  endDay: number;
}

export class MembershipCategoryQueryDto {
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
}

export class CreateMembershipCategoryDto {
  @ApiProperty({ example: 'Fellow' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 200000, description: 'Annual fee in TZS' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  yearlyFee: number;

  @ApiProperty({ example: 15, description: 'Minimum years of professional experience' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  minYearsExperience: number;

  @ApiPropertyOptional({ example: 'For distinguished engineers with 15+ years of experience' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateMembershipCategoryDto {
  @ApiPropertyOptional({ example: 'Fellow' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: 200000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  yearlyFee?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minYearsExperience?: number;

  @ApiPropertyOptional({ example: 'For distinguished engineers' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class EngineeringInstitutionQueryDto {
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

  @ApiPropertyOptional({ example: 'Dar es Salaam' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;
}

export class CreateEngineeringInstitutionDto {
  @ApiProperty({ example: 'University of Dar es Salaam' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ example: 'Tanzania' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({ example: 'UNIVERSITY' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  institutionType?: string;

  @ApiPropertyOptional({ example: 'RECOGNIZED' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  recognitionStatus?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Accredited engineering programmes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateEngineeringInstitutionDto {
  @ApiPropertyOptional({ example: 'University of Dar es Salaam' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: 'Tanzania' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({ example: 'UNIVERSITY' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  institutionType?: string;

  @ApiPropertyOptional({ example: 'RECOGNIZED' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(({ value }) => value?.trim())
  recognitionStatus?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'Accredited engineering programmes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
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
