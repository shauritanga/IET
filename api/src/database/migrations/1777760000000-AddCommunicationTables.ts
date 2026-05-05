import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommunicationTables1777760000000 implements MigrationInterface {
  name = 'AddCommunicationTables1777760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS communication_templates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL UNIQUE,
        type VARCHAR NOT NULL,
        subject VARCHAR,
        body TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS communication_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "createdById" UUID,
        type VARCHAR NOT NULL,
        target VARCHAR NOT NULL,
        "groupId" UUID,
        subject VARCHAR,
        message TEXT NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'PENDING',
        "recipientCount" INT NOT NULL DEFAULT 0,
        "successfulCount" INT NOT NULL DEFAULT 0,
        "failedCount" INT NOT NULL DEFAULT 0,
        "sentAt" TIMESTAMPTZ,
        "errorSummary" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_messages_type"
      ON communication_messages (type)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_messages_target"
      ON communication_messages (target)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_messages_status"
      ON communication_messages (status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_messages_groupId"
      ON communication_messages ("groupId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_messages_createdAt"
      ON communication_messages ("createdAt")
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_communication_messages_createdBy'
        ) THEN
          ALTER TABLE communication_messages
          ADD CONSTRAINT "FK_communication_messages_createdBy"
          FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_communication_messages_group'
        ) THEN
          ALTER TABLE communication_messages
          ADD CONSTRAINT "FK_communication_messages_group"
          FOREIGN KEY ("groupId") REFERENCES "membership_categories"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS communication_deliveries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "messageId" UUID NOT NULL,
        "userId" UUID,
        recipient VARCHAR NOT NULL,
        channel VARCHAR NOT NULL,
        status VARCHAR NOT NULL,
        error TEXT,
        "sentAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_deliveries_messageId"
      ON communication_deliveries ("messageId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_deliveries_userId"
      ON communication_deliveries ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_communication_deliveries_status"
      ON communication_deliveries (status)
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_communication_deliveries_message'
        ) THEN
          ALTER TABLE communication_deliveries
          ADD CONSTRAINT "FK_communication_deliveries_message"
          FOREIGN KEY ("messageId") REFERENCES communication_messages("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_communication_deliveries_user'
        ) THEN
          ALTER TABLE communication_deliveries
          ADD CONSTRAINT "FK_communication_deliveries_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS communication_deliveries`);
    await queryRunner.query(`DROP TABLE IF EXISTS communication_messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS communication_templates`);
  }
}
