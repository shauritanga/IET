import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import type { EventEntity } from './event.entity';
import {
  EventRegistrationStatus,
  AttendeeType,
  PaymentMethod,
  PaymentStatus,
} from '../../../common/enums';

@Entity('event_registrations')
@Index(['eventId'])
@Index(['userId'])
@Index(['eventId', 'userId'], { unique: true })
@Index(['ticketNumber'], { unique: true, where: '"ticketNumber" IS NOT NULL' })
export class EventRegistrationEntity extends BaseEntity {
  @ApiProperty({ description: 'Event ID' })
  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./event.entity').EventEntity,
    (event: EventEntity) => event.registrations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({
    example: 'MEMBER',
    description: 'Attendee type',
    enum: AttendeeType,
  })
  @Column({ type: 'enum', enum: AttendeeType, default: AttendeeType.MEMBER })
  attendeeType: AttendeeType;

  @ApiProperty({
    example: 'CONFIRMED',
    description: 'Registration status',
    enum: EventRegistrationStatus,
  })
  @Column({
    type: 'enum',
    enum: EventRegistrationStatus,
    default: EventRegistrationStatus.PENDING_PAYMENT,
  })
  status: EventRegistrationStatus;

  @ApiProperty({
    example: 'Vegetarian meal',
    description: 'Special requirements',
  })
  @Column({ type: 'text', nullable: true })
  specialRequirements?: string;

  @ApiProperty({
    example: 50000,
    description: 'Amount paid',
  })
  @Column({ type: 'integer', default: 0 })
  amountPaid: number;

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
    description: 'Transaction reference',
  })
  @Column({ nullable: true })
  transactionRef?: string;

  @ApiProperty({
    example: 'IET/EVT/2025/0123',
    description: 'Ticket number',
  })
  @Column({ nullable: true, unique: true })
  ticketNumber?: string;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/qr/uuid.png',
    description: 'QR code URL for check-in',
  })
  @Column({ nullable: true })
  qrCodeUrl?: string;

  @ApiProperty({
    description: 'Date when registration was confirmed',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  confirmedAt?: Date;

  @ApiProperty({
    description: 'Date when attendance was recorded',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  attendedAt?: Date;

  @ApiProperty({
    description: 'Check-in notes',
  })
  @Column({ type: 'text', nullable: true })
  checkInNotes?: string;

  @ApiProperty({
    description: 'Cancellation reason',
  })
  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @ApiProperty({
    description: 'Date when registration was cancelled',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({
    description: 'Refund amount (if applicable)',
  })
  @Column({ type: 'integer', default: 0 })
  refundAmount: number;

  @ApiProperty({
    description: 'Refund status',
    enum: PaymentStatus,
  })
  @Column({ type: 'enum', enum: PaymentStatus, nullable: true })
  refundStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Certificate URL (generated after attendance)',
  })
  @Column({ nullable: true })
  certificateUrl?: string;

  @ApiProperty({
    example: 'IET-CERT-2025-0123',
    description: 'Certificate verification code',
  })
  @Column({ nullable: true })
  certificateCode?: string;

  @ApiProperty({
    description: 'Event feedback rating (1-5)',
  })
  @Column({ type: 'integer', nullable: true })
  feedbackRating?: number;

  @ApiProperty({
    description: 'Event feedback comment',
  })
  @Column({ type: 'text', nullable: true })
  feedbackComment?: string;

  @ApiProperty({
    description: 'Timestamp when the pending payment expires',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  paymentExpiresAt?: Date;
}
