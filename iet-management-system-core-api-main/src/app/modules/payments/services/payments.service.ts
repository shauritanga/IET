import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentEntity } from '../entities/payment.entity';
import { UserEntity } from '../../user/entities/user.entity';
import {
  InitiatePaymentDto,
  MpesaCallbackDto,
  SelcomCallbackDto,
  PaymentQueryDto,
} from '../dto';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '../../../common/enums';
import { PaymentGatewayService } from '../../shared/services/payment-gateway.service';
import { SmsService } from '../../shared/services/sms.service';
import { EmailService } from '../../shared/services/email.service';
import { v4 as uuid4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
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

    const savedPayment = await this.paymentRepository.save(payment);

    // Use PaymentGatewayService
    const gatewayResult = await this.paymentGateway.initiatePayment(
      dto.paymentMethod,
      {
        amount: dto.amount,
        currency: 'TZS',
        phoneNumber: dto.phoneNumber,
        email: user.email,
        reference: savedPayment.id,
        description: payment.description,
        callbackUrl: `${this.configService.get('API_URL')}/payments/webhooks/${dto.paymentMethod.toLowerCase()}`,
        metadata: dto.metadata,
      },
    );

    // Update payment with provider response
    savedPayment.mobileMoneyRef = gatewayResult.transactionId;
    savedPayment.paymentUrl = gatewayResult.paymentUrl;
    savedPayment.providerResponse = gatewayResult.rawResponse || {};
    savedPayment.status = gatewayResult.success
      ? PaymentStatus.PROCESSING
      : PaymentStatus.FAILED;

    if (!gatewayResult.success) {
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
  ): Promise<{ status: string }> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { id: data.reference },
      });

      if (!payment) {
        this.logger.warn(
          `Selcom callback for unknown payment: ${data.reference}`,
        );
        return { status: 'OK' };
      }

      if (data.resultcode === '000') {
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = new Date();
        payment.receiptNumber = await this.generateReceiptNumber();

        // Send success notifications
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

    return this.paymentRepository.save(payment);
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
    return this.paymentRepository.save(payment);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isMobileMoneyMethod(method: PaymentMethod): boolean {
    return [
      PaymentMethod.MPESA,
      PaymentMethod.AIRTEL_MONEY,
      PaymentMethod.TIGO_PESA,
    ].includes(method);
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select(
        'MAX(CAST(SUBSTRING(payment.receiptNumber, 13) AS INTEGER))',
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
