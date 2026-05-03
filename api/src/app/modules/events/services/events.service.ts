import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEntity, EventRegistrationEntity } from '../entities';
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
  PaymentStatus,
} from '../../../common/enums';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    @InjectRepository(EventRegistrationEntity)
    private registrationRepository: Repository<EventRegistrationEntity>,
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

    // Check if already registered
    const existingReg = await this.registrationRepository.findOne({
      where: {
        userId,
        eventId,
        status: In([
          EventRegistrationStatus.PENDING_PAYMENT,
          EventRegistrationStatus.CONFIRMED,
        ]),
      },
    });
    if (existingReg) {
      throw new BadRequestException(
        'You are already registered for this event',
      );
    }

    // Check capacity
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

    // Create registration
    const registration = new EventRegistrationEntity();
    registration.eventId = eventId;
    registration.userId = userId;
    registration.attendeeType = dto.attendeeType || AttendeeType.MEMBER;
    registration.specialRequirements = dto.specialRequirements;

    // If event is free, auto-confirm
    if (event.registrationFee === 0) {
      registration.status = EventRegistrationStatus.CONFIRMED;
      registration.confirmedAt = new Date();
      registration.ticketNumber = await this.generateTicketNumber(
        event.startDate.getFullYear(),
      );
    } else {
      registration.status = EventRegistrationStatus.PENDING_PAYMENT;
      // TODO: Create payment record
    }

    const savedReg = await this.registrationRepository.save(registration);

    this.logger.log(`User ${userId} registered for event ${eventId}`);

    return {
      registrationId: savedReg.id,
      eventId: event.id,
      eventTitle: event.title,
      status: savedReg.status,
      paymentId: savedReg.paymentId,
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
      },
      status: reg.status,
      registeredAt: reg.createdAt,
      paymentStatus: reg.paymentId ? 'PAID' : 'PENDING',
      ticketNumber: reg.ticketNumber,
      qrCode: reg.qrCodeUrl,
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
      guestOfHonor?: string | null;
      registrationDeadline?: Date | null;
      registrationFee: number;
      cpdPoints: number;
      maxParticipants?: number | null;
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
      guestOfHonor: event.guestOfHonor,
      registrationDeadline: event.registrationDeadline ?? null,
      registrationFee: event.registrationFee,
      cpdPoints: event.cpdPoints,
      maxParticipants: event.maxParticipants ?? null,
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

  private async generateTicketNumber(year: number): Promise<string> {
    const result = await this.registrationRepository
      .createQueryBuilder('reg')
      .select('MAX(CAST(SUBSTRING(reg.ticketNumber, 13) AS INTEGER))', 'maxNum')
      .where('reg.ticketNumber LIKE :pattern', { pattern: `IET/EVT/${year}/%` })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `IET/EVT/${year}/${nextNumber.toString().padStart(4, '0')}`;
  }
}
