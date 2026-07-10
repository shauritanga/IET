import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';

@Entity('upgrade_rules')
@Index(['fromCategoryId'])
@Index(['toCategoryId'])
@Index(['isActive'])
export class UpgradeRuleEntity extends AuditableEntity {
  // ============================================
  // UPGRADE PATH
  // ============================================

  @ApiProperty({ description: 'Source category ID' })
  @Column({ type: 'uuid' })
  fromCategoryId: string;

  @ManyToOne(() => MembershipCategoryEntity, { eager: true })
  @JoinColumn({ name: 'fromCategoryId' })
  fromCategory: MembershipCategoryEntity;

  @ApiProperty({ description: 'Target category ID' })
  @Column({ type: 'uuid' })
  toCategoryId: string;

  @ManyToOne(() => MembershipCategoryEntity, { eager: true })
  @JoinColumn({ name: 'toCategoryId' })
  toCategory: MembershipCategoryEntity;

  // ============================================
  // ELIGIBILITY CRITERIA
  // ============================================

  @ApiProperty({ example: 3, description: 'Minimum years of professional experience required' })
  @Column({ type: 'int', default: 0 })
  minYearsExperience: number;

  @ApiProperty({ example: 24, description: 'Minimum CPD points required (0 = not checked)' })
  @Column({ type: 'int', default: 0 })
  minCpdPoints: number;

  @ApiProperty({ description: 'Whether active membership/payment status is required' })
  @Column({ default: true })
  requiresActiveMembership: boolean;

  @ApiProperty({ description: 'Whether a pending upgrade application blocks new applications' })
  @Column({ default: true })
  requiresNoPendingApplication: boolean;

  @ApiProperty({ description: 'List of required document types (empty = none required)', example: ['CV', 'CERTIFICATE'] })
  @Column({ type: 'jsonb', default: [] })
  requiredDocuments: string[];

  @ApiProperty({ description: 'Whether admin approval is required for upgrade' })
  @Column({ default: true })
  requiresApproval: boolean;

  @ApiProperty({ description: 'Human-readable description of this upgrade path' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  // ============================================
  // STATUS
  // ============================================

  @ApiProperty({ description: 'Whether this upgrade rule is active' })
  @Column({ default: true })
  isActive: boolean;
}
