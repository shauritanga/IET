import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from '../shared/services/email.service';
import { EMAIL_QUEUE } from './queue.constants';

@Processor(EMAIL_QUEUE)
export class EmailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing email job ${job.id} (${job.name})`);

    let result;
    switch (job.name) {
      case 'portal-welcome':
        result = await this.emailService.sendPortalAccountWelcomeEmail(
          job.data,
        );
        break;
      case 'verification':
        result = await this.emailService.sendVerificationEmail(
          job.data.email,
          job.data.firstName,
          job.data.code,
        );
        break;
      case 'login-otp':
        result = await this.emailService.sendLoginOtpEmail(
          job.data.email,
          job.data.firstName,
          job.data.code,
          job.data.portal,
        );
        break;
      case 'welcome':
        result = await this.emailService.sendWelcomeEmail(
          job.data.email,
          job.data.firstName,
        );
        break;
      case 'password-reset':
        result = await this.emailService.sendPasswordResetEmail(
          job.data.email,
          job.data.firstName,
          job.data.resetToken,
          job.data.portal,
        );
        break;
      case 'payment-receipt':
        result = await this.emailService.sendPaymentReceipt(
          job.data.email,
          job.data.firstName,
          {
            ...job.data.receipt,
            date: new Date(job.data.receipt.date),
          },
        );
        break;
      case 'application-status':
        result = await this.emailService.sendApplicationStatusEmail(
          job.data.email,
          job.data.firstName,
          job.data.status,
          job.data.details,
        );
        break;
      case 'application-submitted':
        result = await this.emailService.sendApplicationSubmittedEmail(
          job.data.email,
          job.data.firstName,
          job.data.referenceNumber,
        );
        break;
      case 'expiry-reminder':
        result = await this.emailService.sendExpiryReminder(
          job.data.email,
          job.data.firstName,
          new Date(job.data.expiryDate),
          job.data.daysUntilExpiry,
        );
        break;
      case 'event-registration':
        result = await this.emailService.sendEventRegistrationEmail(
          job.data.email,
          job.data.firstName,
          {
            ...job.data.event,
            date: new Date(job.data.event.date),
          },
        );
        break;
      case 'send':
      default:
        result = await this.emailService.send(job.data);
        break;
    }

    if (!result?.success) {
      throw new Error(result?.error || `Email job ${job.name} failed`);
    }
  }
}
