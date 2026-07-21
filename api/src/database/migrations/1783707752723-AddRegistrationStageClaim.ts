import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a generic per-stage claim marker to registrations so that, at any review
 * stage (evaluator/MPDC/council), the first panel member to claim locks the
 * application and only they can act. Backfills in-flight evaluator-stage
 * applications so their existing assigned evaluator is treated as the claimer.
 */
export class AddRegistrationStageClaim1783707752723
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD COLUMN "stageClaimedById" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD COLUMN "stageClaimedAt" TIMESTAMP WITH TIME ZONE`,
    );

    // Backfill: existing evaluator-stage applications keep their assigned
    // evaluator as the claimer so they remain visible/actionable under the new
    // claim-based queue scoping.
    await queryRunner.query(
      `UPDATE "registrations" SET "stageClaimedById" = "assignedEvaluatorId", "stageClaimedAt" = COALESCE("assignedAt", now()) WHERE "reviewStage" = 'EVALUATOR_REVIEW' AND "assignedEvaluatorId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP COLUMN "stageClaimedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registrations" DROP COLUMN "stageClaimedById"`,
    );
  }
}
