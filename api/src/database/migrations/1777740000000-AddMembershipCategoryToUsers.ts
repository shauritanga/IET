import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipCategoryToUsers1777740000000
  implements MigrationInterface
{
  name = 'AddMembershipCategoryToUsers1777740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "membershipCategoryId" uuid
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_membershipCategoryId"
      ON "users" ("membershipCategoryId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_users_membership_category'
        ) THEN
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_users_membership_category"
          FOREIGN KEY ("membershipCategoryId") REFERENCES "membership_categories"("id")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP CONSTRAINT IF EXISTS "FK_users_membership_category"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_membershipCategoryId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "membershipCategoryId"
    `);
  }
}
