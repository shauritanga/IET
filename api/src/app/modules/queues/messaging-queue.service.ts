import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { AuthPortal } from '../../common/enums';
import {
  EmailOptions,
  EmailResult,
  EmailService,
} from '../shared/services/email.service';
import {
  SmsOptions,
  SmsResult,
  SmsService,
} from '../shared/services/sms.service';
import {
  DEFAULT_JOB_OPTIONS,
  EMAIL_QUEUE,
  OTP_JOB_OPTIONS,
  SMS_QUEUE,
} from './queue.constants';

@Injectable()
export class MessagingQueueService {
  private readonly logger = new Logger(MessagingQueueService.name);
  private readonly queueEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    @Optional() @InjectQueue(EMAIL_QUEUE) private readonly emailQueue?: Queue,
    @Optional() @InjectQueue(SMS_QUEUE) private readonly smsQueue?: Queue,
  ) {
    this.queueEnabled =
      this.configService.get<boolean>('MESSAGING_QUEUE_ENABLED') !== false &&
      !!this.emailQueue &&
      !!this.smsQueue;

    if (this.queueEnabled) {
      this.logger.log('Messaging queues enabled (BullMQ)');
    } else {
      this.logger.warn(
        'Messaging queues disabled — email/SMS will send inline',
      );
    }
  }

  isQueueEnabled(): boolean {
    return this.queueEnabled;
  }

  async enqueueEmail(
    options: EmailOptions,
    jobOptions?: JobsOptions,
  ): Promise<EmailResult> {
    if (!this.queueEnabled || !this.emailQueue) {
      return this.emailService.send(options);
    }

    const job = await this.emailQueue.add('send', options, {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions,
    });
    this.logger.debug(`Queued email job ${job.id} → ${options.to}`);
    return { success: true, messageId: String(job.id), provider: 'bullmq' };
  }

  async enqueueSms(
    options: SmsOptions,
    jobOptions?: JobsOptions,
  ): Promise<SmsResult> {
    if (!this.queueEnabled || !this.smsQueue) {
      return this.smsService.send(options);
    }

    const job = await this.smsQueue.add('send', options, {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions,
    });
    this.logger.debug(`Queued SMS job ${job.id} → ${options.to}`);
    return { success: true, messageId: String(job.id), provider: 'bullmq' };
  }

  async enqueuePortalWelcomeEmail(params: {
    email: string;
    firstName: string;
    role: string;
    temporaryPassword?: string;
    portal: AuthPortal;
  }): Promise<EmailResult> {
    return this.enqueueNamedEmail('portal-welcome', params);
  }

  async enqueueVerificationEmail(
    email: string,
    firstName: string,
    code: string,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail(
      'verification',
      { email, firstName, code },
      OTP_JOB_OPTIONS,
    );
  }

  async enqueueLoginOtpEmail(
    email: string,
    firstName: string,
    code: string,
    portal: AuthPortal = AuthPortal.MEMBER_PORTAL,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail(
      'login-otp',
      { email, firstName, code, portal },
      OTP_JOB_OPTIONS,
    );
  }

  async enqueueWelcomeEmail(
    email: string,
    firstName: string,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('welcome', { email, firstName });
  }

  async enqueuePasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
    portal: AuthPortal = AuthPortal.MEMBER_PORTAL,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail(
      'password-reset',
      { email, firstName, resetToken, portal },
      OTP_JOB_OPTIONS,
    );
  }

  async enqueuePaymentReceipt(
    email: string,
    firstName: string,
    receipt: {
      receiptNumber: string;
      amount: number;
      currency: string;
      description: string;
      date: Date | string;
    },
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('payment-receipt', {
      email,
      firstName,
      receipt: {
        ...receipt,
        date:
          receipt.date instanceof Date
            ? receipt.date.toISOString()
            : receipt.date,
      },
    });
  }

  async enqueueApplicationStatusEmail(
    email: string,
    firstName: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    details: {
      membershipId?: string;
      membershipClass?: string;
      reason?: string;
    },
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('application-status', {
      email,
      firstName,
      status,
      details,
    });
  }

  async enqueueApplicationSubmittedEmail(
    email: string,
    firstName: string,
    referenceNumber: string,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('application-submitted', {
      email,
      firstName,
      referenceNumber,
    });
  }

  async enqueueExpiryReminderEmail(
    email: string,
    firstName: string,
    expiryDate: Date | string,
    daysUntilExpiry: number,
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('expiry-reminder', {
      email,
      firstName,
      expiryDate:
        expiryDate instanceof Date ? expiryDate.toISOString() : expiryDate,
      daysUntilExpiry,
    });
  }

  async enqueueEventRegistrationEmail(
    email: string,
    firstName: string,
    event: {
      title: string;
      date: Date | string;
      location: string;
      ticketNumber: string;
    },
  ): Promise<EmailResult> {
    return this.enqueueNamedEmail('event-registration', {
      email,
      firstName,
      event: {
        ...event,
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
      },
    });
  }

  async enqueueLoginOtpSms(
    phoneNumber: string,
    code: string,
    portal: AuthPortal = AuthPortal.MEMBER_PORTAL,
  ): Promise<SmsResult> {
    return this.enqueueNamedSms(
      'login-otp',
      { phoneNumber, code, portal },
      OTP_JOB_OPTIONS,
    );
  }

  async enqueueVerificationSms(
    phoneNumber: string,
    code: string,
  ): Promise<SmsResult> {
    return this.enqueueNamedSms(
      'verification',
      { phoneNumber, code },
      OTP_JOB_OPTIONS,
    );
  }

  async enqueuePaymentConfirmationSms(
    phoneNumber: string,
    amount: number,
    currency: string,
    receiptNumber: string,
  ): Promise<SmsResult> {
    return this.enqueueNamedSms('payment-confirmation', {
      phoneNumber,
      amount,
      currency,
      receiptNumber,
    });
  }

  async enqueueApplicationStatusSms(
    phoneNumber: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    membershipId?: string,
  ): Promise<SmsResult> {
    return this.enqueueNamedSms('application-status', {
      phoneNumber,
      status,
      membershipId,
    });
  }

  async enqueueExpiryReminderSms(
    phoneNumber: string,
    memberName: string,
    expiryDate: Date | string,
    daysUntilExpiry: number,
  ): Promise<SmsResult> {
    return this.enqueueNamedSms('expiry-reminder', {
      phoneNumber,
      memberName,
      expiryDate:
        expiryDate instanceof Date ? expiryDate.toISOString() : expiryDate,
      daysUntilExpiry,
    });
  }

  private async enqueueNamedEmail(
    name: string,
    data: Record<string, any>,
    jobOptions?: JobsOptions,
  ): Promise<EmailResult> {
    if (!this.queueEnabled || !this.emailQueue) {
      return this.dispatchEmailInline(name, data);
    }

    const job = await this.emailQueue.add(name, data, {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions,
    });
    this.logger.debug(`Queued email job ${job.id} (${name})`);
    return { success: true, messageId: String(job.id), provider: 'bullmq' };
  }

  private async enqueueNamedSms(
    name: string,
    data: Record<string, any>,
    jobOptions?: JobsOptions,
  ): Promise<SmsResult> {
    if (!this.queueEnabled || !this.smsQueue) {
      return this.dispatchSmsInline(name, data);
    }

    const job = await this.smsQueue.add(name, data, {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions,
    });
    this.logger.debug(`Queued SMS job ${job.id} (${name})`);
    return { success: true, messageId: String(job.id), provider: 'bullmq' };
  }

  private async dispatchEmailInline(
    name: string,
    data: Record<string, any>,
  ): Promise<EmailResult> {
    switch (name) {
      case 'portal-welcome':
        return this.emailService.sendPortalAccountWelcomeEmail(data as any);
      case 'verification':
        return this.emailService.sendVerificationEmail(
          data.email,
          data.firstName,
          data.code,
        );
      case 'login-otp':
        return this.emailService.sendLoginOtpEmail(
          data.email,
          data.firstName,
          data.code,
          data.portal,
        );
      case 'welcome':
        return this.emailService.sendWelcomeEmail(data.email, data.firstName);
      case 'password-reset':
        return this.emailService.sendPasswordResetEmail(
          data.email,
          data.firstName,
          data.resetToken,
          data.portal,
        );
      case 'payment-receipt':
        return this.emailService.sendPaymentReceipt(
          data.email,
          data.firstName,
          {
            ...data.receipt,
            date: new Date(data.receipt.date),
          },
        );
      case 'application-status':
        return this.emailService.sendApplicationStatusEmail(
          data.email,
          data.firstName,
          data.status,
          data.details,
        );
      case 'application-submitted':
        return this.emailService.sendApplicationSubmittedEmail(
          data.email,
          data.firstName,
          data.referenceNumber,
        );
      case 'expiry-reminder':
        return this.emailService.sendExpiryReminder(
          data.email,
          data.firstName,
          new Date(data.expiryDate),
          data.daysUntilExpiry,
        );
      case 'event-registration':
        return this.emailService.sendEventRegistrationEmail(
          data.email,
          data.firstName,
          {
            ...data.event,
            date: new Date(data.event.date),
          },
        );
      default:
        return this.emailService.send(data as EmailOptions);
    }
  }

  private async dispatchSmsInline(
    name: string,
    data: Record<string, any>,
  ): Promise<SmsResult> {
    switch (name) {
      case 'login-otp':
        return this.smsService.sendLoginOtp(
          data.phoneNumber,
          data.code,
          data.portal,
        );
      case 'verification':
        return this.smsService.sendVerificationCode(
          data.phoneNumber,
          data.code,
        );
      case 'payment-confirmation':
        return this.smsService.sendPaymentConfirmation(
          data.phoneNumber,
          data.amount,
          data.currency,
          data.receiptNumber,
        );
      case 'application-status':
        return this.smsService.sendApplicationStatusUpdate(
          data.phoneNumber,
          data.status,
          data.membershipId,
        );
      case 'expiry-reminder':
        return this.smsService.sendExpiryReminder(
          data.phoneNumber,
          data.memberName,
          new Date(data.expiryDate),
          data.daysUntilExpiry,
        );
      default:
        return this.smsService.send(data as SmsOptions);
    }
  }
}
