import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class ResendLoginOtpDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID from the login 2FA response',
  })
  @IsUUID('4', { message: 'Invalid user ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    example: 'email',
    description: 'Delivery channel for the login OTP',
    enum: ['sms', 'email'],
  })
  @IsIn(['sms', 'email'], { message: 'Channel must be sms or email' })
  @IsNotEmpty({ message: 'Channel is required' })
  channel: 'sms' | 'email';
}
