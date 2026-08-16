import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds system settings only. Membership categories and upgrade rules
 * are managed by admins (not seeded).
 */
export class SeedReferenceData1783707752718 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO public.system_settings (id, key, value, "createdAt", "updatedAt") VALUES ('943c5d09-34c8-443a-aa9e-fee60fea414f', 'membership_fees', '{"GRADUATE":50000,"ASSOCIATE":75000,"MIET":100000,"CORPORATE":150000,"SENIOR":100000,"FELLOW":50000,"HONORARY":0}', '2026-07-10 18:10:26.540432+00', '2026-07-10 18:10:26.540432+00')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "system_settings" WHERE key = 'membership_fees'`);
  }
}
