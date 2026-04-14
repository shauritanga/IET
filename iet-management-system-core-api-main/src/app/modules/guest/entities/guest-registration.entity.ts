import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EventEntity } from '../../events/entities/event.entity';
import {
  EventRegistrationStatus,
  PaymentStatus,
  PaymentMethod,
} from '../../../common/enums';

/**
 * Guest Registration Entity
 * For non-registered users who want to participate in events
 */
@Entity('guest_registrations')
@Index(['email'])
@Index(['phoneNumber'])
@Index(['ticketNumber'], { unique: true, where: '"ticketNumber" IS NOT NULL' })
@Index(['controlNumber'], {
  unique: true,
  where: '"controlNumber" IS NOT NULL',
})
export class GuestRegistrationEntity extends BaseEntity {
  // ============================================
  // EVENT REFERENCE
  // ============================================
  @ApiProperty({ description: 'Event ID' })
  @Column({ type: 'uuid' })
  eventId: string;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'eventId' })
  event: EventEntity;

  // ============================================
  // GUEST PERSONAL DETAILS
  // ============================================
  @ApiProperty({ example: 'John', description: 'First name' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @Column()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @Column()
  email: string;

  @ApiProperty({ example: '+255712345678', description: 'Phone number' })
  @Column()
  phoneNumber: string;

  @ApiProperty({
    example: 'ABC Company Ltd',
    description: 'Organization/Company',
  })
  @Column({ nullable: true })
  organization?: string;

  @ApiProperty({
    example: 'Software Engineer',
    description: 'Position/Designation',
  })
  @Column({ nullable: true })
  position?: string;

  @ApiProperty({ example: 'Tanzanian', description: 'Nationality' })
  @Column({ nullable: true })
  nationality?: string;

  // ============================================
  // REGISTRATION DETAILS
  // ============================================
  @ApiProperty({ enum: EventRegistrationStatus })
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

  @ApiProperty({ description: 'Ticket number' })
  @Column({ nullable: true })
  ticketNumber?: string;

  @ApiProperty({ description: 'QR code URL for check-in' })
  @Column({ nullable: true })
  qrCodeUrl?: string;

  // ============================================
  // PAYMENT DETAILS
  // ============================================
  @ApiProperty({ description: 'Control number for payment' })
  @Column({ nullable: true })
  controlNumber?: string;

  @ApiProperty({ example: 50000, description: 'Amount paid' })
  @Column({ type: 'integer', default: 0 })
  amountPaid: number;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @ApiProperty({ description: 'Payment ID reference' })
  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  @ApiProperty({ description: 'Transaction reference' })
  @Column({ nullable: true })
  transactionRef?: string;

  @ApiProperty({ enum: PaymentStatus })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Receipt number' })
  @Column({ nullable: true })
  receiptNumber?: string;

  // ============================================
  // ATTENDANCE
  // ============================================
  @ApiProperty({ description: 'Check-in timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  checkedInAt?: Date;

  @ApiProperty({ description: 'Checked in by (admin user ID)' })
  @Column({ type: 'uuid', nullable: true })
  checkedInBy?: string;

  @ApiProperty({ description: 'Check-out timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  checkedOutAt?: Date;

  // ============================================
  // CERTIFICATE
  // ============================================
  @ApiProperty({ description: 'Certificate URL' })
  @Column({ nullable: true })
  certificateUrl?: string;

  @ApiProperty({ description: 'Certificate verification code' })
  @Column({ nullable: true })
  certificateCode?: string;

  @ApiProperty({ description: 'Certificate generated timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  certificateGeneratedAt?: Date;

  // ============================================
  // NAME TAG
  // ============================================
  @ApiProperty({ description: 'Name tag generated' })
  @Column({ default: false })
  nameTagGenerated: boolean;

  @ApiProperty({ description: 'Name tag URL' })
  @Column({ nullable: true })
  nameTagUrl?: string;

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
