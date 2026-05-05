import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';

@Entity('communication_templates')
@Index(['name'], { unique: true })
@Index(['type'])
export class CommunicationTemplateEntity extends AuditableEntity {
  @ApiProperty({ example: 'Monthly Renewal Reminder' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ example: 'EMAIL' })
  @Column({ type: 'varchar' })
  type: string;

  @ApiProperty({ example: 'Renew your membership', required: false })
  @Column({ type: 'varchar', nullable: true })
  subject?: string | null;

  @ApiProperty({ example: 'Please renew your membership before 10 July.' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
