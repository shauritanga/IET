import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganisationRelationshipToReference1777662750620 implements MigrationInterface {
    name = 'AddOrganisationRelationshipToReference1777662750620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_references" ADD "organisation" character varying`);
        await queryRunner.query(`ALTER TABLE "registration_references" ADD "relationship" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_references" DROP COLUMN "relationship"`);
        await queryRunner.query(`ALTER TABLE "registration_references" DROP COLUMN "organisation"`);
    }

}
