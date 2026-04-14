import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../../user/services/user.service';
import { UserEntity } from '../../user/entities/user.entity';
import { UserLoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Enable2FAType } from '../types/enable-2fa.type';
import { UpdateResult } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../../../common/services/encryption.service';
import { EmailService } from '../../shared/services/email.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { RegistrationEntity } from '../../registration/entities';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private emailService: EmailService,
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
  ) {}

  private async getRegistrationStatus(userId: string): Promise<string | null> {
    const registration = await this.registrationRepository.findOne({
      where: { userId },
      select: ['status'],
    });
    return registration?.status ?? null;
  }

  /**
   * Register a new user
   */
  async register(
    createUserDto: CreateUserDto,
  ): Promise<{ userId: string; email: string; verificationSent: boolean }> {
    try {
      const user = await this.usersService.create(createUserDto);

      // Send verification email (fire-and-forget, don't block registration)
      this.emailService
        .sendVerificationEmail(
          user.email,
          user.firstName || user.email,
          user.emailVerificationCode,
        )
        .catch((err) =>
          this.logger.error(
            `Failed to send verification email: ${err.message}`,
          ),
        );

      return {
        userId: user.id,
        email: user.email,
        verificationSent: true,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Verify email with code and auto-login the user
   */
  async verifyEmail(
    email: string,
    code: string,
  ): Promise<{
    verified: boolean;
    accessToken: string;
    refreshToken: string;
    user: Partial<UserEntity> & { registrationStatus?: string | null };
  }> {
    await this.usersService.verifyEmail(email, code);

    const user = await this.usersService.findByEmail(email);

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    const registrationStatus = await this.getRegistrationStatus(user.id);

    return {
      verified: true,
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        membershipId: user.membershipId,
        membershipStatus: user.membershipStatus,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl,
        registrationStatus,
      },
    };
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ sent: boolean }> {
    const code = await this.usersService.resendVerificationCode(email);

    // Get user info for email
    const user = await this.usersService.findByEmail(email);
    if (user) {
      this.emailService
        .sendVerificationEmail(user.email, user.firstName || user.email, code)
        .catch((err) =>
          this.logger.error(
            `Failed to send verification email: ${err.message}`,
          ),
        );
    }

    return { sent: true };
  }

  /**
   * User login
   */
  async login(
    loginDTO: UserLoginDto,
  ): Promise<
    | { accessToken: string; refreshToken: string; user: Partial<UserEntity> & { registrationStatus?: string | null } }
    | { validate2FA: string; message: string }
  > {
    try {
      // Check if account is locked
      const isLocked = await this.usersService.isAccountLocked(loginDTO.email);
      if (isLocked) {
        throw new ForbiddenException(
          'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        );
      }

      const user = await this.usersService.findOne(loginDTO);

      // Check if account is active
      if (!user.isActive) {
        throw new ForbiddenException(
          'Account is deactivated. Please contact support.',
        );
      }

      const passwordMatched = await bcrypt.compare(
        loginDTO.password,
        user.password,
      );

      if (!passwordMatched) {
        // Record failed attempt
        await this.usersService.recordFailedLoginAttempt(loginDTO.email);
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if 2FA is enabled
      if (user.enable2FA) {
        return {
          validate2FA: user.id,
          message: 'Please enter your 2FA token to complete login',
        };
      }

      // Reset failed login attempts
      await this.usersService.resetFailedLoginAttempts(user.id);

      delete user.password;

      const tokens = await this.generateTokens(user);

      // Store the refresh token in the database
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      const registrationStatus = await this.getRegistrationStatus(user.id);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          membershipId: user.membershipId,
          membershipStatus: user.membershipStatus,
          role: user.role,
          profilePhotoUrl: user.profilePhotoUrl,
          registrationStatus,
        },
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Login failed: ${error.message}`);
    }
  }

  /**
   * Forgot password - generate reset token
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const token = await this.usersService.generatePasswordResetToken(email);

      // Get user info for email
      const user = await this.usersService.findByEmail(email);
      if (user) {
        this.emailService
          .sendPasswordResetEmail(user.email, user.firstName, token)
          .catch((err) =>
            this.logger.error(
              `Failed to send password reset email: ${err.message}`,
            ),
          );
      }

      return {
        message: 'Password reset instructions sent to your email',
      };
    } catch (error) {
      this.logger.error(
        `Forgot password failed: ${error.message}`,
        error.stack,
      );
      // Always return success to prevent email enumeration
      return {
        message: 'Password reset instructions sent to your email',
      };
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean }> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const success = await this.usersService.resetPassword(token, password);
    return { success };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ success: boolean }> {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const success = await this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
    return { success };
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { refreshToken } = refreshTokenDto;

      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find the user with this refresh token
      const user = await this.usersService.findById(payload.sub);

      // Validate that the refresh token matches what's stored
      if (
        !user ||
        !user.refreshToken ||
        !(await bcrypt.compare(refreshToken, user.refreshToken))
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update the refresh token in the database
      await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error(`Refresh token failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(userId: string): Promise<void> {
    // Clear the refresh token when logging out
    await this.usersService.removeRefreshToken(userId);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    user: UserEntity | Partial<UserEntity>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      membershipId: user.membershipId,
    };

    // Generate access token (15 minutes default)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '15m'),
    });

    // Generate refresh token with longer expiration (7 days default)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Enable 2FA for user
   */
  async enable2FA(userId: string): Promise<Enable2FAType> {
    try {
      const user = await this.usersService.findById(userId);

      if (user.enable2FA) {
        // If 2FA is already enabled, return the decrypted secret
        return { secret: user.twoFASecret };
      }

      // Generate a new 2FA secret - will be encrypted by the UserService
      const secret = speakeasy.generateSecret({
        name: `IET Portal (${user.email})`,
        issuer: 'Institution of Engineers Tanzania',
      });
      await this.usersService.updateSecretKey(user.id, secret.base32);

      return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
      };
    } catch (error) {
      this.logger.error(`Failed to enable 2FA: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to enable 2FA: ${error.message}`);
    }
  }

  /**
   * Validate 2FA token
   */
  async validate2FAToken(
    userId: string,
    token: string,
  ): Promise<{
    verified: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: Partial<UserEntity> & { registrationStatus?: string | null };
  }> {
    try {
      const user = await this.usersService.findById(userId);

      // The secret is already decrypted in findById
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        token: token,
        encoding: 'base32',
      });

      if (verified) {
        // Reset failed login attempts
        await this.usersService.resetFailedLoginAttempts(user.id);

        // Generate tokens on successful 2FA validation
        const tokens = await this.generateTokens(user);
        await this.usersService.updateRefreshToken(
          user.id,
          tokens.refreshToken,
        );

        const registrationStatus = await this.getRegistrationStatus(user.id);

        return {
          verified: true,
          ...tokens,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            membershipId: user.membershipId,
            membershipStatus: user.membershipStatus,
            role: user.role,
            profilePhotoUrl: user.profilePhotoUrl,
            registrationStatus,
          },
        };
      }

      return { verified: false };
    } catch (error) {
      this.logger.error(
        `Error verifying 2FA token: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Error verifying 2FA token');
    }
  }

  /**
   * Validate user by API key
   */
  async validateUserByApiKey(apiKey: string): Promise<UserEntity> {
    return this.usersService.findByApiKey(apiKey);
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string): Promise<UpdateResult> {
    return this.usersService.disable2FA(userId);
  }

  /**
   * Get environment variables (for debugging)
   */
  getEnvVariables() {
    return {
      port: this.configService.get<number>('PORT'),
      nodeEnv: this.configService.get<string>('NODE_ENV'),
    };
  }
}
