import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { UserEntity } from '../../user/entities/user.entity';
import {
  RegistrationEntity,
  ApplicationStageHistoryEntity,
} from '../../registration/entities';
import { MembershipFeeEntity } from '../../membership/entities/membership-fee.entity';
import { EventEntity, EventRegistrationEntity } from '../../events/entities';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { SystemSettingEntity } from '../entities/system-setting.entity';
import { MembershipCategoryEntity } from '../entities/membership-category.entity';
import { UserService } from '../../user/services/user.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import {
  MemberQueryDto,
  ApplicationQueryDto,
  UpdateApplicationStageDto,
  UpdateMemberStatusDto,
  AnalyticsQueryDto,
  CreateMemberDto,
  AdminUserQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  FiscalYearSettingsDto,
  MembershipCategoryQueryDto,
  CreateMembershipCategoryDto,
  UpdateMembershipCategoryDto,
  RenewMemberDto,
} from '../dto';
import {
  MembershipStatus,
  MembershipClass,
  EngineeringDiscipline,
  Gender,
  ApplicationStatus,
  ApplicationReviewStage,
  PaymentStatus,
  FeeStatus,
  UserRole,
} from '../../../common/enums';

type LegacyMemberImportResult = {
  created: number;
  updated: number;
  skipped: number;
  feesCreated: number;
  feesUpdated: number;
  errors: Array<{
    row: number;
    membershipId?: string;
    email?: string;
    reason: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    value: string;
    reason: string;
  }>;
};

type LegacyMemberImportRow = {
  rowNumber: number;
  values: Record<string, string>;
};

const PORTAL_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.SECRETARIAT,
  UserRole.EVALUATOR,
  UserRole.MPDC,
  UserRole.COUNCIL,
  UserRole.REVIEWER,
] as const;

const FISCAL_YEAR_SETTING_KEY = 'membership_fiscal_year';
const DEFAULT_FISCAL_YEAR_SETTINGS: FiscalYearSettingsDto = {
  startMonth: 7,
  startDay: 11,
  endMonth: 7,
  endDay: 10,
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(ApplicationStageHistoryEntity)
    private stageHistoryRepository: Repository<ApplicationStageHistoryEntity>,
    @InjectRepository(MembershipFeeEntity)
    private feeRepository: Repository<MembershipFeeEntity>,
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(EventRegistrationEntity)
    private eventRegistrationRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(SystemSettingEntity)
    private settingRepository: Repository<SystemSettingEntity>,
    @InjectRepository(MembershipCategoryEntity)
    private membershipCategoryRepository: Repository<MembershipCategoryEntity>,
    private userService: UserService,
    private notificationsService: NotificationsService,
  ) {}

  private assertSuperAdmin(user: Pick<UserEntity, 'role'>): void {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can manage portal users');
    }
  }

  private assertPortalRole(role: UserRole): void {
    if (!PORTAL_ROLES.includes(role as (typeof PORTAL_ROLES)[number])) {
      throw new BadRequestException('Role is not allowed for admin portal users');
    }
  }

  private toAdminUserSummary(user: UserEntity) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      profilePhotoUrl: user.profilePhotoUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listAdminUsers(
    actor: UserEntity,
    query: AdminUserQueryDto,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    this.assertSuperAdmin(actor);

    const { page = 1, limit = 20, role, isActive, search } = query;
    const pageSize = Math.min(limit, 100);
    const skip = (page - 1) * pageSize;
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: PORTAL_ROLES });

    if (role) {
      this.assertPortalRole(role);
      qb.andWhere('user.role = :role', { role });
    }
    if (typeof isActive === 'boolean') {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }
    if (search) {
      qb.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: users.map((user) => this.toAdminUserSummary(user)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createAdminUser(actor: UserEntity, dto: CreateAdminUserDto) {
    this.assertSuperAdmin(actor);
    this.assertPortalRole(dto.role);

    const existing = await this.userRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      role: dto.role,
      isActive: dto.isActive ?? true,
      emailVerified: true,
      enable2FA: false,
      membershipStatus: MembershipStatus.PENDING,
      failedLoginAttempts: 0,
      emailPreferences: {},
      smsPreferences: {},
      pushPreferences: {},
      password: await bcrypt.hash(dto.password, 10),
    });

    const saved = await this.userRepository.save(user);
    return this.toAdminUserSummary(saved);
  }

  async listEvaluators() {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [UserRole.EVALUATOR, UserRole.REVIEWER],
      })
      .andWhere('user.isActive = true')
      .orderBy('user.firstName', 'ASC')
      .addOrderBy('user.email', 'ASC')
      .getMany();

    return users.map((user) => this.toAdminUserSummary(user));
  }

  async updateAdminUser(
    actor: UserEntity,
    userId: string,
    dto: UpdateAdminUserDto,
  ) {
    this.assertSuperAdmin(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    if (actor.id === userId) {
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
      if (dto.role && dto.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('You cannot remove your own super admin role');
      }
    }

    if (dto.role) {
      this.assertPortalRole(dto.role);
      user.role = dto.role;
    }
    if (typeof dto.isActive === 'boolean') user.isActive = dto.isActive;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;

    const saved = await this.userRepository.save(user);
    return this.toAdminUserSummary(saved);
  }

  async getAdminUser(actor: UserEntity, userId: string) {
    this.assertSuperAdmin(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    return this.toAdminUserSummary(user);
  }

  async deleteAdminUser(actor: UserEntity, userId: string): Promise<void> {
    this.assertSuperAdmin(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    if (user.id === actor.id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Super admin accounts cannot be deleted');
    }

    await this.userRepository.remove(user);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    members: {
      total: number;
      active: number;
      expired: number;
      newThisMonth: number;
    };
    applications: {
      pending: number;
      approved: number;
      rejected: number;
      totalThisYear: number;
    };
    payments: {
      totalRevenue: number;
      thisMonth: number;
      pending: number;
      currency: string;
    };
    events: {
      upcoming: number;
      totalRegistrations: number;
      avgAttendance: number;
    };
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Member stats
    const totalMembers = await this.userRepository.count();
    const activeMembers = await this.userRepository.count({
      where: { membershipStatus: MembershipStatus.ACTIVE },
    });
    const expiredMembers = await this.userRepository.count({
      where: { membershipStatus: MembershipStatus.EXPIRED },
    });
    const newThisMonth = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :startOfMonth', { startOfMonth })
      .getCount();

    // Application stats
    const pendingApplications = await this.registrationRepository.count({
      where: {
        status: In([ApplicationStatus.IN_REVIEW]),
      },
    });
    const approvedApplications = await this.registrationRepository.count({
      where: { status: ApplicationStatus.APPROVED },
    });
    const rejectedApplications = await this.registrationRepository.count({
      where: { status: ApplicationStatus.REJECTED },
    });
    const totalApplicationsThisYear = await this.registrationRepository
      .createQueryBuilder('reg')
      .where('reg.createdAt >= :startOfYear', { startOfYear })
      .getCount();

    // Payment stats
    const totalRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();
    const thisMonthRevenueResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .andWhere('payment.completedAt >= :startOfMonth', { startOfMonth })
      .getRawOne();
    const pendingPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .getRawOne();

    // Event stats
    const upcomingEvents = await this.eventRepository.count({
      where: { isPublished: true },
    });
    const totalEventRegistrations =
      await this.eventRegistrationRepository.count();

    return {
      members: {
        total: totalMembers,
        active: activeMembers,
        expired: expiredMembers,
        newThisMonth,
      },
      applications: {
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        totalThisYear: totalApplicationsThisYear,
      },
      payments: {
        totalRevenue: parseInt(totalRevenueResult?.total || '0'),
        thisMonth: parseInt(thisMonthRevenueResult?.total || '0'),
        pending: parseInt(pendingPayments?.total || '0'),
        currency: 'TZS',
      },
      events: {
        upcoming: upcomingEvents,
        totalRegistrations: totalEventRegistrations,
        avgAttendance: 85.5, // TODO: Calculate actual average
      },
    };
  }

  /**
   * List all members with filtering
   */
  async listMembers(query: MemberQueryDto): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      membershipClass,
      search,
      discipline,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (status) {
      queryBuilder.andWhere('user.membershipStatus = :status', { status });
    }
    if (membershipClass) {
      queryBuilder.andWhere('user.membershipClass = :membershipClass', {
        membershipClass,
      });
    }
    if (discipline) {
      queryBuilder.andWhere('user.engineeringDiscipline = :discipline', {
        discipline,
      });
    }
    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.membershipId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get last payment dates
    const userIds = users.map((u) => u.id);
    const lastPayments = await this.feeRepository
      .createQueryBuilder('fee')
      .select('fee.userId', 'userId')
      .addSelect('MAX(fee.paidAt)', 'lastPaymentDate')
      .where('fee.userId IN (:...userIds)', {
        userIds: userIds.length > 0 ? userIds : [''],
      })
      .andWhere('fee.status = :status', { status: FeeStatus.PAID })
      .groupBy('fee.userId')
      .getRawMany();

    const paymentMap = new Map(
      lastPayments.map((p) => [p.userId, p.lastPaymentDate]),
    );

    const items = users.map((user) => ({
      id: user.id,
      membershipId: user.membershipId,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhotoUrl: user.profilePhotoUrl,
      membershipClass: user.membershipClass,
      membershipStatus: user.membershipStatus,
      status: user.membershipStatus,
      engineeringDiscipline: user.engineeringDiscipline,
      employer: user.employer,
      joiningDate: user.joiningDate,
      expiryDate: user.membershipExpiryDate,
      lastPaymentDate: paymentMap.get(user.id) || null,
    }));

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create a single member account (admin-initiated)
   */
  async createMember(dto: CreateMemberDto): Promise<UserEntity> {
    return this.userService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      engineeringDiscipline: dto.engineeringDiscipline as any,
    });
  }

  /**
   * Get member details (admin view with full info)
   */
  async getMemberDetails(memberId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: memberId },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    // Get registration
    const registration = await this.registrationRepository.findOne({
      where: { userId: memberId },
      relations: ['educations', 'experiences', 'documents', 'references'],
      order: { createdAt: 'DESC' },
    });

    // Get payment history
    const payments = await this.paymentRepository.find({
      where: { userId: memberId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Get fee history
    const fees = await this.feeRepository.find({
      where: { userId: memberId },
      order: { year: 'DESC' },
      take: 5,
    });

    // Get event participation
    const eventRegistrations = await this.eventRegistrationRepository.find({
      where: { userId: memberId },
      relations: ['event'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      id: user.id,
      membershipId: user.membershipId,
      personalDetails: {
        title: user.title,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality,
        employer: user.employer,
        position: user.position,
        location: user.location,
        profilePhotoUrl: user.profilePhotoUrl,
      },
      membershipDetails: {
        membershipClass: user.membershipClass,
        status: user.membershipStatus,
        engineeringDiscipline: user.engineeringDiscipline,
        joiningDate: user.joiningDate,
        expiryDate: user.membershipExpiryDate,
        annualFee: user.annualMembershipFee,
      },
      registration: registration
        ? {
            referenceNumber: registration.referenceNumber,
            status: registration.status,
            submittedAt: registration.submittedAt,
            educations: registration.educations,
            experiences: registration.experiences,
            documents: registration.documents,
            references: registration.references,
          }
        : null,
      paymentHistory: payments,
      feeHistory: fees,
      eventParticipation: eventRegistrations.map((r) => ({
        eventId: r.event.id,
        eventTitle: r.event.title,
        eventDate: r.event.startDate,
        status: r.status,
        attendedAt: r.attendedAt,
      })),
      accountInfo: {
        emailVerified: user.emailVerified,
        enable2FA: user.enable2FA,
        isActive: user.isActive,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * List applications for review
   */
  async listApplications(actor: UserEntity, query: ApplicationQueryDto): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status, reviewStage } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.registrationRepository
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.user', 'user');

    if (status) {
      queryBuilder.andWhere('reg.status = :status', { status });
    } else {
      // Default to pending applications
      queryBuilder.andWhere('reg.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.IN_REVIEW,
        ],
      });
    }
    if (reviewStage) {
      queryBuilder.andWhere('reg.reviewStage = :reviewStage', { reviewStage });
    }
    this.applyApplicationRoleScope(queryBuilder, actor);

    const [registrations, total] = await queryBuilder
      .orderBy('reg.submittedAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items = registrations.map((reg) => ({
      id: reg.id,
      referenceNumber: reg.referenceNumber,
      applicantName: reg.user.fullName,
      email: reg.user.email,
      appliedMembershipClass: reg.appliedMembershipClass,
      engineeringDiscipline: reg.engineeringDiscipline,
      status: reg.status,
      reviewStage: reg.reviewStage,
      queueOwnerRole: this.getQueueOwnerRole(reg.reviewStage),
      assignedEvaluatorId: reg.assignedEvaluatorId,
      stageUpdatedAt: reg.stageUpdatedAt,
      submittedAt: reg.submittedAt,
      createdAt: reg.createdAt,
    }));

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Review an application
   */
  async getApplicationDetails(actor: UserEntity, applicationId: string): Promise<any> {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId },
      relations: ['user', 'educations', 'experiences', 'documents', 'references', 'stageHistory'],
      order: {
        stageHistory: {
          createdAt: 'ASC',
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Application not found');
    }
    this.assertCanViewApplication(actor, registration);

    return {
      id: registration.id,
      referenceNumber: registration.referenceNumber,
      status: registration.status,
      reviewStage: registration.reviewStage,
      queueOwnerRole: this.getQueueOwnerRole(registration.reviewStage),
      assignedEvaluatorId: registration.assignedEvaluatorId,
      assignedAt: registration.assignedAt,
      submittedAt: registration.submittedAt,
      stageUpdatedAt: registration.stageUpdatedAt,
      councilApprovedAt: registration.councilApprovedAt,
      approvalNoticeSentAt: registration.approvalNoticeSentAt,
      applicant: {
        id: registration.user.id,
        fullName: registration.user.fullName,
        email: registration.user.email,
        phoneNumber: registration.user.phoneNumber,
      },
      appliedMembershipClass: registration.appliedMembershipClass,
      engineeringDiscipline: registration.engineeringDiscipline,
      reviewComments: registration.reviewComments,
      rejectionReason: registration.rejectionReason,
      educations: registration.educations,
      experiences: registration.experiences,
      documents: registration.documents,
      references: registration.references,
      stageHistory: registration.stageHistory,
    };
  }

  async updateApplicationStage(
    applicationId: string,
    actor: UserEntity,
    dto: UpdateApplicationStageDto,
  ): Promise<{
    applicationId: string;
    status: ApplicationStatus;
    reviewStage?: ApplicationReviewStage;
    reviewedBy?: string;
    reviewedAt?: Date;
    membershipId?: string;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId },
      relations: ['user'],
    });

    if (!registration) {
      throw new NotFoundException('Application not found');
    }

    if (registration.status !== ApplicationStatus.IN_REVIEW) {
      throw new BadRequestException(
        'Application cannot be updated in its current state',
      );
    }

    const currentStage = registration.reviewStage;
    if (!currentStage) {
      throw new BadRequestException('Application is missing a review stage');
    }

    this.assertAllowedStageAction(currentStage, dto.action);
    this.assertCanPerformStageAction(actor, registration, dto.action);

    let newStatus: ApplicationStatus = registration.status;
    let newStage: ApplicationReviewStage = currentStage;
    let membershipId: string | undefined;
    const now = new Date();

    switch (dto.action) {
      case 'ASSIGN_EVALUATOR':
        if (currentStage !== ApplicationReviewStage.SECRETARIAT_REVIEW) {
          throw new BadRequestException(
            'Evaluators can only be assigned during secretariat review',
          );
        }
        if (!dto.evaluatorId) {
          throw new BadRequestException(
            'Evaluator ID is required when assigning an evaluator',
          );
        }
        await this.assertAssignableEvaluator(dto.evaluatorId);
        newStage = ApplicationReviewStage.EVALUATOR_REVIEW;
        registration.reviewStage = newStage;
        registration.assignedEvaluatorId = dto.evaluatorId;
        registration.assignedAt = now;
        registration.reviewComments = dto.comments;
        registration.stageUpdatedAt = now;
        registration.updatedBy = actor.id;
        await this.registrationRepository.save(registration);
        await this.recordStageHistory(registration, {
          fromStage: currentStage,
          toStage: newStage,
          action: 'ASSIGNED',
          actedByUserId: actor.id,
          comments: dto.comments,
          assignedEvaluatorId: dto.evaluatorId,
        });
        break;
      case 'ADVANCE_TO_MPDC':
        newStage = ApplicationReviewStage.MPDC_REVIEW;
        registration.reviewComments = dto.comments;
        registration.stageUpdatedAt = now;
        registration.reviewStage = newStage;
        registration.updatedBy = actor.id;
        await this.registrationRepository.save(registration);
        await this.recordStageHistory(registration, {
          fromStage: currentStage,
          toStage: newStage,
          action: 'ADVANCED',
          actedByUserId: actor.id,
          comments: dto.comments,
        });
        break;
      case 'ADVANCE_TO_COUNCIL':
        newStage = ApplicationReviewStage.COUNCIL_REVIEW;
        registration.reviewComments = dto.comments;
        registration.stageUpdatedAt = now;
        registration.reviewStage = newStage;
        registration.updatedBy = actor.id;
        await this.registrationRepository.save(registration);
        await this.recordStageHistory(registration, {
          fromStage: currentStage,
          toStage: newStage,
          action: 'ADVANCED',
          actedByUserId: actor.id,
          comments: dto.comments,
        });
        break;
      case 'APPROVE':
        if (!dto.membershipClass) {
          throw new BadRequestException(
            'Membership class is required for approval',
          );
        }
        newStatus = ApplicationStatus.APPROVED;
        newStage = ApplicationReviewStage.APPROVAL_NOTICE_SENT;

        // Generate and assign membership ID
        membershipId = await this.userService.assignMembershipId(
          registration.userId,
        );

        // Update user membership details
        await this.userRepository.update(
          { id: registration.userId },
          {
            membershipClass: dto.membershipClass,
            membershipStatus: MembershipStatus.ACTIVE,
            joiningDate: new Date(),
            membershipExpiryDate: await this.getUpcomingFiscalYearEndDate(),
          },
        );
        registration.councilApprovedAt = now;
        registration.approvalNoticeSentAt = now;
        registration.reviewComments = dto.comments;
        registration.reviewStage = newStage;
        registration.stageUpdatedAt = now;
        break;

      case 'REJECT':
        newStatus = ApplicationStatus.REJECTED;
        registration.rejectionReason = dto.comments;
        break;

      case 'RETURN_FOR_CHANGES':
        newStatus = ApplicationStatus.CHANGES_REQUESTED;
        break;

      default:
        throw new BadRequestException('Invalid action');
    }

    registration.status = newStatus;
    registration.reviewStage = newStage;
    registration.reviewedBy = actor.id;
    registration.reviewedAt = now;
    registration.reviewComments = dto.comments;
    registration.updatedBy = actor.id;
    registration.stageUpdatedAt = now;

    await this.registrationRepository.save(registration);

    this.logger.log(
      `Application ${applicationId} action ${dto.action} processed by admin ${actor.id}`,
    );

    if (dto.action === 'APPROVE') {
      await this.recordStageHistory(registration, {
        fromStage: currentStage,
        toStage: ApplicationReviewStage.COUNCIL_REVIEW,
        action: 'APPROVED_BY_COUNCIL',
        actedByUserId: actor.id,
        comments: dto.comments,
      });
      await this.recordStageHistory(registration, {
        fromStage: ApplicationReviewStage.COUNCIL_REVIEW,
        toStage: ApplicationReviewStage.APPROVAL_NOTICE_SENT,
        action: 'NOTICE_SENT',
        actedByUserId: actor.id,
        comments: dto.comments,
      });
      await this.notificationsService.sendApplicationStatusNotification(
        registration.userId,
        'APPROVED',
        {
          membershipId,
          membershipClass: dto.membershipClass,
        },
      );
    } else if (dto.action === 'REJECT') {
      await this.recordStageHistory(registration, {
        fromStage: currentStage,
        toStage: currentStage,
        action: 'REJECTED',
        actedByUserId: actor.id,
        comments: dto.comments,
      });
      await this.notificationsService.sendApplicationStatusNotification(
        registration.userId,
        'REJECTED',
        {
          reason: dto.comments,
        },
      );
    } else if (dto.action === 'RETURN_FOR_CHANGES') {
      await this.recordStageHistory(registration, {
        fromStage: currentStage,
        toStage: currentStage,
        action: 'RETURNED_FOR_CHANGES',
        actedByUserId: actor.id,
        comments: dto.comments,
      });
      await this.notificationsService.sendApplicationStatusNotification(
        registration.userId,
        'CHANGES_REQUESTED',
        {
          reason: dto.comments,
        },
      );
    }

    return {
      applicationId: registration.id,
      status: newStatus,
      reviewStage: registration.reviewStage,
      reviewedBy: actor.id,
      reviewedAt: registration.reviewedAt,
      membershipId,
    };
  }

  /**
   * Update member status
   */
  async updateMemberStatus(
    memberId: string,
    adminId: string,
    dto: UpdateMemberStatusDto,
  ): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: memberId });
    if (!user) {
      throw new NotFoundException('Member not found');
    }

    user.membershipStatus = dto.status;
    await this.userRepository.save(user);

    this.logger.log(
      `Member ${memberId} status updated to ${dto.status} by admin ${adminId}`,
    );

    // TODO: Send notification and log activity
  }

  async renewMember(
    memberId: string,
    adminId: string,
    dto: RenewMemberDto,
  ): Promise<{
    memberId: string;
    feeId: string;
    status: MembershipStatus;
    expiryDate: Date;
  }> {
    const user = await this.userRepository.findOneBy({ id: memberId });
    if (!user) {
      throw new NotFoundException('Member not found');
    }

    if (!user.membershipClass) {
      throw new BadRequestException('Member does not have a membership class');
    }

    let fee = await this.feeRepository.findOne({
      where: { userId: memberId, year: dto.year },
    });
    const expiryDate = await this.getFiscalYearEndDate(dto.year);

    if (!fee) {
      fee = this.feeRepository.create({
        userId: memberId,
        year: dto.year,
        membershipClass: user.membershipClass,
        currency: 'TZS',
        remindersSent: 0,
      });
    }

    fee.membershipClass = user.membershipClass;
    fee.amount = dto.amount;
    fee.status = FeeStatus.PAID;
    fee.dueDate = expiryDate;
    fee.paidAt = new Date();
    fee.notes = `Renewed by admin ${adminId}`;
    fee = await this.feeRepository.save(fee);

    user.membershipStatus = MembershipStatus.ACTIVE;
    user.membershipExpiryDate = expiryDate;
    user.annualMembershipFee = dto.amount;
    user.isActive = true;
    await this.userRepository.save(user);

    this.logger.log(
      `Member ${memberId} renewed for ${dto.year} by admin ${adminId}`,
    );

    return {
      memberId,
      feeId: fee.id,
      status: user.membershipStatus,
      expiryDate,
    };
  }

  async deleteMember(memberId: string, adminId: string): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: memberId });
    if (!user) {
      throw new NotFoundException('Member not found');
    }

    user.isActive = false;
    user.membershipStatus = MembershipStatus.REVOKED;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(memberId);

    this.logger.log(`Member ${memberId} soft deleted by admin ${adminId}`);
  }

  /**
   * Get member analytics
   */
  async getMemberAnalytics(_query: AnalyticsQueryDto): Promise<{
    newMembers: Array<{ period: string; count: number }>;
    membersByDiscipline: Array<{ discipline: string; count: number }>;
    membershipClassDistribution: Array<{ class: string; count: number }>;
  }> {
    // Members by discipline
    const membersByDiscipline = await this.userRepository
      .createQueryBuilder('user')
      .select('user.engineeringDiscipline', 'discipline')
      .addSelect('COUNT(*)', 'count')
      .where('user.engineeringDiscipline IS NOT NULL')
      .groupBy('user.engineeringDiscipline')
      .getRawMany();

    // Membership class distribution
    const classDistribution = await this.userRepository
      .createQueryBuilder('user')
      .select('user.membershipClass', 'class')
      .addSelect('COUNT(*)', 'count')
      .where('user.membershipClass IS NOT NULL')
      .groupBy('user.membershipClass')
      .getRawMany();

    // New members over time
    const newMembers = await this.userRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(user.createdAt, 'YYYY-MM')", 'period')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM')")
      .orderBy('period', 'ASC')
      .limit(12)
      .getRawMany();

    return {
      newMembers: newMembers.map((n) => ({
        period: n.period,
        count: parseInt(n.count),
      })),
      membersByDiscipline: membersByDiscipline.map((m) => ({
        discipline: m.discipline,
        count: parseInt(m.count),
      })),
      membershipClassDistribution: classDistribution.map((c) => ({
        class: c.class,
        count: parseInt(c.count),
      })),
    };
  }

  /**
   * Export members to CSV
   */
  async exportMembers(query: MemberQueryDto): Promise<string> {
    const { items } = await this.listMembers({ ...query, limit: 10000 });

    const headers = [
      'Membership ID',
      'Full Name',
      'Email',
      'Phone',
      'Membership Class',
      'Status',
      'Discipline',
      'Employer',
      'Joining Date',
      'Expiry Date',
    ];
    const rows = items.map((m) => [
      m.membershipId || '',
      m.fullName || '',
      m.email || '',
      m.phoneNumber || '',
      m.membershipClass || '',
      m.status || '',
      m.engineeringDiscipline || '',
      m.employer || '',
      m.joiningDate ? new Date(m.joiningDate).toLocaleDateString() : '',
      m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  private isFullWorkflowAdmin(role?: UserRole | string | null): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private applyApplicationRoleScope(queryBuilder: any, actor: UserEntity): void {
    if (this.isFullWorkflowAdmin(actor.role)) return;

    switch (actor.role) {
      case UserRole.SECRETARIAT:
        queryBuilder.andWhere('reg.reviewStage = :actorStage', {
          actorStage: ApplicationReviewStage.SECRETARIAT_REVIEW,
        });
        break;
      case UserRole.EVALUATOR:
      case UserRole.REVIEWER:
        queryBuilder
          .andWhere('reg.reviewStage = :actorStage', {
            actorStage: ApplicationReviewStage.EVALUATOR_REVIEW,
          })
          .andWhere('reg.assignedEvaluatorId = :actorId', {
            actorId: actor.id,
          });
        break;
      case UserRole.MPDC:
        queryBuilder.andWhere('reg.reviewStage = :actorStage', {
          actorStage: ApplicationReviewStage.MPDC_REVIEW,
        });
        break;
      case UserRole.COUNCIL:
        queryBuilder.andWhere('reg.reviewStage = :actorStage', {
          actorStage: ApplicationReviewStage.COUNCIL_REVIEW,
        });
        break;
      default:
        queryBuilder.andWhere('1 = 0');
    }
  }

  private assertCanViewApplication(
    actor: UserEntity,
    registration: RegistrationEntity,
  ): void {
    if (this.isFullWorkflowAdmin(actor.role)) return;

    const stage = registration.reviewStage;
    const allowed =
      (actor.role === UserRole.SECRETARIAT &&
        stage === ApplicationReviewStage.SECRETARIAT_REVIEW) ||
      ((actor.role === UserRole.EVALUATOR || actor.role === UserRole.REVIEWER) &&
        stage === ApplicationReviewStage.EVALUATOR_REVIEW &&
        registration.assignedEvaluatorId === actor.id) ||
      (actor.role === UserRole.MPDC &&
        stage === ApplicationReviewStage.MPDC_REVIEW) ||
      (actor.role === UserRole.COUNCIL &&
        stage === ApplicationReviewStage.COUNCIL_REVIEW);

    if (!allowed) {
      throw new ForbiddenException('You do not have access to this application');
    }
  }

  private assertCanPerformStageAction(
    actor: UserEntity,
    registration: RegistrationEntity,
    _action: UpdateApplicationStageDto['action'],
  ): void {
    this.assertCanViewApplication(actor, registration);
  }

  private async assertAssignableEvaluator(evaluatorId: string): Promise<void> {
    const evaluator = await this.userRepository.findOneBy({ id: evaluatorId });
    if (
      !evaluator ||
      !evaluator.isActive ||
      ![UserRole.EVALUATOR, UserRole.REVIEWER].includes(evaluator.role)
    ) {
      throw new BadRequestException(
        'Assigned evaluator must be an active evaluator user',
      );
    }
  }

  private getQueueOwnerRole(stage?: ApplicationReviewStage | null): string | null {
    switch (stage) {
      case ApplicationReviewStage.SECRETARIAT_REVIEW:
        return 'SECRETARIAT';
      case ApplicationReviewStage.EVALUATOR_REVIEW:
        return 'EVALUATOR';
      case ApplicationReviewStage.MPDC_REVIEW:
        return 'MPDC';
      case ApplicationReviewStage.COUNCIL_REVIEW:
      case ApplicationReviewStage.APPROVAL_NOTICE_SENT:
        return 'COUNCIL';
      default:
        return null;
    }
  }

  private assertAllowedStageAction(
    stage: ApplicationReviewStage,
    action: UpdateApplicationStageDto['action'],
  ): void {
    const allowedActions: Record<ApplicationReviewStage, UpdateApplicationStageDto['action'][]> = {
      [ApplicationReviewStage.SECRETARIAT_REVIEW]: [
        'ASSIGN_EVALUATOR',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.EVALUATOR_REVIEW]: [
        'ADVANCE_TO_MPDC',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.MPDC_REVIEW]: [
        'ADVANCE_TO_COUNCIL',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.COUNCIL_REVIEW]: [
        'APPROVE',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.APPROVAL_NOTICE_SENT]: [],
    };

    if (!allowedActions[stage].includes(action)) {
      throw new BadRequestException(
        `Action ${action} is not allowed while the application is in ${stage}`,
      );
    }
  }

  async listPayments(query: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.limit ?? 50, 200);
    const skip = (page - 1) * pageSize;

    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .orderBy('payment.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }
    if (query.type) {
      qb.andWhere('payment.paymentType = :type', { type: query.type });
    }

    const [payments, total] = await qb.getManyAndCount();

    const items = payments.map((p) => ({
      id: p.id,
      transactionRef: p.transactionRef ?? p.receiptNumber ?? p.id.slice(0, 8).toUpperCase(),
      receiptNumber: p.receiptNumber,
      receiptUrl: p.receiptUrl,
      memberName: p.user
        ? `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim() || p.user.email
        : 'Unknown',
      memberEmail: p.user?.email ?? null,
      paymentType: p.paymentType,
      description: p.description ?? p.paymentType,
      amount: p.amount,
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      status: p.status,
      completedAt: p.completedAt ?? null,
      createdAt: p.createdAt,
    }));

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async importMembers(file: Express.Multer.File): Promise<LegacyMemberImportResult> {
    const rows = await this.parseMemberImportRows(file);
    const result: LegacyMemberImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      feesCreated: 0,
      feesUpdated: 0,
      errors: [],
      warnings: [],
    };

    for (const row of rows) {
      const values = row.values;
      const membershipId = this.cleanImportValue(
        values.regno ?? values.membershipid,
      );
      const email = this.normalizeImportEmail(values.email);

      if (!membershipId && !email) {
        result.skipped++;
        result.errors.push({
          row: row.rowNumber,
          reason: 'Missing both Reg.No. and email',
        });
        continue;
      }

      if (!email) {
        result.skipped++;
        result.errors.push({
          row: row.rowNumber,
          membershipId,
          reason: 'Email is required to create a portal account',
        });
        continue;
      }

      try {
        let user = membershipId
          ? await this.userRepository.findOneBy({ membershipId })
          : null;

        if (!user) {
          user = await this.userRepository.findOneBy({ email });
        }

        const membershipClass = this.normalizeLegacyMembershipClass(
          values.membertype ?? values.membershipclass,
          row.rowNumber,
          result,
        );
        const engineeringDiscipline = this.normalizeLegacyDiscipline(
          values.discipline ?? values.engineeringdiscipline,
          row.rowNumber,
          result,
        );
        const gender = this.normalizeLegacyGender(
          values.gender,
          row.rowNumber,
          result,
        );
        const joiningDate = this.parseLegacyDate(
          values.yearofadmission ?? values.joiningdate,
          row.rowNumber,
          result,
        );
        const location = [values.pobox, values.address]
          .map((value) => this.cleanImportValue(value))
          .filter(Boolean)
          .join(', ');
        const paidFees = this.extractLegacyPaidFees(values);
        const latestPaidFee = paidFees[paidFees.length - 1];
        const membershipExpiryDate = latestPaidFee
          ? new Date(latestPaidFee.year, 11, 31, 23, 59, 59, 999)
          : undefined;
        const membershipStatus =
          membershipExpiryDate && membershipExpiryDate >= new Date()
            ? MembershipStatus.ACTIVE
            : MembershipStatus.EXPIRED;

        if (user) {
          user = this.userRepository.merge(user, {
            email,
            membershipId: membershipId || user.membershipId,
            firstName: this.cleanImportValue(values.firstname) || user.firstName,
            middleName:
              this.cleanImportValue(values.middlename) || user.middleName,
            lastName: this.cleanImportValue(values.lastname) || user.lastName,
            phoneNumber: this.cleanImportValue(values.phone) || user.phoneNumber,
            gender: gender ?? user.gender,
            employer:
              this.cleanImportValue(values.organisation) || user.employer,
            location: location || user.location,
            membershipClass: membershipClass ?? user.membershipClass,
            engineeringDiscipline:
              engineeringDiscipline ?? user.engineeringDiscipline,
            joiningDate: joiningDate ?? user.joiningDate,
            membershipStatus,
            membershipExpiryDate:
              membershipExpiryDate ?? user.membershipExpiryDate,
            annualMembershipFee: latestPaidFee?.amount ?? user.annualMembershipFee,
            role: UserRole.MEMBER,
            isActive: true,
          });
          await this.userRepository.save(user);
          result.updated++;
        } else {
          const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
          const hashed = await bcrypt.hash(tempPassword, 10);
          user = this.userRepository.create({
            email,
            password: hashed,
            membershipId,
            firstName: this.cleanImportValue(values.firstname) || email.split('@')[0],
            middleName: this.cleanImportValue(values.middlename),
            lastName: this.cleanImportValue(values.lastname),
            phoneNumber: this.cleanImportValue(values.phone),
            gender,
            employer: this.cleanImportValue(values.organisation),
            location: location || undefined,
            membershipClass,
            engineeringDiscipline,
            joiningDate,
            membershipStatus,
            membershipExpiryDate,
            annualMembershipFee: latestPaidFee?.amount,
            role: UserRole.MEMBER,
            emailVerified: true,
            isActive: true,
          });
          await this.userRepository.save(user);
          result.created++;
        }

        for (const paidFee of paidFees) {
          const existingFee = await this.feeRepository.findOne({
            where: { userId: user.id, year: paidFee.year },
          });
          const feePayload = {
            userId: user.id,
            year: paidFee.year,
            membershipClass:
              user.membershipClass ?? membershipClass ?? MembershipClass.CORPORATE,
            amount: paidFee.amount,
            currency: 'TZS',
            status: FeeStatus.PAID,
            dueDate: new Date(paidFee.year, 6, 10, 23, 59, 59, 999),
            paidAt: new Date(paidFee.year, 11, 31, 12, 0, 0, 0),
            notes: 'Imported from legacy spreadsheet; exact payment date unknown',
          };

          if (existingFee) {
            await this.feeRepository.save(
              this.feeRepository.merge(existingFee, feePayload),
            );
            result.feesUpdated++;
          } else {
            await this.feeRepository.save(this.feeRepository.create(feePayload));
            result.feesCreated++;
          }
        }
      } catch (err) {
        result.errors.push({
          row: row.rowNumber,
          membershipId,
          email,
          reason: (err as Error).message,
        });
      }
    }

    this.logger.log(
      `Member import complete: ${result.created} created, ${result.updated} updated, ${result.feesCreated} fees created, ${result.feesUpdated} fees updated, ${result.errors.length} errors`,
    );
    return result;
  }

  private async parseMemberImportRows(
    file: Express.Multer.File,
  ): Promise<LegacyMemberImportRow[]> {
    const lowerName = file.originalname.toLowerCase();

    if (lowerName.endsWith('.csv') || file.mimetype.includes('csv')) {
      return this.parseMemberCsvRows(file.buffer.toString('utf-8'));
    }

    if (
      !lowerName.endsWith('.xlsx') &&
      !lowerName.endsWith('.xls') &&
      !file.mimetype.includes('spreadsheetml')
    ) {
      throw new BadRequestException('Only .xlsx, .xls, and .csv files are accepted');
    }

    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Spreadsheet does not contain a worksheet');
    }
    const worksheet = workbook.Sheets[sheetName];
    const sheetRows = XLSX.utils.sheet_to_json<Array<string | number | Date>>(
      worksheet,
      {
        header: 1,
        raw: false,
        defval: '',
      },
    );
    const headers = (sheetRows[0] ?? []).map((header) =>
      this.normalizeImportHeader(this.cleanImportValue(header)),
    );

    return this.assertAndTrimImportRows(
      sheetRows.slice(1).map((row, rowIndex) => {
        const values: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (!header) return;
          values[header] = this.cleanImportValue(row[index]);
        });
        return { rowNumber: rowIndex + 2, values };
      }),
    );
  }

  private parseMemberCsvRows(csvContent: string): LegacyMemberImportRow[] {
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return [];

    const headers = this.parseCsvLine(lines[0]).map((header) =>
      this.normalizeImportHeader(header),
    );

    return this.assertAndTrimImportRows(
      lines.slice(1).map((line, index) => {
        const columns = this.parseCsvLine(line);
        const values: Record<string, string> = {};
        headers.forEach((header, columnIndex) => {
          if (!header) return;
          values[header] = columns[columnIndex] ?? '';
        });
        return { rowNumber: index + 2, values };
      }),
    );
  }

  private assertAndTrimImportRows(
    rows: LegacyMemberImportRow[],
  ): LegacyMemberImportRow[] {
    if (!rows.length) return [];
    const hasEmail = rows.some((row) => 'email' in row.values);
    const hasRegNo = rows.some(
      (row) => 'regno' in row.values || 'membershipid' in row.values,
    );
    if (!hasEmail && !hasRegNo) {
      throw new BadRequestException(
        'Import file must include either "Reg.No." or "email" columns',
      );
    }
    return rows.filter((row) =>
      Object.values(row.values).some((value) => this.cleanImportValue(value)),
    );
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    return cells.map((cell) => cell.replace(/^"|"$/g, '').trim());
  }

  private normalizeImportHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private cleanImportValue(value?: string | number | Date | null): string {
    if (value instanceof Date) return value.toISOString();
    return String(value ?? '').trim();
  }

  private normalizeImportEmail(value?: string | null): string {
    return this.cleanImportValue(value).toLowerCase();
  }

  private normalizeLegacyMembershipClass(
    value: string | undefined,
    row: number,
    result: LegacyMemberImportResult,
  ): MembershipClass | undefined {
    const normalized = this.cleanImportValue(value).toUpperCase();
    if (!normalized) return undefined;
    const map: Record<string, MembershipClass> = {
      GRADUATE: MembershipClass.GRADUATE,
      ASSOCIATE: MembershipClass.ASSOCIATE,
      AMIET: MembershipClass.ASSOCIATE,
      MEMBER: MembershipClass.MEMBER,
      MIET: MembershipClass.MEMBER,
      CORPORATE: MembershipClass.CORPORATE,
      CMIET: MembershipClass.CORPORATE,
      SENIOR: MembershipClass.SENIOR,
      SMIET: MembershipClass.SENIOR,
      FELLOW: MembershipClass.FELLOW,
      FIET: MembershipClass.FELLOW,
      HONORARY: MembershipClass.HONORARY,
    };
    const mapped = map[normalized];
    if (!mapped) {
      result.warnings.push({
        row,
        field: 'MEMBER_TYPE',
        value: value ?? '',
        reason: 'Unknown member type; membership class left blank',
      });
    }
    return mapped;
  }

  private normalizeLegacyDiscipline(
    value: string | undefined,
    row: number,
    result: LegacyMemberImportResult,
  ): EngineeringDiscipline | undefined {
    const normalized = this.cleanImportValue(value).toUpperCase();
    if (!normalized) return undefined;
    const map: Record<string, EngineeringDiscipline> = {
      CIVIL: EngineeringDiscipline.CIVIL,
      MECH: EngineeringDiscipline.MECHANICAL,
      MECHANICAL: EngineeringDiscipline.MECHANICAL,
      ELEC: EngineeringDiscipline.ELECTRICAL,
      ELECT: EngineeringDiscipline.ELECTRICAL,
      ELECTRICAL: EngineeringDiscipline.ELECTRICAL,
      ELECTRONICS: EngineeringDiscipline.ELECTRONICS,
      'ELECTRONICSANDIT': EngineeringDiscipline.ELECTRONICS,
      CPE: EngineeringDiscipline.COMPUTER,
      COMPUTER: EngineeringDiscipline.COMPUTER,
      PETROLEUM: EngineeringDiscipline.PETROLEUM,
      METTALUGICAL: EngineeringDiscipline.OTHER,
      METALLURGICAL: EngineeringDiscipline.OTHER,
    };
    const mapped = map[normalized.replace(/[^A-Z0-9]/g, '')] ?? map[normalized];
    if (!mapped) {
      result.warnings.push({
        row,
        field: 'Discipline',
        value: value ?? '',
        reason: 'Unknown discipline; imported as Other',
      });
      return EngineeringDiscipline.OTHER;
    }
    return mapped;
  }

  private normalizeLegacyGender(
    value: string | undefined,
    row: number,
    result: LegacyMemberImportResult,
  ): Gender | undefined {
    const normalized = this.cleanImportValue(value).toUpperCase();
    if (!normalized) return undefined;
    if (normalized === 'M' || normalized === 'MALE') return Gender.MALE;
    if (normalized === 'F' || normalized === 'FEMALE') return Gender.FEMALE;
    result.warnings.push({
      row,
      field: 'Gender',
      value: value ?? '',
      reason: 'Unknown gender; value not imported',
    });
    return undefined;
  }

  private parseLegacyDate(
    value: string | undefined,
    row: number,
    result: LegacyMemberImportResult,
  ): Date | undefined {
    const raw = this.cleanImportValue(value);
    if (!raw) return undefined;

    if (/^\d+(\.\d+)?$/.test(raw)) {
      const serial = Number(raw);
      if (serial > 20000) {
        return new Date(Date.UTC(1899, 11, 30 + serial));
      }
    }

    const parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (parts) {
      const year =
        parts[3].length === 2 ? Number(`20${parts[3]}`) : Number(parts[3]);
      return new Date(Date.UTC(year, Number(parts[2]) - 1, Number(parts[1])));
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    result.warnings.push({
      row,
      field: 'Year of Admission',
      value: raw,
      reason: 'Unable to parse date; joining date left blank',
    });
    return undefined;
  }

  private extractLegacyPaidFees(
    values: Record<string, string>,
  ): Array<{ year: number; amount: number }> {
    return Object.entries(values)
      .filter(([key, value]) => /^\d{4}$/.test(key) && this.cleanImportValue(value))
      .map(([key, value]) => ({
        year: Number(key),
        amount: Number(this.cleanImportValue(value).replace(/,/g, '')),
      }))
      .filter((fee) => Number.isFinite(fee.year) && Number.isFinite(fee.amount))
      .sort((a, b) => a.year - b.year);
  }

  async deactivateInactiveMembers(): Promise<{ deactivated: number }> {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 3);

    const inactive = await this.userRepository
      .createQueryBuilder('user')
      .where('user.isActive = :active', { active: true })
      .andWhere('user.membershipStatus = :status', { status: MembershipStatus.EXPIRED })
      .andWhere('user.updatedAt < :cutoff', { cutoff })
      .getMany();

    if (!inactive.length) return { deactivated: 0 };

    const now = new Date();
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: false, deletedAt: now } as any)
      .where('id IN (:...ids)', { ids: inactive.map((u) => u.id) })
      .execute();

    this.logger.log(`Deactivated ${inactive.length} inactive members`);
    return { deactivated: inactive.length };
  }

  async expireUnpaidMemberships(): Promise<{
    feesMarkedOverdue: number;
    membershipsExpired: number;
  }> {
    const today = new Date();

    const overdueResult = await this.feeRepository
      .createQueryBuilder()
      .update()
      .set({ status: FeeStatus.OVERDUE })
      .where('"dueDate" < :today', { today })
      .andWhere('status = :pending', { pending: FeeStatus.PENDING })
      .execute();

    const feesMarkedOverdue = overdueResult.affected ?? 0;

    const overdueUserIds = await this.feeRepository
      .createQueryBuilder('fee')
      .select('DISTINCT fee.userId', 'userId')
      .where('fee.status = :overdue', { overdue: FeeStatus.OVERDUE })
      .getRawMany<{ userId: string }>();

    let membershipsExpired = 0;
    if (overdueUserIds.length) {
      const expiredResult = await this.userRepository
        .createQueryBuilder()
        .update()
        .set({ membershipStatus: MembershipStatus.EXPIRED })
        .where('id IN (:...ids)', { ids: overdueUserIds.map((r) => r.userId) })
        .andWhere('membershipStatus = :active', { active: MembershipStatus.ACTIVE })
        .execute();
      membershipsExpired = expiredResult.affected ?? 0;
    }

    const expiredByDateResult = await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ membershipStatus: MembershipStatus.EXPIRED })
      .where('"membershipExpiryDate" < :today', { today })
      .andWhere('membershipStatus = :active', { active: MembershipStatus.ACTIVE })
      .execute();
    membershipsExpired += expiredByDateResult.affected ?? 0;

    this.logger.log(
      `Maintenance: ${feesMarkedOverdue} fees marked overdue, ${membershipsExpired} memberships expired`,
    );
    return { feesMarkedOverdue, membershipsExpired };
  }

  async getFeeConfig(): Promise<Record<string, number>> {
    const setting = await this.settingRepository.findOneBy({ key: 'membership_fees' });
    if (setting) {
      return JSON.parse(setting.value) as Record<string, number>;
    }
    return {
      GRADUATE: 50000,
      ASSOCIATE: 75000,
      MIET: 100000,
      CORPORATE: 150000,
      SENIOR: 100000,
      FELLOW: 50000,
      HONORARY: 0,
    };
  }

  async updateFeeConfig(fees: Record<string, number>): Promise<Record<string, number>> {
    let setting = await this.settingRepository.findOneBy({ key: 'membership_fees' });
    if (!setting) {
      setting = this.settingRepository.create({ key: 'membership_fees', value: '{}' });
    }
    setting.value = JSON.stringify(fees);
    await this.settingRepository.save(setting);
    return fees;
  }

  async getFiscalYearSettings(): Promise<FiscalYearSettingsDto> {
    const setting = await this.settingRepository.findOneBy({
      key: FISCAL_YEAR_SETTING_KEY,
    });
    if (!setting) {
      return DEFAULT_FISCAL_YEAR_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_FISCAL_YEAR_SETTINGS,
        ...(JSON.parse(setting.value) as Partial<FiscalYearSettingsDto>),
      };
    } catch {
      return DEFAULT_FISCAL_YEAR_SETTINGS;
    }
  }

  async updateFiscalYearSettings(
    dto: FiscalYearSettingsDto,
  ): Promise<FiscalYearSettingsDto> {
    const normalized: FiscalYearSettingsDto = {
      startMonth: dto.startMonth,
      startDay: dto.startDay,
      endMonth: dto.endMonth,
      endDay: dto.endDay,
    };

    const startDate = new Date(2025, normalized.startMonth - 1, normalized.startDay);
    const endDate = new Date(2025, normalized.endMonth - 1, normalized.endDay);
    if (
      startDate.getMonth() !== normalized.startMonth - 1 ||
      startDate.getDate() !== normalized.startDay ||
      endDate.getMonth() !== normalized.endMonth - 1 ||
      endDate.getDate() !== normalized.endDay
    ) {
      throw new BadRequestException('Fiscal year dates are invalid');
    }

    let setting = await this.settingRepository.findOneBy({
      key: FISCAL_YEAR_SETTING_KEY,
    });
    if (!setting) {
      setting = this.settingRepository.create({
        key: FISCAL_YEAR_SETTING_KEY,
        value: '{}',
      });
    }
    setting.value = JSON.stringify(normalized);
    await this.settingRepository.save(setting);
    return normalized;
  }

  private async getUpcomingFiscalYearEndDate(reference = new Date()): Promise<Date> {
    const settings = await this.getFiscalYearSettings();
    const currentYearEnd = new Date(
      reference.getFullYear(),
      settings.endMonth - 1,
      settings.endDay,
    );
    currentYearEnd.setHours(23, 59, 59, 999);

    if (reference <= currentYearEnd) {
      return currentYearEnd;
    }

    const nextYearEnd = new Date(
      reference.getFullYear() + 1,
      settings.endMonth - 1,
      settings.endDay,
    );
    nextYearEnd.setHours(23, 59, 59, 999);
    return nextYearEnd;
  }

  private async getFiscalYearEndDate(year: number): Promise<Date> {
    const settings = await this.getFiscalYearSettings();
    const endDate = new Date(year, settings.endMonth - 1, settings.endDay);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }

  private async recordStageHistory(
    registration: RegistrationEntity,
    params: {
      fromStage?: ApplicationReviewStage;
      toStage: ApplicationReviewStage;
      action: ApplicationStageHistoryEntity['action'];
      actedByUserId: string;
      comments?: string;
      assignedEvaluatorId?: string;
    },
  ): Promise<void> {
    const history = new ApplicationStageHistoryEntity();
    history.registrationId = registration.id;
    history.fromStage = params.fromStage;
    history.toStage = params.toStage;
    history.action = params.action;
    history.comments = params.comments;
    history.assignedEvaluatorId = params.assignedEvaluatorId;
    history.createdBy = params.actedByUserId;
    history.updatedBy = params.actedByUserId;
    await this.stageHistoryRepository.save(history);
  }

  // ============================================
  // MEMBERSHIP CATEGORIES
  // ============================================

  async getMembershipCategories(query: MembershipCategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.membershipCategoryRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return {
      success: true,
      data: categories,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async createMembershipCategory(dto: CreateMembershipCategoryDto) {
    const existing = await this.membershipCategoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Category "${dto.name}" already exists`);
    }
    const category = this.membershipCategoryRepository.create({
      name: dto.name,
      yearlyFee: dto.yearlyFee,
      minYearsExperience: dto.minYearsExperience,
      description: dto.description ?? null,
    });
    const saved = await this.membershipCategoryRepository.save(category);
    return { success: true, data: saved };
  }

  async updateMembershipCategory(id: string, dto: UpdateMembershipCategoryDto) {
    const category = await this.membershipCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Membership category not found`);
    }
    if (dto.name && dto.name !== category.name) {
      const existing = await this.membershipCategoryRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException(`Category "${dto.name}" already exists`);
      }
    }
    Object.assign(category, dto);
    const saved = await this.membershipCategoryRepository.save(category);
    return { success: true, data: saved };
  }

  async deleteMembershipCategory(id: string) {
    const category = await this.membershipCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Membership category not found`);
    }
    await this.membershipCategoryRepository.remove(category);
    return { success: true, message: 'Category deleted successfully' };
  }
}
