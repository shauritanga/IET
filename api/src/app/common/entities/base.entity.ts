import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

/**
 * Base entity with common fields for all entities
 * Includes UUID primary key, timestamps, and soft delete support
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-27T10:00:00Z',
  })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-01-27T10:00:00Z',
  })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  deletedAt?: Date;
}

/**
 * Base entity with audit fields (createdBy, updatedBy)
 */
export abstract class AuditableEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  @ApiProperty({
    description: 'ID of user who created this record',
    required: false,
  })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @ApiProperty({
    description: 'ID of user who last updated this record',
    required: false,
  })
  updatedBy?: string;
}
