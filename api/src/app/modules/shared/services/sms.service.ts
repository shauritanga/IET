import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
  senderId?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * SMS Service - Mock Implementation
 *
 * This service provides a mock implementation for SMS sending.
 * Replace the mock methods with actual provider integration when ready.
 *
 * Supported providers to integrate:
 * - Africa's Talking (recommended for Tanzania)
 * - Twilio
 * - Beem Africa
 * - Nexmo/Vonage
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isDevelopment: boolean;
  private readonly defaultSenderId: string;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    this.defaultSenderId = configService.get('BEEM_SOURCE_ADDR', 'IET');
  }

  /**
   * Send an SMS message
   */
  async send(options: SmsOptions): Promise<SmsResult> {
    const { to, message, senderId = this.defaultSenderId } = options;

    // Validate phone number (Tanzania format)
    if (!this.isValidPhoneNumber(to)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        provider: 'mock',
      };
    }

    const apiKey = this.configService.get<string>('BEEM_API_KEY');
    const secretKey = this.configService.get<string>('BEEM_SECRET_KEY');

    if (apiKey && secretKey) {
      return this.sendViaBeem(to, message, senderId);
    }

    return this.mockSend(to, message, senderId);
  }

  /**
   * Send OTP/Verification code
   */
  async sendVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<SmsResult> {
    const message = `Your IET verification code is: ${code}. Valid for 10 minutes.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send login OTP for 2FA
   */
  async sendLoginOtp(phoneNumber: string, code: string): Promise<SmsResult> {
    const message = `Your IET admin login code is: ${code}. Valid for 5 minutes. Do not share this code.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    phoneNumber: string,
    amount: number,
    currency: string,
    receiptNumber: string,
  ): Promise<SmsResult> {
    const message = `IET Payment Confirmed: ${currency} ${amount.toLocaleString()}. Receipt: ${receiptNumber}. Thank you!`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send membership expiry reminder
   */
  async sendExpiryReminder(
    phoneNumber: string,
    memberName: string,
    expiryDate: Date,
    daysUntilExpiry: number,
  ): Promise<SmsResult> {
    const message = `Dear ${memberName}, your IET membership expires on ${expiryDate.toLocaleDateString()}. ${daysUntilExpiry} days remaining. Renew now to avoid interruption.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send event reminder
   */
  async sendEventReminder(
    phoneNumber: string,
    eventTitle: string,
    eventDate: Date,
    location: string,
  ): Promise<SmsResult> {
    const message = `IET Event Reminder: "${eventTitle}" on ${eventDate.toLocaleDateString()} at ${location}. See you there!`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send application status update
   */
  async sendApplicationStatusUpdate(
    phoneNumber: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    membershipId?: string,
  ): Promise<SmsResult> {
    let message: string;
    switch (status) {
      case 'APPROVED':
        message = `Congratulations! Your IET membership application has been approved. Your membership ID is ${membershipId}. Welcome to IET!`;
        break;
      case 'REJECTED':
        message = `Your IET membership application has been reviewed. Unfortunately, it was not approved. Please check your email for details.`;
        break;
      case 'CHANGES_REQUESTED':
        message = `Your IET membership application requires additional information. Please login to review and update your application.`;
        break;
    }
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send bulk SMS
   */
  async sendBulk(
    recipients: string[],
    message: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: SmsResult[];
  }> {
    const results: SmsResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.send({ to: recipient, message });
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      total: recipients.length,
      successful,
      failed,
      results,
    };
  }

  // ============================================
  // BEEM AFRICA INTEGRATION
  // ============================================

  private async sendViaBeem(
    to: string,
    message: string,
    senderId: string,
  ): Promise<SmsResult> {
    const apiKey = this.configService.get<string>('BEEM_API_KEY');
    const secretKey = this.configService.get<string>('BEEM_SECRET_KEY');
    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
    // Beem requires 255XXXXXXXXX format (no leading +)
    const normalizedPhone = this.formatPhoneNumber(to).replace(/^\+/, '');

    const body = {
      source_addr: senderId,
      encoding: 0,
      schedule_time: '',
      message,
      recipients: [{ recipient_id: 1, dest_addr: normalizedPhone }],
    };

    try {
      const res = await fetch('https://apisms.beem.africa/v1/send', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as any;

      if (!res.ok || !data.successful) {
        this.logger.error(`Beem SMS failed [HTTP ${res.status}]: ${JSON.stringify(data)}`);
        return {
          success: false,
          error: data.message || 'Beem API error',
          provider: 'beem',
        };
      }

      this.logger.log(
        `[BEEM] SMS sent to +${normalizedPhone}, requestId: ${data.request_id}`,
      );
      return {
        success: true,
        messageId: String(data.request_id),
        provider: 'beem',
      };
    } catch (error: any) {
      this.logger.error(`Beem SMS exception: ${error.message}`);
      return { success: false, error: error.message, provider: 'beem' };
    }
  }

  // ============================================
  // MOCK IMPLEMENTATION
  // ============================================

  private async mockSend(
    to: string,
    message: string,
    senderId: string,
  ): Promise<SmsResult> {
    // Simulate network delay
    await this.delay(100);

    const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK SMS] To: ${to}, From: ${senderId}`);
    this.logger.log(`[MOCK SMS] Message: ${message}`);
    this.logger.log(`[MOCK SMS] MessageId: ${messageId}`);

    return {
      success: true,
      messageId,
      provider: 'mock',
    };
  }

  // ============================================
  // AFRICA'S TALKING INTEGRATION (TEMPLATE)
  // ============================================

  /**
   * Uncomment and configure when ready to integrate
   *
   * Required env variables:
   * - AT_API_KEY
   * - AT_USERNAME
   * - AT_SENDER_ID
   */
  // private async sendViaAfricasTalking(to: string, message: string, senderId: string): Promise<SmsResult> {
  //     const apiKey = this.configService.get('AT_API_KEY');
  //     const username = this.configService.get('AT_USERNAME');
  //
  //     const AT = require('africastalking')({ apiKey, username });
  //     const sms = AT.SMS;
  //
  //     try {
  //         const result = await sms.send({
  //             to: [to],
  //             message,
  //             from: senderId
  //         });
  //
  //         return {
  //             success: true,
  //             messageId: result.SMSMessageData.Recipients[0].messageId,
  //             provider: 'africastalking'
  //         };
  //     } catch (error) {
  //         this.logger.error(`Africa's Talking SMS error: ${error.message}`);
  //         return {
  //             success: false,
  //             error: error.message,
  //             provider: 'africastalking'
  //         };
  //     }
  // }

  // ============================================
  // HELPER METHODS
  // ============================================

  private isValidPhoneNumber(phone: string): boolean {
    // Tanzania phone number validation
    // Accepts: +255XXXXXXXXX, 255XXXXXXXXX, 0XXXXXXXXX
    const tanzaniaRegex = /^(\+?255|0)?[67]\d{8}$/;
    return tanzaniaRegex.test(phone.replace(/\s/g, ''));
  }

  private formatPhoneNumber(phone: string): string {
    // Normalize to +255 format
    const cleaned = phone
      .replace(/\s/g, '')
      .replace(/^0/, '')
      .replace(/^\+?255/, '');
    return `+255${cleaned}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
