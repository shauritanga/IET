import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestRegistrationEntity } from '../entities/guest-registration.entity';
import { DevelopmentFeeEntity } from '../entities/development-fee.entity';
import { EventEntity } from '../../events/entities/event.entity';
import {
  GuestEventRegistrationDto,
  GuestPaymentDto,
  CreateDevelopmentFeeDto,
  DevelopmentFeePaymentDto,
  CalendarQueryDto,
} from '../dto';
import {
  EventRegistrationStatus,
  PaymentStatus,
  PaymentMethod,
} from '../../../common/enums';
import { PaymentGatewayService } from '../../shared/services/payment-gateway.service';
import { SmsService } from '../../shared/services/sms.service';
import { EmailService } from '../../shared/services/email.service';

@Injectable()
export class GuestService {
  private readonly logger = new Logger(GuestService.name);

  constructor(
    @InjectRepository(GuestRegistrationEntity)
    private guestRegistrationRepository: Repository<GuestRegistrationEntity>,
    @InjectRepository(DevelopmentFeeEntity)
    private developmentFeeRepository: Repository<DevelopmentFeeEntity>,
    @InjectRepository(EventEntity)
    private eventRepository: Repository<EventEntity>,
    private paymentGateway: PaymentGatewayService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  // ============================================
  // GUEST EVENT REGISTRATION
  // ============================================

  /**
   * Register a guest for an event
   */
  async registerForEvent(
    eventId: string,
    dto: GuestEventRegistrationDto,
  ): Promise<{
    registrationId: string;
    ticketNumber: string;
    controlNumber: string;
    event: { title: string; date: Date; location: string };
    amount: number;
    status: EventRegistrationStatus;
  }> {
    // Get event
    const event = await this.eventRepository.findOne({
      where: { id: eventId, isPublished: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found or not available');
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Check capacity
    if (event.maxParticipants) {
      const currentCount = await this.guestRegistrationRepository.count({
        where: { eventId, status: EventRegistrationStatus.CONFIRMED },
      });
      if (currentCount >= event.maxParticipants) {
        throw new BadRequestException('Event is full');
      }
    }

    // Check for existing registration
    const existingReg = await this.guestRegistrationRepository.findOne({
      where: { eventId, email: dto.email },
    });

    if (existingReg) {
      throw new ConflictException('You have already registered for this event');
    }

    // Create registration
    const registration = new GuestRegistrationEntity();
    registration.eventId = eventId;
    registration.firstName = dto.firstName;
    registration.lastName = dto.lastName;
    registration.email = dto.email;
    registration.phoneNumber = dto.phoneNumber;
    registration.organization = dto.organization;
    registration.position = dto.position;
    registration.nationality = dto.nationality;
    registration.specialRequirements = dto.specialRequirements;

    // Generate ticket number and control number
    registration.ticketNumber = await this.generateTicketNumber();
    registration.controlNumber = await this.generateControlNumber('EVT');

    // Set status based on whether event is free
    if (event.registrationFee === 0) {
      registration.status = EventRegistrationStatus.CONFIRMED;
      registration.paymentStatus = PaymentStatus.COMPLETED;
    } else {
      registration.status = EventRegistrationStatus.PENDING_PAYMENT;
      registration.paymentStatus = PaymentStatus.PENDING;
    }

    const savedReg = await this.guestRegistrationRepository.save(registration);

    // Send confirmation email
    await this.sendRegistrationConfirmation(savedReg, event);

    this.logger.log(`Guest ${dto.email} registered for event ${event.title}`);

    return {
      registrationId: savedReg.id,
      ticketNumber: savedReg.ticketNumber,
      controlNumber: savedReg.controlNumber,
      event: {
        title: event.title,
        date: event.startDate,
        location: event.location,
      },
      amount: event.registrationFee,
      status: savedReg.status,
    };
  }

  /**
   * Initiate payment for guest registration
   */
  async initiateGuestPayment(
    registrationId: string,
    dto: GuestPaymentDto,
  ): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    controlNumber: string;
    paymentUrl?: string;
    mobileMoneyRef?: string;
  }> {
    const registration = await this.guestRegistrationRepository.findOne({
      where: { id: registrationId },
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status === EventRegistrationStatus.CONFIRMED) {
      throw new BadRequestException('Registration is already confirmed');
    }

    const amount = registration.event.registrationFee;

    // Validate phone number for mobile money
    const phoneNumber = dto.phoneNumber || registration.phoneNumber;
    if (this.isMobileMoneyMethod(dto.paymentMethod) && !phoneNumber) {
      throw new BadRequestException(
        'Phone number required for mobile money payment',
      );
    }

    // Initiate payment
    const paymentResult = await this.paymentGateway.initiatePayment(
      dto.paymentMethod,
      {
        amount,
        currency: 'TZS',
        phoneNumber,
        email: registration.email,
        reference: registration.id,
        description: `Event Registration: ${registration.event.title}`,
        metadata: {
          registrationType: 'GUEST_EVENT',
          eventId: registration.eventId,
          guestName: registration.fullName,
        },
      },
    );

    // Update registration
    registration.paymentMethod = dto.paymentMethod;
    registration.paymentStatus = PaymentStatus.PROCESSING;
    await this.guestRegistrationRepository.save(registration);

    return {
      paymentId: paymentResult.transactionId,
      amount,
      currency: 'TZS',
      controlNumber: registration.controlNumber,
      paymentUrl: paymentResult.paymentUrl,
      mobileMoneyRef: paymentResult.transactionId,
    };
  }

  /**
   * Get guest registration by ticket number or email
   */
  async getGuestRegistration(
    ticketNumber?: string,
    email?: string,
  ): Promise<GuestRegistrationEntity> {
    const where: any = {};
    if (ticketNumber) where.ticketNumber = ticketNumber;
    if (email) where.email = email;

    if (!ticketNumber && !email) {
      throw new BadRequestException('Ticket number or email required');
    }

    const registration = await this.guestRegistrationRepository.findOne({
      where,
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  /**
   * Check-in guest at event
   */
  async checkInGuest(
    ticketNumber: string,
    adminUserId: string,
  ): Promise<{
    success: boolean;
    guestName: string;
    organization?: string;
    checkedInAt: Date;
  }> {
    const registration = await this.guestRegistrationRepository.findOne({
      where: { ticketNumber },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== EventRegistrationStatus.CONFIRMED) {
      throw new BadRequestException('Registration is not confirmed');
    }

    if (registration.checkedInAt) {
      throw new BadRequestException('Guest has already checked in');
    }

    registration.checkedInAt = new Date();
    registration.checkedInBy = adminUserId;
    registration.status = EventRegistrationStatus.ATTENDED;

    await this.guestRegistrationRepository.save(registration);

    return {
      success: true,
      guestName: registration.fullName,
      organization: registration.organization,
      checkedInAt: registration.checkedInAt,
    };
  }

  /**
   * Generate name tag for guest
   */
  async generateNameTag(registrationId: string): Promise<{
    nameTagUrl: string;
    guestName: string;
    organization?: string;
    eventTitle: string;
  }> {
    const registration = await this.guestRegistrationRepository.findOne({
      where: { id: registrationId },
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (
      registration.status !== EventRegistrationStatus.CONFIRMED &&
      registration.status !== EventRegistrationStatus.ATTENDED
    ) {
      throw new BadRequestException(
        'Registration must be confirmed to generate name tag',
      );
    }

    // TODO: Generate actual name tag PDF
    // For now, mock the URL
    const nameTagUrl = `https://cdn.iet.or.tz/nametags/${registration.id}.pdf`;

    registration.nameTagGenerated = true;
    registration.nameTagUrl = nameTagUrl;
    await this.guestRegistrationRepository.save(registration);

    this.logger.log(`Name tag generated for guest ${registration.fullName}`);

    return {
      nameTagUrl,
      guestName: registration.fullName,
      organization: registration.organization,
      eventTitle: registration.event.title,
    };
  }

  /**
   * Generate certificate for guest
   */
  async generateCertificate(registrationId: string): Promise<{
    certificateUrl: string;
    certificateCode: string;
    guestName: string;
    eventTitle: string;
    eventDate: Date;
    cpdPoints?: number;
  }> {
    const registration = await this.guestRegistrationRepository.findOne({
      where: { id: registrationId },
      relations: ['event'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.status !== EventRegistrationStatus.ATTENDED) {
      throw new BadRequestException(
        'Must have attended the event to get certificate',
      );
    }

    // Generate certificate code if not already generated
    if (!registration.certificateCode) {
      registration.certificateCode = `IET-CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      registration.certificateGeneratedAt = new Date();

      // TODO: Generate actual certificate PDF with IET signature
      registration.certificateUrl = `https://cdn.iet.or.tz/certificates/${registration.id}.pdf`;

      await this.guestRegistrationRepository.save(registration);
    }

    return {
      certificateUrl: registration.certificateUrl,
      certificateCode: registration.certificateCode,
      guestName: registration.fullName,
      eventTitle: registration.event.title,
      eventDate: registration.event.startDate,
      cpdPoints: registration.event.cpdPoints,
    };
  }

  // ============================================
  // DEVELOPMENT FEE CONTRIBUTIONS
  // ============================================

  /**
   * Create development fee contribution
   */
  async createDevelopmentFee(dto: CreateDevelopmentFeeDto): Promise<{
    feeId: string;
    controlNumber: string;
    amount: number;
    currency: string;
    purpose: string;
  }> {
    const fee = new DevelopmentFeeEntity();
    fee.firstName = dto.firstName;
    fee.lastName = dto.lastName;
    fee.email = dto.email;
    fee.phoneNumber = dto.phoneNumber;
    fee.organization = dto.organization;
    fee.purpose = dto.purpose;
    fee.amount = dto.amount;
    fee.notes = dto.notes;
    fee.controlNumber = await this.generateControlNumber('DEV');

    const savedFee = await this.developmentFeeRepository.save(fee);

    this.logger.log(
      `Development fee contribution created: ${dto.amount} TZS from ${dto.email}`,
    );

    return {
      feeId: savedFee.id,
      controlNumber: savedFee.controlNumber,
      amount: savedFee.amount,
      currency: savedFee.currency,
      purpose: savedFee.purpose,
    };
  }

  /**
   * Initiate payment for development fee
   */
  async initiateDevelopmentFeePayment(
    feeId: string,
    dto: DevelopmentFeePaymentDto,
  ): Promise<{
    paymentId: string;
    amount: number;
    currency: string;
    controlNumber: string;
    paymentUrl?: string;
    mobileMoneyRef?: string;
  }> {
    const fee = await this.developmentFeeRepository.findOneBy({ id: feeId });

    if (!fee) {
      throw new NotFoundException('Development fee record not found');
    }

    if (fee.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed');
    }

    const phoneNumber = dto.phoneNumber || fee.phoneNumber;
    if (this.isMobileMoneyMethod(dto.paymentMethod) && !phoneNumber) {
      throw new BadRequestException(
        'Phone number required for mobile money payment',
      );
    }

    const paymentResult = await this.paymentGateway.initiatePayment(
      dto.paymentMethod,
      {
        amount: fee.amount,
        currency: 'TZS',
        phoneNumber,
        email: fee.email,
        reference: fee.id,
        description: `IET Development Fee: ${fee.purpose}`,
        metadata: {
          type: 'DEVELOPMENT_FEE',
          purpose: fee.purpose,
          contributorName: fee.fullName,
        },
      },
    );

    fee.paymentMethod = dto.paymentMethod;
    fee.status = PaymentStatus.PROCESSING;
    await this.developmentFeeRepository.save(fee);

    return {
      paymentId: paymentResult.transactionId,
      amount: fee.amount,
      currency: fee.currency,
      controlNumber: fee.controlNumber,
      paymentUrl: paymentResult.paymentUrl,
      mobileMoneyRef: paymentResult.transactionId,
    };
  }

  // ============================================
  // PUBLIC CALENDAR
  // ============================================

  /**
   * Get public events calendar
   */
  async getPublicCalendar(query: CalendarQueryDto): Promise<{
    year: number;
    month?: number;
    events: Array<{
      id: string;
      title: string;
      category: string;
      startDate: Date;
      endDate?: Date;
      location: string;
      isOnline: boolean;
      registrationFee: number;
      isFree: boolean;
    }>;
  }> {
    const year = query.year || new Date().getFullYear();
    const queryBuilder = this.eventRepository
      .createQueryBuilder('event')
      .where('event.isPublished = true')
      .andWhere('EXTRACT(YEAR FROM event.startDate) = :year', { year });

    if (query.month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM event.startDate) = :month', {
        month: query.month,
      });
    }

    const events = await queryBuilder
      .orderBy('event.startDate', 'ASC')
      .getMany();

    return {
      year,
      month: query.month,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        isOnline: e.isOnline,
        registrationFee: e.registrationFee,
        isFree: e.registrationFee === 0,
      })),
    };
  }

  /**
   * Get system usage instructions (for landing page)
   */
  getSystemInstructions(): {
    sections: Array<{
      title: string;
      steps: string[];
    }>;
  } {
    return {
      sections: [
        {
          title: 'How to Register for Events (Guest)',
          steps: [
            'Browse available events on our Events & Training page',
            'Click "Register" on your desired event',
            'Fill in your personal details (name, email, phone)',
            'Submit your registration',
            'For paid events, complete payment using M-Pesa, Airtel Money, or Card',
            'Receive your ticket number via email and SMS',
            'Present your ticket at the event for check-in',
          ],
        },
        {
          title: 'How to Pay Using Control Number',
          steps: [
            'Note your Control Number from the registration confirmation',
            'Open your mobile money app (M-Pesa/Airtel Money)',
            'Select "Pay Bill" or "Lipa"',
            'Enter the IET Business Number: XXXXXX',
            'Enter your Control Number as reference',
            'Enter the exact amount',
            'Confirm and complete payment',
            'You will receive confirmation via SMS',
          ],
        },
        {
          title: 'How to Get Your Certificate',
          steps: [
            'Attend the event and check in at registration',
            'After the event, log in using your email',
            'Go to "My Registrations"',
            'Click "Download Certificate" for attended events',
            'Certificate includes IET official signature and verification code',
          ],
        },
        {
          title: 'How to Become an IET Member',
          steps: [
            'Click "Register" on the home page',
            'Complete the multi-step registration form',
            'Upload required documents (CV, certificates)',
            'Add your references (proposer and supporter)',
            'Pay the application fee',
            'Submit your application',
            'Wait for review and approval',
          ],
        },
      ],
    };
  }

  // ============================================
  // PAYMENT CALLBACK HANDLERS
  // ============================================

  /**
   * Handle successful guest payment
   */
  async handleGuestPaymentSuccess(
    registrationId: string,
    transactionRef: string,
  ): Promise<void> {
    const registration = await this.guestRegistrationRepository.findOne({
      where: { id: registrationId },
      relations: ['event'],
    });

    if (!registration) {
      this.logger.warn(`Guest registration not found: ${registrationId}`);
      return;
    }

    registration.status = EventRegistrationStatus.CONFIRMED;
    registration.paymentStatus = PaymentStatus.COMPLETED;
    registration.transactionRef = transactionRef;
    registration.receiptNumber = await this.generateReceiptNumber();
    registration.amountPaid = registration.event.registrationFee;

    await this.guestRegistrationRepository.save(registration);

    // Send confirmation
    await this.sendPaymentConfirmation(registration);

    this.logger.log(`Guest payment confirmed for ${registration.email}`);
  }

  /**
   * Handle development fee payment success
   */
  async handleDevelopmentFeePaymentSuccess(
    feeId: string,
    transactionRef: string,
  ): Promise<void> {
    const fee = await this.developmentFeeRepository.findOneBy({ id: feeId });

    if (!fee) {
      this.logger.warn(`Development fee not found: ${feeId}`);
      return;
    }

    fee.status = PaymentStatus.COMPLETED;
    fee.transactionRef = transactionRef;
    fee.paidAt = new Date();
    fee.receiptNumber = await this.generateReceiptNumber();

    await this.developmentFeeRepository.save(fee);

    // Send receipt
    await this.sendDevelopmentFeeReceipt(fee);

    this.logger.log(`Development fee payment confirmed: ${fee.receiptNumber}`);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const result = await this.guestRegistrationRepository
      .createQueryBuilder('reg')
      .select('MAX(CAST(SUBSTRING(reg.ticketNumber, 10) AS INTEGER))', 'maxNum')
      .where('reg.ticketNumber LIKE :pattern', { pattern: `TKT-${year}-%` })
      .getRawOne();

    const nextNumber = (result?.maxNum || 0) + 1;
    return `TKT-${year}-${nextNumber.toString().padStart(5, '0')}`;
  }

  private async generateControlNumber(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `IET-${prefix}-${year}-${random}`;
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `IET/RCT/${year}/${random}`;
  }

  private isMobileMoneyMethod(method: PaymentMethod): boolean {
    return [
      PaymentMethod.MPESA,
      PaymentMethod.AIRTEL_MONEY,
      PaymentMethod.TIGO_PESA,
    ].includes(method);
  }

  private async sendRegistrationConfirmation(
    registration: GuestRegistrationEntity,
    event: EventEntity,
  ): Promise<void> {
    // Send SMS
    await this.smsService.send({
      to: registration.phoneNumber,
      message: `IET Event Registration: ${event.title} on ${event.startDate.toLocaleDateString()}. Ticket: ${registration.ticketNumber}. Control No: ${registration.controlNumber}`,
    });

    // Send Email
    await this.emailService.sendEventRegistrationEmail(
      registration.email,
      registration.firstName,
      {
        title: event.title,
        date: event.startDate,
        location: event.location,
        ticketNumber: registration.ticketNumber,
      },
    );
  }

  private async sendPaymentConfirmation(
    registration: GuestRegistrationEntity,
  ): Promise<void> {
    await this.smsService.sendPaymentConfirmation(
      registration.phoneNumber,
      registration.amountPaid,
      'TZS',
      registration.receiptNumber,
    );

    await this.emailService.sendPaymentReceipt(
      registration.email,
      registration.firstName,
      {
        receiptNumber: registration.receiptNumber,
        amount: registration.amountPaid,
        currency: 'TZS',
        description: `Event Registration: ${registration.event?.title}`,
        date: new Date(),
      },
    );
  }

  private async sendDevelopmentFeeReceipt(
    fee: DevelopmentFeeEntity,
  ): Promise<void> {
    await this.smsService.sendPaymentConfirmation(
      fee.phoneNumber,
      fee.amount,
      fee.currency,
      fee.receiptNumber,
    );

    await this.emailService.sendPaymentReceipt(fee.email, fee.firstName, {
      receiptNumber: fee.receiptNumber,
      amount: fee.amount,
      currency: fee.currency,
      description: `IET Development Contribution: ${fee.purpose}`,
      date: fee.paidAt,
    });
  }
}
