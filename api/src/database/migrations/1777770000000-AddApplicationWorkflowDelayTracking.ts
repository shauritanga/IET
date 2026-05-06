import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationWorkflowDelayTracking1777770000000
  implements MigrationInterface
{
  name = 'AddApplicationWorkflowDelayTracking1777770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "notifications_type_enum"
      ADD VALUE IF NOT EXISTS 'APPLICATION_DELAY'
    `);

    await queryRunner.query(`
      ALTER TABLE "registrations"
      ADD COLUMN IF NOT EXISTS "workflowDelayNotifiedAt" TIMESTAMPTZ
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registrations"
      DROP COLUMN IF EXISTS "workflowDelayNotifiedAt"
    `);
  }
}
