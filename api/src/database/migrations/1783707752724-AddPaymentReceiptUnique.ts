import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforce receipt-number uniqueness at the database level so two concurrently
 * completing payments can never share a receipt number (the app also retries on
 * conflict). Partial index skips the many NULLs on not-yet-completed payments.
 */
export class AddPaymentReceiptUnique1783707752724
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Null out any pre-existing duplicate receipt numbers (keep the earliest),
    // so the unique index can be created without failing on legacy data.
    await queryRunner.query(`
      UPDATE "payments" p
      SET "receiptNumber" = NULL
      WHERE "receiptNumber" IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM "payments" q
          WHERE q."receiptNumber" = p."receiptNumber"
            AND q."createdAt" < p."createdAt"
        )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_payments_receiptNumber" ON "payments" ("receiptNumber") WHERE "receiptNumber" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_payments_receiptNumber"`);
  }
}
