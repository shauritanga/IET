import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSystemSettings1777690000000 implements MigrationInterface {
    name = 'AddSystemSettings1777690000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "system_settings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "key" character varying NOT NULL,
                "value" text NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"),
                CONSTRAINT "PK_system_settings" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            INSERT INTO "system_settings" ("key", "value") VALUES
            ('membership_fees', '{"GRADUATE":50000,"ASSOCIATE":75000,"MIET":100000,"CORPORATE":150000,"SENIOR":100000,"FELLOW":50000,"HONORARY":0}')
            ON CONFLICT ("key") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_settings"`);
    }
}
