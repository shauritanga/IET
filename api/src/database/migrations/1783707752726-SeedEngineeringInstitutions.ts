import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds commonly used Tanzanian / regional engineering institutions
 * so applicants can select them during education entry.
 */
export class SeedEngineeringInstitutions1783707752726
  implements MigrationInterface
{
  name = 'SeedEngineeringInstitutions1783707752726';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const institutions: Array<{
      name: string;
      country: string;
      institutionType: string;
    }> = [
      {
        name: 'University of Dar es Salaam (UDSM)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Ardhi University (ARU)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'University of Dodoma (UDOM)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Nelson Mandela African Institution of Science and Technology (NM-AIST)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Mbeya University of Science and Technology (MUST)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Sokoine University of Agriculture (SUA)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Muhimbili University of Health and Allied Sciences (MUHAS)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Dar es Salaam Institute of Technology (DIT)',
        country: 'Tanzania',
        institutionType: 'INSTITUTE',
      },
      {
        name: 'Arusha Technical College (ATC)',
        country: 'Tanzania',
        institutionType: 'COLLEGE',
      },
      {
        name: 'National Institute of Transport (NIT)',
        country: 'Tanzania',
        institutionType: 'INSTITUTE',
      },
      {
        name: 'College of Business Education (CBE)',
        country: 'Tanzania',
        institutionType: 'COLLEGE',
      },
      {
        name: 'Institute of Accountancy Arusha (IAA)',
        country: 'Tanzania',
        institutionType: 'INSTITUTE',
      },
      {
        name: 'St. Joseph University in Tanzania (SJUIT)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Kampala International University in Tanzania (KIUT)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Catholic University of Health and Allied Sciences (CUHAS)',
        country: 'Tanzania',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'University of Nairobi',
        country: 'Kenya',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Jomo Kenyatta University of Agriculture and Technology (JKUAT)',
        country: 'Kenya',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'Makerere University',
        country: 'Uganda',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'University of Cape Town',
        country: 'South Africa',
        institutionType: 'UNIVERSITY',
      },
      {
        name: 'University of Pretoria',
        country: 'South Africa',
        institutionType: 'UNIVERSITY',
      },
    ];

    for (const institution of institutions) {
      await queryRunner.query(
        `
          INSERT INTO "engineering_institutions"
            ("name", "country", "institutionType", "recognitionStatus", "isActive")
          VALUES ($1, $2, $3, 'RECOGNIZED', true)
          ON CONFLICT ("name") DO UPDATE
          SET
            "country" = EXCLUDED."country",
            "institutionType" = EXCLUDED."institutionType",
            "recognitionStatus" = 'RECOGNIZED',
            "isActive" = true,
            "updatedAt" = now()
        `,
        [institution.name, institution.country, institution.institutionType],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "engineering_institutions"
      WHERE "name" IN (
        'University of Dar es Salaam (UDSM)',
        'Ardhi University (ARU)',
        'University of Dodoma (UDOM)',
        'Nelson Mandela African Institution of Science and Technology (NM-AIST)',
        'Mbeya University of Science and Technology (MUST)',
        'Sokoine University of Agriculture (SUA)',
        'Muhimbili University of Health and Allied Sciences (MUHAS)',
        'Dar es Salaam Institute of Technology (DIT)',
        'Arusha Technical College (ATC)',
        'National Institute of Transport (NIT)',
        'College of Business Education (CBE)',
        'Institute of Accountancy Arusha (IAA)',
        'St. Joseph University in Tanzania (SJUIT)',
        'Kampala International University in Tanzania (KIUT)',
        'Catholic University of Health and Allied Sciences (CUHAS)',
        'University of Nairobi',
        'Jomo Kenyatta University of Agriculture and Technology (JKUAT)',
        'Makerere University',
        'University of Cape Town',
        'University of Pretoria'
      )
    `);
  }
}
