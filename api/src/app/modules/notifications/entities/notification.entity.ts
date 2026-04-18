import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationType, NotificationChannel } from '../../../common/enums';

@Entity('notifications')
@Index(['userId'])
@Index(['isRead'])
@Index(['type'])
@Index(['createdAt'])
export class NotificationEntity extends BaseEntity {
  @ApiProperty({ description: 'User ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({
    example: 'PAYMENT_REMINDER',
    description: 'Notification type',
    enum: NotificationType,
  })
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({
    example: 'Membership Fee Due Soon',
    description: 'Notification title',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: 'Your 2025 membership fee is due on July 10, 2025',
    description: 'Notification message',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    example: false,
    description: 'Whether notification has been read',
  })
  @Column({ default: false })
  isRead: boolean;

  @ApiProperty({
    description: 'Date when notification was read',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt?: Date;

  @ApiProperty({
    example: '/memberships/fees',
    description: 'Action URL to navigate to',
  })
  @Column({ nullable: true })
  actionUrl?: string;

  @ApiProperty({
    description: 'Additional data/metadata',
  })
  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @ApiProperty({
    description: 'Channels through which notification was sent',
    enum: NotificationChannel,
    isArray: true,
  })
  @Column({ type: 'jsonb', default: [] })
  sentVia: NotificationChannel[];

  @ApiProperty({
    description: 'Date when email was sent',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  emailSentAt?: Date;

  @ApiProperty({
    description: 'Date when SMS was sent',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  smsSentAt?: Date;

  @ApiProperty({
    description: 'Date when push notification was sent',
  })
  @Column({ type: 'timestamp with time zone', nullable: true })
  pushSentAt?: Date;
}
