import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipFeeReminderCycle1783707752731
  implements MigrationInterface
{
  name = 'AddMembershipFeeReminderCycle1783707752731';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_fees" ADD COLUMN IF NOT EXISTS "reminderCycleMonth" character varying(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_fees" ADD COLUMN IF NOT EXISTS "reminderCycleStep" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_fees" DROP COLUMN IF EXISTS "reminderCycleStep"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_fees" DROP COLUMN IF EXISTS "reminderCycleMonth"`,
    );
  }
}
