import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import type { RegistrationEntity } from './registration.entity';
import { DocumentType, DocumentStatus } from '../../../common/enums';

@Entity('registration_documents')
@Index(['registrationId'])
@Index(['documentType'])
export class DocumentEntity extends BaseEntity {
  @ApiProperty({ description: 'Registration ID' })
  @Column({ type: 'uuid' })
  registrationId: string;

  @ManyToOne(
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    () => require('./registration.entity').RegistrationEntity,
    (registration: RegistrationEntity) => registration.documents,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  registration: RegistrationEntity;

  @ApiProperty({
    example: 'CV',
    description: 'Type of document',
    enum: DocumentType,
  })
  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @ApiProperty({
    example: 'cv_joram_jackson.pdf',
    description: 'Original filename',
  })
  @Column()
  fileName: string;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/documents/uuid.pdf',
    description: 'Document URL',
  })
  @Column()
  fileUrl: string;

  @ApiProperty({
    example: 2048576,
    description: 'File size in bytes',
  })
  @Column({ type: 'integer' })
  fileSize: number;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type',
  })
  @Column()
  mimeType: string;

  @ApiProperty({
    example: 'Updated CV 2025',
    description: 'Description or notes',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Verification status',
    enum: DocumentStatus,
  })
  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @ApiProperty({
    description: 'Verification notes from reviewer',
  })
  @Column({ type: 'text', nullable: true })
  verificationNotes?: string;

  @ApiProperty({
    description: 'ID of user who verified the document',
  })
  @Column({ type: 'uuid', nullable: true })
  verifiedBy?: string;

  @ApiProperty({
    description: 'Date when document was verified',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  verifiedAt?: Date;
}
