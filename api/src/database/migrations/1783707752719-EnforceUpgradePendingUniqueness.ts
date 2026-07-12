import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUpgradePendingUniqueness1783707752719 implements MigrationInterface {
  name = 'EnforceUpgradePendingUniqueness1783707752719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_upgrade_applications_one_pending_per_user"
      ON "upgrade_applications" ("userId")
      WHERE "status" = 'PENDING' AND "deletedAt" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_upgrade_applications_one_pending_per_user"`);
  }
}
