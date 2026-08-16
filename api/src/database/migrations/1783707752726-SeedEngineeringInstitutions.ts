import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Previously seeded engineering institutions for local/demo use.
 * Left as a no-op — institutions are managed by admins.
 */
export class SeedEngineeringInstitutions1783707752726
  implements MigrationInterface
{
  name = 'SeedEngineeringInstitutions1783707752726';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally empty — do not seed institutions.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
