import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentEntity } from '../entities/payment.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { RegistrationEntity } from '../../registration/entities';
import {
  InitiatePaymentDto,
  InitiateApplicationPaymentDto,
  MpesaCallbackDto,
  SelcomCallbackDto,
  SelcomC2bCallbackDto,
  PaymentQueryDto,
} from '../dto';
import {
  ApplicationStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  RegistrationCategory,
  RegistrationStep,
  EventRegistrationStatus,
} from '../../../common/enums';
import { PaymentGatewayService } from '../../shared/services/payment-gateway.service';
import { SmsService } from '../../shared/services/sms.service';
import { EmailService } from '../../shared/services/email.service';
import { EventRegistrationEntity } from '../../events/entities';
import { GuestRegistrationEntity } from '../../guest/entities/guest-registration.entity';
import { v4 as uuid4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly completedGatewayStatuses = new Set([
    'SUCCESS',
    'SUCCESSFUL',
    'SUCCEEDED',
    'COMPLETED',
    'COMPLETE',
    'SETTLED',
    'PAID',
    'APPROVED',
  ]);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RegistrationEntity)
    private registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(EventRegistrationEntity)
    private eventRegistrationRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(GuestRegistrationEntity)
    private guestRegistrationRepository: Repository<GuestRegistrationEntity>,
    private configService: ConfigService,
    private paymentGateway: PaymentGatewayService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  /**
   * Initiate a payment
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
  ): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    paymentUrl?: string;
    mobileMoneyRef?: string;
    message?: string;
  }> {
    // Validate phone number for mobile money
    if (this.isMobileMoneyMethod(dto.paymentMethod) && !dto.phoneNumber) {
      throw new BadRequestException(
        'Phone number is required for mobile money payments',
      );
    }

    // Get user for email
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create payment record
    const payment = new PaymentEntity();
    payment.userId = userId;
    payment.paymentType = dto.paymentType;
    payment.amount = dto.amount;
    payment.currency = 'TZS';
    payment.status = PaymentStatus.PENDING;
    payment.paymentMethod = dto.paymentMethod;
    payment.description =
      dto.description || this.getPaymentDescription(dto.paymentType);
    payment.phoneNumber = dto.phoneNumber;
    payment.referenceId = dto.referenceId;
    payment.referenceType = dto.referenceType;
    payment.metadata = dto.metadata || {};
    payment.idempotencyKey = uuid4();

    let savedPayment = await this.paymentRepository.save(payment);
    const providerOrderReference = this.paymentGateway.usesClickPesa(
      dto.paymentMethod,
    )
      ? this.buildClickPesaOrderReference(savedPayment.id)
      : savedPayment.id;

    if (this.paymentGateway.usesClickPesa(dto.paymentMethod)) {
      savedPayment.metadata = {
        ...savedPayment.metadata,
        providerOrderReference,
      };
      savedPayment = await this.paymentRepository.save(savedPayment);
    }
    const apiUrl = this.configService.get<string>('API_URL');

    // Use PaymentGatewayService
    let gatewayResult;
    try {
      gatewayResult = await this.paymentGateway.initiatePayment(
        dto.paymentMethod,
        {
          amount: dto.amount,
          currency: 'TZS',
          phoneNumber: dto.phoneNumber || user.phoneNumber,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          reference: providerOrderReference,
          description: payment.description,
          callbackUrl: this.paymentGateway.getCallbackUrl(
            dto.paymentMethod,
            apiUrl,
          ),
          metadata: dto.metadata,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Payment provider initiation failed';
      savedPayment.status = PaymentStatus.FAILED;
      savedPayment.errorMessage = message;
      await this.paymentRepository.save(savedPayment);
      throw error;
    }

    // Update payment with provider response
    savedPayment.mobileMoneyRef = gatewayResult.transactionId;
    savedPayment.paymentUrl = gatewayResult.paymentUrl;
    savedPayment.providerResponse = gatewayResult.rawResponse || {};
    savedPayment.status = gatewayResult.success
      ? PaymentStatus.PROCESSING
      : PaymentStatus.FAILED;

    const hasGatewayReference =
      !!gatewayResult.transactionId || !!gatewayResult.paymentUrl;

    if (gatewayResult.success && !hasGatewayReference) {
      savedPayment.status = PaymentStatus.FAILED;
      savedPayment.errorMessage =
        gatewayResult.message ||
        'Payment provider did not return a valid payment reference';
    } else if (!gatewayResult.success) {
      savedPayment.errorMessage = gatewayResult.message;
    }

    await this.paymentRepository.save(savedPayment);

    this.logger.log(
      `Payment ${savedPayment.id} initiated for user ${userId} via ${dto.paymentMethod}`,
    );

    return {
      paymentId: savedPayment.id,
      amount: savedPayment.amount,
      currency: savedPayment.currency,
      paymentMethod: savedPayment.paymentMethod,
      status: savedPayment.status,
      paymentUrl: gatewayResult.paymentUrl,
      mobileMoneyRef: gatewayResult.transactionId,
      message: gatewayResult.message,
    };
  }

  async initiateApplicationPayment(
    userId: string,
    applicationId: string,
    dto: InitiateApplicationPaymentDto,
  ): Promise<{
    applicationId: string;
    paymentCompleted: boolean;
    paymentId: string;
    paymentStatus: PaymentStatus;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentUrl?: string;
    mobileMoneyRef?: string;
    phoneNumber?: string;
    transactionRef?: string;
    applicationType: RegistrationCategory;
    message?: string;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (
      registration.status !== ApplicationStatus.DRAFT &&
      registration.status !== ApplicationStatus.CHANGES_REQUESTED
    ) {
      throw new BadRequestException(
        'Application payment can only be made for editable registrations',
      );
    }

    const requiredSteps = [
      RegistrationStep.PERSONAL_DETAILS,
      RegistrationStep.REGISTRATION_DETAILS,
      RegistrationStep.EDUCATION_EXPERIENCE,
      RegistrationStep.REFERENCES,
    ];

    const missingSteps = requiredSteps.filter(
      (step) => !registration.completedSteps.includes(step),
    );

    if (missingSteps.length > 0) {
      throw new BadRequestException(
        `Please complete these steps before payment: ${missingSteps.join(', ')}`,
      );
    }

    if (registration.paymentCompleted && registration.paymentId) {
      const completedPayment = await this.paymentRepository.findOne({
        where: { id: registration.paymentId, userId },
      });

      return {
        applicationId: registration.id,
        paymentCompleted: true,
        paymentId: registration.paymentId,
        paymentStatus: completedPayment?.status ?? PaymentStatus.COMPLETED,
        amount:
          completedPayment?.amount ??
          this.getApplicationFeeAmount(dto.applicationType),
        currency: completedPayment?.currency ?? 'TZS',
        paymentMethod: completedPayment?.paymentMethod ?? PaymentMethod.SELCOM,
        paymentUrl: completedPayment?.paymentUrl,
        mobileMoneyRef: completedPayment?.mobileMoneyRef,
        phoneNumber: completedPayment?.phoneNumber,
        transactionRef: completedPayment?.transactionRef,
        applicationType: dto.applicationType,
        message: 'Application fee is already completed',
      };
    }

    // Return existing active payment instead of creating a duplicate
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        userId,
        referenceId: registration.id,
        referenceType: 'registration',
        paymentType: PaymentType.APPLICATION_FEE,
        status: In([PaymentStatus.PENDING, PaymentStatus.PROCESSING]),
      },
      order: { createdAt: 'DESC' },
    });

    if (existingPayment?.paymentUrl) {
      return {
        applicationId: registration.id,
        paymentCompleted: false,
        paymentId: existingPayment.id,
        paymentStatus: existingPayment.status,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        paymentMethod: PaymentMethod.SELCOM,
        paymentUrl: existingPayment.paymentUrl,
        mobileMoneyRef: existingPayment.mobileMoneyRef,
        phoneNumber: undefined,
        transactionRef: undefined,
        applicationType: dto.applicationType,
        message: 'Existing payment session resumed',
      };
    }

    const amount = this.getApplicationFeeAmount(dto.applicationType);

    const result = await this.initiatePayment(userId, {
      paymentType: PaymentType.APPLICATION_FEE,
      amount,
      paymentMethod: PaymentMethod.SELCOM,
      referenceId: registration.id,
      referenceType: 'registration',
      metadata: {
        applicationId: registration.id,
        applicationType: dto.applicationType,
      },
    });

    return {
      applicationId: registration.id,
      paymentCompleted: false,
      paymentId: result.paymentId,
      paymentStatus: result.status,
      amount: result.amount,
      currency: result.currency,
      paymentMethod: PaymentMethod.SELCOM,
      paymentUrl: result.paymentUrl,
      mobileMoneyRef: result.mobileMoneyRef,
      phoneNumber: undefined,
      transactionRef: undefined,
      applicationType: dto.applicationType,
      message: result.message,
    };
  }

  async getApplicationPaymentStatus(userId: string, applicationId: string) {
    const registration = await this.registrationRepository.findOne({
      where: { id: applicationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const payment = await this.paymentRepository.findOne({
      where: {
        userId,
        referenceId: registration.id,
        referenceType: 'registration',
        paymentType: PaymentType.APPLICATION_FEE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      return {
        applicationId: registration.id,
        paymentCompleted: registration.paymentCompleted,
        paymentId: registration.paymentId,
        paymentStatus: registration.paymentCompleted
          ? PaymentStatus.COMPLETED
          : null,
        paymentMethod: null,
        paymentUrl: null,
        phoneNumber: null,
        transactionRef: null,
        amount: null,
        currency: 'TZS',
        applicationType: null,
        message: registration.paymentCompleted
          ? 'Application fee payment completed'
          : 'Application fee payment has not been initiated yet',
      };
    }

    const syncedPayment = await this.syncPaymentState(payment);
    const expectedAmount =
      syncedPayment.metadata?.applicationType === RegistrationCategory.GRADUATE
        ? this.getApplicationFeeAmount(RegistrationCategory.GRADUATE)
        : this.getApplicationFeeAmount(RegistrationCategory.STANDARD);

    if (
      [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(
        syncedPayment.status,
      ) &&
      this.isOutdatedApplicationPaymentAmount(syncedPayment, expectedAmount)
    ) {
      await this.markPaymentFailed(
        syncedPayment.id,
        `Superseded by updated application fee amount ${expectedAmount}`,
      );

      return {
        applicationId: registration.id,
        paymentCompleted: registration.paymentCompleted,
        paymentId: registration.paymentId,
        paymentStatus: null,
        paymentMethod: null,
        paymentUrl: null,
        phoneNumber: null,
        transactionRef: null,
        amount: expectedAmount,
        currency: 'TZS',
        applicationType:
          syncedPayment.metadata?.applicationType ??
          registration.registrationCategory ??
          null,
        message: 'Application fee payment has not been initiated yet',
      };
    }

    return {
      applicationId: registration.id,
      paymentCompleted: syncedPayment.status === PaymentStatus.COMPLETED,
      paymentId: syncedPayment.id,
      paymentStatus: syncedPayment.status,
      paymentMethod: syncedPayment.paymentMethod,
      paymentUrl: syncedPayment.paymentUrl ?? null,
      phoneNumber: syncedPayment.phoneNumber ?? null,
      transactionRef: syncedPayment.transactionRef ?? null,
      amount:
        syncedPayment.status === PaymentStatus.COMPLETED
          ? syncedPayment.amount
          : expectedAmount,
      currency: syncedPayment.currency,
      applicationType:
        syncedPayment.metadata?.applicationType ??
        registration.registrationCategory ??
        null,
      message:
        syncedPayment.status === PaymentStatus.COMPLETED
          ? 'Application fee payment completed'
          : syncedPayment.errorMessage || 'Payment is awaiting confirmation',
    };
  }

  private getPaymentDescription(type: PaymentType): string {
    const descriptions: Record<PaymentType, string> = {
      [PaymentType.MEMBERSHIP_FEE]: 'Annual Membership Fee',
      [PaymentType.EVENT_REGISTRATION]: 'Event Registration Fee',
      [PaymentType.APPLICATION_FEE]: 'Membership Application Fee',
      [PaymentType.UPGRADE_FEE]: 'Membership Upgrade Fee',
    };
    return descriptions[type] || 'IET Payment';
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(
    paymentId: string,
    userId?: string,
  ): Promise<PaymentEntity> {
    const whereClause: any = { id: paymentId };
    if (userId) {
      whereClause.userId = userId;
    }

    const payment = await this.paymentRepository.findOne({
      where: whereClause,
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(
    userId: string,
    query: PaymentQueryDto,
  ): Promise<{
    items: PaymentEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, type } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId });

    if (type) {
      const types = type.split(',') as PaymentType[];
      queryBuilder.andWhere('payment.paymentType IN (:...types)', { types });
    }

    const [items, total] = await queryBuilder
      .orderBy('payment.createdAt', 'DESC')
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
   * Handle M-Pesa callback
   */
  async handleMpesaCallback(
    data: MpesaCallbackDto,
  ): Promise<{ ResultCode: number; ResultDesc: string }> {
    try {
      // Find payment by reference
      const payment = await this.paymentRepository.findOne({
        where: { id: data.BillRefNumber },
      });

      if (!payment) {
        this.logger.warn(
          `M-Pesa callback for unknown payment: ${data.BillRefNumber}`,
        );
        return { ResultCode: 0, ResultDesc: 'Success' };
      }

      // Update payment
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionRef = data.TransID;
      payment.completedAt = new Date();
      payment.providerResponse = {
        ...payment.providerResponse,
        mpesaCallback: data,
      };
      payment.receiptNumber = await this.generateReceiptNumber();

      await this.paymentRepository.save(payment);
      await this.updateRegistrationPaymentStatus(payment);

      // Send notifications
      await this.sendPaymentNotifications(payment);

      this.logger.log(
        `M-Pesa payment ${payment.id} completed, txn: ${data.TransID}`,
      );

      return { ResultCode: 0, ResultDesc: 'Success' };
    } catch (error) {
      this.logger.error(
        `Error processing M-Pesa callback: ${error.message}`,
        error.stack,
      );
      return { ResultCode: 0, ResultDesc: 'Success' };
    }
  }

  /**
   * Handle Selcom callback
   */
  async handleSelcomCallback(
    data: SelcomCallbackDto,
    auth: string,
  ): Promise<{ status: string }> {
    if (!this.verifySelcomWebhookToken(auth)) {
      this.logger.warn('Selcom legacy callback rejected: invalid token');
      return { status: 'OK' };
    }

    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: this.resolvePaymentId(data.reference) },
      });

      if (!payment) {
        this.logger.warn(
          `Selcom callback for unknown payment: ${data.reference}`,
        );
        return { status: 'OK' };
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        this.logger.log(`Selcom payment ${payment.id} already completed`);
        return { status: 'OK' };
      }

      if (data.resultcode === '000') {
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
        payment.receiptNumber = await this.generateReceiptNumber();
        await this.sendPaymentNotifications(payment);
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.errorMessage = data.result;
      }

      payment.transactionRef = data.transid;
      payment.providerResponse = {
        ...payment.providerResponse,
        selcomCallback: data,
      };

      await this.paymentRepository.save(payment);
      await this.updateRegistrationPaymentStatus(payment);
      this.logger.log(
        `Selcom payment ${payment.id} processed, status: ${payment.status}`,
      );

      return { status: 'OK' };
    } catch (error) {
      this.logger.error(
        `Error processing Selcom callback: ${error.message}`,
        error.stack,
      );
      return { status: 'OK' };
    }
  }

  async handleSelcomLookup(
    data: SelcomC2bCallbackDto,
    auth: string,
  ): Promise<Record<string, string>> {
    const fail = (code: string, msg: string) => ({
      reference: data.reference,
      resultcode: code,
      result: 'FAIL',
      message: msg,
    });

    if (!this.verifySelcomWebhookToken(auth)) {
      return fail('010', 'Unauthorized');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: this.resolvePaymentId(data.utilityref) },
      relations: ['user'],
    });

    if (!payment) {
      this.logger.warn(
        `Selcom lookup for unknown payment ref: ${data.utilityref}`,
      );
      return fail('010', 'Invalid payment reference');
    }

    const user = await this.userRepository.findOne({
      where: { id: payment.userId },
    });
    const name = user
      ? `${user.firstName} ${user.lastName}`.trim()
      : 'IET Member';

    this.logger.log(`Selcom lookup OK for payment ${payment.id}`);
    return {
      reference: data.reference,
      resultcode: '000',
      result: 'SUCCESS',
      message: 'Lookup successful',
      name,
    };
  }

  async handleSelcomValidation(
    data: SelcomC2bCallbackDto,
    auth: string,
  ): Promise<Record<string, string>> {
    const fail = (code: string, msg: string) => ({
      reference: data.reference,
      resultcode: code,
      result: 'FAIL',
      message: msg,
    });

    if (!this.verifySelcomWebhookToken(auth)) {
      return fail('010', 'Unauthorized');
    }

    const payment = await this.paymentRepository.findOne({
      where: { id: this.resolvePaymentId(data.utilityref) },
    });

    if (!payment) {
      this.logger.warn(
        `Selcom validation for unknown payment ref: ${data.utilityref}`,
      );
      return fail('010', 'Invalid payment reference');
    }

    if (data.amount) {
      const incoming = parseInt(data.amount, 10);
      if (!isNaN(incoming) && incoming !== payment.amount) {
        this.logger.warn(
          `Selcom amount mismatch for ${payment.id}: expected ${payment.amount}, got ${incoming}`,
        );
        return fail('012', 'Invalid amount');
      }
    }

    this.logger.log(`Selcom validation OK for payment ${payment.id}`);
    return {
      reference: data.reference,
      resultcode: '000',
      result: 'SUCCESS',
      message: 'Validation successful',
    };
  }

  async handleSelcomNotification(
    data: SelcomC2bCallbackDto,
    auth: string,
  ): Promise<Record<string, string>> {
    const fail = (code: string, msg: string) => ({
      reference: data.reference,
      resultcode: code,
      result: 'FAIL',
      message: msg,
    });

    if (!this.verifySelcomWebhookToken(auth)) {
      return fail('010', 'Unauthorized');
    }

    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: this.resolvePaymentId(data.utilityref) },
      });

      if (!payment) {
        this.logger.warn(
          `Selcom notification for unknown payment ref: ${data.utilityref}`,
        );
        return fail('010', 'Invalid payment reference');
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        this.logger.log(`Selcom payment ${payment.id} already completed`);
        return {
          reference: data.reference,
          resultcode: '000',
          result: 'SUCCESS',
          message: 'Already processed',
        };
      }

      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      payment.transactionRef = data.transid;
      payment.mobileMoneyRef = data.reference;
      payment.receiptNumber = await this.generateReceiptNumber();
      payment.providerResponse = {
        ...payment.providerResponse,
        selcomNotification: data,
      };

      const savedPayment = await this.paymentRepository.save(payment);
      await this.updateRegistrationPaymentStatus(savedPayment);
      await this.sendPaymentNotifications(savedPayment);

      this.logger.log(`Selcom payment ${payment.id} completed via notification`);
      return {
        reference: data.reference,
        resultcode: '000',
        result: 'SUCCESS',
        message: 'Payment confirmed',
      };
    } catch (error) {
      this.logger.error(
        `Error processing Selcom notification: ${error.message}`,
        error.stack,
      );
      return fail('4XX', 'Internal error');
    }
  }

  private verifySelcomWebhookToken(auth: string): boolean {
    const webhookToken = this.configService.get<string>('SELCOM_WEBHOOK_TOKEN');
    if (!webhookToken) {
      this.logger.warn('SELCOM_WEBHOOK_TOKEN not configured — rejecting webhook');
      return false;
    }
    const expected = `Bearer ${webhookToken}`;
    const valid = auth === expected;
    if (!valid) {
      this.logger.warn('Selcom webhook token verification failed');
    }
    return valid;
  }

  async handleClickPesaCallback(data: any): Promise<{ status: string }> {
    try {
      const payload = Array.isArray(data) ? data[0] : data;
      const orderReference =
        payload?.orderReference || payload?.paymentReference || payload?.reference;

      if (!orderReference) {
        this.logger.warn('ClickPesa callback received without order reference');
        return { status: 'OK' };
      }

      const paymentById = await this.paymentRepository.findOne({
        where: { id: orderReference },
      });
      const payment =
        paymentById ||
        (await this.findPaymentByProviderOrderReference(orderReference));

      if (!payment) {
        this.logger.warn(
          `ClickPesa callback for unknown payment: ${orderReference}`,
        );
        return { status: 'OK' };
      }

      const rawStatus = String(
        payload?.status || payload?.paymentStatus || payload?.transactionStatus || '',
      ).toUpperCase();

      if (this.completedGatewayStatuses.has(rawStatus)) {
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = payload?.updatedAt
          ? new Date(payload.updatedAt)
          : new Date();
        payment.transactionRef =
          payload?.paymentReference ||
          payload?.transactionReference ||
          payment.transactionRef;
        payment.receiptNumber =
          payment.receiptNumber || (await this.generateReceiptNumber());
        await this.sendPaymentNotifications(payment);
      } else if (rawStatus === 'FAILED') {
        payment.status = PaymentStatus.FAILED;
        payment.errorMessage = payload?.message || 'ClickPesa payment failed';
      } else if (rawStatus === 'CANCELLED') {
        payment.status = PaymentStatus.CANCELLED;
        payment.errorMessage = payload?.message || 'ClickPesa payment cancelled';
      } else {
        payment.status = PaymentStatus.PROCESSING;
      }

      payment.providerResponse = {
        ...payment.providerResponse,
        clickpesaCallback: payload,
      };

      const savedPayment = await this.paymentRepository.save(payment);
      await this.updateRegistrationPaymentStatus(savedPayment);

      return { status: 'OK' };
    } catch (error) {
      this.logger.error(
        `Error processing ClickPesa callback: ${error.message}`,
        error.stack,
      );
      return { status: 'OK' };
    }
  }

  /**
   * Send payment confirmation notifications
   */
  private async sendPaymentNotifications(
    payment: PaymentEntity,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOneBy({ id: payment.userId });
      if (!user) return;

      // Send SMS confirmation
      if (user.phoneNumber) {
        await this.smsService.sendPaymentConfirmation(
          user.phoneNumber,
          payment.amount,
          payment.currency,
          payment.receiptNumber,
        );
      }

      // Send email receipt
      await this.emailService.sendPaymentReceipt(
        user.email,
        user.firstName || 'Member',
        {
          receiptNumber: payment.receiptNumber,
          amount: payment.amount,
          currency: payment.currency,
          description: payment.description,
          date: payment.completedAt,
        },
      );

      this.logger.log(`Payment notifications sent for payment ${payment.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment notifications: ${error.message}`,
      );
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Mark payment as completed (manual/internal use)
   */
  async markPaymentCompleted(
    paymentId: string,
    transactionRef: string,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentById(paymentId);

    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.transactionRef = transactionRef;
    payment.completedAt = new Date();
    payment.receiptNumber = await this.generateReceiptNumber();

    const savedPayment = await this.paymentRepository.save(payment);
    await this.updateRegistrationPaymentStatus(savedPayment);
    return savedPayment;
  }

  /**
   * Mark payment as failed
   */
  async markPaymentFailed(
    paymentId: string,
    reason: string,
  ): Promise<PaymentEntity> {
    const payment = await this.getPaymentById(paymentId);
    payment.status = PaymentStatus.FAILED;
    payment.errorMessage = reason;
    const savedPayment = await this.paymentRepository.save(payment);
    await this.updateRegistrationPaymentStatus(savedPayment);
    return savedPayment;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private resolvePaymentId(ref: string): string {
    return ref?.startsWith('IET-') ? ref.slice(4) : ref;
  }

  private isMobileMoneyMethod(method: PaymentMethod): boolean {
    return [
      PaymentMethod.MPESA,
      PaymentMethod.AIRTEL_MONEY,
      PaymentMethod.TIGO_PESA,
      PaymentMethod.HALOPESA,
      ].includes(method);
  }

  private getApplicationFeeAmount(category: RegistrationCategory): number {
    return category === RegistrationCategory.GRADUATE
      ? Number(this.configService.get('APPLICATION_FEE_GRADUATE') || 5000)
      : Number(this.configService.get('APPLICATION_FEE_STANDARD') || 10000);
  }

  private isOutdatedApplicationPaymentAmount(
    payment: PaymentEntity,
    expectedAmount: number,
  ): boolean {
    return (
      payment.paymentType === PaymentType.APPLICATION_FEE &&
      [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status) &&
      payment.amount !== expectedAmount
    );
  }

  private buildClickPesaOrderReference(paymentId: string): string {
    const compactId = paymentId.replace(/[^a-zA-Z0-9]/g, '');
    return `PAY${compactId.slice(-17)}`;
  }

  private async findPaymentByProviderOrderReference(
    orderReference: string,
  ): Promise<PaymentEntity | null> {
    return this.paymentRepository
      .createQueryBuilder('payment')
      .where(`payment.metadata ->> 'providerOrderReference' = :orderReference`, {
        orderReference,
      })
      .getOne();
  }

  private async syncPaymentState(payment: PaymentEntity): Promise<PaymentEntity> {
    if (
      ![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status)
    ) {
      await this.updateRegistrationPaymentStatus(payment);
      return payment;
    }

    const providerReference =
      payment.mobileMoneyRef ||
      payment.transactionRef ||
      payment.metadata?.providerOrderReference ||
      payment.id;

    const gatewayStatus = await this.paymentGateway.checkPaymentStatus(
      payment.paymentMethod,
      providerReference,
    );

    if (gatewayStatus.status === 'COMPLETED') {
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionRef =
        gatewayStatus.transactionId || payment.transactionRef;
      payment.completedAt = gatewayStatus.paidAt || new Date();
      payment.receiptNumber =
        payment.receiptNumber || (await this.generateReceiptNumber());
      payment.errorMessage = null;
    } else if (gatewayStatus.status === 'FAILED') {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = gatewayStatus.message;
    } else if (gatewayStatus.status === 'CANCELLED') {
      payment.status = PaymentStatus.CANCELLED;
      payment.errorMessage = gatewayStatus.message;
    } else {
      payment.status = PaymentStatus.PROCESSING;
    }

    payment.providerResponse = {
      ...payment.providerResponse,
      statusCheck: gatewayStatus,
    };

    const savedPayment = await this.paymentRepository.save(payment);
    await this.updateRegistrationPaymentStatus(savedPayment);
    return savedPayment;
  }

  private canRetryApplicationPayment(payment: PaymentEntity): boolean {
    if (![PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(payment.status)) {
      return false;
    }

    const hasProviderReference =
      !!payment.mobileMoneyRef || !!payment.transactionRef || !!payment.paymentUrl;

    const lastStatusCheckSuccess =
      payment.providerResponse?.statusCheck?.success !== false;

    const ageMs =
      Date.now() - new Date(payment.updatedAt || payment.createdAt).getTime();

    return !hasProviderReference || !lastStatusCheckSuccess || ageMs > 5 * 60 * 1000;
  }

  private async updateRegistrationPaymentStatus(
    payment: PaymentEntity,
  ): Promise<void> {
    if (
      payment.paymentType === PaymentType.EVENT_REGISTRATION &&
      payment.referenceType === 'event_registration' &&
      payment.referenceId
    ) {
      await this.confirmEventRegistration(payment);
      return;
    }

    if (
      payment.referenceType === 'guest_registration' &&
      payment.referenceId
    ) {
      await this.confirmGuestRegistration(payment);
      return;
    }

    if (
      payment.referenceType !== 'registration' ||
      !payment.referenceId ||
      payment.paymentType !== PaymentType.APPLICATION_FEE
    ) {
      return;
    }

    const registration = await this.registrationRepository.findOne({
      where: { id: payment.referenceId },
    });

    if (!registration) {
      return;
    }

    registration.paymentId = payment.id;
    registration.paymentCompleted = payment.status === PaymentStatus.COMPLETED;

    if (payment.status === PaymentStatus.COMPLETED) {
      if (!registration.completedSteps.includes(RegistrationStep.PAYMENT)) {
        registration.completedSteps.push(RegistrationStep.PAYMENT);
      }

      if (
        registration.status === ApplicationStatus.DRAFT &&
        !registration.completedSteps.includes(RegistrationStep.DECLARATION)
      ) {
        registration.currentStep = RegistrationStep.PAYMENT;
      }
    }

    await this.registrationRepository.save(registration);

    if (payment.status === PaymentStatus.COMPLETED) {
      await this.sendPaymentNotifications(payment);
    }
  }

  private async confirmEventRegistration(
    payment: PaymentEntity,
  ): Promise<void> {
    const eventReg = await this.eventRegistrationRepository.findOne({
      where: { id: payment.referenceId },
    });

    if (!eventReg) {
      return;
    }

    eventReg.paymentId = payment.id;

    if (payment.status === PaymentStatus.COMPLETED) {
      eventReg.status = EventRegistrationStatus.CONFIRMED;
      eventReg.confirmedAt = new Date();
      eventReg.paymentExpiresAt = undefined;
      this.logger.log(
        `Event registration ${eventReg.id} confirmed after payment ${payment.id}`,
      );
    }
    // Failed payments keep the registration as PENDING_PAYMENT so the member can retry

    await this.eventRegistrationRepository.save(eventReg);
  }

  private async confirmGuestRegistration(
    payment: PaymentEntity,
  ): Promise<void> {
    const guestReg = await this.guestRegistrationRepository.findOne({
      where: { id: payment.referenceId },
      relations: ['event'],
    });

    if (!guestReg) {
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      guestReg.status = EventRegistrationStatus.CONFIRMED;
      guestReg.paymentStatus = PaymentStatus.COMPLETED;
      guestReg.transactionRef = payment.transactionRef || payment.mobileMoneyRef;
      guestReg.receiptNumber = payment.receiptNumber;
      guestReg.amountPaid = payment.amount;
      this.logger.log(
        `Guest registration ${guestReg.id} confirmed after payment ${payment.id}`,
      );
    } else if (payment.status === PaymentStatus.FAILED) {
      guestReg.paymentStatus = PaymentStatus.FAILED;
    }

    await this.guestRegistrationRepository.save(guestReg);
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select(
        'MAX(CAST(SUBSTRING(payment.receiptNumber, 14) AS INTEGER))',
        'maxNum',
      )
      .where('payment.receiptNumber LIKE :pattern', {
        pattern: `IET/PAY/${year}/%`,
      })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `IET/PAY/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Get payment gateway configuration status
   */
  getGatewayStatus() {
    return this.paymentGateway.getProviderStatus();
  }
}
