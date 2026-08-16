import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventFeePricingMode1783707752730 implements MigrationInterface {
  name = 'AddEventFeePricingMode1783707752730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."events_feepricingmode_enum" AS ENUM('FLAT', 'DIFFERENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "feePricingMode" "public"."events_feepricingmode_enum" NOT NULL DEFAULT 'FLAT'`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "memberRegistrationFee" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP COLUMN IF EXISTS "memberRegistrationFee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP COLUMN IF EXISTS "feePricingMode"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."events_feepricingmode_enum"`,
    );
  }
}
