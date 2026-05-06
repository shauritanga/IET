import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Get,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserLoginDto } from '../dto/login.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Enable2FADto } from '../dto/enable-2fa.dto';
import { ValidateTokenDTO } from '../dto/validate-token.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============================================
  // REGISTRATION ENDPOINTS
  // ============================================

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        data: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'joram@gmail.com',
          verificationSent: true,
        },
        message:
          'Registration successful. Please check your email to verify your account.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or email already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto as any);
    return {
      success: true,
      data: result,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with verification code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully, user is logged in',
    schema: {
      example: {
        success: true,
        data: {
          verified: true,
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'joram@gmail.com',
            fullName: 'Eng. Joram Allan Jackson',
            membershipId: 'IET/ENG/0234',
            membershipStatus: 'ACTIVE',
            role: 'MEMBER',
          },
        },
        message: 'Email verified successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired verification code',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.code,
    );
    return {
      success: true,
      data: result,
      message: 'Email verified successfully',
    };
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent',
    schema: {
      example: {
        success: true,
        message: 'Verification code sent to your email',
      },
    },
  })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    await this.authService.resendVerificationCode(resendDto.email);
    return {
      success: true,
      message: 'Verification code sent to your email',
    };
  }

  // ============================================
  // LOGIN ENDPOINTS
  // ============================================

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User login successful',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'joram@gmail.com',
            fullName: 'Eng. Joram Allan Jackson',
            membershipId: 'IET/ENG/0234',
            membershipStatus: 'ACTIVE',
            role: 'MEMBER',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Account locked or deactivated',
  })
  async login(@Body() userLoginDto: UserLoginDto) {
    const result = await this.authService.login(userLoginDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    schema: {
      example: {
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid refresh token',
  })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User logged out successfully',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
      },
    },
  })
  async logout(@GetUser() user: UserEntity) {
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // ============================================
  // PASSWORD MANAGEMENT ENDPOINTS
  // ============================================

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset instructions sent',
    schema: {
      example: {
        success: true,
        message: 'Password reset instructions sent to your email',
      },
    },
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.portal,
    );
    return {
      success: true,
      message: result.message,
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    schema: {
      example: {
        success: true,
        message: 'Password reset successful',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
      resetPasswordDto.confirmPassword,
    );
    return {
      success: true,
      message: 'Password reset successful',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @GetUser() user: UserEntity,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      changePasswordDto.confirmPassword,
    );
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  // ============================================
  // TWO-FACTOR AUTHENTICATION ENDPOINTS
  // ============================================

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable two-factor authentication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the 2FA secret and QR code URL',
    schema: {
      example: {
        success: true,
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          otpauthUrl:
            'otpauth://totp/IET%20Portal%20(joram@gmail.com)?secret=JBSWY3DPEHPK3PXP&issuer=Institution%20of%20Engineers%20Tanzania',
        },
      },
    },
  })
  async enable2FA(
    @Body() enable2FADto: Enable2FADto,
    @GetUser() user: UserEntity,
  ) {
    const result = await this.authService.enable2FA(user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Post('2fa/validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate 2FA token and complete login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns verification result and tokens if successful',
    schema: {
      example: {
        success: true,
        data: {
          verified: true,
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'joram@gmail.com',
            fullName: 'Eng. Joram Allan Jackson',
            membershipId: 'IET/ENG/0234',
            membershipStatus: 'ACTIVE',
            role: 'MEMBER',
          },
        },
      },
    },
  })
  async validate2FA(@Body() validateTokenDTO: ValidateTokenDTO) {
    // Note: For 2FA validation during login, userId is passed in the validate2FA field of login response
    const result = await this.authService.validate2FAToken(
      validateTokenDTO.userId,
      validateTokenDTO.token,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable two-factor authentication' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
    schema: {
      example: {
        success: true,
        message: '2FA disabled successfully',
      },
    },
  })
  async disable2FA(@GetUser() user: UserEntity) {
    await this.authService.disable2FA(user.id);
    return {
      success: true,
      message: '2FA disabled successfully',
    };
  }

}
