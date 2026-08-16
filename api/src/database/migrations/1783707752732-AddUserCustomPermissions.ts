import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserCustomPermissions1783707752732
  implements MigrationInterface
{
  name = 'AddUserCustomPermissions1783707752732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "customPermissions" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "customPermissions"`,
    );
  }
}
