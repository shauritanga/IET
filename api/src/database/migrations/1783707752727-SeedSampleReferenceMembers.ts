import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds active IET members so applicants can search/select
 * proposers and supporters during the references step.
 *
 * Password for all sample accounts: Password123!
 */
export class SeedSampleReferenceMembers1783707752727
  implements MigrationInterface
{
  name = 'SeedSampleReferenceMembers1783707752727';

  // bcrypt hash of Password123! (cost 10)
  private readonly passwordHash =
    '$2b$10$V4pSxKU8Mx79Hj.EgMmgHONwciOKfPTzlNc3oYiMY8NS7c4UpbJdy';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const categoryByCode = async (code: string): Promise<string | null> => {
      const rows = await queryRunner.query(
        `SELECT id FROM "membership_categories" WHERE code = $1 LIMIT 1`,
        [code],
      );
      return rows[0]?.id ?? null;
    };

    const fellowCategoryId = await categoryByCode('FIET');
    const honoraryCategoryId = await categoryByCode('HONORARY');
    const memberCategoryId = await categoryByCode('MIET');
    const seniorCategoryId = await categoryByCode('SENMIET');
    const graduateCategoryId = await categoryByCode('GIET');

    const members: Array<{
      email: string;
      title: string;
      firstName: string;
      lastName: string;
      membershipId: string;
      membershipClass: string;
      membershipCategoryId: string | null;
      employer: string;
      phoneNumber: string;
      gender: string;
      position: string;
    }> = [
      {
        email: 'amina.mwakyusa@iet.sample',
        title: 'Eng.',
        firstName: 'Amina',
        lastName: 'Mwakyusa',
        membershipId: 'IET/F/2015/001',
        membershipClass: 'FELLOW',
        membershipCategoryId: fellowCategoryId,
        employer: 'TANESCO',
        phoneNumber: '255712100001',
        gender: 'FEMALE',
        position: 'Chief Engineer',
      },
      {
        email: 'joseph.kimaro@iet.sample',
        title: 'Eng.',
        firstName: 'Joseph',
        lastName: 'Kimaro',
        membershipId: 'IET/C/2016/014',
        membershipClass: 'CORPORATE',
        membershipCategoryId: memberCategoryId,
        employer: 'CRDB Bank Plc',
        phoneNumber: '255712100002',
        gender: 'MALE',
        position: 'Head of Engineering',
      },
      {
        email: 'grace.lyimo@iet.sample',
        title: 'Prof.',
        firstName: 'Grace',
        lastName: 'Lyimo',
        membershipId: 'IET/H/2010/003',
        membershipClass: 'HONORARY',
        membershipCategoryId: honoraryCategoryId,
        employer: 'University of Dar es Salaam',
        phoneNumber: '255712100003',
        gender: 'FEMALE',
        position: 'Professor of Civil Engineering',
      },
      {
        email: 'baraka.nchimbi@iet.sample',
        title: 'Eng.',
        firstName: 'Baraka',
        lastName: 'Nchimbi',
        membershipId: 'IET/M/2019/112',
        membershipClass: 'MIET',
        membershipCategoryId: memberCategoryId,
        employer: 'Wami Engineers Ltd',
        phoneNumber: '255712100004',
        gender: 'MALE',
        position: 'Project Engineer',
      },
      {
        email: 'fatma.hassan@iet.sample',
        title: 'Eng.',
        firstName: 'Fatma',
        lastName: 'Hassan',
        membershipId: 'IET/S/2017/088',
        membershipClass: 'SENIOR',
        membershipCategoryId: seniorCategoryId,
        employer: 'Ministry of Works',
        phoneNumber: '255712100005',
        gender: 'FEMALE',
        position: 'Senior Civil Engineer',
      },
      {
        email: 'david.mushi@iet.sample',
        title: 'Eng.',
        firstName: 'David',
        lastName: 'Mushi',
        membershipId: 'IET/M/2020/205',
        membershipClass: 'MIET',
        membershipCategoryId: memberCategoryId,
        employer: 'Geita Gold Mining Ltd',
        phoneNumber: '255712100006',
        gender: 'MALE',
        position: 'Mining Engineer',
      },
      {
        email: 'neema.juma@iet.sample',
        title: 'Eng.',
        firstName: 'Neema',
        lastName: 'Juma',
        membershipId: 'IET/F/2018/022',
        membershipClass: 'FELLOW',
        membershipCategoryId: fellowCategoryId,
        employer: 'EWURA',
        phoneNumber: '255712100007',
        gender: 'FEMALE',
        position: 'Director of Technical Services',
      },
      {
        email: 'peter.mganga@iet.sample',
        title: 'Eng.',
        firstName: 'Peter',
        lastName: 'Mganga',
        membershipId: 'IET/G/2022/041',
        membershipClass: 'GRADUATE',
        membershipCategoryId: graduateCategoryId,
        employer: 'Dar Rapid Transit Agency',
        phoneNumber: '255712100008',
        gender: 'MALE',
        position: 'Graduate Engineer',
      },
    ];

    for (const member of members) {
      await queryRunner.query(
        `
          INSERT INTO "users" (
            email,
            password,
            "emailVerified",
            title,
            "firstName",
            "lastName",
            gender,
            "phoneNumber",
            employer,
            position,
            "membershipId",
            "membershipClass",
            "membershipCategoryId",
            "membershipStatus",
            role,
            "isActive",
            "joiningDate",
            "membershipExpiryDate"
          )
          VALUES (
            $1, $2, true, $3, $4, $5, $6::users_gender_enum, $7, $8, $9,
            $10, $11::users_membershipclass_enum, $12,
            'ACTIVE'::users_membershipstatus_enum,
            'MEMBER'::users_role_enum,
            true,
            '2018-01-15',
            '2027-12-31'
          )
          ON CONFLICT (email) DO UPDATE SET
            password = EXCLUDED.password,
            "emailVerified" = true,
            title = EXCLUDED.title,
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            gender = EXCLUDED.gender,
            "phoneNumber" = EXCLUDED."phoneNumber",
            employer = EXCLUDED.employer,
            position = EXCLUDED.position,
            "membershipId" = EXCLUDED."membershipId",
            "membershipClass" = EXCLUDED."membershipClass",
            "membershipCategoryId" = EXCLUDED."membershipCategoryId",
            "membershipStatus" = 'ACTIVE'::users_membershipstatus_enum,
            role = 'MEMBER'::users_role_enum,
            "isActive" = true,
            "joiningDate" = EXCLUDED."joiningDate",
            "membershipExpiryDate" = EXCLUDED."membershipExpiryDate",
            "updatedAt" = now(),
            "deletedAt" = NULL
        `,
        [
          member.email,
          this.passwordHash,
          member.title,
          member.firstName,
          member.lastName,
          member.gender,
          member.phoneNumber,
          member.employer,
          member.position,
          member.membershipId,
          member.membershipClass,
          member.membershipCategoryId,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "users"
      WHERE email LIKE '%@iet.sample'
    `);
  }
}
