import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { RegistrationEntity } from './registration.entity';
import { ReferenceType, MembershipClass } from '../../../common/enums';

@Entity('registration_references')
@Index(['registrationId'])
@Index(['referenceType'])
export class ReferenceEntity extends BaseEntity {
  @ApiProperty({ description: 'Registration ID' })
  @Column({ type: 'uuid' })
  registrationId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./registration.entity').RegistrationEntity,
    (registration: RegistrationEntity) => registration.references,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  registration: RegistrationEntity;

  @ApiProperty({
    example: 'PROPOSER',
    description: 'Reference type (Proposer or Supporter)',
    enum: ReferenceType,
  })
  @Column({ type: 'enum', enum: ReferenceType })
  referenceType: ReferenceType;

  @ApiProperty({
    example: 'Eng. Emmanuel Ole Kambainei',
    description: 'Full name of referee',
  })
  @Column()
  fullName: string;

  @ApiProperty({
    example: 'FELLOW',
    description: 'Membership category of referee',
  })
  @Column({ type: 'varchar' })
  membershipCategory: string;

  @ApiProperty({
    example: 'IET/ENG/0123',
    description: 'Membership number of referee',
  })
  @Column()
  membershipNumber: string;

  @ApiProperty({
    example: '2020-01-01',
    description: 'Date from which referee has known the applicant',
  })
  @Column({ type: 'date', nullable: true })
  knownFrom?: Date;

  @ApiProperty({
    example: 'emmanuel@example.com',
    description: 'Email of referee (optional)',
  })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({
    example: '+255712345678',
    description: 'Phone number of referee (optional)',
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    example: 'Tanzania Engineers Registration Board',
    description: 'Organisation or employer of referee (optional)',
  })
  @Column({ nullable: true })
  organisation?: string;

  @ApiProperty({
    example: 'Current Supervisor / Manager',
    description: 'Relationship of referee to applicant (optional)',
  })
  @Column({ nullable: true })
  relationship?: string;

  @ApiProperty({
    description: 'Whether reference has been verified',
  })
  @Column({ default: false })
  verified: boolean;

  @ApiProperty({
    description: 'Date when reference was verified',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'Verification notes',
  })
  @Column({ type: 'text', nullable: true })
  verificationNotes?: string;
}
