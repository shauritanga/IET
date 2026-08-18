import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountantRole1783707752734 implements MigrationInterface {
  name = 'AddAccountantRole1783707752734';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" ADD VALUE IF NOT EXISTS 'ACCOUNTANT'`,
    );
  }

  public async down(): Promise<void> {
    // Postgres does not support removing a value from an enum type. Down
    // migrations for this change would require recreating the enum and
    // migrating dependent rows off ACCOUNTANT first; left as a no-op.
  }
}
