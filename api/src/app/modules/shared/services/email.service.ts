import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { AuthPortal } from '../../../common/enums';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

/**
 * Email Service - Nodemailer SMTP with Mock Fallback
 *
 * When SMTP_HOST is configured, emails are sent via SMTP (Nodemailer).
 * When SMTP_HOST is not set, a mock implementation logs emails to console.
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment: boolean;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly smtpEnabled: boolean;
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    this.fromEmail = configService.get('EMAIL_FROM', 'noreply@iet.or.tz');
    this.fromName = configService.get('EMAIL_FROM_NAME', 'IET Tanzania');
    this.smtpEnabled = !!configService.get('SMTP_HOST');

    if (this.smtpEnabled) {
      const rejectUnauthorized =
        configService.get('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false';
      this.transporter = nodemailer.createTransport({
        host: configService.get('SMTP_HOST'),
        port: configService.get<number>('SMTP_PORT', 465),
        secure:
          configService.get('SMTP_SECURE') === 'true' ||
          configService.get('SMTP_SECURE') === true,
        auth: {
          user: configService.get('SMTP_USER'),
          pass: configService.get('SMTP_PASS'),
        },
        tls: { rejectUnauthorized },
      });
      this.logger.log(
        `SMTP transport configured: ${configService.get('SMTP_HOST')}:${configService.get('SMTP_PORT', 465)}`,
      );
    } else {
      this.logger.log('SMTP not configured - using mock email service');
    }
  }

  async onModuleInit() {
    if (!this.smtpEnabled) {
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error: any) {
      this.logger.error(`SMTP verification failed: ${error.message}`);
    }
  }

  /**
   * Send an email (via SMTP if configured, otherwise mock)
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    if (this.smtpEnabled) {
      return this.sendViaSmtp(options);
    }
    return this.mockSend(options);
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
  ): Promise<EmailResult> {
    const html = this.getTemplate('welcome', { firstName });
    return this.send({
      to: email,
      subject: 'Welcome to IET Tanzania',
      html,
    });
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(
    email: string,
    firstName: string,
    code: string,
  ): Promise<EmailResult> {
    const html = this.getTemplate('verification', { firstName, code });
    return this.send({
      to: email,
      subject: 'Verify Your IET Email Address',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
    portal: AuthPortal = AuthPortal.MEMBER_PORTAL,
  ): Promise<EmailResult> {
    const isAdminPortal = portal === AuthPortal.ADMIN_PORTAL;
    const baseUrl = isAdminPortal
      ? this.configService.get('ADMIN_PORTAL_URL') ?? this.configService.get('APP_URL')
      : this.configService.get('ENGINEER_PORTAL_URL') ?? this.configService.get('APP_URL');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
    const portalLabel = isAdminPortal ? 'Admin Portal' : 'Member Portal';
    const html = this.getTemplate('password-reset', {
      firstName,
      resetUrl,
      portalLabel,
    });
    return this.send({
      to: email,
      subject: `Reset Your IET ${portalLabel} Password`,
      html,
    });
  }

  /**
   * Send application submitted confirmation email
   */
  async sendApplicationSubmittedEmail(
    email: string,
    firstName: string,
    referenceNumber: string,
  ): Promise<EmailResult> {
    const portalUrl =
      this.configService.get<string>('ENGINEER_PORTAL_URL') ??
      this.configService.get<string>('APP_URL');
    const applicationStatusUrl = `${portalUrl}/dashboard/status`;
    const html = this.getTemplate('application-submitted', {
      firstName,
      referenceNumber,
      applicationStatusUrl,
    });
    return this.send({
      to: email,
      subject: `Your IET Application Has Been Submitted - ${referenceNumber}`,
      html,
    });
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(
    email: string,
    firstName: string,
    receipt: {
      receiptNumber: string;
      amount: number;
      currency: string;
      description: string;
      date: Date;
    },
  ): Promise<EmailResult> {
    const html = this.getTemplate('payment-receipt', { firstName, ...receipt });
    return this.send({
      to: email,
      subject: `Payment Receipt - ${receipt.receiptNumber}`,
      html,
    });
  }

  /**
   * Send membership expiry reminder
   */
  async sendExpiryReminder(
    email: string,
    firstName: string,
    expiryDate: Date,
    daysUntilExpiry: number,
  ): Promise<EmailResult> {
    const html = this.getTemplate('expiry-reminder', {
      firstName,
      expiryDate,
      daysUntilExpiry,
    });
    return this.send({
      to: email,
      subject: `Your IET Membership Expires in ${daysUntilExpiry} Days`,
      html,
    });
  }

  /**
   * Send application status update
   */
  async sendApplicationStatusEmail(
    email: string,
    firstName: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    details: {
      membershipId?: string;
      membershipClass?: string;
      reason?: string;
    },
  ): Promise<EmailResult> {
    const statusSubjects = {
      APPROVED: 'Congratulations! Your IET Membership Application is Approved',
      REJECTED: 'Update on Your IET Membership Application',
      CHANGES_REQUESTED: 'Action Required: Your IET Application Needs Updates',
    };

    const html = this.getTemplate(`application-${status.toLowerCase()}`, {
      firstName,
      ...details,
    });
    return this.send({
      to: email,
      subject: statusSubjects[status],
      html,
    });
  }

  /**
   * Send event registration confirmation
   */
  async sendEventRegistrationEmail(
    email: string,
    firstName: string,
    event: {
      title: string;
      date: Date;
      location: string;
      ticketNumber: string;
    },
  ): Promise<EmailResult> {
    const html = this.getTemplate('event-registration', {
      firstName,
      ...event,
    });
    return this.send({
      to: email,
      subject: `Event Registration Confirmed - ${event.title}`,
      html,
    });
  }

  /**
   * Send event reminder
   */
  async sendEventReminder(
    email: string,
    firstName: string,
    event: {
      title: string;
      date: Date;
      location: string;
      ticketNumber: string;
    },
  ): Promise<EmailResult> {
    const html = this.getTemplate('event-reminder', { firstName, ...event });
    return this.send({
      to: email,
      subject: `Reminder: ${event.title} - Tomorrow!`,
      html,
    });
  }

  /**
   * Send bulk email
   */
  async sendBulk(
    recipients: string[],
    subject: string,
    html: string,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
  }> {
    let successful = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await this.send({ to: recipient, subject, html });
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
    };
  }

  // ============================================
  // SMTP IMPLEMENTATION
  // ============================================

  private async sendViaSmtp(options: EmailOptions): Promise<EmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
        replyTo: options.replyTo,
      });
      this.logger.log(
        `Email sent via SMTP: ${info.messageId} to ${options.to}`,
      );
      return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error: any) {
      this.logger.error(`SMTP send error: ${error.message}`);
      return { success: false, error: error.message, provider: 'smtp' };
    }
  }

  // ============================================
  // MOCK IMPLEMENTATION
  // ============================================

  private async mockSend(options: EmailOptions): Promise<EmailResult> {
    // Simulate network delay
    await this.delay(50);

    const messageId = `EMAIL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    this.logger.log(`[MOCK EMAIL] To: ${recipients.join(', ')}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] MessageId: ${messageId}`);
    if (options.html) {
      this.logger.debug(
        `[MOCK EMAIL] HTML preview: ${options.html.substring(0, 200)}...`,
      );
    }

    return {
      success: true,
      messageId,
      provider: 'mock',
    };
  }

  // ============================================
  // EMAIL TEMPLATES
  // ============================================

  private getTemplate(
    templateName: string,
    context: Record<string, any>,
  ): string {
    const templates: Record<string, (ctx: any) => string> = {
      welcome: (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Welcome to IET</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Welcome to IET Tanzania</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Hello ${ctx.firstName},</h2>
                        <p>Welcome to the Institution of Engineers Tanzania! We're excited to have you join our community of engineering professionals.</p>
                        <p>Your account has been created successfully. You can now:</p>
                        <ul>
                            <li>Complete your membership application</li>
                            <li>Browse upcoming events and training</li>
                            <li>Connect with fellow engineers</li>
                        </ul>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${this.configService.get('APP_URL')}/dashboard" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
                        <p>Institution of Engineers Tanzania (IET)</p>
                        <p>Dar es Salaam, Tanzania</p>
                    </div>
                </body>
                </html>
            `,
      verification: (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Verify Your Email</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Email Verification</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Hello ${ctx.firstName},</h2>
                        <p>Please use the following code to verify your email address:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #edf2f7; padding: 15px 30px; border-radius: 10px;">${ctx.code}</span>
                        </div>
                        <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes.</p>
                        <p>If you didn't request this code, please ignore this email.</p>
                    </div>
                </body>
                </html>
            `,
      'password-reset': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Reset Your Password</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Password Reset</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Hello ${ctx.firstName},</h2>
                        <p>We received a request to reset your password for the ${ctx.portalLabel}. Click the button below to create a new password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${ctx.resetUrl}" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        </p>
                        <p style="color: #718096; font-size: 14px;">This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email or contact support.</p>
                    </div>
                </body>
                </html>
            `,
      'application-submitted': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Application Submitted</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Application Submitted</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Congratulations, ${ctx.firstName}!</h2>
                        <p>Your IET membership application has been successfully submitted. Thank you for your interest in joining the Institution of Engineers Tanzania.</p>
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                            <p style="color: #718096; margin-bottom: 5px;">Your Application Reference Number</p>
                            <p style="font-size: 28px; font-weight: bold; color: #1a365d; letter-spacing: 2px;">${ctx.referenceNumber}</p>
                        </div>
                        <p>Your application is now <strong>under review</strong> by our membership committee. We will notify you once a decision has been made.</p>
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Our team will review your application and supporting documents</li>
                            <li>Your references will be contacted for verification</li>
                            <li>You will receive an email notification with the outcome</li>
                        </ul>
                        <p>Please keep your reference number for future correspondence.</p>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${ctx.applicationStatusUrl}" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Application Status</a>
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
                        <p>Institution of Engineers Tanzania (IET)</p>
                        <p>Dar es Salaam, Tanzania</p>
                    </div>
                </body>
                </html>
            `,
      'payment-receipt': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Payment Receipt</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Payment Receipt</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Thank you, ${ctx.firstName}!</h2>
                        <p>Your payment has been processed successfully.</p>
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <table style="width: 100%;">
                                <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Receipt Number:</strong></td><td style="text-align: right;">${ctx.receiptNumber}</td></tr>
                                <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Amount:</strong></td><td style="text-align: right;">${ctx.currency} ${ctx.amount.toLocaleString()}</td></tr>
                                <tr><td style="padding: 10px 0; border-bottom: 1px solid #edf2f7;"><strong>Description:</strong></td><td style="text-align: right;">${ctx.description}</td></tr>
                                <tr><td style="padding: 10px 0;"><strong>Date:</strong></td><td style="text-align: right;">${new Date(ctx.date).toLocaleDateString()}</td></tr>
                            </table>
                        </div>
                        <p style="color: #718096; font-size: 14px;">Please keep this receipt for your records.</p>
                    </div>
                </body>
                </html>
            `,
      'expiry-reminder': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Membership Expiry Reminder</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #c53030; color: white;">
                        <h1>Membership Expiring Soon</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Dear ${ctx.firstName},</h2>
                        <p>Your IET membership will expire in <strong>${ctx.daysUntilExpiry} days</strong> on ${new Date(ctx.expiryDate).toLocaleDateString()}.</p>
                        <p>To continue enjoying your membership benefits, please renew your membership before the expiry date.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${this.configService.get('APP_URL')}/memberships/renew" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Renew Now</a>
                        </p>
                    </div>
                </body>
                </html>
            `,
      'application-approved': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Application Approved</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #38a169; color: white;">
                        <h1>Congratulations!</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Dear ${ctx.firstName},</h2>
                        <p>We are pleased to inform you that your IET membership application has been <strong>approved</strong>!</p>
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
                            <p style="color: #718096; margin-bottom: 5px;">Your Membership ID</p>
                            <p style="font-size: 24px; font-weight: bold; color: #1a365d;">${ctx.membershipId}</p>
                            <p style="color: #718096; margin-top: 5px;">Membership Class: ${ctx.membershipClass}</p>
                        </div>
                        <p>Welcome to the Institution of Engineers Tanzania family!</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${this.configService.get('APP_URL')}/dashboard" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Your Membership</a>
                        </p>
                    </div>
                </body>
                </html>
            `,
      'application-rejected': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Application Update</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Application Update</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Dear ${ctx.firstName},</h2>
                        <p>Thank you for your interest in joining the Institution of Engineers Tanzania.</p>
                        <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
                        ${ctx.reason ? `<p><strong>Reason:</strong> ${ctx.reason}</p>` : ''}
                        <p>If you have any questions, please contact our membership office.</p>
                    </div>
                </body>
                </html>
            `,
      'application-changes_requested': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Action Required</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #d69e2e; color: white;">
                        <h1>Action Required</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Dear ${ctx.firstName},</h2>
                        <p>Your IET membership application has been reviewed and requires some updates before we can proceed.</p>
                        ${ctx.reason ? `<p><strong>Required Changes:</strong> ${ctx.reason}</p>` : ''}
                        <p>Please login to your account and update your application.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${this.configService.get('APP_URL')}/registrations" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Update Application</a>
                        </p>
                    </div>
                </body>
                </html>
            `,
      'event-registration': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Event Registration Confirmed</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                        <h1>Registration Confirmed</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Hello ${ctx.firstName},</h2>
                        <p>Your registration for the following event has been confirmed:</p>
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">${ctx.title}</h3>
                            <p><strong>Date:</strong> ${new Date(ctx.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${ctx.location}</p>
                            <p><strong>Ticket Number:</strong> ${ctx.ticketNumber}</p>
                        </div>
                        <p>Please save this email for your records. We look forward to seeing you!</p>
                    </div>
                </body>
                </html>
            `,
      'event-reminder': (ctx) => `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><title>Event Reminder</title></head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px; background: #2b6cb0; color: white;">
                        <h1>Event Tomorrow!</h1>
                    </div>
                    <div style="padding: 30px; background: #f7fafc;">
                        <h2>Hello ${ctx.firstName},</h2>
                        <p>This is a reminder that you're registered for an event tomorrow:</p>
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">${ctx.title}</h3>
                            <p><strong>Date:</strong> ${new Date(ctx.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${ctx.location}</p>
                            <p><strong>Your Ticket:</strong> ${ctx.ticketNumber}</p>
                        </div>
                        <p>See you there!</p>
                    </div>
                </body>
                </html>
            `,
    };

    const templateFn = templates[templateName];
    if (!templateFn) {
      this.logger.warn(`Template not found: ${templateName}`);
      return `<p>${JSON.stringify(context)}</p>`;
    }

    return templateFn(context);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
