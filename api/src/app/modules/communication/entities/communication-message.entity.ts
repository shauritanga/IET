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

@Entity('communication_messages')
@Index(['type'])
@Index(['target'])
@Index(['status'])
@Index(['groupId'])
@Index(['createdAt'])
export class CommunicationMessageEntity extends AuditableEntity {
  @ApiProperty({ description: 'Admin who created the message' })
  @Column({ type: 'uuid', nullable: true })
  createdById?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdByUser?: UserEntity | null;

  @ApiProperty({ example: 'EMAIL', description: 'Message type' })
  @Column({ type: 'varchar' })
  type: string;

  @ApiProperty({ example: 'ALL', description: 'Recipient target' })
  @Column({ type: 'varchar' })
  target: string;

  @ApiProperty({ description: 'Membership category target for GROUP sends', required: false })
  @Column({ type: 'uuid', nullable: true })
  groupId?: string | null;

  @ManyToOne(() => MembershipCategoryEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group?: MembershipCategoryEntity | null;

  @ApiProperty({ example: 'Membership renewal notice', required: false })
  @Column({ type: 'varchar', nullable: true })
  subject?: string | null;

  @ApiProperty({ example: 'Please renew your membership...', description: 'Message body' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ example: 'PENDING', description: 'Campaign status' })
  @Column({ type: 'varchar', default: 'PENDING' })
  status: string;

  @ApiProperty({ description: 'Number of recipients resolved for the campaign' })
  @Column({ type: 'integer', default: 0 })
  recipientCount: number;

  @ApiProperty({ description: 'Number of recipients successfully delivered' })
  @Column({ type: 'integer', default: 0 })
  successfulCount: number;

  @ApiProperty({ description: 'Number of recipients that failed delivery' })
  @Column({ type: 'integer', default: 0 })
  failedCount: number;

  @ApiProperty({ description: 'Date when sending completed', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt?: Date | null;

  @ApiProperty({ description: 'Error summary if the campaign failed' })
  @Column({ type: 'text', nullable: true })
  errorSummary?: string | null;
}
