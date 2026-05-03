import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkflowUserRoles1777700000000 implements MigrationInterface {
  name = 'AddWorkflowUserRoles1777700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'SECRETARIAT';
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'EVALUATOR';
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'MPDC';
          ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'COUNCIL';
        END IF;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL enum values cannot be removed safely without recreating the enum.
  }
}
