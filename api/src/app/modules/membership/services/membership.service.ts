import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipFeeEntity } from '../entities/membership-fee.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipCategoryEntity } from '../../admin/entities/membership-category.entity';
import { SystemSettingEntity } from '../../admin/entities/system-setting.entity';
import {
  FeeStatus,
  MembershipClass,
  MembershipStatus,
  PaymentMethod,
} from '../../../common/enums';
import { InitiateFeePaymentDto } from '../dto';

type FiscalYearSettings = {
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

const FISCAL_YEAR_SETTING_KEY = 'membership_fiscal_year';
const DEFAULT_FISCAL_YEAR_SETTINGS: FiscalYearSettings = {
  startMonth: 7,
  startDay: 11,
  endMonth: 7,
  endDay: 10,
};

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  // Fee amounts per membership class (in TZS)
  private readonly FEE_AMOUNTS: Record<MembershipClass, number> = {
    [MembershipClass.GRADUATE]: 5000,
    [MembershipClass.ASSOCIATE]: 7500,
    [MembershipClass.MEMBER]: 10000,
    [MembershipClass.CORPORATE]: 15000,
    [MembershipClass.SENIOR]: 10000,
    [MembershipClass.FELLOW]: 5000,
    [MembershipClass.HONORARY]: 0,
  };

  constructor(
    @InjectRepository(MembershipFeeEntity)
    private feeRepository: Repository<MembershipFeeEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(MembershipCategoryEntity)
    private membershipCategoryRepository: Repository<MembershipCategoryEntity>,
    @InjectRepository(SystemSettingEntity)
    private settingRepository: Repository<SystemSettingEntity>,
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

  async getMembershipCategories(): Promise<
    Array<{
      id: string;
      name: string;
      code?: string | null;
      level: number;
      yearlyFee: number;
      minYearsExperience: number;
      description: string | null;
    }>
  > {
    return this.membershipCategoryRepository.find({
      where: { isActive: true },
      order: { level: 'ASC', minYearsExperience: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Get membership details for user
   */
  async getMembershipDetails(userId: string): Promise<{
    membershipId: string | null;
    membershipClass: MembershipClass | null;
    status: MembershipStatus;
    engineeringDiscipline: string | null;
    location: string | null;
    joiningDate: Date | null;
    expiryDate: Date | null;
    annualFee: number | null;
    nextPaymentDue: Date | null;
    daysUntilExpiry: number | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membershipCategory'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate next payment due date
    let nextPaymentDue: Date | null = null;
    const currentYear = new Date().getFullYear();
    const unpaidFee = await this.feeRepository.findOne({
      where: { userId, status: FeeStatus.PENDING, year: currentYear },
      order: { year: 'ASC' },
    });

    if (unpaidFee) {
      nextPaymentDue = unpaidFee.dueDate;
    }

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (user.membershipExpiryDate) {
      const now = new Date();
      const expiry = new Date(user.membershipExpiryDate);
      daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    const annualFee = user.membershipCategoryId
      ? user.membershipCategory?.yearlyFee ??
        (user.membershipClass
          ? await this.getMembershipFeeAmount(user.membershipClass)
          : null)
      : user.membershipClass
        ? await this.getMembershipFeeAmount(user.membershipClass)
        : null;

    return {
      membershipId: user.membershipId,
      membershipClass: user.membershipClass,
      status: user.membershipStatus,
      engineeringDiscipline: user.engineeringDiscipline,
      location: user.location,
      joiningDate: user.joiningDate,
      expiryDate: user.membershipExpiryDate,
      annualFee,
      nextPaymentDue,
      daysUntilExpiry,
    };
  }

  /**
   * Get fee history for user
   */
  async getFeeHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
    year?: number,
  ): Promise<{
    items: MembershipFeeEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.userId = :userId', { userId });

    if (year) {
      queryBuilder.andWhere('fee.year = :year', { year });
    }

    const [items, total] = await queryBuilder
      .orderBy('fee.year', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single fee record
   */
  async getFeeByYear(
    userId: string,
    year: number,
  ): Promise<MembershipFeeEntity | null> {
    return this.feeRepository.findOne({
      where: { userId, year },
    });
  }

  /**
   * Initiate fee payment
   */
  async initiateFeePayment(
    userId: string,
    dto: InitiateFeePaymentDto,
  ): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: string;
    mobileMoneyRef?: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['membershipCategory'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const effectiveMembershipClass =
      user.membershipClass ??
      this.resolveMembershipClassFromCategoryName(user.membershipCategory?.name);

    if (!effectiveMembershipClass && !user.membershipCategory) {
      throw new BadRequestException(
        'User does not have an active membership class',
      );
    }

    // Check if fee record exists for the year
    let fee = await this.feeRepository.findOne({
      where: { userId, year: dto.year },
    });

    if (!fee) {
      // Create fee record
      fee = new MembershipFeeEntity();
      fee.userId = userId;
      fee.year = dto.year;
      fee.membershipClass = effectiveMembershipClass ?? MembershipClass.MEMBER;
      fee.amount = user.membershipCategory?.yearlyFee ??
        (effectiveMembershipClass
          ? await this.getMembershipFeeAmount(effectiveMembershipClass)
          : 0);
      fee.currency = 'TZS';
      fee.status = FeeStatus.PENDING;
      fee.dueDate = await this.getFiscalYearEndDate(dto.year);
      fee = await this.feeRepository.save(fee);
    }

    if (fee.status === FeeStatus.PAID) {
      throw new BadRequestException('Fee for this year has already been paid');
    }

    // TODO: Integrate with actual payment gateway
    // For now, return mock payment initiation response
    const mobileMoneyRef =
      dto.paymentMethod !== PaymentMethod.SELCOM &&
      dto.paymentMethod !== PaymentMethod.DPO_BANK
        ? `REF${Date.now()}`
        : undefined;

    this.logger.log(
      `Payment initiated for user ${userId}, year ${dto.year}, amount ${fee.amount}`,
    );

    return {
      paymentId: fee.id,
      amount: fee.amount,
      currency: fee.currency,
      paymentMethod: dto.paymentMethod,
      status: 'PENDING',
      mobileMoneyRef,
    };
  }

  /**
   * Mark fee as paid (called by payment webhook)
   */
  async markFeePaid(
    feeId: string,
    transactionRef: string,
    paymentMethod: PaymentMethod,
  ): Promise<MembershipFeeEntity> {
    const fee = await this.feeRepository.findOne({
      where: { id: feeId },
      relations: ['user'],
    });

    if (!fee) {
      throw new NotFoundException('Fee record not found');
    }

    if (fee.status === FeeStatus.PAID) {
      return fee; // Already paid
    }

    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber(fee.year);

    fee.status = FeeStatus.PAID;
    fee.paidAt = new Date();
    fee.paymentMethod = paymentMethod;
    fee.transactionRef = transactionRef;
    fee.receiptNumber = receiptNumber;
    // TODO: Generate PDF receipt and set URL
    // fee.receiptUrl = await this.generateReceipt(fee);

    await this.feeRepository.save(fee);

    // Update user membership status and expiry
    const user = fee.user;
    user.membershipStatus = MembershipStatus.ACTIVE;
    user.membershipExpiryDate = await this.getFiscalYearEndDate(fee.year);
    await this.userRepository.save(user);

    this.logger.log(`Fee ${feeId} marked as paid, receipt: ${receiptNumber}`);

    return fee;
  }

  /**
   * Get receipt details
   */
  async getReceipt(
    userId: string,
    year: number,
  ): Promise<{
    receiptNumber: string;
    year: number;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    transactionRef: string;
    paidAt: Date;
    pdfUrl: string | null;
  }> {
    const fee = await this.feeRepository.findOne({
      where: { userId, year, status: FeeStatus.PAID },
    });

    if (!fee) {
      throw new NotFoundException(
        'Receipt not found. Payment may not be completed.',
      );
    }

    return {
      receiptNumber: fee.receiptNumber,
      year: fee.year,
      amount: fee.amount,
      currency: fee.currency,
      paymentMethod: fee.paymentMethod,
      transactionRef: fee.transactionRef,
      paidAt: fee.paidAt,
      pdfUrl: fee.receiptUrl,
    };
  }

  /**
   * Create annual fee records for all active members
   * (To be run by cron job at start of each year)
   */
  async createAnnualFees(year: number): Promise<number> {
    const activeMembers = await this.userRepository.find({
      where: { membershipStatus: MembershipStatus.ACTIVE },
      relations: ['membershipCategory'],
    });

    let created = 0;
    for (const member of activeMembers) {
      const effectiveMembershipClass =
        member.membershipClass ??
        this.resolveMembershipClassFromCategoryName(member.membershipCategory?.name);
      if (!effectiveMembershipClass && !member.membershipCategory) continue;

      // Check if fee already exists
      const existingFee = await this.feeRepository.findOne({
        where: { userId: member.id, year },
      });

      if (!existingFee) {
        const fee = new MembershipFeeEntity();
        fee.userId = member.id;
        fee.year = year;
        fee.membershipClass = effectiveMembershipClass ?? MembershipClass.MEMBER;
        fee.amount =
          member.membershipCategory?.yearlyFee ??
          (effectiveMembershipClass
            ? this.FEE_AMOUNTS[effectiveMembershipClass]
            : 0);
        fee.currency = 'TZS';
        fee.status = FeeStatus.PENDING;
        fee.dueDate = new Date(year, 6, 10); // July 10th
        await this.feeRepository.save(fee);
        created++;
      }
    }

    this.logger.log(`Created ${created} annual fee records for year ${year}`);
    return created;
  }

  /**
   * Update fee statuses (to be run by cron job)
   * Marks overdue and expiring fees
   */
  async updateFeeStatuses(): Promise<void> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    // Mark expiring fees (due within 30 days)
    await this.feeRepository
      .createQueryBuilder()
      .update(MembershipFeeEntity)
      .set({ status: FeeStatus.EXPIRING })
      .where('status = :pending', { pending: FeeStatus.PENDING })
      .andWhere('dueDate <= :thirtyDays', { thirtyDays: thirtyDaysFromNow })
      .andWhere('dueDate > :now', { now })
      .execute();

    // Mark overdue fees
    await this.feeRepository
      .createQueryBuilder()
      .update(MembershipFeeEntity)
      .set({ status: FeeStatus.OVERDUE })
      .where('status IN (:...statuses)', {
        statuses: [FeeStatus.PENDING, FeeStatus.EXPIRING],
      })
      .andWhere('dueDate < :now', { now })
      .execute();

    // Update membership status for members with overdue fees
    const overdueUserIds = await this.getMembersWithThreeConsecutiveUnpaidFeeYears();

    if (overdueUserIds.length > 0) {
      await this.userRepository
        .createQueryBuilder()
        .update(UserEntity)
        .set({ membershipStatus: MembershipStatus.EXPIRED })
        .whereInIds(overdueUserIds)
        .execute();
    }

    this.logger.log('Fee statuses updated');
  }

  private async getMembershipFeeAmount(
    membershipClass: MembershipClass,
  ): Promise<number> {
    const category = await this.membershipCategoryRepository.findOne({
      where: { name: membershipClass },
    });

    return category?.yearlyFee ?? this.FEE_AMOUNTS[membershipClass];
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

  private async getFiscalYearSettings(): Promise<FiscalYearSettings> {
    const setting = await this.settingRepository.findOneBy({
      key: FISCAL_YEAR_SETTING_KEY,
    });
    if (!setting) {
      return DEFAULT_FISCAL_YEAR_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_FISCAL_YEAR_SETTINGS,
        ...(JSON.parse(setting.value) as Partial<FiscalYearSettings>),
      };
    } catch {
      return DEFAULT_FISCAL_YEAR_SETTINGS;
    }
  }

  private async getFiscalYearEndDate(year: number): Promise<Date> {
    const settings = await this.getFiscalYearSettings();
    const date = new Date(year, settings.endMonth - 1, settings.endDay);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  /**
   * Generate receipt number
   */
  private async generateReceiptNumber(year: number): Promise<string> {
    const result = await this.feeRepository
      .createQueryBuilder('fee')
      .select(
        'MAX(CAST(SUBSTRING(fee.receiptNumber, 14) AS INTEGER))',
        'maxNum',
      )
      .where('fee.receiptNumber LIKE :pattern', {
        pattern: `IET/RCT/${year}/%`,
      })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `IET/RCT/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }
}
