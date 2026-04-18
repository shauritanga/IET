import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../entities/notification.entity';
import { UserEntity } from '../../user/entities/user.entity';
import { NotificationQueryDto, UpdatePreferencesDto } from '../dto';
import { NotificationType, NotificationChannel } from '../../../common/enums';
import { SmsService } from '../../shared/services/sms.service';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      data?: Record<string, any>;
      sendEmail?: boolean;
      sendSms?: boolean;
      sendPush?: boolean;
    },
  ): Promise<NotificationEntity> {
    const notification = new NotificationEntity();
    notification.userId = userId;
    notification.type = type;
    notification.title = title;
    notification.message = message;
    notification.actionUrl = options?.actionUrl;
    notification.data = options?.data || {};
    notification.sentVia = [];

    const savedNotification =
      await this.notificationRepository.save(notification);

    // Get user preferences
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
      // Send via different channels based on preferences
      if (
        options?.sendEmail &&
        user.emailPreferences?.[this.getPreferenceKey(type)]
      ) {
        await this.sendEmailNotification(user, savedNotification);
      }
      if (
        options?.sendSms &&
        user.smsPreferences?.[this.getPreferenceKey(type)]
      ) {
        await this.sendSmsNotification(user, savedNotification);
      }
      if (
        options?.sendPush &&
        user.pushPreferences?.[this.getPreferenceKey(type)]
      ) {
        await this.sendPushNotification(user, savedNotification);
      }
    }

    this.logger.log(`Notification created for user ${userId}: ${title}`);
    return savedNotification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<{
    items: NotificationEntity[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (unreadOnly) {
      queryBuilder.andWhere('notification.isRead = false');
    }

    const [items, total] = await queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ markedCount: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { markedCount: result.affected || 0 };
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string): Promise<{
    email: Record<string, boolean>;
    sms: Record<string, boolean>;
    push: Record<string, boolean>;
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      email: user.emailPreferences || {},
      sms: user.smsPreferences || {},
      push: user.pushPreferences || {},
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<{
    email: Record<string, boolean>;
    sms: Record<string, boolean>;
    push: Record<string, boolean>;
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email) {
      user.emailPreferences = { ...user.emailPreferences, ...dto.email };
    }
    if (dto.sms) {
      user.smsPreferences = { ...user.smsPreferences, ...dto.sms };
    }
    if (dto.push) {
      user.pushPreferences = { ...user.pushPreferences, ...dto.push };
    }

    await this.userRepository.save(user);

    return {
      email: user.emailPreferences,
      sms: user.smsPreferences,
      push: user.pushPreferences,
    };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getPreferenceKey(type: NotificationType): string {
    const mapping: Record<NotificationType, string> = {
      [NotificationType.PAYMENT_REMINDER]: 'paymentReminders',
      [NotificationType.EVENT_REMINDER]: 'eventReminders',
      [NotificationType.APPLICATION_UPDATE]: 'applicationUpdates',
      [NotificationType.MEMBERSHIP_EXPIRY]: 'paymentReminders',
      [NotificationType.GENERAL_ANNOUNCEMENT]: 'generalAnnouncements',
      [NotificationType.WELCOME]: 'applicationUpdates',
      [NotificationType.PASSWORD_RESET]: 'applicationUpdates',
      [NotificationType.EMAIL_VERIFICATION]: 'applicationUpdates',
    };
    return mapping[type] || 'generalAnnouncements';
  }

  private async sendEmailNotification(
    user: UserEntity,
    notification: NotificationEntity,
  ): Promise<void> {
    try {
      const result = await this.emailService.send({
        to: user.email,
        subject: notification.title,
        html: this.formatNotificationHtml(notification),
      });

      if (result.success) {
        notification.sentVia.push(NotificationChannel.EMAIL);
        notification.emailSentAt = new Date();
        await this.notificationRepository.save(notification);
        this.logger.log(`Email sent to ${user.email}: ${notification.title}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${user.email}: ${error.message}`,
      );
    }
  }

  private async sendSmsNotification(
    user: UserEntity,
    notification: NotificationEntity,
  ): Promise<void> {
    if (!user.phoneNumber) return;

    try {
      const result = await this.smsService.send({
        to: user.phoneNumber,
        message: `${notification.title}: ${notification.message}`,
      });

      if (result.success) {
        notification.sentVia.push(NotificationChannel.SMS);
        notification.smsSentAt = new Date();
        await this.notificationRepository.save(notification);
        this.logger.log(
          `SMS sent to ${user.phoneNumber}: ${notification.title}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${user.phoneNumber}: ${error.message}`,
      );
    }
  }

  private async sendPushNotification(
    user: UserEntity,
    notification: NotificationEntity,
  ): Promise<void> {
    // TODO: Implement push notification (Firebase/OneSignal)
    // This requires device tokens which would need to be stored separately
    this.logger.log(
      `Push notification queued for user ${user.id}: ${notification.title}`,
    );

    notification.sentVia.push(NotificationChannel.PUSH);
    notification.pushSentAt = new Date();
    await this.notificationRepository.save(notification);
  }

  private formatNotificationHtml(notification: NotificationEntity): string {
    return `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><title>${notification.title}</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; padding: 20px; background: #1a365d; color: white;">
                    <h1>IET Tanzania</h1>
                </div>
                <div style="padding: 30px; background: #f7fafc;">
                    <h2>${notification.title}</h2>
                    <p>${notification.message}</p>
                    ${
                      notification.actionUrl
                        ? `
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${notification.actionUrl}" style="background: #2b6cb0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">View Details</a>
                        </p>
                    `
                        : ''
                    }
                </div>
                <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
                    <p>Institution of Engineers Tanzania (IET)</p>
                </div>
            </body>
            </html>
        `;
  }

  // ============================================
  // BATCH NOTIFICATION METHODS
  // ============================================

  /**
   * Send payment reminder notifications
   */
  async sendPaymentReminders(): Promise<number> {
    // Find users with expiring fees
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.membershipExpiryDate IS NOT NULL')
      .andWhere('user.membershipExpiryDate <= :thirtyDays', {
        thirtyDays: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .andWhere('user.membershipExpiryDate > :now', { now: new Date() })
      .getMany();

    let count = 0;
    for (const user of users) {
      const daysUntilExpiry = Math.ceil(
        (user.membershipExpiryDate.getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );

      // Create in-app notification
      await this.createNotification(
        user.id,
        NotificationType.PAYMENT_REMINDER,
        'Membership Fee Due Soon',
        `Your membership expires on ${user.membershipExpiryDate?.toLocaleDateString()}. Please renew to maintain your active status.`,
        {
          actionUrl: '/memberships/fees',
          sendEmail: true,
          sendSms: true,
        },
      );

      // Also send direct SMS reminder
      if (user.phoneNumber) {
        await this.smsService.sendExpiryReminder(
          user.phoneNumber,
          user.firstName || 'Member',
          user.membershipExpiryDate,
          daysUntilExpiry,
        );
      }

      // Send email reminder
      await this.emailService.sendExpiryReminder(
        user.email,
        user.firstName || 'Member',
        user.membershipExpiryDate,
        daysUntilExpiry,
      );

      count++;
    }

    this.logger.log(`Sent ${count} payment reminder notifications`);
    return count;
  }

  /**
   * Send event reminder notifications
   */
  async sendEventReminders(): Promise<number> {
    // TODO: Query event registrations for tomorrow's events
    // and send reminders to attendees
    return 0;
  }

  /**
   * Send application status notification
   */
  async sendApplicationStatusNotification(
    userId: string,
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED',
    details: {
      membershipId?: string;
      membershipClass?: string;
      reason?: string;
    },
  ): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) return;

    const titles = {
      APPROVED: 'Application Approved!',
      REJECTED: 'Application Update',
      CHANGES_REQUESTED: 'Action Required on Your Application',
    };

    const messages = {
      APPROVED: `Congratulations! Your IET membership application has been approved. Your membership ID is ${details.membershipId}.`,
      REJECTED: `Your IET membership application has been reviewed. Please check your email for more details.`,
      CHANGES_REQUESTED: `Your IET membership application requires additional information. Please login to update your application.`,
    };

    // Create in-app notification
    await this.createNotification(
      userId,
      NotificationType.APPLICATION_UPDATE,
      titles[status],
      messages[status],
      {
        actionUrl: '/registrations',
        data: details,
        sendEmail: true,
        sendSms: true,
      },
    );

    // Send SMS
    if (user.phoneNumber) {
      await this.smsService.sendApplicationStatusUpdate(
        user.phoneNumber,
        status,
        details.membershipId,
      );
    }

    // Send email
    await this.emailService.sendApplicationStatusEmail(
      user.email,
      user.firstName || 'Applicant',
      status,
      details,
    );
  }
}
