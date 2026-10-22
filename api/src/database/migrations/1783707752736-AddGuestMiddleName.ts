import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGuestMiddleName1783707752736 implements MigrationInterface {
  name = 'AddGuestMiddleName1783707752736';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "guest_registrations" ADD COLUMN IF NOT EXISTS "middleName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "development_fees" ADD COLUMN IF NOT EXISTS "middleName" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "development_fees" DROP COLUMN IF EXISTS "middleName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guest_registrations" DROP COLUMN IF EXISTS "middleName"`,
    );
  }
}
