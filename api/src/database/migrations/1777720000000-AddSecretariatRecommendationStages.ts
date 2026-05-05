import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecretariatRecommendationStages1777720000000 implements MigrationInterface {
  name = 'AddSecretariatRecommendationStages1777720000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const enumTypes = [
      'registrations_reviewstage_enum',
      'application_stage_history_fromstage_enum',
      'application_stage_history_tostage_enum',
    ];
    const stages = [
      'SECRETARIAT_EVALUATOR_RECOMMENDATION',
      'SECRETARIAT_MPDC_RECOMMENDATION',
      'SECRETARIAT_COUNCIL_RECOMMENDATION',
    ];

    for (const enumType of enumTypes) {
      for (const stage of stages) {
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumType}') THEN
              ALTER TYPE "${enumType}" ADD VALUE IF NOT EXISTS '${stage}';
            END IF;
          END
          $$;
        `);
      }
    }
  }

  public async down(): Promise<void> {
    // PostgreSQL enum values cannot be safely removed while existing rows may use them.
  }
}
