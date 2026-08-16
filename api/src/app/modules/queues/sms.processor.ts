import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SmsService } from '../shared/services/sms.service';
import { SMS_QUEUE } from './queue.constants';

@Processor(SMS_QUEUE)
export class SmsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsQueueProcessor.name);

  constructor(private readonly smsService: SmsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.debug(`Processing SMS job ${job.id} (${job.name})`);

    let result;
    switch (job.name) {
      case 'login-otp':
        result = await this.smsService.sendLoginOtp(
          job.data.phoneNumber,
          job.data.code,
          job.data.portal,
        );
        break;
      case 'verification':
        result = await this.smsService.sendVerificationCode(
          job.data.phoneNumber,
          job.data.code,
        );
        break;
      case 'payment-confirmation':
        result = await this.smsService.sendPaymentConfirmation(
          job.data.phoneNumber,
          job.data.amount,
          job.data.currency,
          job.data.receiptNumber,
        );
        break;
      case 'application-status':
        result = await this.smsService.sendApplicationStatusUpdate(
          job.data.phoneNumber,
          job.data.status,
          job.data.membershipId,
        );
        break;
      case 'expiry-reminder':
        result = await this.smsService.sendExpiryReminder(
          job.data.phoneNumber,
          job.data.memberName,
          new Date(job.data.expiryDate),
          job.data.daysUntilExpiry,
        );
        break;
      case 'membership-fee-reminder':
        result = await this.smsService.sendMembershipFeeReminder(
          job.data.phoneNumber,
          job.data.memberName,
          job.data.year,
          job.data.amountLabel,
          job.data.reminderStep,
        );
        break;
      case 'event-reminder':
        result = await this.smsService.sendEventReminder(
          job.data.phoneNumber,
          job.data.eventTitle,
          new Date(job.data.eventDate),
          job.data.location,
        );
        break;
      case 'send':
      default:
        result = await this.smsService.send(job.data);
        break;
    }

    if (!result?.success) {
      throw new Error(result?.error || `SMS job ${job.name} failed`);
    }
  }
}
