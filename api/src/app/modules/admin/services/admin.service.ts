import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { RegistrationEntity } from '../../registration/entities/registration.entity';
import { MembershipFeeEntity } from '../../membership/entities/membership-fee.entity';
import { EventEntity, EventRegistrationEntity } from '../../events/entities';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { UserService } from '../../user/services/user.service';
import {
  MemberQueryDto,
  ApplicationQueryDto,
  ReviewApplicationDto,
  UpdateMemberStatusDto,
  AnalyticsQueryDto,
} from '../dto';
import {
  MembershipStatus,
  ApplicationStatus,
  PaymentStatus,
  FeeStatus,
} from '../../../common/enums';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(MembershipFeeEntity)
    private feeRepository: Repository<MembershipFeeEntity>,
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(EventRegistrationEntity)
    private eventRegistrationRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    private userService: UserService,
  ) {}

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
        status: In([
          ApplicationStatus.IN_REVIEW,
        ]),
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
      email: user.email,
      phoneNumber: user.phoneNumber,
      membershipClass: user.membershipClass,
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
  async listApplications(query: ApplicationQueryDto): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status } = query;
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
  async reviewApplication(
    applicationId: string,
    adminId: string,
    dto: ReviewApplicationDto,
  ): Promise<{
    applicationId: string;
    status: ApplicationStatus;
    reviewedBy: string;
    reviewedAt: Date;
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
        'Application cannot be reviewed in its current state',
      );
    }

    let newStatus: ApplicationStatus;
    let membershipId: string | undefined;

    switch (dto.action) {
      case 'APPROVE':
        if (!dto.membershipClass) {
          throw new BadRequestException(
            'Membership class is required for approval',
          );
        }
        newStatus = ApplicationStatus.APPROVED;

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
            membershipExpiryDate: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000,
            ),
          },
        );
        break;

      case 'REJECT':
        newStatus = ApplicationStatus.REJECTED;
        registration.rejectionReason = dto.comments;
        break;

      case 'REQUEST_CHANGES':
        newStatus = ApplicationStatus.CHANGES_REQUESTED;
        break;

      default:
        throw new BadRequestException('Invalid action');
    }

    registration.status = newStatus;
    registration.reviewedBy = adminId;
    registration.reviewedAt = new Date();
    registration.reviewComments = dto.comments;
    registration.updatedBy = adminId;

    await this.registrationRepository.save(registration);

    this.logger.log(
      `Application ${applicationId} ${dto.action}ed by admin ${adminId}`,
    );

    // TODO: Send notification to applicant

    return {
      applicationId: registration.id,
      status: newStatus,
      reviewedBy: adminId,
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
}
