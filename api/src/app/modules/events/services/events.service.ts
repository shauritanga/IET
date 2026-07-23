import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { EventEntity, EventRegistrationEntity } from '../entities';
import { UserEntity } from '../../user/entities/user.entity';
import { EmailService } from '../../shared/services/email.service';
import { SmsService } from '../../shared/services/sms.service';
import { PaymentsService } from '../../payments/services/payments.service';
import { PaymentType } from '../../../common/enums';
import {
  EventQueryDto,
  CreateEventDto,
  UpdateEventDto,
  RegisterForEventDto,
  CancelRegistrationDto,
  EventFeedbackDto,
} from '../dto';
import {
  EventCategory,
  EventRegistrationStatus,
  AttendeeType,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../../../common/enums';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(EventRegistrationEntity)
    private registrationRepository: Repository<EventRegistrationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private emailService: EmailService,
    private smsService: SmsService,
    private paymentsService: PaymentsService,
  ) {}

  /**
   * List events with filtering and pagination
   */
  async listEvents(
    query: EventQueryDto,
    userId?: string,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      category,
      fromDate,
      toDate,
      location,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.isPublished = :published', { published: true });

    // Category filter
    if (category) {
      const categories = category.split(',') as EventCategory[];
      queryBuilder.andWhere('event.category IN (:...categories)', {
        categories,
      });
    }

    // Date filters
    if (fromDate) {
      queryBuilder.andWhere('event.startDate >= :fromDate', { fromDate });
    }
    if (toDate) {
      queryBuilder.andWhere('event.startDate <= :toDate', { toDate });
    }

    // Location filter
    if (location) {
      queryBuilder.andWhere('event.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        '(event.title ILIKE :search OR event.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [events, total] = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Get registration counts and user registration status
    const eventIds = events.map((e) => e.id);
    const registrationCounts =
      eventIds.length > 0
        ? await this.registrationRepository
            .createQueryBuilder('reg')
            .select('reg.eventId', 'eventId')
            .addSelect('COUNT(reg.id)', 'count')
            .where('reg.eventId IN (:...eventIds)', {
              eventIds,
            })
            .andWhere('reg.status NOT IN (:...excludedStatuses)', {
              excludedStatuses: [EventRegistrationStatus.CANCELLED],
            })
            .groupBy('reg.eventId')
            .getRawMany()
        : [];

    const countMap = new Map(
      registrationCounts.map((r) => [r.eventId, parseInt(r.count)]),
    );

    // Check if user is registered for each event
    let userRegistrations: Set<string> = new Set();
    if (userId && eventIds.length > 0) {
      const regs = await this.registrationRepository.find({
        where: {
          userId,
          eventId: In(eventIds),
          status: In([
            EventRegistrationStatus.PENDING_PAYMENT,
            EventRegistrationStatus.CONFIRMED,
          ]),
        },
        select: ['eventId'],
      });
      userRegistrations = new Set(regs.map((r) => r.eventId));
    }

    const items = events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate ?? null,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.isOnline ? 'Online' : event.location,
      isOnline: event.isOnline,
      guestOfHonor: event.guestOfHonor,
      speaker: event.speakers?.[0]?.name,
      coverImage: event.coverImage,
      registrationDeadline: event.registrationDeadline,
      registrationFee: event.registrationFee,
      cpdPoints: event.cpdPoints,
      availableSlots: event.maxParticipants,
      registeredCount: countMap.get(event.id) || 0,
      isFull: event.maxParticipants
        ? (countMap.get(event.id) || 0) >= event.maxParticipants
        : false,
      isRegistered: userRegistrations.has(event.id),
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
   * Get event details
   */
  async getEventDetails(eventId: string, userId?: string): Promise<any> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPublished) {
      throw new NotFoundException('Event not found');
    }

    // Get registration count
    const registeredCount = await this.registrationRepository.count({
      where: {
        eventId,
        status: In([
          EventRegistrationStatus.PENDING_PAYMENT,
          EventRegistrationStatus.CONFIRMED,
          EventRegistrationStatus.ATTENDED,
        ]),
      },
    });

    // Check if user is registered
    let isRegistered = false;
    if (userId) {
      const userReg = await this.registrationRepository.findOne({
        where: {
          userId,
          eventId,
          status: In([
            EventRegistrationStatus.PENDING_PAYMENT,
            EventRegistrationStatus.CONFIRMED,
          ]),
        },
      });
      isRegistered = !!userReg;
    }

    return {
      ...event,
      registeredCount,
      isFull: event.maxParticipants
        ? registeredCount >= event.maxParticipants
        : false,
      isRegistered,
    };
  }

  /**
   * Register for event
   */
  async registerForEvent(
    eventId: string,
    userId: string,
    dto: RegisterForEventDto,
  ): Promise<{
    registrationId: string;
    eventId: string;
    eventTitle: string;
    status: EventRegistrationStatus;
    paymentId: string | null;
    paymentUrl?: string;
    amount: number;
    currency: string;
  }> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPublished || !event.registrationOpen) {
      throw new BadRequestException('Registration is not open for this event');
    }

    // Check registration deadline
    if (
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check if already registered. Cancelled and expired registrations can be retried.
    const existingReg = await this.registrationRepository.findOne({
      where: {
        userId,
        eventId,
      },
    });
    if (
      existingReg &&
      existingReg.status !== EventRegistrationStatus.CANCELLED &&
      existingReg.status !== EventRegistrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'You are already registered for this event',
      );
    }

    // Check capacity — expired registrations do not hold seats
    if (event.maxParticipants) {
      const currentCount = await this.registrationRepository.count({
        where: {
          eventId,
          status: In([
            EventRegistrationStatus.PENDING_PAYMENT,
            EventRegistrationStatus.CONFIRMED,
            EventRegistrationStatus.ATTENDED,
          ]),
        },
      });
      if (currentCount >= event.maxParticipants) {
        throw new BadRequestException('Event is full');
      }
    }

    // Create or restore registration
    const registration = existingReg || new EventRegistrationEntity();
    registration.eventId = eventId;
    registration.userId = userId;
    registration.attendeeType = dto.attendeeType || AttendeeType.MEMBER;
    registration.specialRequirements = dto.specialRequirements;
    registration.cancelledAt = undefined;
    registration.cancellationReason = undefined;
    registration.refundAmount = 0;
    registration.refundStatus = undefined;

    const eventYear = new Date(event.startDate).getFullYear();
    if (event.registrationFee > 0) {
      registration.status = EventRegistrationStatus.PENDING_PAYMENT;
      registration.paymentMethod = PaymentMethod.SELCOM;
      registration.paymentExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else {
      registration.status = EventRegistrationStatus.CONFIRMED;
      registration.confirmedAt = new Date();
      registration.paymentExpiresAt = undefined;
      registration.ticketNumber = await this.generateTicketNumber(eventYear);
    }

    const savedReg = await this.registrationRepository.save(registration);

    let paymentId: string | null = null;
    let paymentUrl: string | undefined;

    if (event.registrationFee > 0) {
      try {
        const paymentResult = await this.paymentsService.initiatePayment(userId, {
          paymentType: PaymentType.EVENT_REGISTRATION,
          amount: event.registrationFee,
          paymentMethod: PaymentMethod.SELCOM,
          description: `Event Registration: ${event.title}`,
          referenceId: savedReg.id,
          referenceType: 'event_registration',
          metadata: { eventId: event.id, registrationId: savedReg.id },
        });

        paymentId = paymentResult.paymentId;
        paymentUrl = paymentResult.paymentUrl;

        savedReg.paymentId = paymentId;
        await this.registrationRepository.save(savedReg);
      } catch (error) {
        savedReg.status = EventRegistrationStatus.CANCELLED;
        savedReg.cancelledAt = new Date();
        savedReg.cancellationReason =
          error instanceof Error
            ? `Payment initiation failed: ${error.message}`
            : 'Payment initiation failed';
        await this.registrationRepository.save(savedReg);
        throw error;
      }
    }

    this.logger.log(`User ${userId} registered for event ${eventId}`);
    await this.notifySuperAdminsOfEventRegistration(event, savedReg, userId);

    return {
      registrationId: savedReg.id,
      eventId: event.id,
      eventTitle: event.title,
      status: savedReg.status,
      paymentId,
      paymentUrl,
      amount: event.registrationFee,
      currency: 'TZS',
    };
  }

  /**
   * Get user's event registrations
   */
  async getUserRegistrations(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.registrationRepository
      .createQueryBuilder('reg')
      .leftJoinAndSelect('reg.event', 'event')
      .where('reg.userId = :userId', { userId });

    if (status) {
      const statuses = status.split(',') as EventRegistrationStatus[];
      queryBuilder.andWhere('reg.status IN (:...statuses)', { statuses });
    }

    const [registrations, total] = await queryBuilder
      .orderBy('reg.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items = registrations.map((reg) => ({
      registrationId: reg.id,
      event: {
        id: reg.event.id,
        title: reg.event.title,
        startDate: reg.event.startDate,
        location: reg.event.isOnline ? 'Online' : reg.event.location,
        category: reg.event.category,
        registrationFee: reg.event.registrationFee,
        registrationOpen: reg.event.registrationOpen,
        registrationDeadline: reg.event.registrationDeadline ?? null,
      },
      status: reg.status,
      registeredAt: reg.createdAt,
      paymentStatus:
        reg.status === EventRegistrationStatus.CONFIRMED ||
        reg.status === EventRegistrationStatus.ATTENDED
          ? 'PAID'
          : 'PENDING',
      ticketNumber: reg.ticketNumber,
      qrCode: reg.qrCodeUrl,
      paymentExpiresAt: reg.paymentExpiresAt ?? null,
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
   * Cancel event registration
   */
  async cancelRegistration(
    registrationId: string,
    userId: string,
    dto: CancelRegistrationDto,
  ): Promise<{
    registrationId: string;
    status: EventRegistrationStatus;
    refundAmount: number;
    refundStatus: string;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, userId },
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status === EventRegistrationStatus.CANCELLED) {
      throw new BadRequestException('Registration is already cancelled');
    }

    if (registration.status === EventRegistrationStatus.ATTENDED) {
      throw new BadRequestException(
        'Cannot cancel registration for an attended event',
      );
    }

    // Calculate refund (90% if >48hrs before event)
    let refundAmount = 0;
    if (registration.amountPaid > 0) {
      const eventDate = new Date(registration.event.startDate);
      const now = new Date();
      const hoursUntilEvent =
        (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilEvent > 48) {
        refundAmount = Math.floor(registration.amountPaid * 0.9);
      } else if (hoursUntilEvent > 24) {
        refundAmount = Math.floor(registration.amountPaid * 0.5);
      }
    }

    registration.status = EventRegistrationStatus.CANCELLED;
    registration.cancelledAt = new Date();
    registration.cancellationReason = dto.reason;
    registration.refundAmount = refundAmount;
    registration.refundStatus =
      refundAmount > 0 ? PaymentStatus.PENDING : undefined;

    await this.registrationRepository.save(registration);

    this.logger.log(`User ${userId} cancelled registration ${registrationId}`);

    return {
      registrationId: registration.id,
      status: EventRegistrationStatus.CANCELLED,
      refundAmount,
      refundStatus: refundAmount > 0 ? 'PROCESSING' : 'NOT_APPLICABLE',
    };
  }

  /**
   * Get event certificate
   */
  async getCertificate(
    registrationId: string,
    userId: string,
  ): Promise<{
    certificateId: string;
    eventTitle: string;
    attendeeName: string;
    completionDate: Date;
    cpdPoints: number;
    certificateUrl: string | null;
    verificationCode: string | null;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, userId },
      relations: ['event', 'user'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== EventRegistrationStatus.ATTENDED) {
      throw new BadRequestException(
        'Certificate is only available for attended events',
      );
    }

    // Generate certificate if not already done
    if (!registration.certificateUrl) {
      registration.certificateCode = `IET-CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      // TODO: Generate PDF certificate
      // registration.certificateUrl = await this.generateCertificate(registration);
      await this.registrationRepository.save(registration);
    }

    return {
      certificateId: registration.id,
      eventTitle: registration.event.title,
      attendeeName: registration.user.fullName,
      completionDate: registration.event.startDate,
      cpdPoints: registration.event.cpdPoints,
      certificateUrl: registration.certificateUrl,
      verificationCode: registration.certificateCode,
    };
  }

  /**
   * Submit event feedback
   */
  async submitFeedback(
    registrationId: string,
    userId: string,
    dto: EventFeedbackDto,
  ): Promise<void> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== EventRegistrationStatus.ATTENDED) {
      throw new BadRequestException(
        'Feedback can only be submitted for attended events',
      );
    }

    if (registration.feedbackRating) {
      throw new BadRequestException('Feedback has already been submitted');
    }

    registration.feedbackRating = dto.rating;
    registration.feedbackComment = dto.comment;
    await this.registrationRepository.save(registration);

    this.logger.log(
      `User ${userId} submitted feedback for registration ${registrationId}`,
    );
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  /**
   * Create event (Admin)
   */
  async createEvent(
    dto: CreateEventDto,
    adminId: string,
  ): Promise<EventEntity> {
    const event = new EventEntity();
    Object.assign(event, dto);
    event.slug = this.generateSlug(dto.title);
    event.startDate = new Date(dto.startDate);
    event.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    event.registrationDeadline = dto.registrationDeadline
      ? new Date(dto.registrationDeadline)
      : undefined;
    event.createdBy = adminId;

    const savedEvent = await this.eventRepository.save(event);
    this.logger.log(`Event ${savedEvent.id} created by admin ${adminId}`);
    return savedEvent;
  }

  /**
   * Get event attendees/registrations (Admin)
   */
  async getEventAttendees(eventId: string): Promise<{
    eventId: string;
    eventTitle: string;
    total: number;
    attendees: Array<{
      id: string;
      ticketNumber: string | undefined;
      fullName: string;
      email: string;
      phoneNumber: string | undefined;
      attendeeType: string;
      status: string;
      amountPaid: number;
      checkedIn: boolean;
      checkedInAt: Date | undefined;
      registeredAt: Date;
    }>;
  }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const registrations = await this.registrationRepository.find({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return {
      eventId,
      eventTitle: event.title,
      total: registrations.length,
      attendees: registrations.map((r) => ({
        id: r.id,
        ticketNumber: r.ticketNumber,
        fullName: r.user?.fullName ?? 'Unknown',
        email: r.user?.email ?? '',
        phoneNumber: r.user?.phoneNumber,
        attendeeType: r.attendeeType,
        status: r.status,
        amountPaid: r.amountPaid,
        checkedIn: Boolean(r.attendedAt),
        checkedInAt: r.attendedAt,
        registeredAt: r.createdAt,
      })),
    };
  }

  /**
   * Update event (Admin)
   */
  async updateEvent(
    eventId: string,
    dto: UpdateEventDto,
    adminId: string,
  ): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const previousTitle = event.title;
    Object.assign(event, dto);
    if (dto.title && dto.title !== previousTitle) {
      event.slug = this.generateSlug(dto.title);
    }
    if (dto.startDate) event.startDate = new Date(dto.startDate);
    if (dto.endDate) event.endDate = new Date(dto.endDate);
    if (dto.registrationDeadline)
      event.registrationDeadline = new Date(dto.registrationDeadline);
    event.updatedBy = adminId;

    const savedEvent = await this.eventRepository.save(event);
    this.logger.log(`Event ${eventId} updated by admin ${adminId}`);
    return savedEvent;
  }

  async listAdminEvents(): Promise<
    Array<{
      id: string;
      title: string;
      category: EventCategory;
      description?: string | null;
      startDate: Date;
      endDate?: Date | null;
      startTime: string;
      endTime: string;
      location?: string | null;
      isOnline: boolean;
      onlineUrl?: string | null;
      guestOfHonor?: string | null;
      speakers: Array<{
        name: string;
        title?: string;
        bio?: string;
        photo?: string;
      }>;
      agenda: Array<{
        time: string;
        title: string;
        description?: string;
      }>;
      registrationDeadline?: Date | null;
      registrationFee: number;
      cpdPoints: number;
      maxParticipants?: number | null;
      requirements: string[];
      organizer: {
        name?: string;
        contact?: string;
        phone?: string;
      };
      coverImage?: string | null;
      images: string[];
      registeredCount: number;
      isPublished: boolean;
      registrationOpen: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    const events = await this.eventRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    const eventIds = events.map((event) => event.id);
    const registrationCounts =
      eventIds.length > 0
        ? await this.registrationRepository
            .createQueryBuilder('reg')
            .select('reg.eventId', 'eventId')
            .addSelect('COUNT(reg.id)', 'count')
            .where('reg.eventId IN (:...eventIds)', {
              eventIds,
            })
            .andWhere('reg.status NOT IN (:...excludedStatuses)', {
              excludedStatuses: [EventRegistrationStatus.CANCELLED],
            })
            .groupBy('reg.eventId')
            .getRawMany()
        : [];

    const countMap = new Map(
      registrationCounts.map((row) => [row.eventId, parseInt(row.count, 10)]),
    );

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      category: event.category,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate ?? null,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      isOnline: event.isOnline,
      onlineUrl: event.onlineUrl,
      guestOfHonor: event.guestOfHonor,
      speakers: event.speakers ?? [],
      agenda: event.agenda ?? [],
      registrationDeadline: event.registrationDeadline ?? null,
      registrationFee: event.registrationFee,
      cpdPoints: event.cpdPoints,
      maxParticipants: event.maxParticipants ?? null,
      requirements: event.requirements ?? [],
      organizer: event.organizer ?? {},
      coverImage: event.coverImage,
      images: event.images ?? [],
      registeredCount: countMap.get(event.id) || 0,
      isPublished: event.isPublished,
      registrationOpen: event.registrationOpen,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const year = new Date().getFullYear();
    return `${baseSlug}-${year}`;
  }

  private generateEventPaymentReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `EVT-PAY-${date}-${random}`;
  }

  private async notifySuperAdminsOfEventRegistration(
    event: EventEntity,
    registration: EventRegistrationEntity,
    userId: string,
  ): Promise<void> {
    try {
      const [member, superAdmins] = await Promise.all([
        this.userRepository.findOne({ where: { id: userId } }),
        this.userRepository.find({
          where: { role: UserRole.SUPER_ADMIN, isActive: true },
        }),
      ]);

      if (!superAdmins.length) {
        this.logger.warn(
          `No active super admins found for event registration alert ${registration.id}`,
        );
        return;
      }

      const memberName = member?.fullName || member?.email || 'IET member';
      const eventDate = new Date(event.startDate).toLocaleDateString();
      const eventTime = `${event.startTime} - ${event.endTime}`;
      const location = event.isOnline ? 'Online' : event.location || 'TBA';
      const amount = registration.amountPaid || event.registrationFee || 0;
      const subject = `New Event Registration - ${event.title}`;
      const textLines = [
        `A member has registered for ${event.title}.`,
        `Member: ${memberName}`,
        `Email: ${member?.email || 'N/A'}`,
        `Phone: ${member?.phoneNumber || 'N/A'}`,
        `Event: ${event.title}`,
        `Date: ${eventDate}`,
        `Time: ${eventTime}`,
        `Location: ${location}`,
        `Status: ${registration.status}`,
        `Ticket: ${registration.ticketNumber || 'Pending'}`,
        `Amount: TZS ${amount.toLocaleString()}`,
        `Registration ID: ${registration.id}`,
      ];
      const text = textLines.join('\n');
      const html = `
        <div style="font-family: Arial, sans-serif; color: #1C1010; line-height: 1.5;">
          <h2 style="color: #390909;">New Event Registration</h2>
          <p>A member has registered for <strong>${event.title}</strong>.</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
            ${[
              ['Member', memberName],
              ['Email', member?.email || 'N/A'],
              ['Phone', member?.phoneNumber || 'N/A'],
              ['Event', event.title],
              ['Date', eventDate],
              ['Time', eventTime],
              ['Location', location],
              ['Status', registration.status],
              ['Ticket', registration.ticketNumber || 'Pending'],
              ['Amount', `TZS ${amount.toLocaleString()}`],
              ['Registration ID', registration.id],
            ]
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="border: 1px solid #E8D5D5; padding: 8px; font-weight: 700;">${label}</td>
                    <td style="border: 1px solid #E8D5D5; padding: 8px;">${value}</td>
                  </tr>
                `,
              )
              .join('')}
          </table>
        </div>
      `;
      const smsMessage = `IET: ${memberName} registered for ${event.title} on ${eventDate}. Status: ${registration.status}. Ticket: ${registration.ticketNumber || 'Pending'}.`;

      await Promise.all(
        superAdmins.map(async (admin) => {
          const tasks: Promise<unknown>[] = [];

          if (admin.email) {
            tasks.push(
              this.emailService
                .send({ to: admin.email, subject, html, text })
                .catch((error: Error) => {
                  this.logger.error(
                    `Failed to email event registration alert to ${admin.email}: ${error.message}`,
                  );
                }),
            );
          }

          if (admin.phoneNumber) {
            tasks.push(
              this.smsService
                .send({ to: admin.phoneNumber, message: smsMessage })
                .catch((error: Error) => {
                  this.logger.error(
                    `Failed to SMS event registration alert to ${admin.phoneNumber}: ${error.message}`,
                  );
                }),
            );
          }

          await Promise.all(tasks);
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send super admin event registration alerts for ${registration.id}: ${message}`,
      );
    }
  }

  private async generateTicketNumber(year: number): Promise<string> {
    const result = await this.registrationRepository
      .createQueryBuilder('reg')
      .select('MAX(CAST(SUBSTRING(reg.ticketNumber, 14) AS INTEGER))', 'maxNum')
      .where('reg.ticketNumber LIKE :pattern', { pattern: `IET/EVT/${year}/%` })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `IET/EVT/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }

  async retryEventPayment(
    registrationId: string,
    userId: string,
  ): Promise<{
    registrationId: string;
    eventId: string;
    eventTitle: string;
    status: EventRegistrationStatus;
    paymentId: string;
    paymentUrl: string;
    amount: number;
    currency: string;
    paymentExpiresAt: Date;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, userId },
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (
      registration.status !== EventRegistrationStatus.PENDING_PAYMENT &&
      registration.status !== EventRegistrationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Payment can only be retried for pending or expired registrations',
      );
    }

    const event = registration.event;

    if (!event.isPublished || !event.registrationOpen) {
      throw new BadRequestException(
        'Registration is no longer open for this event',
      );
    }

    if (
      event.registrationDeadline &&
      new Date() > new Date(event.registrationDeadline)
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check capacity (exclude expired registrations)
    if (event.maxParticipants) {
      const currentCount = await this.registrationRepository.count({
        where: {
          eventId: event.id,
          status: In([
            EventRegistrationStatus.PENDING_PAYMENT,
            EventRegistrationStatus.CONFIRMED,
            EventRegistrationStatus.ATTENDED,
          ]),
        },
      });
      // If this registration was EXPIRED it is not counted above, so the slot is available.
      // If it was PENDING_PAYMENT it is already counted so we check strictly less than capacity.
      const alreadyCounted =
        registration.status === EventRegistrationStatus.PENDING_PAYMENT;
      if (
        alreadyCounted
          ? currentCount > event.maxParticipants
          : currentCount >= event.maxParticipants
      ) {
        throw new BadRequestException('Event is full');
      }
    }

    // Guard against double-charging: reconcile any prior payment for this
    // registration against the gateway first. If it already settled, don't
    // create a second order; if it's still an open, resumable checkout session,
    // reuse that URL instead of minting a new one.
    const existingPayment = await this.paymentsService.syncEventRegistrationPayment(
      userId,
      registrationId,
    );
    if (existingPayment?.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'This registration has already been paid for.',
      );
    }
    if (
      existingPayment &&
      [PaymentStatus.PENDING, PaymentStatus.PROCESSING].includes(
        existingPayment.status,
      ) &&
      existingPayment.paymentUrl &&
      registration.paymentExpiresAt &&
      new Date(registration.paymentExpiresAt).getTime() > Date.now()
    ) {
      return {
        registrationId: registration.id,
        eventId: event.id,
        eventTitle: event.title,
        status: registration.status,
        paymentId: existingPayment.id,
        paymentUrl: existingPayment.paymentUrl,
        amount: event.registrationFee,
        currency: 'TZS',
        paymentExpiresAt: registration.paymentExpiresAt,
      };
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const paymentResult = await this.paymentsService.initiatePayment(userId, {
      paymentType: PaymentType.EVENT_REGISTRATION,
      amount: event.registrationFee,
      paymentMethod: PaymentMethod.SELCOM,
      description: `Event Registration: ${event.title}`,
      referenceId: registration.id,
      referenceType: 'event_registration',
      metadata: { eventId: event.id, registrationId: registration.id },
    });

    if (!paymentResult.paymentUrl) {
      throw new BadRequestException('Failed to create payment. Please try again.');
    }

    registration.status = EventRegistrationStatus.PENDING_PAYMENT;
    registration.paymentId = paymentResult.paymentId;
    registration.paymentExpiresAt = expiresAt;
    await this.registrationRepository.save(registration);

    this.logger.log(
      `User ${userId} retried payment for event registration ${registrationId}`,
    );

    return {
      registrationId: registration.id,
      eventId: event.id,
      eventTitle: event.title,
      status: registration.status,
      paymentId: paymentResult.paymentId,
      paymentUrl: paymentResult.paymentUrl,
      amount: event.registrationFee,
      currency: 'TZS',
      paymentExpiresAt: expiresAt,
    };
  }

  async getRegistrationPaymentStatus(
    registrationId: string,
    userId: string,
  ): Promise<{
    registrationId: string;
    status: EventRegistrationStatus;
    paymentStatus: 'PAID' | 'PENDING';
    paymentId?: string;
    amount?: number;
    currency: string;
    paymentExpiresAt?: Date;
    message: string;
  }> {
    const registration = await this.registrationRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Reconcile against the authoritative Selcom order-status before reporting.
    // This also confirms the event registration when payment has settled, so we
    // re-read the registration below to pick up any status change.
    const payment = await this.paymentsService.syncEventRegistrationPayment(
      userId,
      registrationId,
    );

    const fresh =
      (await this.registrationRepository.findOne({
        where: { id: registrationId, userId },
      })) ?? registration;

    const isPaid =
      fresh.status === EventRegistrationStatus.CONFIRMED ||
      fresh.status === EventRegistrationStatus.ATTENDED;

    return {
      registrationId: fresh.id,
      status: fresh.status,
      paymentStatus: isPaid ? 'PAID' : 'PENDING',
      paymentId: payment?.id ?? fresh.paymentId ?? undefined,
      amount: payment?.amount,
      currency: payment?.currency ?? 'TZS',
      paymentExpiresAt: fresh.paymentExpiresAt,
      message: isPaid
        ? 'Event registration payment completed'
        : payment?.errorMessage || 'Payment is awaiting confirmation',
    };
  }

  async expirePendingRegistrations(): Promise<number> {
    const result = await this.registrationRepository.update(
      {
        status: EventRegistrationStatus.PENDING_PAYMENT,
        paymentExpiresAt: LessThan(new Date()),
      },
      { status: EventRegistrationStatus.EXPIRED },
    );
    const count = result.affected ?? 0;
    if (count > 0) {
      this.logger.log(`Expired ${count} pending event registrations`);
    }
    return count;
  }
}
