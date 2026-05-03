import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Optional,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { ILike, Repository, UpdateResult } from 'typeorm';
import { RegistrationEntity } from '../../registration/entities';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { v4 as uuid4 } from 'uuid';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EncryptionService } from '../../../common/services/encryption.service';
import { ConfigService } from '@nestjs/config';
import { UserRole, MembershipStatus } from '../../../common/enums';

// Mock user for when database is disabled
const MOCK_USER: Partial<UserEntity> = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@example.com',
  password: '$2b$10$KlBGKASI0HX5Io0DRJ/yLePhMWMuB1r64QnZYvQqjuFzq1jXrdw5G', // password: 'password'
  apiKey: 'demo-api-key',
  role: UserRole.ADMIN,
  membershipStatus: MembershipStatus.ACTIVE,
  enable2FA: false,
  twoFASecret: null,
  refreshToken: null,
  emailVerified: true,
  isActive: true,
  failedLoginAttempts: 0,
  emailPreferences: {},
  smsPreferences: {},
  pushPreferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly databaseEnabled: boolean;
  private readonly mockUsers: Partial<UserEntity>[] = [MOCK_USER];
  private readonly SALT_ROUNDS = 10;

  constructor(
    @Optional()
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Optional()
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
    private encryptionService: EncryptionService,
    private configService: ConfigService,
  ) {
    this.databaseEnabled = this.configService.get<boolean>('DATABASE_ENABLED');
    this.logger.log(`Database enabled: ${this.databaseEnabled}`);
  }

  /**
   * Create a new user
   */
  async create(
    userDto: CreateUserDto,
    options: { enable2FA?: boolean } = {},
  ): Promise<UserEntity> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      // Check if email already exists
      const existingUser = await this.userRepository.findOneBy({
        email: userDto.email,
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Check if phone number already exists (if provided)
      if (userDto.phoneNumber) {
        const existingPhone = await this.userRepository.findOneBy({
          phoneNumber: userDto.phoneNumber,
        });
        if (existingPhone) {
          throw new BadRequestException(
            'User with this phone number already exists',
          );
        }
      }

      const user = new UserEntity();
      user.email = userDto.email.toLowerCase().trim();
      user.title = userDto.title;
      user.firstName = userDto.firstName;
      user.middleName = userDto.middleName;
      user.lastName = userDto.lastName;
      user.gender = userDto.gender;
      user.phoneNumber = userDto.phoneNumber;
      user.dateOfBirth = userDto.dateOfBirth
        ? new Date(userDto.dateOfBirth)
        : undefined;
      user.nationality = userDto.nationality;
      user.employer = userDto.employer;
      user.position = userDto.position;
      user.engineeringDiscipline = userDto.engineeringDiscipline;
      user.apiKey = uuid4();
      user.membershipStatus = MembershipStatus.PENDING;
      user.role = UserRole.MEMBER;
      user.isActive = true;
      user.emailVerified = false;
      user.enable2FA = options.enable2FA ?? false;
      user.failedLoginAttempts = 0;
      user.emailPreferences = {
        eventReminders: true,
        paymentReminders: true,
        newsletters: true,
        applicationUpdates: true,
      };
      user.smsPreferences = { eventReminders: true, paymentReminders: true };
      user.pushPreferences = {
        eventReminders: true,
        paymentReminders: true,
        generalAnnouncements: true,
      };

      // Hash password
      user.password = await bcrypt.hash(userDto.password, this.SALT_ROUNDS);

      // Generate email verification code
      user.emailVerificationCode = this.generateVerificationCode();
      user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const savedUser = await this.userRepository.save(user);
      delete savedUser.password;
      return savedUser;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create user: ' + error.message);
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return 'IET-' + Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Find all users with pagination
   */
  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<{
    items: UserEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    if (!this.databaseEnabled) {
      const { page = 1, pageSize = 10 } = paginationDto;
      const mockUsersWithoutPassword = this.mockUsers.map((user) => {
        const { password: _password, ...userWithoutPassword } = { ...user };
        return userWithoutPassword as UserEntity;
      });

      return {
        items: mockUsersWithoutPassword as UserEntity[],
        total: mockUsersWithoutPassword.length,
        page,
        pageSize,
        totalPages: 1,
      };
    }

    try {
      const { page = 1, pageSize = 10 } = paginationDto;
      const skip = (page - 1) * pageSize;

      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // Add search filter if provided
      if (search) {
        queryBuilder.where(
          '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.membershipId ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      const [users, total] = await queryBuilder
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(pageSize)
        .getManyAndCount();

      const items = users.map((user) => {
        const userCopy = { ...user };
        delete userCopy.password;
        delete userCopy.refreshToken;
        delete userCopy.twoFASecret;
        delete userCopy.emailVerificationCode;
        delete userCopy.passwordResetToken;
        return userCopy as UserEntity;
      });

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch users: ' + error.message);
    }
  }

  async findOne(data: Partial<UserEntity>): Promise<UserEntity> {
    if (!this.databaseEnabled) {
      const mockUser = this.mockUsers.find((u) => u.email === data.email);
      if (!mockUser) {
        throw new UnauthorizedException(
          'User not found with the provided email',
        );
      }
      return { ...mockUser } as UserEntity;
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(data.email) } });
      if (!user) {
        throw new UnauthorizedException(
          'User not found with the provided email',
        );
      }
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException('Failed to find user: ' + error.message);
    }
  }

  async findByApiKey(apiKey: string): Promise<UserEntity> {
    if (!this.databaseEnabled) {
      const mockUser = this.mockUsers.find((u) => u.apiKey === apiKey);
      if (!mockUser) {
        throw new UnauthorizedException('Invalid API key');
      }
      return { ...mockUser } as UserEntity;
    }

    try {
      const user = await this.userRepository.findOneBy({ apiKey });
      if (!user) {
        throw new UnauthorizedException('Invalid API key');
      }
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to authenticate with API key: ' + error.message,
      );
    }
  }

  /**
   * Find user by ID (UUID)
   */
  async findById(id: string): Promise<UserEntity> {
    if (!this.databaseEnabled) {
      const mockUser = this.mockUsers.find((u) => u.id === id);
      if (!mockUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const { password: _password, ...userWithoutPassword } = { ...mockUser };
      return userWithoutPassword as UserEntity;
    }

    try {
      const user = await this.userRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      delete user.password;

      // Decrypt 2FA secret if it exists
      if (user.twoFASecret) {
        try {
          user.twoFASecret = this.encryptionService.decrypt(user.twoFASecret);
        } catch (error: any) {
          this.logger.error('Failed to decrypt 2FA secret:', error.message);
        }
      }

      return user;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to find user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to find user with ID ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Get user profile with registration status
   */
  async getProfileWithRegistrationStatus(userId: string) {
    const user = await this.findById(userId);
    const registration = this.registrationRepository
      ? await this.registrationRepository.findOne({
          where: { userId },
          select: ['status', 'reviewStage', 'stageUpdatedAt'],
        })
      : null;

    const {
      password,
      refreshToken,
      twoFASecret,
      emailVerificationCode,
      emailVerificationExpiry,
      passwordResetToken,
      passwordResetExpiry,
      apiKey,
      failedLoginAttempts,
      lockedUntil,
      deletedAt,
      fullName,
      ...safeUser
    } = user as any;

    return {
      success: true,
      data: {
        ...safeUser,
        registrationStatus: registration?.status ?? null,
        registrationReviewStage: registration?.reviewStage ?? null,
        registrationStageUpdatedAt: registration?.stageUpdatedAt ?? null,
      },
    };
  }

  /**
   * Find user by membership ID
   */
  async findByMembershipId(membershipId: string): Promise<UserEntity | null> {
    if (!this.databaseEnabled) {
      return null;
    }

    try {
      const user = await this.userRepository.findOneBy({ membershipId });
      if (user) {
        delete user.password;
        delete user.refreshToken;
        delete user.twoFASecret;
      }
      return user;
    } catch (error: any) {
      this.logger.error(
        `Failed to find user with membership ID ${membershipId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to find user with membership ID ${membershipId}: ${error.message}`,
      );
    }
  }

  /**
   * Find user by email (for profile lookup, not auth)
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    if (!this.databaseEnabled) {
      const mockUser = this.mockUsers.find((u) => u.email === email);
      return mockUser ? ({ ...mockUser } as UserEntity) : null;
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (user) {
        delete user.password;
        delete user.refreshToken;
        delete user.twoFASecret;
      }
      return user;
    } catch (error: any) {
      this.logger.error(
        `Failed to find user by email: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to find user by email: ${error.message}`,
      );
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.findById(id);

      // Extract dateOfBirth to handle separately
      const { dateOfBirth, ...dtoWithoutDate } = updateUserDto;

      // Create a copy and merge updates (excluding dateOfBirth)
      const updatedUser = Object.assign(user, dtoWithoutDate);

      // Handle date conversion
      if (dateOfBirth) {
        updatedUser.dateOfBirth = new Date(dateOfBirth);
      }

      await this.userRepository.save(updatedUser);
      delete updatedUser.password;
      delete updatedUser.refreshToken;
      delete updatedUser.twoFASecret;
      return updatedUser;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to update user with ID ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Soft delete user
   */
  async remove(id: string): Promise<void> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const result = await this.userRepository.softDelete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete user with ID ${id}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to delete user with ID ${id}: ${error.message}`,
      );
    }
  }

  /**
   * Update 2FA secret key (encrypted)
   */
  async updateSecretKey(userId: string, secret: string): Promise<UpdateResult> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      // Encrypt the 2FA secret before storing it
      const encryptedSecret = this.encryptionService.encrypt(secret);

      return this.userRepository.update(
        { id: userId },
        {
          twoFASecret: encryptedSecret,
          enable2FA: true,
        },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update 2FA secret: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to update 2FA secret: ${error.message}`,
      );
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string): Promise<UpdateResult> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      return this.userRepository.update(
        { id: userId },
        {
          enable2FA: false,
          twoFASecret: null,
        },
      );
    } catch (error: any) {
      this.logger.error(`Failed to disable 2FA: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to disable 2FA: ${error.message}`);
    }
  }

  /**
   * Update refresh token (hashed)
   */
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    if (!this.databaseEnabled) {
      // In-memory mock update for the demo user
      if (userId === '00000000-0000-0000-0000-000000000001') {
        this.mockUsers[0].refreshToken = await bcrypt.hash(
          refreshToken,
          this.SALT_ROUNDS,
        );
      }
      return;
    }

    try {
      // Hash the refresh token before storing
      const hashedRefreshToken = await bcrypt.hash(
        refreshToken,
        this.SALT_ROUNDS,
      );

      await this.userRepository.update(
        { id: userId },
        { refreshToken: hashedRefreshToken },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update refresh token: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to update refresh token: ${error.message}`,
      );
    }
  }

  /**
   * Remove refresh token (logout)
   */
  async removeRefreshToken(userId: string): Promise<void> {
    if (!this.databaseEnabled) {
      // In-memory mock update for the demo user
      if (userId === '00000000-0000-0000-0000-000000000001') {
        this.mockUsers[0].refreshToken = null;
      }
      return;
    }

    try {
      await this.userRepository.update({ id: userId }, { refreshToken: null });
    } catch (error: any) {
      this.logger.error(
        `Failed to remove refresh token: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to remove refresh token: ${error.message}`,
      );
    }
  }

  /**
   * Verify email with verification code
   */
  async verifyEmail(email: string, code: string): Promise<boolean> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.emailVerified) {
        throw new BadRequestException('Email already verified');
      }

      if (user.emailVerificationCode !== code) {
        throw new BadRequestException('Invalid verification code');
      }

      if (
        user.emailVerificationExpiry &&
        new Date() > user.emailVerificationExpiry
      ) {
        throw new BadRequestException('Verification code has expired');
      }

      await this.userRepository.update(
        { id: user.id },
        {
          emailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
        },
      );

      return true;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to verify email: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(`Failed to verify email: ${error.message}`);
    }
  }

  /**
   * Resend email verification code
   */
  async resendVerificationCode(email: string): Promise<string> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.emailVerified) {
        throw new BadRequestException('Email already verified');
      }

      const code = this.generateVerificationCode();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await this.userRepository.update(
        { id: user.id },
        {
          emailVerificationCode: code,
          emailVerificationExpiry: expiry,
        },
      );

      return code;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to resend verification code: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to resend verification code: ${error.message}`,
      );
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (!user) {
        // Return success even if user not found to prevent email enumeration
        return uuid4();
      }

      const token = uuid4();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.userRepository.update(
        { id: user.id },
        {
          passwordResetToken: token,
          passwordResetExpiry: expiry,
        },
      );

      return token;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate password reset token: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to generate password reset token: ${error.message}`,
      );
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.userRepository.findOneBy({
        passwordResetToken: token,
      });
      if (!user) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (user.passwordResetExpiry && new Date() > user.passwordResetExpiry) {
        throw new BadRequestException('Reset token has expired');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      await this.userRepository.update(
        { id: user.id },
        {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      );

      return true;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to reset password: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to reset password: ${error.message}`,
      );
    }
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      await this.userRepository.update(
        { id: userId },
        { password: hashedPassword },
      );

      return true;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to change password: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to change password: ${error.message}`,
      );
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLoginAttempt(email: string): Promise<void> {
    if (!this.databaseEnabled) {
      return;
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (!user) return;

      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: Partial<UserEntity> = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account after 5 failed attempts for 30 minutes
      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await this.userRepository.update({ id: user.id }, updateData);
    } catch (error: any) {
      this.logger.error(
        `Failed to record failed login attempt: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedLoginAttempts(userId: string): Promise<void> {
    if (!this.databaseEnabled) {
      return;
    }

    try {
      await this.userRepository.update(
        { id: userId },
        {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to reset failed login attempts: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    if (!this.databaseEnabled) {
      return false;
    }

    try {
      const user = await this.userRepository.findOne({ where: { email: ILike(email) } });
      if (!user || !user.lockedUntil) return false;

      return new Date() < user.lockedUntil;
    } catch (error: any) {
      this.logger.error(
        `Failed to check account lock status: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Generate membership ID in format IET/ENG/XXXX
   */
  async generateMembershipId(): Promise<string> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      // Get the count of existing members with membershipId
      const result = await this.userRepository
        .createQueryBuilder('user')
        .select(
          'MAX(CAST(SUBSTRING(user.membershipId, 9) AS INTEGER))',
          'maxId',
        )
        .where('user.membershipId IS NOT NULL')
        .getRawOne();

      const nextNumber = (result?.maxId || 0) + 1;
      return `IET/ENG/${nextNumber.toString().padStart(4, '0')}`;
    } catch (error: any) {
      this.logger.error(
        `Failed to generate membership ID: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to generate membership ID: ${error.message}`,
      );
    }
  }

  /**
   * Assign membership ID to user
   */
  async assignMembershipId(userId: string): Promise<string> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      const user = await this.findById(userId);
      if (user.membershipId) {
        return user.membershipId;
      }

      const membershipId = await this.generateMembershipId();

      await this.userRepository.update(
        { id: userId },
        {
          membershipId,
          membershipStatus: MembershipStatus.ACTIVE,
          joiningDate: new Date(),
          membershipExpiryDate: new Date(
            Date.now() + 365 * 24 * 60 * 60 * 1000,
          ), // 1 year
        },
      );

      return membershipId;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to assign membership ID: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to assign membership ID: ${error.message}`,
      );
    }
  }

  /**
   * Save a one-time login OTP for SMS 2FA
   */
  async saveLoginOtp(userId: string, code: string): Promise<void> {
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.userRepository.update({ id: userId }, { loginOtpCode: code, loginOtpExpiry: expiry });
  }

  /**
   * Verify login OTP and clear it on success
   */
  async verifyAndClearLoginOtp(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'loginOtpCode', 'loginOtpExpiry'],
    });
    if (!user?.loginOtpCode || !user.loginOtpExpiry) return false;
    if (new Date() > user.loginOtpExpiry) return false;
    if (user.loginOtpCode !== code) return false;

    await this.userRepository.update({ id: userId }, { loginOtpCode: null, loginOtpExpiry: null });
    return true;
  }

  /**
   * Update profile photo URL
   */
  async updateProfilePhoto(userId: string, photoUrl: string): Promise<void> {
    if (!this.databaseEnabled) {
      throw new BadRequestException('Database functionality is disabled');
    }

    try {
      await this.userRepository.update(
        { id: userId },
        { profilePhotoUrl: photoUrl },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to update profile photo: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to update profile photo: ${error.message}`,
      );
    }
  }
}
