import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEngineeringInstitutions1777730000000
  implements MigrationInterface
{
  name = 'AddEngineeringInstitutions1777730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "engineering_institutions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "country" character varying NOT NULL DEFAULT 'Tanzania',
        "institutionType" character varying NOT NULL DEFAULT 'UNIVERSITY',
        "recognitionStatus" character varying NOT NULL DEFAULT 'RECOGNIZED',
        "isActive" boolean NOT NULL DEFAULT true,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_engineering_institutions_name" UNIQUE ("name"),
        CONSTRAINT "PK_engineering_institutions" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "registration_educations"
      ADD COLUMN IF NOT EXISTS "institutionId" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_registration_educations_institution'
        ) THEN
          ALTER TABLE "registration_educations"
          ADD CONSTRAINT "FK_registration_educations_institution"
          FOREIGN KEY ("institutionId") REFERENCES "engineering_institutions"("id")
          ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "registration_educations"
      DROP CONSTRAINT IF EXISTS "FK_registration_educations_institution"
    `);
    await queryRunner.query(`
      ALTER TABLE "registration_educations"
      DROP COLUMN IF EXISTS "institutionId"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "engineering_institutions"`);
  }
}
