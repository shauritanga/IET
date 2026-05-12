import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../../../common/enums';

@Entity('payments')
@Index(['userId'])
@Index(['status'])
@Index(['paymentType'])
@Index(['transactionRef'], {
  unique: true,
  where: '"transactionRef" IS NOT NULL',
})
export class PaymentEntity extends BaseEntity {
  @ApiProperty({ description: 'User ID (null for guest payments)' })
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity | null;

  @ApiProperty({
    example: 'MEMBERSHIP_FEE',
    description: 'Payment type',
    enum: PaymentType,
  })
  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty({
    example: 10000,
    description: 'Payment amount in smallest currency unit (cents/kobo)',
  })
  @Column({ type: 'integer' })
  amount: number;

  @ApiProperty({
    example: 'TZS',
    description: 'Currency code',
  })
  @Column({ default: 'TZS' })
  currency: string;

  @ApiProperty({
    example: 'COMPLETED',
    description: 'Payment status',
    enum: PaymentStatus,
  })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({
    example: 'MPESA',
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'Annual Membership Fee 2025',
    description: 'Payment description',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    example: '+255657000000',
    description: 'Phone number for mobile money payments',
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    example: 'TXN123456',
    description: 'Transaction reference from payment provider',
  })
  @Column({ nullable: true, unique: true })
  transactionRef?: string;

  @ApiProperty({
    example: 'REF123456',
    description: 'Mobile money reference',
  })
  @Column({ nullable: true })
  mobileMoneyRef?: string;

  @ApiProperty({
    example: 'https://pay.iet.or.tz/payment/uuid',
    description: 'Payment URL for card payments',
  })
  @Column({ nullable: true })
  paymentUrl?: string;

  @ApiProperty({
    description: 'Provider-specific response data',
  })
  @Column({ type: 'jsonb', default: {} })
  providerResponse: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata',
    example: { year: 2025, membershipClass: 'SENIOR_MEMBER' },
  })
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Reference to related entity (registration, fee, event)',
  })
  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @ApiProperty({
    description: 'Type of referenced entity',
  })
  @Column({ nullable: true })
  referenceType?: string;

  @ApiProperty({
    example: 'IET/RCT/2025/0234',
    description: 'Receipt number (generated after completion)',
  })
  @Column({ nullable: true })
  receiptNumber?: string;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/receipts/uuid.pdf',
    description: 'Receipt PDF URL',
  })
  @Column({ nullable: true })
  receiptUrl?: string;

  @ApiProperty({
    description: 'Date when payment was completed',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @ApiProperty({
    description: 'Error message if payment failed',
  })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({
    description: 'Number of retry attempts',
  })
  @Column({ default: 0 })
  retryCount: number;

  @ApiProperty({
    description: 'Date of last retry',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastRetryAt?: Date;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate payments',
  })
  @Column({ nullable: true, unique: true })
  idempotencyKey?: string;
}
