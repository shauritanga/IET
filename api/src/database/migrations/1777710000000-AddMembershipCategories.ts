import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMembershipCategories1777710000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS membership_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR NOT NULL UNIQUE,
        "yearlyFee" INT NOT NULL,
        "minYearsExperience" INT NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      INSERT INTO membership_categories (name, "yearlyFee", "minYearsExperience", description) VALUES
        ('Graduate Member (GIET)', 30000, 0, 'Has three (3) years after graduation and has 21 years of age. The age limit is 40 years of age.'),
        ('Member (MIET)', 65000, 3, 'Has three (3) years of practical experience and has 25 years of age. Includes Free ID-8 PDUs.'),
        ('Senior Member (SenMIET)', 75000, 8, 'Has eight (8) years of professional experience after having been elected Member and has 33 years of age. Includes Free ID-8 PDUs.'),
        ('Fellow (FIET)', 85000, 10, 'Has ten (10) years as an active member and has had a position of superior responsibility for 5 years in the practice of engineering and has 36 years of age. Includes Free ID-8 PDUs.'),
        ('Affiliate Member (Aff. MIET)', 40000, 3, 'Has successfully completed and passed an approved Technicians Course and has three (3) years of practical experience in the field of engineering.'),
        ('Affiliate Fellow (Aff. FIET)', 40000, 10, 'Has 10 years as an active Affiliate member.'),
        ('Affiliate Graduate (Aff. GIET)', 30000, 0, 'Technician graduate of any engineering discipline.'),
        ('Affiliate Student (Aff. St. IET)', 0, 0, 'Taking a Technician or similar course in any engineering discipline. Fee: Contact respective college Student chapter leaders.'),
        ('Student Member (St. IET)', 0, 0, 'Taking an Engineering course in any engineering discipline. Fee: Contact respective college Student chapter leaders.')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS membership_categories`);
  }
}
