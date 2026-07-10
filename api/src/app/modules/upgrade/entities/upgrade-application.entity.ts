import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';
import { UpgradeApplicationStatus } from '../../../common/enums';

@Entity('upgrade_applications')
@Index(['userId'])
@Index(['status'])
@Index(['fromCategoryId'])
@Index(['toCategoryId'])
@Index(['userId', 'status'])
export class UpgradeApplicationEntity extends AuditableEntity {
  // ============================================
  // APPLICANT
  // ============================================

  @ApiProperty({ description: 'Applicant (engineer) user ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // ============================================
  // UPGRADE PATH
  // ============================================

  @ApiProperty({ description: 'Current category ID at time of application' })
  @Column({ type: 'uuid' })
  fromCategoryId: string;

  @ManyToOne(() => MembershipCategoryEntity)
  @JoinColumn({ name: 'fromCategoryId' })
  fromCategory: MembershipCategoryEntity;

  @ApiProperty({ description: 'Target category ID' })
  @Column({ type: 'uuid' })
  toCategoryId: string;

  @ManyToOne(() => MembershipCategoryEntity)
  @JoinColumn({ name: 'toCategoryId' })
  toCategory: MembershipCategoryEntity;

  // ============================================
  // STATUS & REVIEW
  // ============================================

  @ApiProperty({ enum: UpgradeApplicationStatus, example: 'PENDING' })
  @Column({
    type: 'enum',
    enum: UpgradeApplicationStatus,
    default: UpgradeApplicationStatus.PENDING,
  })
  status: UpgradeApplicationStatus;

  @ApiProperty({ description: 'Date when application was submitted' })
  @Column({ type: 'timestamp with time zone', default: () => 'NOW()' })
  submittedAt: Date;

  @ApiProperty({ description: 'Date when application was reviewed', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Admin user ID who reviewed the application', required: false })
  @Column({ type: 'uuid', nullable: true })
  reviewedById?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy?: UserEntity;

  @ApiProperty({ description: 'Reason for rejection if rejected', required: false })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @ApiProperty({ description: 'Notes from the applicant (optional)', required: false })
  @Column({ type: 'text', nullable: true })
  applicantNotes?: string;
}
