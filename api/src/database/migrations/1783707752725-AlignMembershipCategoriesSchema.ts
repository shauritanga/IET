import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Older local DBs created membership_categories without code/level/isActive,
 * while the entity and newer InitialSchema expect those columns.
 */
export class AlignMembershipCategoriesSchema1783707752725
  implements MigrationInterface
{
  name = 'AlignMembershipCategoriesSchema1783707752725';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      ADD COLUMN IF NOT EXISTS "code" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      ADD COLUMN IF NOT EXISTS "level" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "membership_categories"
      SET
        "code" = CASE
          WHEN "name" ILIKE '%Affiliate Student%' THEN 'AFF_ST_IET'
          WHEN "name" ILIKE 'Student Member%' THEN 'ST_IET'
          WHEN "name" ILIKE 'Graduate Member%' THEN 'GIET'
          WHEN "name" ILIKE 'Member (MIET)%' OR "name" = 'Member (MIET)' THEN 'MIET'
          WHEN "name" ILIKE 'Senior Member%' THEN 'SENMIET'
          WHEN "name" ILIKE 'Fellow (FIET)%' OR "name" = 'Fellow (FIET)' THEN 'FIET'
          WHEN "name" ILIKE 'Affiliate Graduate%' THEN 'AFF_GIET'
          WHEN "name" ILIKE 'Affiliate Member%' THEN 'AFF_MIET'
          WHEN "name" ILIKE 'Affiliate Fellow%' THEN 'AFF_FIET'
          WHEN "name" ILIKE 'Honorary%' THEN 'HONORARY'
          ELSE UPPER(REPLACE(REPLACE(COALESCE("code", "name"), ' ', '_'), '.', ''))
        END,
        "level" = CASE
          WHEN "name" ILIKE '%Student%' THEN 0
          WHEN "name" ILIKE '%Graduate%' THEN 1
          WHEN "name" ILIKE 'Member (MIET)%' OR "name" = 'Member (MIET)' OR "name" ILIKE 'Affiliate Member%' THEN 2
          WHEN "name" ILIKE 'Senior Member%' THEN 3
          WHEN "name" ILIKE '%Fellow%' THEN 4
          WHEN "name" ILIKE 'Honorary%' THEN 4
          ELSE COALESCE("level", 0)
        END,
        "isActive" = COALESCE("isActive", true)
      WHERE "code" IS NULL OR "code" = ''
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_membership_categories_code'
        ) THEN
          ALTER TABLE "membership_categories"
          ADD CONSTRAINT "UQ_membership_categories_code" UNIQUE ("code");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      DROP CONSTRAINT IF EXISTS "UQ_membership_categories_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      DROP COLUMN IF EXISTS "isActive"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      DROP COLUMN IF EXISTS "level"
    `);
    await queryRunner.query(`
      ALTER TABLE "membership_categories"
      DROP COLUMN IF EXISTS "code"
    `);
  }
}
