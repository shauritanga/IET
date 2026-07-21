import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
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
import { EngineeringInstitutionEntity } from '../entities/engineering-institution.entity';
import { DisciplineEntity } from '../entities/discipline.entity';
import { UserDisciplineEntity } from '../../user/entities/user-discipline.entity';
import { UserService } from '../../user/services/user.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { EmailService } from '../../shared/services/email.service';
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
  EngineeringInstitutionQueryDto,
  CreateEngineeringInstitutionDto,
  UpdateEngineeringInstitutionDto,
  RenewMemberDto,
  DisciplineQueryDto,
  CreateDisciplineDto,
  UpdateDisciplineDto,
} from '../dto';
import {
  MembershipStatus,
  MembershipClass,
  EngineeringDiscipline,
  Gender,
  ApplicationStatus,
  ApplicationReviewStage,
  PaymentStatus,
  PaymentType,
  FeeStatus,
  UserRole,
  NotificationType,
  DocumentStatus,
  EventRegistrationStatus,
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

// Roles for which discipline tagging is meaningful (review-panel members).
const PANEL_ROLES = [
  UserRole.EVALUATOR,
  UserRole.MPDC,
  UserRole.COUNCIL,
  UserRole.REVIEWER,
] as const;

const isPanelRole = (role: UserRole): boolean =>
  PANEL_ROLES.includes(role as (typeof PANEL_ROLES)[number]);

// Portal roles a plain ADMIN (not SUPER_ADMIN) is allowed to create and manage.
// The ADMIN and SUPER_ADMIN roles are intentionally excluded so an admin cannot
// escalate privileges — only a super admin can manage admin accounts.
const ADMIN_MANAGEABLE_ROLES = [
  UserRole.SECRETARIAT,
  UserRole.EVALUATOR,
  UserRole.MPDC,
  UserRole.COUNCIL,
  UserRole.REVIEWER,
] as const;

const isAdminManageableRole = (role: UserRole): boolean =>
  ADMIN_MANAGEABLE_ROLES.includes(role as (typeof ADMIN_MANAGEABLE_ROLES)[number]);

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
    @InjectRepository(EngineeringInstitutionEntity)
    private engineeringInstitutionRepository: Repository<EngineeringInstitutionEntity>,
    @InjectRepository(DisciplineEntity)
    private disciplineRepository: Repository<DisciplineEntity>,
    @InjectRepository(UserDisciplineEntity)
    private userDisciplineRepository: Repository<UserDisciplineEntity>,
    private userService: UserService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  private hasThreeConsecutiveUnpaidFeeYears(
    fees: Array<{ year: number; status: FeeStatus }>,
  ): boolean {
    let streak = 0;
    let previousYear: number | null = null;

    for (const fee of [...fees].sort((a, b) => b.year - a.year)) {
      if (fee.status === FeeStatus.PAID) {
        break;
      }

      if (previousYear !== null && previousYear !== fee.year + 1) {
        break;
      }

      streak += 1;
      if (streak >= 3) {
        return true;
      }

      previousYear = fee.year;
    }

    return false;
  }

  private async getMembersWithThreeConsecutiveUnpaidFeeYears(): Promise<string[]> {
    const feeRows = await this.feeRepository
      .createQueryBuilder('fee')
      .select('fee.userId', 'userId')
      .addSelect('fee.year', 'year')
      .addSelect('fee.status', 'status')
      .orderBy('fee.userId', 'ASC')
      .addOrderBy('fee.year', 'DESC')
      .getRawMany<Array<{ userId: string; year: string | number; status: FeeStatus }>>();

    const groupedFees = new Map<string, Array<{ year: number; status: FeeStatus }>>();
    for (const row of feeRows as unknown as Array<{ userId: string; year: string | number; status: FeeStatus }>) {
      const userFees = groupedFees.get(row.userId) ?? [];
      userFees.push({
        year: Number(row.year),
        status: row.status,
      });
      groupedFees.set(row.userId, userFees);
    }

    return Array.from(groupedFees.entries())
      .filter(([, fees]) => this.hasThreeConsecutiveUnpaidFeeYears(fees))
      .map(([userId]) => userId);
  }

  private getFileNameFromUrl(url: string, fallback: string): string {
    try {
      const pathname = new URL(url).pathname;
      const fileName = pathname.split('/').filter(Boolean).pop();
      return fileName ? decodeURIComponent(fileName) : fallback;
    } catch {
      const fileName = url.split('/').filter(Boolean).pop();
      return fileName ? decodeURIComponent(fileName) : fallback;
    }
  }

  private buildUnifiedApplicationDocuments(registration: RegistrationEntity) {
    const documents: any[] = (registration.documents ?? []).map((document) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      description: document.description ?? null,
      status: document.status,
      uploadedAt: document.createdAt,
      verifiedAt: document.verifiedAt ?? null,
      source: 'registration_documents',
    }));

    if (registration.supportingDocumentUrl) {
      documents.push({
        id: `${registration.id}:supporting-document`,
        documentType: 'STATUTORY_BOARD',
        fileName: this.getFileNameFromUrl(
          registration.supportingDocumentUrl,
          'Supporting document',
        ),
        fileUrl: registration.supportingDocumentUrl,
        fileSize: 0,
        mimeType: '',
        description: 'Statutory board supporting document',
        status: DocumentStatus.PENDING,
        uploadedAt: registration.updatedAt,
        verifiedAt: null,
        source: 'supportingDocumentUrl',
      });
    }

    if (registration.cvAttachment) {
      documents.push({
        id: `${registration.id}:cv`,
        documentType: 'CV',
        fileName: this.getFileNameFromUrl(registration.cvAttachment, 'CV'),
        fileUrl: registration.cvAttachment,
        fileSize: 0,
        mimeType: '',
        description: 'Curriculum vitae',
        status: DocumentStatus.PENDING,
        uploadedAt: registration.updatedAt,
        verifiedAt: null,
        source: 'cvAttachment',
      });
    }

    for (const education of registration.educations ?? []) {
      if (!education.attachmentUrl) continue;
      documents.push({
        id: `${education.id}:education-attachment`,
        documentType: 'EDUCATION_CERTIFICATE',
        fileName: this.getFileNameFromUrl(
          education.attachmentUrl,
          `${education.qualification || education.institutionName || 'Education'} certificate`,
        ),
        fileUrl: education.attachmentUrl,
        fileSize: 0,
        mimeType: '',
        description: education.institutionName
          ? `Education certificate - ${education.institutionName}`
          : 'Education certificate',
        status: DocumentStatus.PENDING,
        uploadedAt: education.updatedAt,
        verifiedAt: null,
        source: 'education.attachmentUrl',
      });
    }

    return documents;
  }

  private assertPortalRole(role: UserRole): void {
    if (!PORTAL_ROLES.includes(role as (typeof PORTAL_ROLES)[number])) {
      throw new BadRequestException('Role is not allowed for admin portal users');
    }
  }

  /** Admins and super admins may manage portal users. */
  private assertCanManagePortalUsers(actor: Pick<UserEntity, 'role'>): void {
    if (actor.role !== UserRole.SUPER_ADMIN && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to manage portal users');
    }
  }

  /** A role the actor is permitted to assign to a portal user. */
  private assertCanAssignRole(actor: Pick<UserEntity, 'role'>, role: UserRole): void {
    this.assertPortalRole(role);
    if (actor.role === UserRole.SUPER_ADMIN) return;
    if (!isAdminManageableRole(role)) {
      throw new ForbiddenException(
        'Only a super admin can assign the Admin or Super Admin role',
      );
    }
  }

  /** Whether the actor may modify or delete an existing portal user. */
  private assertCanManageTarget(
    actor: Pick<UserEntity, 'role'>,
    target: Pick<UserEntity, 'role'>,
  ): void {
    if (actor.role === UserRole.SUPER_ADMIN) return;
    if (
      target.role === UserRole.ADMIN ||
      target.role === UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only a super admin can manage Admin or Super Admin accounts',
      );
    }
  }

  private toAdminUserSummary(
    user: UserEntity,
    disciplines: { id: string; name: string }[] = [],
  ) {
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
      disciplines,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /** Discipline tags ({id,name}) for one panel-member user. */
  private async getUserDisciplines(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    const tags = await this.userDisciplineRepository.find({
      where: { userId },
    });
    if (!tags.length) {
      return [];
    }
    const disciplines = await this.disciplineRepository.find({
      where: { id: In(tags.map((t) => t.disciplineId)) },
      order: { name: 'ASC' },
    });
    return disciplines.map((d) => ({ id: d.id, name: d.name }));
  }

  /** Discipline tags keyed by userId, for a batch of users (list views). */
  private async getUserDisciplinesMap(
    userIds: string[],
  ): Promise<Map<string, { id: string; name: string }[]>> {
    const map = new Map<string, { id: string; name: string }[]>();
    if (!userIds.length) {
      return map;
    }
    const tags = await this.userDisciplineRepository.find({
      where: { userId: In(userIds) },
    });
    if (!tags.length) {
      return map;
    }
    const disciplines = await this.disciplineRepository.find({
      where: { id: In([...new Set(tags.map((t) => t.disciplineId))]) },
    });
    const byId = new Map(disciplines.map((d) => [d.id, d]));
    for (const tag of tags) {
      const discipline = byId.get(tag.disciplineId);
      if (!discipline) continue;
      const list = map.get(tag.userId) ?? [];
      list.push({ id: discipline.id, name: discipline.name });
      map.set(tag.userId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return map;
  }

  /** Replace a user's discipline tags with the given set (validates ids exist). */
  private async setUserDisciplines(
    userId: string,
    disciplineIds: string[],
  ): Promise<void> {
    await this.userDisciplineRepository.delete({ userId });
    const uniqueIds = [...new Set(disciplineIds)];
    if (!uniqueIds.length) {
      return;
    }
    const found = await this.disciplineRepository.find({
      where: { id: In(uniqueIds) },
    });
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException('One or more disciplines were not found');
    }
    await this.userDisciplineRepository.save(
      uniqueIds.map((disciplineId) =>
        this.userDisciplineRepository.create({ userId, disciplineId }),
      ),
    );
  }

  private resolveMembershipClassFromCategoryName(
    categoryName?: string | null,
  ): MembershipClass | undefined {
    const normalized = (categoryName ?? '').trim().toUpperCase();
    if (!normalized) return undefined;

    if (normalized.includes('GRADUATE')) return MembershipClass.GRADUATE;
    if (normalized.includes('ASSOCIATE') || normalized.includes('AMIET')) {
      return MembershipClass.ASSOCIATE;
    }
    if (
      normalized === 'MEMBER' ||
      normalized.includes('MIET') ||
      normalized.includes('MEMBER')
    ) {
      return MembershipClass.MEMBER;
    }
    if (normalized.includes('CORPORATE') || normalized.includes('CMIET')) {
      return MembershipClass.CORPORATE;
    }
    if (normalized.includes('SENIOR') || normalized.includes('SMIET')) {
      return MembershipClass.SENIOR;
    }
    if (normalized.includes('FELLOW') || normalized.includes('FIET')) {
      return MembershipClass.FELLOW;
    }
    if (normalized.includes('HONORARY')) {
      return MembershipClass.HONORARY;
    }

    return undefined;
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
    this.assertCanManagePortalUsers(actor);

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

    const disciplinesByUser = await this.getUserDisciplinesMap(
      users.map((u) => u.id),
    );

    return {
      items: users.map((user) =>
        this.toAdminUserSummary(user, disciplinesByUser.get(user.id) ?? []),
      ),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createAdminUser(actor: UserEntity, dto: CreateAdminUserDto) {
    this.assertCanManagePortalUsers(actor);
    this.assertCanAssignRole(actor, dto.role);

    const existing = await this.userRepository.findOneBy({ email: dto.email });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // When no password is supplied, generate a temporary one and email the
    // login credentials to the panel member (same pattern as createMember).
    const plainPassword = dto.password || this.generateTemporaryPassword();
    const sendCredentials = !dto.password;

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
      password: await bcrypt.hash(plainPassword, 10),
    });

    const saved = await this.userRepository.save(user);

    if (isPanelRole(dto.role) && dto.disciplineIds) {
      await this.setUserDisciplines(saved.id, dto.disciplineIds);
    }

    if (sendCredentials) {
      void this.emailService
        .send({
          to: saved.email,
          subject: 'Your IET portal account has been created',
          html: `
        <p>Hello ${saved.firstName ?? 'there'},</p>
        <p>An IET portal account has been created for you (${saved.role}).</p>
        <p><strong>Login email:</strong> ${saved.email}</p>
        <p><strong>Temporary password:</strong> ${plainPassword}</p>
        <p>Please sign in and change your password immediately.</p>
      `,
        })
        .catch((error: any) => {
          this.logger.warn(
            `Failed to send portal credentials email to ${saved.email}: ${error.message}`,
          );
        });
    }

    const disciplines = await this.getUserDisciplines(saved.id);
    return this.toAdminUserSummary(saved, disciplines);
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

    const disciplinesByUser = await this.getUserDisciplinesMap(
      users.map((u) => u.id),
    );
    return users.map((user) =>
      this.toAdminUserSummary(user, disciplinesByUser.get(user.id) ?? []),
    );
  }

  async updateAdminUser(
    actor: UserEntity,
    userId: string,
    dto: UpdateAdminUserDto,
  ) {
    this.assertCanManagePortalUsers(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    // A plain admin may not modify Admin/Super Admin accounts.
    this.assertCanManageTarget(actor, user);

    if (actor.id === userId) {
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
      if (dto.role && dto.role !== UserRole.SUPER_ADMIN) {
        throw new BadRequestException('You cannot remove your own super admin role');
      }
    }

    if (dto.role) {
      this.assertCanAssignRole(actor, dto.role);
      user.role = dto.role;
    }
    if (typeof dto.isActive === 'boolean') user.isActive = dto.isActive;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;

    const saved = await this.userRepository.save(user);

    // Replace discipline tags when provided. Non-panel roles carry no tags.
    if (dto.disciplineIds !== undefined) {
      await this.setUserDisciplines(
        saved.id,
        isPanelRole(saved.role) ? dto.disciplineIds : [],
      );
    } else if (!isPanelRole(saved.role)) {
      await this.setUserDisciplines(saved.id, []);
    }

    const disciplines = await this.getUserDisciplines(saved.id);
    return this.toAdminUserSummary(saved, disciplines);
  }

  async getAdminUser(actor: UserEntity, userId: string) {
    this.assertCanManagePortalUsers(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    const disciplines = await this.getUserDisciplines(user.id);
    return this.toAdminUserSummary(user, disciplines);
  }

  async deleteAdminUser(actor: UserEntity, userId: string): Promise<void> {
    this.assertCanManagePortalUsers(actor);

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !PORTAL_ROLES.includes(user.role as any)) {
      throw new NotFoundException('Admin portal user not found');
    }

    // A plain admin may not delete Admin/Super Admin accounts.
    this.assertCanManageTarget(actor, user);

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
      membershipCategoryId,
      search,
      discipline,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.leftJoinAndSelect('user.membershipCategory', 'membershipCategory');

    if (status) {
      queryBuilder.andWhere('user.membershipStatus = :status', { status });
    }
    if (membershipClass) {
      queryBuilder.andWhere('user.membershipClass = :membershipClass', {
        membershipClass,
      });
    }
    if (membershipCategoryId) {
      queryBuilder.andWhere('user.membershipCategoryId = :membershipCategoryId', {
        membershipCategoryId,
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
      middleName: user.middleName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePhotoUrl: user.profilePhotoUrl,
      membershipClass: user.membershipClass,
      membershipCategory: user.membershipCategory
        ? {
            id: user.membershipCategory.id,
            name: user.membershipCategory.name,
            yearlyFee: user.membershipCategory.yearlyFee,
            minYearsExperience: user.membershipCategory.minYearsExperience,
            description: user.membershipCategory.description,
          }
        : null,
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
    const category = dto.membershipCategoryId
      ? await this.membershipCategoryRepository.findOne({
          where: { id: dto.membershipCategoryId },
        })
      : null;

    if (dto.membershipCategoryId && !category) {
      throw new BadRequestException('Selected membership category was not found');
    }

    const temporaryPassword = this.generateTemporaryPassword();

    const user = await this.userService.create({
      email: dto.email,
      password: temporaryPassword,
      firstName: dto.firstName,
      middleName: dto.middleName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
      engineeringDiscipline: dto.engineeringDiscipline as any,
    });

    if (category) {
      user.membershipCategoryId = category.id;
      user.membershipClass =
        this.resolveMembershipClassFromCategoryName(category.name) ??
        user.membershipClass ??
        MembershipClass.MEMBER;
      await this.userRepository.save(user);
    } else if (!user.membershipClass) {
      user.membershipClass = MembershipClass.MEMBER;
      await this.userRepository.save(user);
    }

    void this.emailService.send({
      to: user.email,
      subject: 'Your IET member account has been created',
      html: `
        <p>Hello ${user.firstName ?? 'Member'},</p>
        <p>Your IET member account has been created by the admin team.</p>
        <p><strong>Login email:</strong> ${user.email}</p>
        <p><strong>Temporary password:</strong> ${temporaryPassword}</p>
        <p>Please sign in and change your password immediately.</p>
      `,
    }).catch((error: any) => {
      this.logger.warn(`Failed to send member credentials email to ${user.email}: ${error.message}`);
    });

    return user;
  }

  private generateTemporaryPassword(): string {
    const token = randomBytes(6).toString('hex');
    return `${token}A1!`;
  }

  /**
   * Get member details (admin view with full info)
   */
  async getMemberDetails(memberId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['membershipCategory'],
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
        membershipCategory: user.membershipCategory
          ? {
              id: user.membershipCategory.id,
              name: user.membershipCategory.name,
              yearlyFee: user.membershipCategory.yearlyFee,
              minYearsExperience: user.membershipCategory.minYearsExperience,
              description: user.membershipCategory.description,
            }
          : null,
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
            documents: this.buildUnifiedApplicationDocuments(registration),
            references: registration.references,
            supportingDocumentUrl: registration.supportingDocumentUrl,
            cvAttachment: registration.cvAttachment,
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
    await this.applyApplicationRoleScope(queryBuilder, actor);

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
      stageClaimedById: reg.stageClaimedById ?? null,
      stageClaimedAt: reg.stageClaimedAt ?? null,
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
    await this.assertCanViewApplication(actor, registration);

    const claimer = registration.stageClaimedById
      ? await this.userRepository.findOneBy({
          id: registration.stageClaimedById,
        })
      : null;

    return {
      id: registration.id,
      referenceNumber: registration.referenceNumber,
      status: registration.status,
      reviewStage: registration.reviewStage,
      queueOwnerRole: this.getQueueOwnerRole(registration.reviewStage),
      assignedEvaluatorId: registration.assignedEvaluatorId,
      assignedAt: registration.assignedAt,
      stageClaimedById: registration.stageClaimedById ?? null,
      stageClaimedByName: claimer?.fullName ?? null,
      stageClaimedAt: registration.stageClaimedAt ?? null,
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
      supportingDocumentUrl: registration.supportingDocumentUrl,
      cvAttachment: registration.cvAttachment,
      educations: registration.educations,
      experiences: registration.experiences,
      documents: this.buildUnifiedApplicationDocuments(registration),
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
    await this.assertCanPerformStageAction(actor, registration, dto.action);

    // CLAIM is a self-contained action: it locks the current review stage to
    // the acting panel member without advancing the application.
    if (dto.action === 'CLAIM') {
      return this.claimApplicationStage(registration, actor);
    }

    let newStatus: ApplicationStatus = registration.status;
    let newStage: ApplicationReviewStage = currentStage;
    let membershipId: string | undefined;
    const now = new Date();
    const comments = dto.comments?.trim();
    const requiresComments = [
      'EVALUATOR_RECOMMEND',
      'MPDC_RECOMMEND',
      'COUNCIL_RECOMMEND',
      'REJECT',
      'RETURN_FOR_CHANGES',
    ].includes(dto.action);
    if (requiresComments && !comments) {
      throw new BadRequestException('Comments or reason are required for this action');
    }

    let historyAction:
      | 'ASSIGNED'
      | 'ADVANCED'
      | 'EVALUATOR_RECOMMENDED'
      | 'MPDC_RECOMMENDED'
      | 'COUNCIL_RECOMMENDED'
      | 'APPROVED_BY_COUNCIL'
      | 'RETURNED_FOR_CHANGES'
      | 'REJECTED'
      | 'NOTICE_SENT' = 'ADVANCED';

    switch (dto.action) {
      case 'ADVANCE_TO_EVALUATOR':
        // Advance to the evaluator stage without picking an evaluator; every
        // discipline-matched evaluator is emailed and one claims it.
        newStage = ApplicationReviewStage.EVALUATOR_REVIEW;
        historyAction = 'ADVANCED';
        break;
      case 'ASSIGN_EVALUATOR':
        if (!dto.evaluatorId) {
          throw new BadRequestException(
            'Evaluator ID is required when assigning an evaluator',
          );
        }
        await this.assertAssignableEvaluator(dto.evaluatorId);
        newStage = ApplicationReviewStage.EVALUATOR_REVIEW;
        registration.assignedEvaluatorId = dto.evaluatorId;
        registration.assignedAt = now;
        historyAction = 'ASSIGNED';
        break;
      case 'EVALUATOR_RECOMMEND':
        newStage = ApplicationReviewStage.SECRETARIAT_EVALUATOR_RECOMMENDATION;
        historyAction = 'EVALUATOR_RECOMMENDED';
        break;
      case 'SECRETARIAT_ADVANCE_TO_MPDC':
        newStage = ApplicationReviewStage.MPDC_REVIEW;
        historyAction = 'ADVANCED';
        break;
      case 'MPDC_RECOMMEND':
        newStage = ApplicationReviewStage.SECRETARIAT_MPDC_RECOMMENDATION;
        historyAction = 'MPDC_RECOMMENDED';
        break;
      case 'SECRETARIAT_ADVANCE_TO_COUNCIL':
        newStage = ApplicationReviewStage.COUNCIL_REVIEW;
        historyAction = 'ADVANCED';
        break;
      case 'COUNCIL_RECOMMEND':
        newStage = ApplicationReviewStage.SECRETARIAT_COUNCIL_RECOMMENDATION;
        historyAction = 'COUNCIL_RECOMMENDED';
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
        historyAction = 'APPROVED_BY_COUNCIL';
        break;

      case 'REJECT':
        newStatus = ApplicationStatus.REJECTED;
        registration.rejectionReason = comments;
        historyAction = 'REJECTED';
        break;

      case 'RETURN_FOR_CHANGES':
        newStatus = ApplicationStatus.CHANGES_REQUESTED;
        historyAction = 'RETURNED_FOR_CHANGES';
        break;

      default:
        throw new BadRequestException('Invalid action');
    }

    // Leaving a stage drops any claim held on it so the next stage starts fresh.
    if (newStage !== currentStage) {
      registration.stageClaimedById = null;
      registration.stageClaimedAt = null;
      if (currentStage === ApplicationReviewStage.EVALUATOR_REVIEW) {
        registration.assignedEvaluatorId = null;
      }
    }

    // A directly-assigned evaluator is treated as having already claimed the
    // evaluator stage (re-applied after the clear above).
    if (dto.action === 'ASSIGN_EVALUATOR') {
      registration.stageClaimedById = dto.evaluatorId;
      registration.stageClaimedAt = now;
    }

    registration.status = newStatus;
    registration.reviewStage = newStage;
    registration.reviewedBy = actor.id;
    registration.reviewedAt = now;
    registration.reviewComments = comments;
    registration.updatedBy = actor.id;
    registration.stageUpdatedAt = now;
    registration.workflowDelayNotifiedAt = null;

    await this.registrationRepository.save(registration);
    await this.recordStageHistory(registration, {
      fromStage: currentStage,
      toStage: newStage,
      action: historyAction,
      actedByUserId: actor.id,
      comments,
      assignedEvaluatorId: dto.action === 'ASSIGN_EVALUATOR' ? dto.evaluatorId : undefined,
    });

    this.logger.log(
      `Application ${applicationId} action ${dto.action} processed by admin ${actor.id}`,
    );

    if (dto.action === 'APPROVE') {
      await this.recordStageHistory(registration, {
        fromStage: newStage,
        toStage: ApplicationReviewStage.APPROVAL_NOTICE_SENT,
        action: 'NOTICE_SENT',
        actedByUserId: actor.id,
        comments,
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
      await this.notificationsService.sendApplicationStatusNotification(
        registration.userId,
        'REJECTED',
        {
          reason: comments,
        },
      );
    } else if (dto.action === 'RETURN_FOR_CHANGES') {
      await this.notificationsService.sendApplicationStatusNotification(
        registration.userId,
        'CHANGES_REQUESTED',
        {
          reason: comments,
        },
      );
    } else {
      await this.sendInternalWorkflowNotification(registration, dto.action, actor);
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
    const user = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['membershipCategory'],
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }

    const membershipCategory = user.membershipCategory;
    const effectiveMembershipClass =
      user.membershipClass ??
      this.resolveMembershipClassFromCategoryName(membershipCategory?.name);

    if (!effectiveMembershipClass && !membershipCategory) {
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
        membershipClass:
          effectiveMembershipClass ?? MembershipClass.MEMBER,
        currency: 'TZS',
        remindersSent: 0,
      });
    }

    fee.membershipClass = effectiveMembershipClass ?? MembershipClass.MEMBER;
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

  private async applyApplicationRoleScope(
    queryBuilder: any,
    actor: UserEntity,
  ): Promise<void> {
    if (this.isFullWorkflowAdmin(actor.role)) return;

    // A review-panel member sees an application at their stage only while it is
    // unclaimed or claimed by them (the claim locks out peers).
    const unclaimedOrMine =
      '(reg.stageClaimedById IS NULL OR reg.stageClaimedById = :actorId)';

    switch (actor.role) {
      case UserRole.SECRETARIAT:
        queryBuilder.andWhere('reg.reviewStage IN (:...actorStages)', {
          actorStages: this.getSecretariatStages(),
        });
        break;
      case UserRole.EVALUATOR:
      case UserRole.REVIEWER: {
        const disciplineNames =
          await this.getEvaluatorApplicationDisciplineNames(actor.id);
        if (!disciplineNames.length) {
          queryBuilder.andWhere('1 = 0');
          break;
        }
        queryBuilder
          .andWhere('reg.reviewStage = :actorStage', {
            actorStage: ApplicationReviewStage.EVALUATOR_REVIEW,
          })
          .andWhere(unclaimedOrMine, { actorId: actor.id })
          .andWhere('reg.engineeringDiscipline IN (:...disciplineNames)', {
            disciplineNames,
          });
        break;
      }
      case UserRole.MPDC:
        queryBuilder
          .andWhere('reg.reviewStage = :actorStage', {
            actorStage: ApplicationReviewStage.MPDC_REVIEW,
          })
          .andWhere(unclaimedOrMine, { actorId: actor.id });
        break;
      case UserRole.COUNCIL:
        queryBuilder
          .andWhere('reg.reviewStage = :actorStage', {
            actorStage: ApplicationReviewStage.COUNCIL_REVIEW,
          })
          .andWhere(unclaimedOrMine, { actorId: actor.id });
        break;
      default:
        queryBuilder.andWhere('1 = 0');
    }
  }

  private async assertCanViewApplication(
    actor: UserEntity,
    registration: RegistrationEntity,
  ): Promise<void> {
    if (this.isFullWorkflowAdmin(actor.role)) return;

    const stage = registration.reviewStage;
    // Unclaimed, or claimed by this actor.
    const claimOpen =
      !registration.stageClaimedById ||
      registration.stageClaimedById === actor.id;

    let allowed = false;
    if (
      actor.role === UserRole.SECRETARIAT &&
      !!stage &&
      this.getSecretariatStages().includes(stage)
    ) {
      allowed = true;
    } else if (
      (actor.role === UserRole.EVALUATOR ||
        actor.role === UserRole.REVIEWER) &&
      stage === ApplicationReviewStage.EVALUATOR_REVIEW &&
      claimOpen
    ) {
      // Evaluators may only view applications in a discipline they cover.
      const disciplineNames =
        await this.getEvaluatorApplicationDisciplineNames(actor.id);
      allowed =
        !!registration.engineeringDiscipline &&
        disciplineNames.includes(registration.engineeringDiscipline);
    } else if (
      actor.role === UserRole.MPDC &&
      stage === ApplicationReviewStage.MPDC_REVIEW &&
      claimOpen
    ) {
      allowed = true;
    } else if (
      actor.role === UserRole.COUNCIL &&
      stage === ApplicationReviewStage.COUNCIL_REVIEW &&
      claimOpen
    ) {
      allowed = true;
    }

    if (!allowed) {
      throw new ForbiddenException('You do not have access to this application');
    }
  }

  private async assertCanPerformStageAction(
    actor: UserEntity,
    registration: RegistrationEntity,
    action: UpdateApplicationStageDto['action'],
  ): Promise<void> {
    await this.assertCanViewApplication(actor, registration);
    const secretariatActions: UpdateApplicationStageDto['action'][] = [
      'ADVANCE_TO_EVALUATOR',
      'ASSIGN_EVALUATOR',
      'SECRETARIAT_ADVANCE_TO_MPDC',
      'SECRETARIAT_ADVANCE_TO_COUNCIL',
      'APPROVE',
      'REJECT',
      'RETURN_FOR_CHANGES',
    ];
    if (
      secretariatActions.includes(action) &&
      !this.isFullWorkflowAdmin(actor.role) &&
      actor.role !== UserRole.SECRETARIAT
    ) {
      throw new ForbiddenException(
        'Only Secretariat can perform this workflow action',
      );
    }

    // A recommendation can only be submitted by the panel member who claimed
    // the application at the current stage.
    const recommendActions: UpdateApplicationStageDto['action'][] = [
      'EVALUATOR_RECOMMEND',
      'MPDC_RECOMMEND',
      'COUNCIL_RECOMMEND',
    ];
    if (
      recommendActions.includes(action) &&
      !this.isFullWorkflowAdmin(actor.role)
    ) {
      if (registration.stageClaimedById !== actor.id) {
        throw new ForbiddenException(
          'You must claim this application before submitting a recommendation',
        );
      }
    }
  }

  /**
   * Claim the current review stage for a panel member. Uses a conditional
   * UPDATE so two members cannot both claim the same application; the first
   * writer wins and later claimers get a 409.
   */
  private async claimApplicationStage(
    registration: RegistrationEntity,
    actor: UserEntity,
  ): Promise<{
    applicationId: string;
    status: ApplicationStatus;
    reviewStage?: ApplicationReviewStage;
    reviewedBy?: string;
    reviewedAt?: Date;
    membershipId?: string;
  }> {
    const stage = registration.reviewStage as ApplicationReviewStage;
    const now = new Date();
    const isEvaluatorStage = stage === ApplicationReviewStage.EVALUATOR_REVIEW;

    const result = await this.registrationRepository
      .createQueryBuilder()
      .update(RegistrationEntity)
      .set({
        stageClaimedById: actor.id,
        stageClaimedAt: now,
        ...(isEvaluatorStage
          ? { assignedEvaluatorId: actor.id, assignedAt: now }
          : {}),
      })
      .where(
        'id = :id AND "reviewStage" = :stage AND "stageClaimedById" IS NULL',
        { id: registration.id, stage },
      )
      .execute();

    if (!result.affected) {
      throw new ConflictException(
        'This application has already been claimed by another reviewer',
      );
    }

    registration.stageClaimedById = actor.id;
    registration.stageClaimedAt = now;
    if (isEvaluatorStage) {
      registration.assignedEvaluatorId = actor.id;
      registration.assignedAt = now;
    }

    await this.recordStageHistory(registration, {
      fromStage: stage,
      toStage: stage,
      action: 'CLAIMED',
      actedByUserId: actor.id,
    });

    this.logger.log(
      `Application ${registration.id} claimed by ${actor.id} at stage ${stage}`,
    );

    return {
      applicationId: registration.id,
      status: registration.status,
      reviewStage: registration.reviewStage,
      reviewedBy: actor.id,
      reviewedAt: now,
      membershipId: undefined,
    };
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
      case ApplicationReviewStage.SECRETARIAT_EVALUATOR_RECOMMENDATION:
      case ApplicationReviewStage.SECRETARIAT_MPDC_RECOMMENDATION:
      case ApplicationReviewStage.SECRETARIAT_COUNCIL_RECOMMENDATION:
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
        'ADVANCE_TO_EVALUATOR',
        'ASSIGN_EVALUATOR',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.EVALUATOR_REVIEW]: [
        'CLAIM',
        'EVALUATOR_RECOMMEND',
      ],
      [ApplicationReviewStage.SECRETARIAT_EVALUATOR_RECOMMENDATION]: [
        'SECRETARIAT_ADVANCE_TO_MPDC',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.MPDC_REVIEW]: [
        'CLAIM',
        'MPDC_RECOMMEND',
      ],
      [ApplicationReviewStage.SECRETARIAT_MPDC_RECOMMENDATION]: [
        'SECRETARIAT_ADVANCE_TO_COUNCIL',
        'RETURN_FOR_CHANGES',
        'REJECT',
      ],
      [ApplicationReviewStage.COUNCIL_REVIEW]: [
        'CLAIM',
        'COUNCIL_RECOMMEND',
      ],
      [ApplicationReviewStage.SECRETARIAT_COUNCIL_RECOMMENDATION]: [
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

  private getSecretariatStages(): ApplicationReviewStage[] {
    return [
      ApplicationReviewStage.SECRETARIAT_REVIEW,
      ApplicationReviewStage.SECRETARIAT_EVALUATOR_RECOMMENDATION,
      ApplicationReviewStage.SECRETARIAT_MPDC_RECOMMENDATION,
      ApplicationReviewStage.SECRETARIAT_COUNCIL_RECOMMENDATION,
    ];
  }

  private getLedgerYear(value?: Date | null): number {
    return (value ?? new Date()).getFullYear();
  }

  private getLedgerDate(item: { completedAt?: Date | null; createdAt: Date }) {
    return item.completedAt ?? item.createdAt;
  }

  private buildPaymentLedgerSummary(
    items: Array<{ amount: number; status: string; createdAt: Date; completedAt?: Date | null }>,
  ) {
    const now = new Date();
    const completedStatuses = new Set<string>([PaymentStatus.COMPLETED]);
    const completed = items.filter((item) => completedStatuses.has(item.status));
    const pending = items.filter((item) =>
      [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(item.status as PaymentStatus),
    );
    const failed = items.filter((item) =>
      [PaymentStatus.FAILED, PaymentStatus.CANCELLED].includes(item.status as PaymentStatus),
    );

    return {
      totalRevenue: completed.reduce((sum, item) => sum + item.amount, 0),
      thisMonth: completed
        .filter((item) => {
          const date = this.getLedgerDate(item);
          return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth()
          );
        })
        .reduce((sum, item) => sum + item.amount, 0),
      pending: pending.reduce((sum, item) => sum + item.amount, 0),
      currency: 'TZS',
      counts: {
        completed: completed.length,
        pending: pending.length,
        failed: failed.length,
        total: items.length,
      },
    };
  }

  private async getPaymentLedgerYears(): Promise<number[]> {
    const paymentYears = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('DISTINCT EXTRACT(YEAR FROM COALESCE(payment.completedAt, payment.createdAt))::int', 'year')
      .getRawMany<{ year: string | number }>();

    const feeYears = await this.feeRepository
      .createQueryBuilder('fee')
      .select('DISTINCT fee.year', 'year')
      .where('fee.status = :paid', { paid: FeeStatus.PAID })
      .getRawMany<{ year: string | number }>();

    return Array.from(
      new Set(
        [...paymentYears, ...feeYears]
          .map((row) => Number(row.year))
          .filter((value) => Number.isFinite(value)),
      ),
    ).sort((a, b) => b - a);
  }

  async listPayments(query: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    year?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.limit ?? 50, 200);
    const status = query.status?.toUpperCase();
    const type = query.type?.toUpperCase();
    const year = query.year;

    const paymentQuery = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user');

    if (status) {
      paymentQuery.andWhere('UPPER(payment.status::text) = :status', { status });
    }
    if (type) {
      paymentQuery.andWhere('UPPER(payment."paymentType"::text) = :type', { type });
    }
    if (year) {
      paymentQuery.andWhere(
        'EXTRACT(YEAR FROM COALESCE(payment.completedAt, payment.createdAt)) = :year',
        { year },
      );
    }

    const payments = await paymentQuery.getMany();

    const includeFees = !type || type === PaymentType.MEMBERSHIP_FEE;
    const includePaidFees = !status || status === PaymentStatus.COMPLETED;
    const fees =
      includeFees && includePaidFees
        ? await this.feeRepository
            .createQueryBuilder('fee')
            .leftJoinAndSelect('fee.user', 'user')
            .where('fee.status = :paid', { paid: FeeStatus.PAID })
            .andWhere(
              year ? 'fee.year = :year' : '1=1',
              year ? { year } : {},
            )
            .getMany()
        : [];

    const paymentItems = payments.map((payment) => {
      const ledgerDate = this.getLedgerDate(payment);
      return {
        id: payment.id,
        transactionRef:
          payment.transactionRef ??
          payment.receiptNumber ??
          payment.id.slice(0, 8).toUpperCase(),
        receiptNumber: payment.receiptNumber,
        receiptUrl: payment.receiptUrl,
        memberName: payment.user
          ? `${payment.user.firstName ?? ''} ${payment.user.lastName ?? ''}`.trim() ||
            payment.user.email
          : 'Unknown',
        memberEmail: payment.user?.email ?? null,
        paymentType: payment.paymentType,
        description: payment.description ?? payment.paymentType,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        completedAt: payment.completedAt ?? null,
        createdAt: payment.createdAt,
        year: this.getLedgerYear(ledgerDate),
        source: 'PAYMENT' as const,
        sourceLabel: 'Gateway payment',
      };
    });

    const feeItems = fees.map((fee) => {
      const ledgerDate = fee.paidAt ?? fee.createdAt;
      return {
        id: `fee-${fee.id}`,
        transactionRef:
          fee.receiptNumber ??
          fee.paymentId ??
          fee.id.slice(0, 8).toUpperCase(),
        receiptNumber: fee.receiptNumber ?? null,
        receiptUrl: fee.receiptUrl ?? null,
        memberName: fee.user
          ? `${fee.user.firstName ?? ''} ${fee.user.lastName ?? ''}`.trim() ||
            fee.user.email
          : 'Unknown',
        memberEmail: fee.user?.email ?? null,
        paymentType: PaymentType.MEMBERSHIP_FEE,
        description: fee.notes ?? `Membership fee ${fee.year}`,
        amount: fee.amount,
        currency: fee.currency,
        paymentMethod: fee.paymentMethod ?? 'Imported',
        status: PaymentStatus.COMPLETED,
        completedAt: fee.paidAt ?? fee.createdAt,
        createdAt: fee.createdAt,
        year: fee.year,
        source: 'MEMBERSHIP_FEE' as const,
        sourceLabel: 'Imported fee',
      };
    });

    const items = [...paymentItems, ...feeItems].sort((a, b) => {
      const dateA = this.getLedgerDate(a).getTime();
      const dateB = this.getLedgerDate(b).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = items.length;
    const summary = this.buildPaymentLedgerSummary(items);
    const years = await this.getPaymentLedgerYears();
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      items: paginatedItems,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      years,
      summary,
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
      .andWhere('user.membershipExpiryDate < :cutoff', { cutoff })
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

    const overdueUserIds = await this.getMembersWithThreeConsecutiveUnpaidFeeYears();

    let membershipsExpired = 0;
    if (overdueUserIds.length) {
      const expiredResult = await this.userRepository
        .createQueryBuilder()
        .update()
        .set({ membershipStatus: MembershipStatus.EXPIRED })
        .where('id IN (:...ids)', { ids: overdueUserIds })
        .andWhere('membershipStatus = :active', { active: MembershipStatus.ACTIVE })
        .execute();
      membershipsExpired = expiredResult.affected ?? 0;
    }

    this.logger.log(
      `Maintenance: ${feesMarkedOverdue} fees marked overdue, ${membershipsExpired} memberships expired`,
    );
    return { feesMarkedOverdue, membershipsExpired };
  }

  async expirePendingEventRegistrations(): Promise<number> {
    const result = await this.eventRegistrationRepository.update(
      {
        status: EventRegistrationStatus.PENDING_PAYMENT,
        paymentExpiresAt: LessThan(new Date()),
      },
      { status: EventRegistrationStatus.EXPIRED },
    );
    const count = result.affected ?? 0;
    this.logger.log(`Maintenance: ${count} pending event registration(s) marked as expired`);
    return count;
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

  private async sendInternalWorkflowNotification(
    registration: RegistrationEntity,
    action: UpdateApplicationStageDto['action'],
    actor: UserEntity,
  ): Promise<void> {
    const reference = registration.referenceNumber ?? registration.id;
    const applicationUrl = `/dashboard/applications/${registration.id}`;
    const applicantUrl = '/dashboard/status';

    if (action === 'ASSIGN_EVALUATOR' && registration.assignedEvaluatorId) {
      await this.notificationsService.sendAdminWorkflowNotification(
        registration.assignedEvaluatorId,
        NotificationType.APPLICATION_UPDATE,
        'Application Assigned',
        `Application ${reference} has been assigned to you for evaluator review.`,
        {
          actionUrl: applicationUrl,
          data: { applicationId: registration.id, action, assignedBy: actor.id },
          sendEmail: true,
          sendSms: true,
        },
      );
    }

    // Discipline-filtered evaluator broadcast: every active evaluator whose
    // disciplines cover the application's discipline (family) is emailed; the
    // first to claim locks it.
    if (action === 'ADVANCE_TO_EVALUATOR') {
      const discipline = registration.engineeringDiscipline;
      const evaluatorIds = discipline
        ? await this.getMatchingEvaluatorUserIds(discipline)
        : [];
      if (evaluatorIds.length) {
        await this.notificationsService.sendAdminWorkflowNotificationToUsers(
          evaluatorIds,
          NotificationType.APPLICATION_UPDATE,
          'Application Ready for Evaluator Review',
          `Application ${reference} (${discipline}) is ready for evaluator review. The first evaluator to claim it will handle the review.`,
          {
            actionUrl: applicationUrl,
            data: { applicationId: registration.id, action, actedBy: actor.id },
            sendEmail: true,
            sendSms: true,
          },
        );
      } else {
        this.logger.warn(
          `No matching evaluators for application ${reference} discipline "${discipline}"; it will sit unclaimed in the evaluator queue.`,
        );
      }
    }

    const queueRoleByAction: Partial<Record<UpdateApplicationStageDto['action'], UserRole>> = {
      SECRETARIAT_ADVANCE_TO_MPDC: UserRole.MPDC,
      SECRETARIAT_ADVANCE_TO_COUNCIL: UserRole.COUNCIL,
      EVALUATOR_RECOMMEND: UserRole.SECRETARIAT,
      MPDC_RECOMMEND: UserRole.SECRETARIAT,
      COUNCIL_RECOMMEND: UserRole.SECRETARIAT,
    };
    const queueRole = queueRoleByAction[action];
    const queueTitleByAction: Partial<Record<UpdateApplicationStageDto['action'], string>> = {
      SECRETARIAT_ADVANCE_TO_MPDC: 'Application Ready for MPDC Review',
      SECRETARIAT_ADVANCE_TO_COUNCIL: 'Application Ready for Council Review',
      EVALUATOR_RECOMMEND: 'Evaluator Recommendation Submitted',
      MPDC_RECOMMEND: 'MPDC Recommendation Submitted',
      COUNCIL_RECOMMEND: 'Council Recommendation Submitted',
    };
    const queueMessageByAction: Partial<Record<UpdateApplicationStageDto['action'], string>> = {
      SECRETARIAT_ADVANCE_TO_MPDC: `Application ${reference} has been advanced to MPDC review.`,
      SECRETARIAT_ADVANCE_TO_COUNCIL: `Application ${reference} has been advanced to Council review.`,
      EVALUATOR_RECOMMEND: `Application ${reference} has been recommended by the assigned evaluator and is waiting for Secretariat action.`,
      MPDC_RECOMMEND: `Application ${reference} has been recommended by MPDC and is waiting for Secretariat action.`,
      COUNCIL_RECOMMEND: `Application ${reference} has been recommended by Council and is waiting for Secretariat action.`,
    };

    if (queueRole) {
      await this.notificationsService.sendAdminWorkflowNotificationToRole(
        queueRole,
        NotificationType.APPLICATION_UPDATE,
        queueTitleByAction[action] ?? 'Application Workflow Update',
        queueMessageByAction[action] ??
          `Application ${reference} is now waiting for ${queueRole} action.`,
        {
          actionUrl: applicationUrl,
          data: { applicationId: registration.id, action, actedBy: actor.id },
          sendEmail: true,
          sendSms: true,
        },
      );
    }

    const applicantTitleByAction: Partial<Record<UpdateApplicationStageDto['action'], string>> = {
      ADVANCE_TO_EVALUATOR: 'Application Under Evaluation',
      ASSIGN_EVALUATOR: 'Application Under Evaluation',
      EVALUATOR_RECOMMEND: 'Application Advanced',
      SECRETARIAT_ADVANCE_TO_MPDC: 'Application Advanced to MPDC Review',
      MPDC_RECOMMEND: 'Application Advanced',
      SECRETARIAT_ADVANCE_TO_COUNCIL: 'Application Advanced to Council Review',
      COUNCIL_RECOMMEND: 'Council Recommendation Submitted',
    };
    const applicantMessageByAction: Partial<Record<UpdateApplicationStageDto['action'], string>> = {
      ADVANCE_TO_EVALUATOR: `Your application ${reference} has been forwarded for evaluator review.`,
      ASSIGN_EVALUATOR: `Your application ${reference} has been assigned to an evaluator for review.`,
      EVALUATOR_RECOMMEND: `Your application ${reference} has completed evaluator review and is now back with Secretariat.`,
      SECRETARIAT_ADVANCE_TO_MPDC: `Your application ${reference} has been forwarded to MPDC for further review.`,
      MPDC_RECOMMEND: `Your application ${reference} has completed MPDC review and is now back with Secretariat.`,
      SECRETARIAT_ADVANCE_TO_COUNCIL: `Your application ${reference} has been forwarded to Council for final review.`,
      COUNCIL_RECOMMEND: `Your application ${reference} has been recommended by Council and is awaiting the final Secretariat decision.`,
    };

    await this.notificationsService.sendMemberWorkflowNotification(
      registration.userId,
      NotificationType.APPLICATION_UPDATE,
      applicantTitleByAction[action] ?? 'Application Update',
      applicantMessageByAction[action] ??
        `Your application ${reference} has been updated.`,
      {
        actionUrl: applicantUrl,
        data: { applicationId: registration.id, action, actedBy: actor.id },
        sendEmail: true,
        sendSms: true,
      },
    );
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
      order: { level: 'ASC', name: 'ASC' },
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
      code: dto.code ?? null,
      level: dto.level ?? 0,
      yearlyFee: dto.yearlyFee,
      minYearsExperience: dto.minYearsExperience,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
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

  async getEngineeringInstitutions(query: EngineeringInstitutionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.engineeringInstitutionRepository
      .createQueryBuilder('institution')
      .orderBy('institution.name', 'ASC')
      .skip(skip)
      .take(limit);

    if (query.activeOnly) {
      queryBuilder.andWhere('institution.isActive = true');
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(institution.name ILIKE :search OR institution.country ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [institutions, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: institutions,
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

  async createEngineeringInstitution(dto: CreateEngineeringInstitutionDto) {
    const existing = await this.engineeringInstitutionRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Institution "${dto.name}" already exists`);
    }

    const institution = this.engineeringInstitutionRepository.create({
      name: dto.name,
      country: dto.country || 'Tanzania',
      institutionType: dto.institutionType || 'UNIVERSITY',
      recognitionStatus: dto.recognitionStatus || 'RECOGNIZED',
      isActive: dto.isActive ?? true,
      notes: dto.notes ?? null,
    });
    const saved = await this.engineeringInstitutionRepository.save(institution);
    return { success: true, data: saved };
  }

  async updateEngineeringInstitution(id: string, dto: UpdateEngineeringInstitutionDto) {
    const institution = await this.engineeringInstitutionRepository.findOne({
      where: { id },
    });
    if (!institution) {
      throw new NotFoundException('Engineering institution not found');
    }

    if (dto.name && dto.name !== institution.name) {
      const existing = await this.engineeringInstitutionRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException(`Institution "${dto.name}" already exists`);
      }
    }

    Object.assign(institution, dto);
    const saved = await this.engineeringInstitutionRepository.save(institution);
    return { success: true, data: saved };
  }

  async deleteEngineeringInstitution(id: string) {
    const institution = await this.engineeringInstitutionRepository.findOne({
      where: { id },
    });
    if (!institution) {
      throw new NotFoundException('Engineering institution not found');
    }

    institution.isActive = false;
    await this.engineeringInstitutionRepository.save(institution);
    return { success: true, message: 'Institution disabled successfully' };
  }

  // ============================================
  // DISCIPLINES (admin-managed tree)
  // ============================================

  async getDisciplines(query: DisciplineQueryDto) {
    const where: Record<string, unknown> = {};
    if (query.activeOnly) {
      where.isActive = true;
    }
    const disciplines = await this.disciplineRepository.find({
      where,
      order: { name: 'ASC' },
    });
    if (query.tree) {
      return { success: true, data: this.buildDisciplineTree(disciplines) };
    }
    return { success: true, data: disciplines };
  }

  private buildDisciplineTree(list: DisciplineEntity[]) {
    const byId = new Map(
      list.map((d) => [d.id, { ...d, children: [] as unknown[] }]),
    );
    const roots: unknown[] = [];
    for (const node of byId.values()) {
      const parent = node.parentId ? byId.get(node.parentId) : undefined;
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async createDiscipline(dto: CreateDisciplineDto) {
    const existing = await this.disciplineRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(`Discipline "${dto.name}" already exists`);
    }
    if (dto.parentId) {
      const parent = await this.disciplineRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent discipline not found');
      }
      if (parent.parentId) {
        throw new BadRequestException(
          'Disciplines can only be nested one level deep',
        );
      }
    }
    const discipline = this.disciplineRepository.create({
      name: dto.name,
      parentId: dto.parentId ?? null,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.disciplineRepository.save(discipline);
    return { success: true, data: saved };
  }

  async updateDiscipline(id: string, dto: UpdateDisciplineDto) {
    const discipline = await this.disciplineRepository.findOne({ where: { id } });
    if (!discipline) {
      throw new NotFoundException('Discipline not found');
    }
    if (dto.name && dto.name !== discipline.name) {
      const existing = await this.disciplineRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException(`Discipline "${dto.name}" already exists`);
      }
    }
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A discipline cannot be its own parent');
      }
      const parent = await this.disciplineRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent discipline not found');
      }
      if (parent.parentId) {
        throw new BadRequestException(
          'Disciplines can only be nested one level deep',
        );
      }
      const childCount = await this.disciplineRepository.count({
        where: { parentId: id },
      });
      if (childCount > 0) {
        throw new BadRequestException(
          'A discipline with sub-disciplines cannot itself be nested',
        );
      }
    }
    Object.assign(discipline, dto);
    const saved = await this.disciplineRepository.save(discipline);
    return { success: true, data: saved };
  }

  async deleteDiscipline(id: string) {
    const discipline = await this.disciplineRepository.findOne({ where: { id } });
    if (!discipline) {
      throw new NotFoundException('Discipline not found');
    }
    const childCount = await this.disciplineRepository.count({
      where: { parentId: id },
    });
    if (childCount > 0) {
      throw new BadRequestException(
        'Remove or reassign sub-disciplines before deleting this discipline',
      );
    }
    const tagCount = await this.userDisciplineRepository.count({
      where: { disciplineId: id },
    });
    if (tagCount > 0) {
      throw new BadRequestException(
        'This discipline is assigned to panel members; unassign them first',
      );
    }
    await this.disciplineRepository.remove(discipline);
    return { success: true, message: 'Discipline deleted successfully' };
  }

  // ---- Discipline resolution helpers (shared by queue scoping + routing) ----

  /** Discipline ids for a top-level name plus all its descendant sub-disciplines. */
  private async getDisciplineFamilyIds(rootName: string): Promise<string[]> {
    const root = await this.disciplineRepository.findOne({
      where: { name: rootName },
    });
    if (!root) {
      return [];
    }
    const ids = [root.id];
    let frontier = [root.id];
    while (frontier.length) {
      const children = await this.disciplineRepository.find({
        where: { parentId: In(frontier) },
      });
      const childIds = children
        .map((c) => c.id)
        .filter((cid) => !ids.includes(cid));
      if (!childIds.length) {
        break;
      }
      ids.push(...childIds);
      frontier = childIds;
    }
    return ids;
  }

  /**
   * The set of top-level (application-facing) discipline names an evaluator is
   * eligible for. Each of the evaluator's discipline tags is walked up to its
   * top-level root; the application's `engineeringDiscipline` is matched against
   * these root names.
   */
  async getEvaluatorApplicationDisciplineNames(
    userId: string,
  ): Promise<string[]> {
    const tags = await this.userDisciplineRepository.find({ where: { userId } });
    if (!tags.length) {
      return [];
    }
    const disciplines = await this.disciplineRepository.find({
      where: { id: In(tags.map((t) => t.disciplineId)) },
    });
    const rootNames = new Set<string>();
    for (const discipline of disciplines) {
      let current: DisciplineEntity | null = discipline;
      const guard = new Set<string>();
      while (current?.parentId && !guard.has(current.id)) {
        guard.add(current.id);
        current = await this.disciplineRepository.findOne({
          where: { id: current.parentId },
        });
      }
      if (current) {
        rootNames.add(current.name);
      }
    }
    return [...rootNames];
  }

  /** Active evaluator user ids tagged with the application's discipline family. */
  async getMatchingEvaluatorUserIds(disciplineName: string): Promise<string[]> {
    const familyIds = await this.getDisciplineFamilyIds(disciplineName);
    if (!familyIds.length) {
      return [];
    }
    const tags = await this.userDisciplineRepository.find({
      where: { disciplineId: In(familyIds) },
    });
    const userIds = [...new Set(tags.map((t) => t.userId))];
    if (!userIds.length) {
      return [];
    }
    const users = await this.userRepository.find({
      where: {
        id: In(userIds),
        role: In([UserRole.EVALUATOR, UserRole.REVIEWER]),
        isActive: true,
      },
    });
    return users.map((u) => u.id);
  }
}
