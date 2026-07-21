import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Join table linking panel-member users (evaluator/MPDC/council) to disciplines.
 */
export class CreateUserDisciplines1783707752722 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_disciplines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "disciplineId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_user_disciplines_user_discipline" UNIQUE ("userId", "disciplineId"), CONSTRAINT "PK_user_disciplines_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_disciplines_userId" ON "user_disciplines" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_disciplines_disciplineId" ON "user_disciplines" ("disciplineId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_disciplines" ADD CONSTRAINT "FK_user_disciplines_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_disciplines" ADD CONSTRAINT "FK_user_disciplines_disciplineId" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_disciplines"`);
  }
}
