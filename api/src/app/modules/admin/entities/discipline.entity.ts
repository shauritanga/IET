import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Admin-managed engineering discipline. Disciplines form a shallow tree: a
 * top-level discipline (e.g. Civil) has `parentId = null`; sub-disciplines
 * (e.g. Structural, Highways, Water, Geotechnical) point at their parent.
 *
 * Top-level names are seeded to exactly match the `EngineeringDiscipline` enum
 * string values so an application's `engineeringDiscipline` can be mapped to a
 * discipline family by name for evaluator routing.
 */
@Entity('disciplines')
export class DisciplineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
