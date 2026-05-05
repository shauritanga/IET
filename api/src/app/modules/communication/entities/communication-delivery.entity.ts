import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { CommunicationMessageEntity } from './communication-message.entity';
import { UserEntity } from '../../user/entities/user.entity';

@Entity('communication_deliveries')
@Index(['messageId'])
@Index(['userId'])
@Index(['status'])
export class CommunicationDeliveryEntity extends AuditableEntity {
  @ApiProperty({ description: 'Communication message ID' })
  @Column({ type: 'uuid' })
  messageId: string;

  @ManyToOne(() => CommunicationMessageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: CommunicationMessageEntity;

  @ApiProperty({ description: 'Recipient user ID', required: false })
  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity | null;

  @ApiProperty({ example: '+255712345678', description: 'Recipient contact' })
  @Column({ type: 'varchar' })
  recipient: string;

  @ApiProperty({ example: 'EMAIL', description: 'Delivery channel' })
  @Column({ type: 'varchar' })
  channel: string;

  @ApiProperty({ example: 'SENT', description: 'Delivery status' })
  @Column({ type: 'varchar' })
  status: string;

  @ApiProperty({ example: 'Provider accepted the message', required: false })
  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @ApiProperty({ description: 'Date when delivery attempt finished', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  sentAt?: Date | null;
}
