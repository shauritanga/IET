import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMembershipCards1783707752733 implements MigrationInterface {
  name = 'CreateMembershipCards1783707752733';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."membership_cards_status_enum" AS ENUM('ISSUED', 'READY_FOR_COLLECTION', 'COLLECTED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "membership_cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid NOT NULL,
        "status" "public"."membership_cards_status_enum" NOT NULL DEFAULT 'ISSUED',
        "membershipNumber" character varying(64) NOT NULL,
        "memberName" character varying(200) NOT NULL,
        "membershipCategory" character varying(100) NOT NULL,
        "specialization" character varying(120),
        "photoUrl" character varying,
        "validUntil" date NOT NULL,
        "issuedById" uuid,
        "issuedAt" TIMESTAMP WITH TIME ZONE,
        "readyForCollectionAt" TIMESTAMP WITH TIME ZONE,
        "collectedAt" TIMESTAMP WITH TIME ZONE,
        "collectedById" uuid,
        "notes" text,
        CONSTRAINT "PK_membership_cards" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_membership_cards_userId" UNIQUE ("userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_membership_cards_status" ON "membership_cards" ("status")`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_cards" ADD CONSTRAINT "FK_membership_cards_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "membership_cards" DROP CONSTRAINT "FK_membership_cards_user"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_membership_cards_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "membership_cards"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."membership_cards_status_enum"`,
    );
  }
}
