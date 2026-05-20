import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentFlowImprovements1779271134311 implements MigrationInterface {
    name = 'PaymentFlowImprovements1779271134311'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_registrations" ADD "paymentExpiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."event_registrations_status_enum" RENAME TO "event_registrations_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."event_registrations_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW', 'EXPIRED')`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" TYPE "public"."event_registrations_status_enum" USING "status"::"text"::"public"."event_registrations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."event_registrations_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."guest_registrations_status_enum" RENAME TO "guest_registrations_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."guest_registrations_status_enum" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW', 'EXPIRED')`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" TYPE "public"."guest_registrations_status_enum" USING "status"::"text"::"public"."guest_registrations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."guest_registrations_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`);
        await queryRunner.query(`CREATE TYPE "public"."guest_registrations_status_enum_old" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW')`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" TYPE "public"."guest_registrations_status_enum_old" USING "status"::"text"::"public"."guest_registrations_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "guest_registrations" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."guest_registrations_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."guest_registrations_status_enum_old" RENAME TO "guest_registrations_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."event_registrations_status_enum_old" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW')`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" TYPE "public"."event_registrations_status_enum_old" USING "status"::"text"::"public"."event_registrations_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "event_registrations" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'`);
        await queryRunner.query(`DROP TYPE "public"."event_registrations_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."event_registrations_status_enum_old" RENAME TO "event_registrations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_registrations" DROP COLUMN "paymentExpiresAt"`);
    }

}
