import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationQueryDto {
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    example: {
      eventReminders: true,
      paymentReminders: true,
      newsletters: false,
    },
    description: 'Email notification preferences',
  })
  @IsOptional()
  @IsObject()
  email?: Record<string, boolean>;

  @ApiPropertyOptional({
    example: { eventReminders: true, paymentReminders: true },
    description: 'SMS notification preferences',
  })
  @IsOptional()
  @IsObject()
  sms?: Record<string, boolean>;

  @ApiPropertyOptional({
    example: { eventReminders: true, generalAnnouncements: false },
    description: 'Push notification preferences',
  })
  @IsOptional()
  @IsObject()
  push?: Record<string, boolean>;
}
