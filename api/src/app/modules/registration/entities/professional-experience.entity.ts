import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { RegistrationEntity } from './registration.entity';

@Entity('registration_experiences')
@Index(['registrationId'])
export class ProfessionalExperienceEntity extends BaseEntity {
  @ApiProperty({ description: 'Registration ID' })
  @Column({ type: 'uuid' })
  registrationId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./registration.entity').RegistrationEntity,
    (registration: RegistrationEntity) => registration.experiences,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  registration: RegistrationEntity;

  @ApiProperty({
    example: 'City Park Softwares',
    description: 'Employer/Company name',
  })
  @Column()
  employerName: string;

  @ApiProperty({
    example: 'Mechanical Engineer',
    description: 'Position/Job title',
  })
  @Column()
  position: string;

  @ApiProperty({
    example: '2024-09-01',
    description: 'Start date',
  })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({
    example: '2025-07-31',
    description: 'End date (null if current)',
  })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether this is the current position',
  })
  @Column({ default: false })
  isCurrent: boolean;

  @ApiProperty({
    example: '<p>Led mechanical design projects...</p>',
    description: 'Description of work/responsibilities (HTML)',
  })
  @Column({ type: 'text', nullable: true })
  responsibilities?: string;

  @ApiProperty({
    example: 'Dar es Salaam, Tanzania',
    description: 'Work location',
  })
  @Column({ nullable: true })
  location?: string;

  @ApiProperty({
    example: 'Engineering',
    description: 'Department/Division',
  })
  @Column({ nullable: true })
  department?: string;

  @ApiProperty({
    description: 'Sort order for display',
  })
  @Column({ default: 0 })
  sortOrder: number;
}
