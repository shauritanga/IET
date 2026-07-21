import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Admin-managed engineering discipline tree. Top-level rows are seeded to match
 * the EngineeringDiscipline enum string values exactly so that an application's
 * `engineeringDiscipline` maps to a discipline family by name. Sub-disciplines
 * (e.g. Civil -> Structural/Highways/Water/Geotechnical) are seeded as examples;
 * admins can add/remove more via the admin portal.
 */
export class CreateAndSeedDisciplines1783707752721
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "disciplines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "parentId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_disciplines_name" UNIQUE ("name"), CONSTRAINT "PK_disciplines_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_disciplines_parentId" ON "disciplines" ("parentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "disciplines" ADD CONSTRAINT "FK_disciplines_parentId" FOREIGN KEY ("parentId") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Top-level disciplines — MUST equal the EngineeringDiscipline enum values.
    const topLevel = [
      'Civil',
      'Mechanical',
      'Electrical',
      'Electronics',
      'Chemical',
      'Mining',
      'Agricultural',
      'Environmental',
      'Computer',
      'Telecommunications',
      'Petroleum',
      'Biomedical',
      'Industrial',
      'Marine',
      'Aeronautical',
      'Other',
    ];
    for (const name of topLevel) {
      await queryRunner.query(
        `INSERT INTO "disciplines" ("name", "parentId") VALUES ($1, NULL) ON CONFLICT ("name") DO NOTHING`,
        [name],
      );
    }

    // Example sub-disciplines under Civil.
    const civilChildren = ['Structural', 'Highways', 'Water', 'Geotechnical'];
    for (const name of civilChildren) {
      await queryRunner.query(
        `INSERT INTO "disciplines" ("name", "parentId") SELECT $1, "id" FROM "disciplines" WHERE "name" = 'Civil' ON CONFLICT ("name") DO NOTHING`,
        [name],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "disciplines" DROP CONSTRAINT "FK_disciplines_parentId"`,
    );
    await queryRunner.query(`DROP TABLE "disciplines"`);
  }
}
