import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Link table tagging a panel-member user (evaluator/MPDC/council) with one or
 * more admin-managed disciplines. Kept as a thin join table (rather than a jsonb
 * array on the user) so evaluators can be queried by discipline family when an
 * application is forwarded to the evaluator stage.
 */
@Entity('user_disciplines')
@Unique(['userId', 'disciplineId'])
export class UserDisciplineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  disciplineId: string;

  @CreateDateColumn()
  createdAt: Date;
}
