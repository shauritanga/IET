import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { RegistrationEntity } from './registration.entity';

@Entity('registration_educations')
@Index(['registrationId'])
export class EducationEntity extends BaseEntity {
  @ApiProperty({ description: 'Registration ID' })
  @Column({ type: 'uuid' })
  registrationId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./registration.entity').RegistrationEntity,
    (registration: RegistrationEntity) => registration.educations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  registration: RegistrationEntity;

  @ApiProperty({
    example: 'University of Dar es Salaam',
    description: 'Institution name',
  })
  @Column()
  institutionName: string;

  @ApiProperty({
    example: 'Bachelor of Science in Mechanical Engineering',
    description: 'Degree/Qualification obtained',
  })
  @Column()
  qualification: string;

  @ApiProperty({
    example: 'Mechanical Engineering',
    description: 'Field of study',
  })
  @Column({ nullable: true })
  fieldOfStudy?: string;

  @ApiProperty({
    example: '2015-09-01',
    description: 'Start date',
  })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({
    example: '2019-07-15',
    description: 'End date',
  })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ApiProperty({
    example: 'First Class Honours',
    description: 'Grade/Classification',
  })
  @Column({ nullable: true })
  grade?: string;

  @ApiProperty({
    example: 'Dar es Salaam, Tanzania',
    description: 'Location of institution',
  })
  @Column({ nullable: true })
  location?: string;

  @ApiProperty({
    description: 'Sort order for display',
  })
  @Column({ default: 0 })
  sortOrder: number;
}
