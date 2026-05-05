import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { ApplicationReviewStage } from '../../../common/enums';
import type { RegistrationEntity } from './registration.entity';

export type ApplicationStageAction =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'ADVANCED'
  | 'EVALUATOR_RECOMMENDED'
  | 'MPDC_RECOMMENDED'
  | 'COUNCIL_RECOMMENDED'
  | 'RETURNED_FOR_CHANGES'
  | 'REJECTED'
  | 'APPROVED_BY_COUNCIL'
  | 'NOTICE_SENT'
  | 'RESUBMITTED';

@Entity('application_stage_history')
@Index(['registrationId', 'createdAt'])
export class ApplicationStageHistoryEntity extends AuditableEntity {
  @ApiProperty({ description: 'Registration ID' })
  @Column({ type: 'uuid' })
  registrationId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./registration.entity').RegistrationEntity,
    (registration: RegistrationEntity) => registration.stageHistory,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  registration: RegistrationEntity;

  @ApiProperty({
    description: 'Previous review stage',
    enum: ApplicationReviewStage,
    required: false,
  })
  @Column({ type: 'enum', enum: ApplicationReviewStage, nullable: true })
  fromStage?: ApplicationReviewStage;

  @ApiProperty({
    description: 'New review stage',
    enum: ApplicationReviewStage,
  })
  @Column({ type: 'enum', enum: ApplicationReviewStage })
  toStage: ApplicationReviewStage;

  @ApiProperty({
    description: 'Workflow action that produced this history row',
  })
  @Column({ type: 'varchar', length: 64 })
  action: ApplicationStageAction;

  @ApiProperty({
    description: 'Comments or reason provided for this transition',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  comments?: string;

  @ApiProperty({
    description: 'User ID of the assigned evaluator for assignment rows',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  assignedEvaluatorId?: string;
}
