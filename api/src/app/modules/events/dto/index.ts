import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  IsNumber,
  Min,
  Max,
  Matches,
  IsUrl,
} from 'class-validator';
import {
  EventCategory,
  AttendeeType,
  PaymentMethod,
} from '../../../common/enums';

// ============================================
// QUERY DTOs
// ============================================

export class EventQueryDto {
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

  @ApiPropertyOptional({ example: 'CPD_COURSE,CONFERENCE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: 'Dar es salaam' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'engineering' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ============================================
// CREATE/UPDATE DTOs
// ============================================

export class SpeakerDto {
  @ApiProperty({ example: 'Eng. Emmanuel Ole Kambainei' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Senior Structural Engineer' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'John has over 20 years of experience...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.iet.or.tz/speakers/john.jpg' })
  @IsOptional()
  @IsString()
  photo?: string;
}

export class AgendaItemDto {
  @ApiProperty({ example: '08:00 - 09:00' })
  @IsNotEmpty()
  @IsString()
  time: string;

  @ApiProperty({ example: 'Registration' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Attendees to register and collect materials',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEventDto {
  @ApiProperty({ example: 'Structural Design CPD Workshop' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'Join us for a comprehensive workshop on structural design...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CPD_COURSE', enum: EventCategory })
  @IsNotEmpty()
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiProperty({ example: '2025-10-27' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-10-27' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '08:00' })
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({ example: '15:00' })
  @IsNotEmpty()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in HH:MM format',
  })
  endTime: string;

  @ApiPropertyOptional({ example: 'Karimjee Hall Dar es salaam' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/123456789' })
  @IsOptional()
  @IsUrl()
  onlineUrl?: string;

  @ApiPropertyOptional({ example: 'Eng. Emmanuel Ole Kambainei' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  guestOfHonor?: string;

  @ApiPropertyOptional({
    example: 'http://67.205.135.70:3000/uploads/images/c5a85146-30a7-424b-a9ac-099e9844b0fb.jpeg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImage?: string;

  @ApiPropertyOptional({ type: [SpeakerDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpeakerDto)
  speakers?: SpeakerDto[];

  @ApiPropertyOptional({ type: [AgendaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: AgendaItemDto[];

  @ApiPropertyOptional({ example: '2025-10-20' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  registrationFee?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cpdPoints?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxParticipants?: number;

  @ApiPropertyOptional({ example: ['Bring laptop', 'Engineering background'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateEventDto extends PartialType(CreateEventDto) {}

// ============================================
// REGISTRATION DTOs
// ============================================

export class RegisterForEventDto {
  @ApiPropertyOptional({ example: 'MEMBER', enum: AttendeeType })
  @IsOptional()
  @IsEnum(AttendeeType)
  attendeeType?: AttendeeType;

  @ApiPropertyOptional({ example: 'Vegetarian meal' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequirements?: string;

  @ApiProperty({ example: 'MPESA', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: '+255657000000' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class CancelRegistrationDto {
  @ApiProperty({ example: 'Schedule conflict' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class EventFeedbackDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great workshop! Very informative.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class RegistrationQueryDto {
  @ApiPropertyOptional({ example: 'CONFIRMED' })
  @IsOptional()
  @IsString()
  status?: string;

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
}
