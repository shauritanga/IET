import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenDTO {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID (from login response validate2FA field)',
  })
  @IsUUID('4', { message: 'Invalid user ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit login code sent by SMS',
  })
  @IsString()
  @IsNotEmpty({ message: 'Login code is required' })
  token: string;
}
