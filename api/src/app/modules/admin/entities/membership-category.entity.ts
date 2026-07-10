import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('membership_categories')
export class MembershipCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  code?: string | null;

  @Column({ type: 'int', default: 0 })
  level: number;

  @Column({ type: 'int' })
  yearlyFee: number;

  @Column({ type: 'int' })
  minYearsExperience: number;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
