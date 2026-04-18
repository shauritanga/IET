import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import {
  FeeStatus,
  MembershipClass,
  PaymentMethod,
} from '../../../common/enums';

@Entity('membership_fees')
@Index(['userId'])
@Index(['year'])
@Index(['status'])
@Index(['userId', 'year'], { unique: true })
export class MembershipFeeEntity extends BaseEntity {
  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({
    example: 2025,
    description: 'Fee year',
  })
  @Column({ type: 'integer' })
  year: number;

  @ApiProperty({
    example: 'MIET',
    description: 'Membership class for this fee',
    enum: MembershipClass,
  })
  @Column({ type: 'enum', enum: MembershipClass })
  membershipClass: MembershipClass;

  @ApiProperty({
    example: 10000,
    description: 'Fee amount in TZS',
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
    example: 'PENDING',
    description: 'Fee payment status',
    enum: FeeStatus,
  })
  @Column({ type: 'enum', enum: FeeStatus, default: FeeStatus.PENDING })
  status: FeeStatus;

  @ApiProperty({
    example: '2025-07-10',
    description: 'Due date for payment',
  })
  @Column({ type: 'date' })
  dueDate: Date;

  @ApiProperty({
    description: 'Date when fee was paid',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;

  @ApiProperty({
    example: 'MPESA',
    description: 'Payment method used',
    enum: PaymentMethod,
  })
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @ApiProperty({
    description: 'Payment ID reference',
  })
  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @ApiProperty({
    example: 'TXN123456',
    description: 'Transaction reference from payment provider',
  })
  @Column({ nullable: true })
  transactionRef?: string;

  @ApiProperty({
    example: 'IET/RCT/2025/0234',
    description: 'Receipt number',
  })
  @Column({ nullable: true, unique: true })
  receiptNumber?: string;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/receipts/uuid.pdf',
    description: 'Receipt PDF URL',
  })
  @Column({ nullable: true })
  receiptUrl?: string;

  @ApiProperty({
    description: 'Notes or comments',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({
    description: 'Number of reminder emails sent',
  })
  @Column({ default: 0 })
  remindersSent: number;

  @ApiProperty({
    description: 'Date of last reminder sent',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastReminderAt?: Date;
}
