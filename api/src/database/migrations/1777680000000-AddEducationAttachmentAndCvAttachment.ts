import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEducationAttachmentAndCvAttachment1777680000000 implements MigrationInterface {
    name = 'AddEducationAttachmentAndCvAttachment1777680000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registration_educations" ADD "attachmentUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD "supportingDocumentUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD "cvAttachment" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registrations" DROP COLUMN "cvAttachment"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP COLUMN "supportingDocumentUrl"`);
        await queryRunner.query(`ALTER TABLE "registration_educations" DROP COLUMN "attachmentUrl"`);
    }
}
