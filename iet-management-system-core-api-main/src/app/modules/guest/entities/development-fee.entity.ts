import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentStatus, PaymentMethod } from '../../../common/enums';

/**
 * Development Fee Entity
 * For guest/temporary payments for IET development contributions
 */
@Entity('development_fees')
@Index(['email'])
@Index(['phoneNumber'])
@Index(['controlNumber'], {
  unique: true,
  where: '"controlNumber" IS NOT NULL',
})
export class DevelopmentFeeEntity extends BaseEntity {
  // ============================================
  // CONTRIBUTOR DETAILS
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
    description: 'Organization (optional)',
  })
  @Column({ nullable: true })
  organization?: string;

  // ============================================
  // FEE DETAILS
  // ============================================
  @ApiProperty({
    example: 'Building Fund',
    description: 'Contribution purpose',
  })
  @Column()
  purpose: string;

  @ApiProperty({ example: 100000, description: 'Amount in TZS' })
  @Column({ type: 'integer' })
  amount: number;

  @ApiProperty({ example: 'TZS', description: 'Currency' })
  @Column({ default: 'TZS' })
  currency: string;

  @ApiProperty({ description: 'Additional notes' })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // ============================================
  // PAYMENT DETAILS
  // ============================================
  @ApiProperty({ description: 'Control number for payment' })
  @Column({ nullable: true })
  controlNumber?: string;

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
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment completed timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt?: Date;

  @ApiProperty({ description: 'Receipt number' })
  @Column({ nullable: true })
  receiptNumber?: string;

  @ApiProperty({ description: 'Receipt URL' })
  @Column({ nullable: true })
  receiptUrl?: string;

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
