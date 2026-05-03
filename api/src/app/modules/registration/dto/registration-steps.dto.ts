import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import {
  EngineeringDiscipline,
  MembershipClass,
  RegistrationCategory,
  ReferenceType,
  DocumentType,
} from '../../../common/enums';


// ============================================
// STEP 2: REGISTRATION DETAILS
// ============================================

export class InstitutionDto {
  @ApiProperty({ example: 'Engineers Registration Board' })
  @IsNotEmpty()
  @IsString()
  institutionName: string;

  @ApiProperty({ example: '2020-09-01' })
  @IsNotEmpty()
  @IsString()
  registrationDate: string;

  @ApiProperty({ example: 'Class B' })
  @IsNotEmpty()
  @IsString()
  classRegistered: string;
}

export class RegistrationDetailsDto {
  @ApiProperty({
    example: 'Mechanical',
    description: 'Engineering discipline',
    enum: EngineeringDiscipline,
  })
  @IsNotEmpty({ message: 'Engineering discipline is required' })
  @IsEnum(EngineeringDiscipline)
  engineeringDiscipline: EngineeringDiscipline;

  @ApiProperty({
    example: 'MIET',
    description: 'Applied membership type',
  })
  @IsNotEmpty({ message: 'Applied membership type is required' })
  @IsString()
  appliedMembershipType: string;

  @ApiProperty({
    example: true,
    description: 'Whether registered with a statutory board',
  })
  @IsBoolean()
  registeredWithStatutoryBoard: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether member of other engineering institutions',
  })
  @IsBoolean()
  memberOfOtherInstitutions: boolean;

  @ApiPropertyOptional({
    example: 'https://eit-bucket.sfo3.digitaloceanspaces.com/documents/uuid.pdf',
    description: 'URL of supporting document — upload via POST /api/v1/uploads first',
  })
  @IsOptional()
  @IsString()
  supportingDocument?: string;

  @ApiPropertyOptional({
    description: 'Other institution memberships',
    type: [InstitutionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstitutionDto)
  institutions?: InstitutionDto[];
}

// ============================================
// STEP 3: EDUCATION & PROFESSIONAL EXPERIENCE (combined)
// ============================================

export class EducationDetailDto {
  @ApiProperty({ example: 'University of Dar es Salaam' })
  @IsNotEmpty()
  @IsString()
  institutionName: string;

  @ApiProperty({ example: 'Tanzania' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: '2015-09-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2019-07-15' })
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty({ example: 'Bachelor of Science in Mechanical Engineering' })
  @IsNotEmpty()
  @IsString()
  courseName: string;

  @ApiPropertyOptional({ example: 'https://eit-bucket.sfo3.digitaloceanspaces.com/documents/uuid.pdf' })
  @IsOptional()
  @IsString()
  attachment?: string;
}

export class WorkExperienceDto {
  @ApiProperty({ example: '2020-01-01' })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty({ example: 'Civil Engineer' })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ example: 'ABC Engineering Ltd' })
  @IsNotEmpty()
  @IsString()
  employer: string;
}

export class ExperienceEducationDto {
  @ApiProperty({ type: [EducationDetailDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDetailDto)
  education: EducationDetailDto[];

  @ApiProperty({ type: [WorkExperienceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  workExperience: WorkExperienceDto[];

  @ApiPropertyOptional({ example: 'https://eit-bucket.sfo3.digitaloceanspaces.com/documents/cv.pdf' })
  @IsOptional()
  @IsString()
  cvAttachment?: string;
}

export class AddEducationDto {
  @ApiProperty({ example: 'University of Dar es Salaam' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  institutionName: string;

  @ApiProperty({ example: 'Bachelor of Science in Mechanical Engineering' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  qualification: string;

  @ApiPropertyOptional({ example: 'Mechanical Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fieldOfStudy?: string;

  @ApiProperty({ example: '2015-09-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2019-07-15' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'First Class Honours' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  grade?: string;

  @ApiPropertyOptional({ example: 'Dar es Salaam, Tanzania' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}

export class AddExperienceDto {
  @ApiProperty({ example: 'City Park Softwares' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  employerName: string;

  @ApiProperty({ example: 'Mechanical Engineer' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  position: string;

  @ApiProperty({ example: '2024-09-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional({ example: '<p>Led mechanical design projects...</p>' })
  @IsOptional()
  @IsString()
  responsibilities?: string;

  @ApiPropertyOptional({ example: 'Dar es Salaam, Tanzania' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  department?: string;
}

// ============================================
// STEP 4: REFERENCES
// ============================================

export class RefereeDto {
  @ApiProperty({ example: 'IET/ENG/0123' })
  @IsNotEmpty()
  @IsString()
  membershipNumber: string;

  @ApiProperty({ example: 'Eng. Emmanuel Ole Kambainei' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ example: 'FELLOW' })
  @IsNotEmpty()
  @IsString()
  membershipCategory: string;

  @ApiPropertyOptional({ example: 'Tanzania Engineers Registration Board' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organisation?: string;

  @ApiPropertyOptional({ example: 'referee@email.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+255712345678' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Current Supervisor / Manager' })
  @IsOptional()
  @IsString()
  relationship?: string;
}

export class ReferencesDto {
  @ApiProperty({ description: 'Proposer information', type: RefereeDto })
  @ValidateNested()
  @Type(() => RefereeDto)
  proposer: RefereeDto;

  @ApiProperty({ description: 'Supporter information', type: RefereeDto })
  @ValidateNested()
  @Type(() => RefereeDto)
  supporter: RefereeDto;
}

// ============================================
// STEP 5: EMAIL VERIFICATION
// ============================================

export class VerifyRegistrationEmailDto {
  @ApiProperty({ example: 'IET-123456' })
  @IsNotEmpty()
  @IsString()
  verificationCode: string;
}

// ============================================
// STEP 6: PAYMENT
// ============================================

export class InitiatePaymentDto {
  @ApiProperty({
    example: 'GRADUATE',
    description: 'Application type for fee calculation',
    enum: RegistrationCategory,
  })
  @IsNotEmpty()
  @IsEnum(RegistrationCategory)
  applicationType: RegistrationCategory;

  @ApiProperty({
    example: 'MPESA',
    description: 'Payment method',
  })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({
    example: '+255657000000',
    description: 'Phone number for mobile money',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

// ============================================
// STEP 7: DECLARATION & SUBMISSION
// ============================================

export class DeclarationDto {
  @ApiProperty({
    example: true,
    description: 'Agreement to terms and conditions',
  })
  @IsNotEmpty()
  @IsBoolean()
  declarationAgreed: boolean;

  @ApiProperty({
    example: '2026-03-23',
    description: 'Date of declaration',
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  declarationDate: string;
}

// ============================================
// DOCUMENT UPLOAD
// ============================================

export class UploadDocumentDto {
  @ApiProperty({
    example: 'CV',
    description: 'Type of document',
    enum: DocumentType,
  })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({ example: 'Updated CV 2025' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
