import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Previously seeded demo members for local reference-step testing.
 * Left as a no-op so production fresh installs only get countries +
 * the bootstrap admin user (plus required membership category config).
 */
export class SeedSampleReferenceMembers1783707752727
  implements MigrationInterface
{
  name = 'SeedSampleReferenceMembers1783707752727';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally empty — do not seed sample members.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
