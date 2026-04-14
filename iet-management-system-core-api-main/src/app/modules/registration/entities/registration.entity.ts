import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import {
  ApplicationStatus,
  ApplicationType,
  RegistrationCategory,
  RegistrationStep,
  EngineeringDiscipline,
  MembershipClass,
} from '../../../common/enums';
import { ProfessionalExperienceEntity } from './professional-experience.entity';
import { EducationEntity } from './education.entity';
import { DocumentEntity } from './document.entity';
import { ReferenceEntity } from './reference.entity';

@Entity('registrations')
@Index(['userId'])
@Index(['status'])
@Index(['referenceNumber'], {
  unique: true,
  where: '"referenceNumber" IS NOT NULL',
})
export class RegistrationEntity extends AuditableEntity {
  // ============================================
  // RELATIONSHIP TO USER
  // ============================================

  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // ============================================
  // APPLICATION TRACKING
  // ============================================

  @ApiProperty({
    example: 'IET/APP/2025/0001',
    description: 'Unique application reference number',
  })
  @Column({ nullable: true, unique: true })
  referenceNumber?: string;

  @ApiProperty({
    example: 'IN_REVIEW',
    description: 'Application status',
    enum: ApplicationStatus,
  })
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @ApiProperty({
    example: 'PERSONAL_DETAILS',
    description: 'Current step in the registration process',
    enum: RegistrationStep,
  })
  @Column({
    type: 'enum',
    enum: RegistrationStep,
    default: RegistrationStep.PERSONAL_DETAILS,
  })
  currentStep: RegistrationStep;

  @ApiProperty({
    example: ['PERSONAL_DETAILS', 'REGISTRATION_DETAILS'],
    description: 'List of completed steps',
  })
  @Column({ type: 'jsonb', default: [] })
  completedSteps: RegistrationStep[];

  // ============================================
  // REGISTRATION DETAILS (STEP 2)
  // ============================================

  @ApiProperty({
    example: 'Mechanical',
    description: 'Engineering discipline',
    enum: EngineeringDiscipline,
  })
  @Column({ type: 'enum', enum: EngineeringDiscipline, nullable: true })
  engineeringDiscipline?: EngineeringDiscipline;

  @ApiProperty({
    example: 'NEW',
    description: 'Application type (new registration or upgrading)',
    enum: ApplicationType,
  })
  @Column({ type: 'enum', enum: ApplicationType, default: ApplicationType.NEW })
  applicationType: ApplicationType;

  @ApiProperty({
    example: 'IET/ENG/0123',
    description: 'Existing membership number (for upgrades)',
  })
  @Column({ nullable: true })
  existingMembershipNumber?: string;

  @ApiProperty({
    example: 'GRADUATE',
    description: 'Registration category',
    enum: RegistrationCategory,
  })
  @Column({ type: 'enum', enum: RegistrationCategory, nullable: true })
  registrationCategory?: RegistrationCategory;

  @ApiProperty({
    example: 'MIET',
    description: 'Applied membership type',
  })
  @Column({ type: 'varchar', nullable: true })
  appliedMembershipClass?: string;

  @ApiProperty({
    example: true,
    description: 'Whether registered with statutory boards',
  })
  @Column({ default: false })
  registeredWithStatutoryBoards: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether member of other engineering institutions',
  })
  @Column({ default: false })
  memberOfOtherInstitutions: boolean;

  // ============================================
  // OTHER INSTITUTIONS (STEP 2)
  // ============================================

  @ApiProperty({
    description: 'Other engineering institution memberships',
    example: [
      {
        institutionName: 'University of Dar es salaam',
        registrationDate: '2020-09-01',
        classRegistered: 'Class B',
      },
    ],
  })
  @Column({ type: 'jsonb', default: [] })
  otherInstitutions: Array<{
    institutionName: string;
    registrationDate: string;
    classRegistered: string;
  }>;

  // ============================================
  // EMAIL VERIFICATION (STEP 5)
  // ============================================

  @ApiProperty({
    description: 'Whether email is verified for this application',
  })
  @Column({ default: false })
  emailVerified: boolean;

  // ============================================
  // PAYMENT (STEP 6)
  // ============================================

  @ApiProperty({
    description: 'Whether application fee has been paid',
  })
  @Column({ default: false })
  paymentCompleted: boolean;

  @ApiProperty({
    description: 'Payment ID reference',
  })
  @Column({ type: 'uuid', nullable: true })
  paymentId?: string;

  // ============================================
  // DECLARATION (STEP 7)
  // ============================================

  @ApiProperty({
    description: 'Whether declaration has been agreed',
  })
  @Column({ default: false })
  declarationAgreed: boolean;

  @ApiProperty({
    description: 'Digital signature (name)',
  })
  @Column({ nullable: true })
  declarationSignature?: string;

  @ApiProperty({
    description: 'Declaration signature date',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  declarationDate?: Date;

  // ============================================
  // SUBMISSION & REVIEW
  // ============================================

  @ApiProperty({
    description: 'Date when application was submitted',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  submittedAt?: Date;

  @ApiProperty({
    description: 'ID of admin who reviewed the application',
  })
  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @ApiProperty({
    description: 'Date when application was reviewed',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({
    description: 'Review comments',
  })
  @Column({ type: 'text', nullable: true })
  reviewComments?: string;

  @ApiProperty({
    description: 'Rejection reason (if rejected)',
  })
  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // ============================================
  // RELATIONSHIPS
  // ============================================

  @OneToMany(() => EducationEntity, (education) => education.registration, {
    cascade: true,
  })
  educations: EducationEntity[];

  @OneToMany(
    () => ProfessionalExperienceEntity,
    (experience) => experience.registration,
    { cascade: true },
  )
  experiences: ProfessionalExperienceEntity[];

  @OneToMany(() => DocumentEntity, (document) => document.registration, {
    cascade: true,
  })
  documents: DocumentEntity[];

  @OneToMany(() => ReferenceEntity, (reference) => reference.registration, {
    cascade: true,
  })
  references: ReferenceEntity[];
}
