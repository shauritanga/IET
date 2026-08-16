import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventAgendaPdf1783707752729 implements MigrationInterface {
  name = 'AddEventAgendaPdf1783707752729';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "agendaPdf" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" DROP COLUMN IF EXISTS "agendaPdf"`,
    );
  }
}
