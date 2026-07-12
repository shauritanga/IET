import { BadRequestException } from '@nestjs/common';
import { UpgradeService } from './upgrade.service';
import { MembershipClass, UpgradeApplicationStatus } from '../../../common/enums';

describe('UpgradeService', () => {
  const applicationId = '2e28ac76-3327-4a89-9da1-1f37fdfb1c08';
  const adminId = '9b9a424b-9418-4b8a-876c-41d7939f4b31';
  const userId = 'f1258e58-b451-49a7-bfb3-9b05fa5e70ce';

  function createService(overrides: Record<string, any> = {}) {
    const upgradeRuleRepository = {
      findOne: jest.fn(),
      ...overrides.upgradeRuleRepository,
    };

    const manager = {
      findOne: jest.fn(),
      update: jest.fn(),
      save: jest.fn(async (_entity, value) => value),
      ...overrides.manager,
    };

    const upgradeApplicationRepository = {
      manager: {
        transaction: jest.fn((callback) => callback(manager)),
      },
      ...overrides.upgradeApplicationRepository,
    };

    const userRepository = {
      update: jest.fn(),
      ...overrides.userRepository,
    };

    const categoryRepository = {
      findOneBy: jest.fn(),
      ...overrides.categoryRepository,
    };

    const service = new UpgradeService(
      upgradeRuleRepository as any,
      upgradeApplicationRepository as any,
      userRepository as any,
      categoryRepository as any,
      {} as any,
      {} as any,
    );

    return {
      service,
      upgradeRuleRepository,
      upgradeApplicationRepository,
      userRepository,
      categoryRepository,
      manager,
    };
  }

  it('approves an application and updates the member category inside one transaction', async () => {
    const pendingApplication = {
      id: applicationId,
      userId,
      fromCategoryId: '4e6a5968-c778-4413-96db-a86170eed913',
      toCategoryId: 'bd228bb5-aeac-4e84-a0bc-d358400248db',
      status: UpgradeApplicationStatus.PENDING,
      toCategory: {
        id: 'bd228bb5-aeac-4e84-a0bc-d358400248db',
        name: 'Senior Member',
        code: 'SMIET',
        yearlyFee: 75000,
      },
    };

    const { service, upgradeApplicationRepository, manager } = createService({
      manager: {
        findOne: jest.fn().mockResolvedValue(pendingApplication),
      },
    });

    const result = await service.reviewUpgradeApplication(applicationId, adminId, {
      status: UpgradeApplicationStatus.APPROVED,
    });

    expect(upgradeApplicationRepository.manager.transaction).toHaveBeenCalledTimes(1);
    expect(manager.update).toHaveBeenCalledWith(expect.any(Function), userId, {
      membershipCategoryId: pendingApplication.toCategoryId,
      annualMembershipFee: 75000,
      membershipClass: MembershipClass.SENIOR,
    });
    expect(manager.save).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({
      status: UpgradeApplicationStatus.APPROVED,
      reviewedById: adminId,
    }));
    expect(result.status).toBe(UpgradeApplicationStatus.APPROVED);
  });

  it('rejects duplicate upgrade rule paths on update', async () => {
    const source = {
      id: '4e6a5968-c778-4413-96db-a86170eed913',
      isActive: true,
      level: 1,
    };
    const target = {
      id: 'bd228bb5-aeac-4e84-a0bc-d358400248db',
      isActive: true,
      level: 2,
    };
    const ruleId = '2ba91dfd-09e9-4075-a202-1378e14aca0f';
    const duplicateRuleId = '3f0edb09-97bf-40e4-8e18-64d28916106d';

    const { service, categoryRepository } = createService({
      upgradeRuleRepository: {
        findOne: jest
          .fn()
          .mockResolvedValueOnce({
            id: ruleId,
            fromCategoryId: source.id,
            toCategoryId: target.id,
          })
          .mockResolvedValueOnce({ id: duplicateRuleId }),
      },
      categoryRepository: {
        findOneBy: jest.fn(async ({ id }) => {
          if (id === source.id) return source;
          if (id === target.id) return target;
          return null;
        }),
      },
    });

    await expect(
      service.updateUpgradeRule(ruleId, adminId, {
        fromCategoryId: source.id,
        toCategoryId: target.id,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(categoryRepository.findOneBy).toHaveBeenCalledTimes(2);
  });
});
