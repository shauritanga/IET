import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMembershipCategoryId1777750000000
  implements MigrationInterface
{
  name = 'BackfillMembershipCategoryId1777750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = (
        SELECT id
        FROM "membership_categories"
        WHERE name = 'Graduate Member (GIET)'
        LIMIT 1
      )
      WHERE "membershipClass" = 'GRADUATE'
        AND "membershipCategoryId" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = (
        SELECT id
        FROM "membership_categories"
        WHERE name = 'Affiliate Member (Aff. MIET)'
        LIMIT 1
      )
      WHERE "membershipClass" = 'ASSOCIATE'
        AND "membershipCategoryId" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = (
        SELECT id
        FROM "membership_categories"
        WHERE name = 'Member (MIET)'
        LIMIT 1
      )
      WHERE "membershipClass" = 'MIET'
        AND "membershipCategoryId" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = (
        SELECT id
        FROM "membership_categories"
        WHERE name = 'Senior Member (SenMIET)'
        LIMIT 1
      )
      WHERE "membershipClass" = 'SENIOR'
        AND "membershipCategoryId" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = (
        SELECT id
        FROM "membership_categories"
        WHERE name = 'Fellow (FIET)'
        LIMIT 1
      )
      WHERE "membershipClass" = 'FELLOW'
        AND "membershipCategoryId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "membershipCategoryId" = NULL
      WHERE "membershipCategoryId" IN (
        SELECT id
        FROM "membership_categories"
        WHERE name IN (
          'Graduate Member (GIET)',
          'Affiliate Member (Aff. MIET)',
          'Member (MIET)',
          'Senior Member (SenMIET)',
          'Fellow (FIET)'
        )
      )
    `);
  }
}
