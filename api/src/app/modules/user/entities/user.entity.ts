import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  Gender,
  Title,
  UserRole,
  MembershipClass,
  MembershipStatus,
  EngineeringDiscipline,
} from '../../../common/enums';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['membershipId'], { unique: true, where: '"membershipId" IS NOT NULL' })
@Index(['phoneNumber'])
@Index(['membershipCategoryId'])
export class UserEntity extends BaseEntity {
  // ============================================
  // AUTHENTICATION FIELDS
  // ============================================

  @ApiProperty({
    example: 'joram@gmail.com',
    description: 'Email address (used for login)',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (hashed when stored)',
  })
  @Column()
  @Exclude()
  password: string;

  @ApiProperty({
    description: 'Whether email has been verified',
    default: false,
  })
  @Column({ default: false })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Email verification code',
    required: false,
  })
  @Column({ nullable: true })
  @Exclude()
  emailVerificationCode?: string;

  @ApiProperty({
    description: 'Email verification code expiry',
    required: false,
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  emailVerificationExpiry?: Date;

  @ApiProperty({
    description: 'Password reset token',
    required: false,
  })
  @Column({ nullable: true })
  @Exclude()
  passwordResetToken?: string;

  @ApiProperty({
    description: 'Password reset token expiry',
    required: false,
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  passwordResetExpiry?: Date;

  @ApiProperty({
    description: 'Secret for two-factor authentication (encrypted)',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  @Exclude()
  twoFASecret?: string;

  @ApiProperty({
    description: 'Whether two-factor authentication is enabled',
    default: false,
  })
  @Column({ default: false })
  enable2FA: boolean;

  @ApiProperty({
    description: 'Refresh token for JWT authentication (hashed)',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  @Exclude()
  refreshToken?: string;

  @ApiProperty({
    description: 'API key for external integrations',
    required: false,
  })
  @Column({ nullable: true, type: 'text' })
  @Exclude()
  apiKey?: string;

  @ApiProperty({
    description: 'Number of failed login attempts',
    default: 0,
  })
  @Column({ default: 0 })
  @Exclude()
  failedLoginAttempts: number;

  @ApiProperty({
    description: 'Account locked until (after too many failed attempts)',
    required: false,
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  lockedUntil?: Date;

  @Column({ nullable: true })
  @Exclude()
  loginOtpCode?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  loginOtpExpiry?: Date;

  // ============================================
  // PERSONAL DETAILS
  // ============================================

  @ApiProperty({
    example: 'Eng.',
    description: 'Professional title',
    enum: Title,
  })
  @Column({ type: 'enum', enum: Title, nullable: true })
  title?: Title;

  @ApiProperty({
    example: 'Joram',
    description: 'First name',
  })
  @Column({ nullable: true })
  firstName?: string;

  @ApiProperty({
    example: 'Allan',
    description: 'Middle name',
  })
  @Column({ nullable: true })
  middleName?: string;

  @ApiProperty({
    example: 'Jackson',
    description: 'Last name',
  })
  @Column({ nullable: true })
  lastName?: string;

  @ApiProperty({
    example: 'MALE',
    description: 'Gender',
    enum: Gender,
  })
  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @ApiProperty({
    example: '1987-09-12',
    description: 'Date of birth',
  })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @ApiProperty({
    example: 'Tanzanian',
    description: 'Nationality',
  })
  @Column({ nullable: true })
  nationality?: string;

  @ApiProperty({
    example: '+255657000000',
    description: 'Phone number with country code',
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/photos/uuid.jpg',
    description: 'Profile photo URL',
  })
  @Column({ nullable: true })
  profilePhotoUrl?: string;

  // ============================================
  // EMPLOYMENT DETAILS
  // ============================================

  @ApiProperty({
    example: 'ALAF Limited',
    description: 'Current employer/organization',
  })
  @Column({ nullable: true })
  employer?: string;

  @ApiProperty({
    example: 'Mechanical Engineer',
    description: 'Position/designation',
  })
  @Column({ nullable: true })
  position?: string;

  @ApiProperty({
    example: 'Dar es salaam, Tanzania',
    description: 'Work location',
  })
  @Column({ nullable: true })
  location?: string;

  // ============================================
  // MEMBERSHIP DETAILS
  // ============================================

  @ApiProperty({
    example: 'IET/ENG/0234',
    description: 'IET Membership ID',
  })
  @Column({ nullable: true, unique: true })
  membershipId?: string;

  @ApiProperty({
    example: 'MIET',
    description: 'Membership class',
    enum: MembershipClass,
  })
  @Column({ type: 'enum', enum: MembershipClass, nullable: true })
  membershipClass?: MembershipClass;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Membership category reference',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  membershipCategoryId?: string | null;

  @ManyToOne(() => MembershipCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'membershipCategoryId' })
  membershipCategory?: MembershipCategoryEntity | null;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Membership status',
    enum: MembershipStatus,
  })
  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.PENDING,
  })
  membershipStatus: MembershipStatus;

  @ApiProperty({
    example: 'Mechanical',
    description: 'Engineering discipline',
    enum: EngineeringDiscipline,
  })
  @Column({ type: 'enum', enum: EngineeringDiscipline, nullable: true })
  engineeringDiscipline?: EngineeringDiscipline;

  @ApiProperty({
    example: '2022-07-10',
    description: 'Date of joining IET',
  })
  @Column({ type: 'date', nullable: true })
  joiningDate?: Date;

  @ApiProperty({
    example: '2026-07-10',
    description: 'Membership expiry date',
  })
  @Column({ type: 'date', nullable: true })
  membershipExpiryDate?: Date;

  @ApiProperty({
    example: 10000,
    description: 'Annual membership fee in TZS',
  })
  @Column({ type: 'integer', nullable: true })
  annualMembershipFee?: number;

  // ============================================
  // AUTHORIZATION
  // ============================================

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @ApiProperty({
    description: 'Whether user account is active',
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  @ApiProperty({
    description: 'Email notification preferences',
    example: {
      eventReminders: true,
      paymentReminders: true,
      newsletters: false,
    },
  })
  @Column({ type: 'jsonb', default: {} })
  emailPreferences: Record<string, boolean>;

  @ApiProperty({
    description: 'SMS notification preferences',
    example: { eventReminders: true, paymentReminders: true },
  })
  @Column({ type: 'jsonb', default: {} })
  smsPreferences: Record<string, boolean>;

  @ApiProperty({
    description: 'Push notification preferences',
    example: { eventReminders: true, paymentReminders: true },
  })
  @Column({ type: 'jsonb', default: {} })
  pushPreferences: Record<string, boolean>;

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================

  /**
   * Get full name with title
   */
  get fullName(): string {
    const parts = [
      this.title,
      this.firstName,
      this.middleName,
      this.lastName,
    ].filter(Boolean);
    return parts.join(' ');
  }

  /**
   * Check if membership is expired
   */
  get isMembershipExpired(): boolean {
    if (!this.membershipExpiryDate) return false;
    return new Date() > new Date(this.membershipExpiryDate);
  }

  /**
   * Get days until membership expiry
   */
  get daysUntilExpiry(): number | null {
    if (!this.membershipExpiryDate) return null;
    const now = new Date();
    const expiry = new Date(this.membershipExpiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
