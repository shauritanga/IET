import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UpgradeRuleEntity } from '../entities/upgrade-rule.entity';
import { UpgradeApplicationEntity } from '../entities/upgrade-application.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';
import { EventRegistrationEntity } from '../../events/entities/event-registration.entity';
import { RegistrationEntity } from '../../registration/entities/registration.entity';
import {
  ApplicationStatus,
  DocumentStatus,
  EventRegistrationStatus,
  MembershipClass,
  MembershipStatus,
  UpgradeApplicationStatus,
} from '../../../common/enums';
import {
  SubmitUpgradeApplicationDto,
  ReviewUpgradeApplicationDto,
  UpgradeApplicationQueryDto,
  CreateUpgradeRuleDto,
  UpdateUpgradeRuleDto,
} from '../dto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EligibilityResult = {
  canUpgrade: boolean;
  eligibleCategories: Array<{
    id: string;
    name: string;
    description: string | null;
    level: number;
    yearlyFee: number;
    minYearsExperience: number;
    minCpdPoints: number;
    requiredDocuments: string[];
    ruleId: string;
  }>;
  missingRequirements: string[];
  currentCategory?: {
    id: string;
    name: string;
    code?: string | null;
    level: number;
  };
  checks: {
    yearsOfExperience: number;
    cpdPoints: number;
    hasPendingApplication: boolean;
    membershipStatus?: MembershipStatus;
    registrationStatus?: ApplicationStatus | null;
    documents: Array<{ type: string; present: boolean; verified: boolean }>;
  };
};

@Injectable()
export class UpgradeService {
  private readonly logger = new Logger(UpgradeService.name);

  constructor(
    @InjectRepository(UpgradeRuleEntity)
    private upgradeRuleRepository: Repository<UpgradeRuleEntity>,
    @InjectRepository(UpgradeApplicationEntity)
    private upgradeApplicationRepository: Repository<UpgradeApplicationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MembershipCategoryEntity)
    private categoryRepository: Repository<MembershipCategoryEntity>,
    @InjectRepository(EventRegistrationEntity)
    private eventRegistrationRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
  ) {}

  // ============================================================
  // CORE ELIGIBILITY CHECK (used in multiple places)
  // ============================================================

  async getEligibleUpgradeCategories(
    userId: string,
    options: { ignoreApplicationId?: string } = {},
  ): Promise<EligibilityResult> {
    // 1. Load engineer profile
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membershipCategory'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const missingRequirements: string[] = [];
    const emptyChecks = {
      yearsOfExperience: 0,
      cpdPoints: 0,
      hasPendingApplication: false,
      membershipStatus: user.membershipStatus,
      registrationStatus: null,
      documents: [],
    };

    // 2. Engineer must have an active membership
    if (!user.membershipCategoryId) {
      return {
        canUpgrade: false,
        eligibleCategories: [],
        missingRequirements: ['You must be a registered member before you can upgrade.'],
        checks: emptyChecks,
      };
    }

    // 3. Check membership status
    if (user.membershipStatus !== MembershipStatus.ACTIVE) {
      return {
        canUpgrade: false,
        eligibleCategories: [],
        missingRequirements: [
          `Your membership status is "${user.membershipStatus}". An active membership is required to apply for an upgrade.`,
        ],
        currentCategory: this.serializeCategory(user.membershipCategory),
        checks: emptyChecks,
      };
    }

    if (!user.membershipId) {
      return {
        canUpgrade: false,
        eligibleCategories: [],
        missingRequirements: ['You must have an issued membership number before you can apply for an upgrade.'],
        currentCategory: this.serializeCategory(user.membershipCategory),
        checks: emptyChecks,
      };
    }

    if (user.membershipCategory && !user.membershipCategory.isActive) {
      return {
        canUpgrade: false,
        eligibleCategories: [],
        missingRequirements: ['Your current membership category is not active for upgrades.'],
        currentCategory: this.serializeCategory(user.membershipCategory),
        checks: emptyChecks,
      };
    }

    // 4. Get all active upgrade rules for this member's current category
    const rules = await this.upgradeRuleRepository.find({
      where: {
        fromCategoryId: user.membershipCategoryId,
        isActive: true,
      },
      relations: ['toCategory'],
    });

    const activeRules = rules.filter((rule) => rule.toCategory?.isActive !== false);

    if (activeRules.length === 0) {
      return {
        canUpgrade: false,
        eligibleCategories: [],
        missingRequirements: ['There are no upgrade paths available for your current membership category.'],
        currentCategory: this.serializeCategory(user.membershipCategory),
        checks: emptyChecks,
      };
    }

    // 5. Check for existing PENDING upgrade application
    const pendingApplications = await this.upgradeApplicationRepository.find({
      where: {
        userId,
        status: UpgradeApplicationStatus.PENDING,
      },
    });
    const pendingApplication = pendingApplications.find(
      (application) => application.id !== options.ignoreApplicationId,
    );

    // 6. Resolve dynamic eligibility inputs.
    const [latestRegistration, cpdPoints] = await Promise.all([
      this.getLatestApprovedRegistration(userId),
      this.getCompletedCpdPoints(userId),
    ]);
    const yearsOfExperience = this.resolveYearsOfExperience(user, latestRegistration);
    const availableDocuments = this.getAvailableDocumentStatuses(latestRegistration);
    const checks = {
      yearsOfExperience,
      cpdPoints,
      hasPendingApplication: Boolean(pendingApplication),
      membershipStatus: user.membershipStatus,
      registrationStatus: latestRegistration?.status ?? null,
      documents: [] as Array<{ type: string; present: boolean; verified: boolean }>,
    };

    // 7. Evaluate each rule
    const eligibleCategories: EligibilityResult['eligibleCategories'] = [];

    for (const rule of activeRules) {
      const ruleReasons: string[] = [];

      // Check pending application
      if (rule.requiresNoPendingApplication && pendingApplication) {
        ruleReasons.push(
          `You already have a pending upgrade application (to "${pendingApplication.toCategoryId}"). Please wait for it to be reviewed before submitting a new one.`,
        );
      }

      // Check active membership (redundant but explicit per rule)
      if (rule.requiresActiveMembership && user.membershipStatus !== MembershipStatus.ACTIVE) {
        ruleReasons.push('An active membership status is required for this upgrade path.');
      }

      // Check minimum years of experience
      if (rule.minYearsExperience > 0 && yearsOfExperience < rule.minYearsExperience) {
        ruleReasons.push(
          `A minimum of ${rule.minYearsExperience} year(s) of professional experience is required. You currently have ${yearsOfExperience} year(s).`,
        );
      }

      // CPD points are stored as 0 = not checked; future integration point
      if (rule.minCpdPoints > 0) {
        if (cpdPoints < rule.minCpdPoints) {
          ruleReasons.push(
            `A minimum of ${rule.minCpdPoints} CPD point(s) is required. You currently have ${cpdPoints} CPD point(s).`,
          );
        }
      }

      for (const documentType of rule.requiredDocuments ?? []) {
        const normalizedType = documentType.toUpperCase();
        const documentStatus = availableDocuments.get(normalizedType);
        checks.documents.push({
          type: normalizedType,
          present: Boolean(documentStatus),
          verified: documentStatus === DocumentStatus.VERIFIED,
        });
        if (!documentStatus) {
          ruleReasons.push(`Required document missing: ${normalizedType}.`);
        } else if (
          documentStatus !== DocumentStatus.VERIFIED &&
          documentStatus !== DocumentStatus.PENDING
        ) {
          ruleReasons.push(`Required document is not acceptable: ${normalizedType}.`);
        }
      }

      if (
        user.membershipCategory?.level != null &&
        rule.toCategory?.level != null &&
        rule.toCategory.level <= user.membershipCategory.level
      ) {
        ruleReasons.push(
          `The target category "${rule.toCategory.name}" is not a higher membership level than your current category.`,
        );
      }

      if (ruleReasons.length === 0) {
        // This rule is fully satisfied — category is eligible
        eligibleCategories.push({
          id: rule.toCategory.id,
          name: rule.toCategory.name,
          description: rule.toCategory.description,
          level: rule.toCategory.level,
          yearlyFee: rule.toCategory.yearlyFee,
          minYearsExperience: rule.toCategory.minYearsExperience,
          minCpdPoints: rule.minCpdPoints,
          requiredDocuments: rule.requiredDocuments ?? [],
          ruleId: rule.id,
        });
      } else {
        // Collect unique missing requirements across all rules
        for (const reason of ruleReasons) {
          if (!missingRequirements.includes(reason)) {
            missingRequirements.push(reason);
          }
        }
      }
    }

    return {
      canUpgrade: eligibleCategories.length > 0,
      eligibleCategories,
      missingRequirements: eligibleCategories.length > 0 ? [] : missingRequirements,
      currentCategory: this.serializeCategory(user.membershipCategory),
      checks: {
        ...checks,
        documents: this.dedupeDocumentChecks(checks.documents),
      },
    };
  }

  // ============================================================
  // MEMBER ENDPOINTS
  // ============================================================

  /**
   * Submit a new upgrade application — re-validates eligibility on the backend.
   */
  async submitUpgradeApplication(
    userId: string,
    dto: SubmitUpgradeApplicationDto,
  ): Promise<UpgradeApplicationEntity> {
    // Re-check eligibility (security: never trust frontend alone)
    const eligibility = await this.getEligibleUpgradeCategories(userId);

    if (!eligibility.canUpgrade) {
      throw new ForbiddenException(
        `You are not eligible to upgrade your membership. Reasons: ${eligibility.missingRequirements.join(' | ')}`,
      );
    }

    // Confirm toCategoryId is in eligible categories (prevents arbitrary category selection)
    const selectedCategory = eligibility.eligibleCategories.find(
      (cat) => cat.id === dto.toCategoryId,
    );

    if (!selectedCategory) {
      throw new ForbiddenException(
        'The selected membership category is not an eligible upgrade target for your profile.',
      );
    }

    // Load user to get current category
    const user = await this.userRepository.findOneOrFail({ where: { id: userId } });
    const rule = await this.upgradeRuleRepository.findOne({
      where: { id: selectedCategory.ruleId },
      relations: ['toCategory'],
    });

    if (!rule) {
      throw new BadRequestException('The selected upgrade rule is no longer available.');
    }

    // Create the application
    const application = this.upgradeApplicationRepository.create({
      userId,
      fromCategoryId: user.membershipCategoryId!,
      toCategoryId: dto.toCategoryId,
      applicantNotes: dto.applicantNotes,
      status: rule.requiresApproval
        ? UpgradeApplicationStatus.PENDING
        : UpgradeApplicationStatus.APPROVED,
      submittedAt: new Date(),
      reviewedAt: rule.requiresApproval ? undefined : new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    try {
      return await this.upgradeApplicationRepository.manager.transaction(async (manager) => {
        const savedApplication = await manager.save(UpgradeApplicationEntity, application);

        if (!rule.requiresApproval) {
          const membershipClass = this.resolveMembershipClassFromCategory(rule.toCategory);
          await manager.update(UserEntity, userId, {
            membershipCategoryId: dto.toCategoryId,
            annualMembershipFee: rule.toCategory?.yearlyFee,
            ...(membershipClass ? { membershipClass } : {}),
          });
        }

        return savedApplication;
      });
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new BadRequestException(
          'You already have a pending upgrade application. Please wait for it to be reviewed before submitting a new one.',
        );
      }
      throw error;
    }
  }

  /**
   * Get all upgrade applications for the logged-in member.
   */
  async getMyUpgradeApplications(userId: string): Promise<UpgradeApplicationEntity[]> {
    return this.upgradeApplicationRepository.find({
      where: { userId },
      relations: ['fromCategory', 'toCategory'],
      order: { submittedAt: 'DESC' },
    });
  }

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  /**
   * List all upgrade applications with filters (admin).
   */
  async listUpgradeApplications(query: UpgradeApplicationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.upgradeApplicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.fromCategory', 'fromCategory')
      .leftJoinAndSelect('app.toCategory', 'toCategory')
      .leftJoinAndSelect('app.reviewedBy', 'reviewer')
      .orderBy('app.submittedAt', 'DESC');

    if (query.status) {
      qb.andWhere('app.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single upgrade application by ID (admin).
   */
  async getUpgradeApplicationById(applicationId: string): Promise<UpgradeApplicationEntity> {
    const app = await this.upgradeApplicationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'fromCategory', 'toCategory', 'reviewedBy'],
    });

    if (!app) {
      throw new NotFoundException('Upgrade application not found.');
    }

    return app;
  }

  async getUpgradeApplicationDetails(applicationId: string) {
    const app = await this.getUpgradeApplicationById(applicationId);
    const eligibility = await this.getEligibleUpgradeCategories(app.userId, {
      ignoreApplicationId: app.id,
    });
    return {
      ...app,
      eligibility,
    };
  }

  /**
   * Admin reviews (approves or rejects) an upgrade application.
   * On approval, the member's current category is updated.
   */
  async reviewUpgradeApplication(
    applicationId: string,
    adminId: string,
    dto: ReviewUpgradeApplicationDto,
  ): Promise<UpgradeApplicationEntity> {
    if (
      dto.status !== UpgradeApplicationStatus.APPROVED &&
      dto.status !== UpgradeApplicationStatus.REJECTED
    ) {
      throw new BadRequestException('Review status must be APPROVED or REJECTED.');
    }

    if (dto.status === UpgradeApplicationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A rejection reason is required when rejecting an application.');
    }

    const reviewedApplication = await this.upgradeApplicationRepository.manager.transaction(async (manager) => {
      const app = await manager.findOne(UpgradeApplicationEntity, {
        where: { id: applicationId },
        relations: ['user', 'fromCategory', 'toCategory', 'reviewedBy'],
      });

      if (!app) {
        throw new NotFoundException('Upgrade application not found.');
      }

      if (app.status !== UpgradeApplicationStatus.PENDING) {
        throw new BadRequestException(
          `This application has already been ${app.status.toLowerCase()} and cannot be reviewed again.`,
        );
      }

      app.status = dto.status;
      app.reviewedById = adminId;
      app.reviewedAt = new Date();
      app.updatedBy = adminId;

      if (dto.status === UpgradeApplicationStatus.REJECTED) {
        app.rejectionReason = dto.rejectionReason;
      } else {
        app.rejectionReason = undefined;
        const membershipClass = this.resolveMembershipClassFromCategory(app.toCategory);
        await manager.update(UserEntity, app.userId, {
          membershipCategoryId: app.toCategoryId,
          annualMembershipFee: app.toCategory?.yearlyFee,
          ...(membershipClass ? { membershipClass } : {}),
        });
      }

      return manager.save(UpgradeApplicationEntity, app);
    });

    if (reviewedApplication.status === UpgradeApplicationStatus.APPROVED) {
      this.logger.log(
        `Upgrade approved: User ${reviewedApplication.userId} upgraded from category ${reviewedApplication.fromCategoryId} → ${reviewedApplication.toCategoryId}`,
      );
    }

    return reviewedApplication;
  }

  // ============================================================
  // UPGRADE RULES MANAGEMENT (Admin)
  // ============================================================

  async listUpgradeRules(): Promise<UpgradeRuleEntity[]> {
    return this.upgradeRuleRepository.find({
      relations: ['fromCategory', 'toCategory'],
      order: { createdAt: 'DESC' },
    });
  }

  async createUpgradeRule(
    adminId: string,
    dto: CreateUpgradeRuleDto,
  ): Promise<UpgradeRuleEntity> {
    // Validate categories exist and are usable.
    const fromCategory = await this.assertCategoryExists(dto.fromCategoryId, 'Source');
    const toCategory = await this.assertCategoryExists(dto.toCategoryId, 'Target');

    if (dto.fromCategoryId === dto.toCategoryId) {
      throw new BadRequestException('Source and target categories cannot be the same.');
    }

    if (!fromCategory.isActive || !toCategory.isActive) {
      throw new BadRequestException('Upgrade rules can only use active membership categories.');
    }

    if (toCategory.level <= fromCategory.level) {
      throw new BadRequestException('Target category must be a higher level than the source category.');
    }

    const existing = await this.upgradeRuleRepository.findOne({
      where: {
        fromCategoryId: dto.fromCategoryId,
        toCategoryId: dto.toCategoryId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'An upgrade rule for this source → target path already exists.',
      );
    }

    const rule = this.upgradeRuleRepository.create({
      ...dto,
      minYearsExperience: dto.minYearsExperience ?? 0,
      minCpdPoints: dto.minCpdPoints ?? 0,
      requiresActiveMembership: dto.requiresActiveMembership ?? true,
      requiresNoPendingApplication: dto.requiresNoPendingApplication ?? true,
      requiredDocuments: dto.requiredDocuments ?? [],
      requiresApproval: dto.requiresApproval ?? true,
      isActive: dto.isActive ?? true,
      createdBy: adminId,
      updatedBy: adminId,
    });

    return this.upgradeRuleRepository.save(rule);
  }

  async updateUpgradeRule(
    ruleId: string,
    adminId: string,
    dto: UpdateUpgradeRuleDto,
  ): Promise<UpgradeRuleEntity> {
    const rule = await this.upgradeRuleRepository.findOne({
      where: { id: ruleId },
      relations: ['fromCategory', 'toCategory'],
    });
    if (!rule) throw new NotFoundException('Upgrade rule not found.');

    const nextFromCategoryId = dto.fromCategoryId ?? rule.fromCategoryId;
    const nextToCategoryId = dto.toCategoryId ?? rule.toCategoryId;

    const fromCategory = await this.assertCategoryExists(nextFromCategoryId, 'Source');
    const toCategory = await this.assertCategoryExists(nextToCategoryId, 'Target');

    this.validateUpgradeRulePath(fromCategory, toCategory);

    const existing = await this.upgradeRuleRepository.findOne({
      where: {
        fromCategoryId: nextFromCategoryId,
        toCategoryId: nextToCategoryId,
      },
    });

    if (existing && existing.id !== ruleId) {
      throw new BadRequestException(
        'An upgrade rule for this source → target path already exists.',
      );
    }

    Object.assign(rule, { ...dto, updatedBy: adminId });
    return this.upgradeRuleRepository.save(rule);
  }

  async deleteUpgradeRule(ruleId: string): Promise<void> {
    const rule = await this.upgradeRuleRepository.findOne({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Upgrade rule not found.');
    await this.upgradeRuleRepository.softDelete(ruleId);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private calculateYearsFromDate(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  }

  private serializeCategory(category?: MembershipCategoryEntity | null) {
    if (!category) return undefined;
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      level: category.level,
    };
  }

  private async getLatestApprovedRegistration(userId: string) {
    return this.registrationRepository.findOne({
      where: { userId, status: ApplicationStatus.APPROVED },
      relations: ['documents', 'experiences', 'educations'],
      order: { reviewedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  private async getCompletedCpdPoints(userId: string): Promise<number> {
    const result = await this.eventRegistrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.event', 'event')
      .select('COALESCE(SUM(event.cpdPoints), 0)', 'total')
      .where('registration.userId = :userId', { userId })
      .andWhere('(registration.status = :attended OR registration.attendedAt IS NOT NULL)', {
        attended: EventRegistrationStatus.ATTENDED,
      })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private resolveYearsOfExperience(
    user: UserEntity,
    registration?: RegistrationEntity | null,
  ): number {
    const experienceYears = registration?.experiences?.reduce((total, experience) => {
      const start = experience.startDate ? new Date(experience.startDate) : null;
      const end = experience.endDate ? new Date(experience.endDate) : new Date();
      if (!start || Number.isNaN(start.getTime())) return total;
      return total + Math.max(0, end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    }, 0);

    if (experienceYears && experienceYears > 0) {
      return Math.floor(experienceYears);
    }

    return user.joiningDate ? this.calculateYearsFromDate(new Date(user.joiningDate)) : 0;
  }

  private getAvailableDocumentStatuses(registration?: RegistrationEntity | null) {
    const documents = new Map<string, DocumentStatus>();

    for (const document of registration?.documents ?? []) {
      const key = String(document.documentType).toUpperCase();
      const current = documents.get(key);
      if (current === DocumentStatus.VERIFIED) continue;
      documents.set(key, document.status);
    }

    if (registration?.cvAttachment && !documents.has('CV')) {
      documents.set('CV', DocumentStatus.PENDING);
    }

    if (registration?.supportingDocumentUrl && !documents.has('STATUTORY_BOARD')) {
      documents.set('STATUTORY_BOARD', DocumentStatus.PENDING);
    }

    for (const education of registration?.educations ?? []) {
      if (education.attachmentUrl && !documents.has('CERTIFICATE')) {
        documents.set('CERTIFICATE', DocumentStatus.PENDING);
      }
    }

    return documents;
  }

  private dedupeDocumentChecks(
    checks: Array<{ type: string; present: boolean; verified: boolean }>,
  ) {
    const byType = new Map<string, { type: string; present: boolean; verified: boolean }>();
    for (const check of checks) {
      const current = byType.get(check.type);
      byType.set(check.type, {
        type: check.type,
        present: Boolean(current?.present || check.present),
        verified: Boolean(current?.verified || check.verified),
      });
    }
    return Array.from(byType.values());
  }

  private async assertCategoryExists(
    id: string,
    label: string,
  ): Promise<MembershipCategoryEntity> {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`${label} membership category with ID "${id}" not found.`);
    }
    return category;
  }

  private validateUpgradeRulePath(
    fromCategory: MembershipCategoryEntity,
    toCategory: MembershipCategoryEntity,
  ): void {
    if (fromCategory.id === toCategory.id) {
      throw new BadRequestException('Source and target categories cannot be the same.');
    }

    if (!fromCategory.isActive || !toCategory.isActive) {
      throw new BadRequestException('Upgrade rules can only use active membership categories.');
    }

    if (toCategory.level <= fromCategory.level) {
      throw new BadRequestException('Target category must be a higher level than the source category.');
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as QueryFailedError & { code?: string }).code === '23505';
  }

  private resolveMembershipClassFromCategory(
    category?: MembershipCategoryEntity | null,
  ): MembershipClass | undefined {
    const normalized = `${category?.code ?? ''} ${category?.name ?? ''}`.trim().toUpperCase();
    if (!normalized) return undefined;

    if (normalized.includes('HONORARY')) return MembershipClass.HONORARY;
    if (normalized.includes('FELLOW') || normalized.includes('FIET')) return MembershipClass.FELLOW;
    if (normalized.includes('SENIOR') || normalized.includes('SENMIET') || normalized.includes('SMIET')) {
      return MembershipClass.SENIOR;
    }
    if (normalized.includes('CORPORATE') || normalized.includes('CMIET')) return MembershipClass.CORPORATE;
    if (normalized.includes('ASSOCIATE') || normalized.includes('AMIET')) return MembershipClass.ASSOCIATE;
    if (normalized.includes('GRADUATE') || normalized.includes('GIET')) return MembershipClass.GRADUATE;
    if (normalized === 'MEMBER' || normalized.includes('MIET') || normalized.includes('MEMBER')) {
      return MembershipClass.MEMBER;
    }

    return undefined;
  }
}
