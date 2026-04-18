import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditableEntity } from '../../../common/entities/base.entity';
import { EventCategory } from '../../../common/enums';
import { EventRegistrationEntity } from './event-registration.entity';

@Entity('events')
@Index(['startDate'])
@Index(['category'])
@Index(['slug'], { unique: true })
export class EventEntity extends AuditableEntity {
  @ApiProperty({
    example: 'Structural Design CPD Workshop',
    description: 'Event title',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: 'structural-design-cpd-workshop-2025',
    description: 'URL-friendly slug',
  })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({
    example: 'Join us for a comprehensive workshop on structural design...',
    description: 'Event description (HTML)',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: 'CPD_COURSE',
    description: 'Event category',
    enum: EventCategory,
  })
  @Column({ type: 'enum', enum: EventCategory })
  category: EventCategory;

  @ApiProperty({
    example: '2025-10-27',
    description: 'Event start date',
  })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({
    example: '2025-10-27',
    description: 'Event end date',
  })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ApiProperty({
    example: '08:00',
    description: 'Start time (HH:MM)',
  })
  @Column()
  startTime: string;

  @ApiProperty({
    example: '15:00',
    description: 'End time (HH:MM)',
  })
  @Column()
  endTime: string;

  @ApiProperty({
    example: 'Karimjee Hall Dar es salaam',
    description: 'Event location',
  })
  @Column({ nullable: true })
  location?: string;

  @ApiProperty({
    example: false,
    description: 'Whether event is online',
  })
  @Column({ default: false })
  isOnline: boolean;

  @ApiProperty({
    example: 'https://zoom.us/j/123456789',
    description: 'Online meeting URL',
  })
  @Column({ nullable: true })
  onlineUrl?: string;

  @ApiProperty({
    example: 'Eng. Emmanuel Ole Kambainei',
    description: 'Guest of honor',
  })
  @Column({ nullable: true })
  guestOfHonor?: string;

  @ApiProperty({
    description: 'List of speakers',
    example: [
      {
        name: 'Eng. John Doe',
        title: 'Senior Engineer',
        bio: '...',
        photo: '...',
      },
    ],
  })
  @Column({ type: 'jsonb', default: [] })
  speakers: Array<{
    name: string;
    title?: string;
    bio?: string;
    photo?: string;
  }>;

  @ApiProperty({
    description: 'Event agenda',
    example: [
      { time: '08:00 - 09:00', title: 'Registration', description: '...' },
    ],
  })
  @Column({ type: 'jsonb', default: [] })
  agenda: Array<{
    time: string;
    title: string;
    description?: string;
  }>;

  @ApiProperty({
    example: 'https://cdn.iet.or.tz/events/uuid.jpg',
    description: 'Cover image URL',
  })
  @Column({ nullable: true })
  coverImage?: string;

  @ApiProperty({
    description: 'Additional event images',
  })
  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @ApiProperty({
    example: '2025-10-20',
    description: 'Registration deadline',
  })
  @Column({ type: 'date', nullable: true })
  registrationDeadline?: Date;

  @ApiProperty({
    example: 50000,
    description: 'Registration fee in TZS (0 for free events)',
  })
  @Column({ type: 'integer', default: 0 })
  registrationFee: number;

  @ApiProperty({
    example: 8,
    description: 'CPD points awarded for attendance',
  })
  @Column({ type: 'integer', default: 0 })
  cpdPoints: number;

  @ApiProperty({
    example: 50,
    description: 'Maximum number of participants (null for unlimited)',
  })
  @Column({ type: 'integer', nullable: true })
  maxParticipants?: number;

  @ApiProperty({
    description: 'Requirements for attendees',
  })
  @Column({ type: 'jsonb', default: [] })
  requirements: string[];

  @ApiProperty({
    description: 'Organizer contact information',
    example: {
      name: 'IET',
      contact: 'info@iet.or.tz',
      phone: '+255 22 211 0000',
    },
  })
  @Column({ type: 'jsonb', default: {} })
  organizer: {
    name?: string;
    contact?: string;
    phone?: string;
  };

  @ApiProperty({
    example: true,
    description: 'Whether event is published',
  })
  @Column({ default: false })
  isPublished: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether event allows registrations',
  })
  @Column({ default: true })
  registrationOpen: boolean;

  @OneToMany(
    () => EventRegistrationEntity,
    (registration) => registration.event,
  )
  registrations: EventRegistrationEntity[];

  // Computed property for registered count (will be set by service)
  registeredCount?: number;
}
