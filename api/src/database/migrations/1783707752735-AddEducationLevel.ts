import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEducationLevel1783707752735 implements MigrationInterface {
  name = 'AddEducationLevel1783707752735';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registration_educations" ADD COLUMN IF NOT EXISTS "educationLevel" character varying(32)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registration_educations" DROP COLUMN IF EXISTS "educationLevel"`,
    );
  }
}
