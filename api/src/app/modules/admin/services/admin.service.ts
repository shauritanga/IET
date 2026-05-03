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
} from '../dto';
import {
  MembershipStatus,
  ApplicationStatus,
  ApplicationReviewStage,
  PaymentStatus,
  FeeStatus,
  UserRole,
} from '../../../common/enums';

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

  async importMembers(csvContent: string): Promise<{
    created: number;
    skipped: number;
    errors: Array<{ row: number; email: string; reason: string }>;
  }> {
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { created: 0, skipped: 0, errors: [] };

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const emailIdx = header.indexOf('email');
    const firstIdx = header.indexOf('firstname');
    const lastIdx = header.indexOf('lastname');
    const classIdx = header.indexOf('membershipclass');
    const disciplineIdx = header.indexOf('engineeringdiscipline');
    const phoneIdx = header.indexOf('phone');

    if (emailIdx === -1) throw new BadRequestException('CSV must include an "email" column');

    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; email: string; reason: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const email = cols[emailIdx]?.toLowerCase();
      if (!email) continue;

      try {
        const existing = await this.userRepository.findOneBy({ email });
        if (existing) { skipped++; continue; }

        const bcrypt = await import('bcrypt');
        const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
        const hashed = await bcrypt.hash(tempPassword, 10);

        const user = this.userRepository.create({
          email,
          password: hashed,
          firstName: firstIdx >= 0 ? cols[firstIdx] : email.split('@')[0],
          lastName: lastIdx >= 0 ? cols[lastIdx] : '',
          membershipClass: classIdx >= 0 ? (cols[classIdx] as any) : undefined,
          engineeringDiscipline: disciplineIdx >= 0 ? (cols[disciplineIdx] as any) : undefined,
          phoneNumber: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
          membershipStatus: MembershipStatus.ACTIVE,
          emailVerified: false,
          isActive: true,
        });
        await this.userRepository.save(user);
        created++;
      } catch (err) {
        errors.push({ row: i + 1, email, reason: (err as Error).message });
      }
    }

    this.logger.log(`Import complete: ${created} created, ${skipped} skipped, ${errors.length} errors`);
    return { created, skipped, errors };
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
