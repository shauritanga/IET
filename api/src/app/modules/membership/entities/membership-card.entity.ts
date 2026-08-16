import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCardStatus } from '../../../common/enums';

@Entity('membership_cards')
@Index(['userId'], { unique: true })
@Index(['status'])
export class MembershipCardEntity extends BaseEntity {
  @ApiProperty({ description: 'Member user ID' })
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ApiProperty({ enum: MembershipCardStatus })
  @Column({
    type: 'enum',
    enum: MembershipCardStatus,
    default: MembershipCardStatus.ISSUED,
  })
  status: MembershipCardStatus;

  @ApiProperty({ description: 'Snapshot of membership number at issue time' })
  @Column({ type: 'varchar', length: 64 })
  membershipNumber: string;

  @ApiProperty({ description: 'Snapshot of full name at issue time' })
  @Column({ type: 'varchar', length: 200 })
  memberName: string;

  @ApiProperty({ description: 'Snapshot of membership category label' })
  @Column({ type: 'varchar', length: 100 })
  membershipCategory: string;

  @ApiProperty({ description: 'Snapshot of specialization / discipline' })
  @Column({ type: 'varchar', length: 120, nullable: true })
  specialization?: string | null;

  @ApiProperty({ description: 'Photo URL used on the card' })
  @Column({ type: 'varchar', nullable: true })
  photoUrl?: string | null;

  @ApiProperty({ description: 'Card validity end date' })
  @Column({ type: 'date' })
  validUntil: Date;

  @ApiProperty({ description: 'Admin who issued the card' })
  @Column({ type: 'uuid', nullable: true })
  issuedById?: string | null;

  @ApiProperty()
  @Column({ type: 'timestamp with time zone', nullable: true })
  issuedAt?: Date | null;

  @ApiProperty()
  @Column({ type: 'timestamp with time zone', nullable: true })
  readyForCollectionAt?: Date | null;

  @ApiProperty()
  @Column({ type: 'timestamp with time zone', nullable: true })
  collectedAt?: Date | null;

  @ApiProperty({ description: 'Admin who marked the card as collected' })
  @Column({ type: 'uuid', nullable: true })
  collectedById?: string | null;

  @ApiProperty({ description: 'Optional notes from secretariat' })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
