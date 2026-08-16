import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntryFeeAndApplicationEntryFeesSetting1783707752728
  implements MigrationInterface
{
  name = 'AddEntryFeeAndApplicationEntryFeesSetting1783707752728';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."payments_paymenttype_enum" ADD VALUE IF NOT EXISTS 'ENTRY_FEE'`,
    );

    await queryRunner.query(`
      INSERT INTO public.system_settings (id, key, value, "createdAt", "updatedAt")
      VALUES (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'application_entry_fees',
        '{"graduate":{"applicationFee":500,"entryFee":0},"others":{"applicationFee":1000,"entryFee":0}}',
        NOW(),
        NOW()
      )
      ON CONFLICT (key) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM public.system_settings WHERE key = 'application_entry_fees'`,
    );
    // PostgreSQL cannot remove a value from an enum safely; leave ENTRY_FEE in place.
  }
}
