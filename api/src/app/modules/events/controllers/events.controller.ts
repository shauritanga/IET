import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { EventsService } from '../services/events.service';
import {
  EventQueryDto,
  RegisterForEventDto,
  CancelRegistrationDto,
  EventFeedbackDto,
  RegistrationQueryDto,
} from '../dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List events with filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Comma-separated categories',
  })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events list retrieved successfully',
  })
  async listEvents(
    @Query() query: EventQueryDto,
    @GetUser() user?: UserEntity,
  ) {
    const result = await this.eventsService.listEvents(query, user?.id);
    return {
      data: result.items,
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Get(':eventId')
  @Public()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get event details' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event details retrieved successfully',
  })
  async getEventDetails(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user?: UserEntity,
  ) {
    const result = await this.eventsService.getEventDetails(eventId, user?.id);
    return {
      data: result,
    };
  }

  // ============================================
  // REGISTRATION ENDPOINTS
  // ============================================

  @Post(':eventId/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for an event' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    schema: {
      example: {
        success: true,
        data: {
          registrationId: '550e8400-e29b-41d4-a716-446655440000',
          eventId: '550e8400-e29b-41d4-a716-446655440001',
          eventTitle: 'Structural Design CPD Workshop',
          status: 'PENDING_PAYMENT',
          paymentId: '550e8400-e29b-41d4-a716-446655440002',
          amount: 50000,
          currency: 'TZS',
        },
        message: 'Registration initiated. Please complete payment.',
      },
    },
  })
  async registerForEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() user: UserEntity,
    @Body() dto: RegisterForEventDto,
  ) {
    const result = await this.eventsService.registerForEvent(
      eventId,
      user.id,
      dto,
    );
    return {
      data: result,
      message:
        result.status === 'CONFIRMED'
          ? 'Registration confirmed.'
          : 'Registration initiated. Please complete payment.',
    };
  }

  @Get('registrations/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my event registrations' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User registrations retrieved successfully',
  })
  async getMyRegistrations(
    @GetUser() user: UserEntity,
    @Query() query: RegistrationQueryDto,
  ) {
    const result = await this.eventsService.getUserRegistrations(
      user.id,
      query.status,
      query.page || 1,
      query.limit || 10,
    );
    return {
      data: result.items,
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Post('registrations/:registrationId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel event registration' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration cancelled',
    schema: {
      example: {
        success: true,
        data: {
          registrationId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'CANCELLED',
          refundAmount: 45000,
          refundStatus: 'PROCESSING',
        },
        message:
          'Registration cancelled. Refund will be processed within 7 days.',
      },
    },
  })
  async cancelRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: CancelRegistrationDto,
  ) {
    const result = await this.eventsService.cancelRegistration(
      registrationId,
      user.id,
      dto,
    );
    const message =
      result.refundAmount > 0
        ? 'Registration cancelled. Refund will be processed within 7 days.'
        : 'Registration cancelled.';
    return {
      data: result,
      message,
    };
  }

  @Get('registrations/:registrationId/certificate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event certificate' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificate details retrieved',
    schema: {
      example: {
        success: true,
        data: {
          certificateId: '550e8400-e29b-41d4-a716-446655440000',
          eventTitle: 'Structural Design CPD Workshop',
          attendeeName: 'Eng. Joram Allan Jackson',
          completionDate: '2025-10-27',
          cpdPoints: 8,
          certificateUrl: 'https://cdn.iet.or.tz/certificates/uuid.pdf',
          verificationCode: 'IET-CERT-2025-0123',
        },
      },
    },
  })
  async getCertificate(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: UserEntity,
  ) {
    const result = await this.eventsService.getCertificate(
      registrationId,
      user.id,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Post('registrations/:registrationId/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit event feedback' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback submitted successfully',
  })
  async submitFeedback(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: UserEntity,
    @Body() dto: EventFeedbackDto,
  ) {
    await this.eventsService.submitFeedback(registrationId, user.id, dto);
    return {
      success: true,
      message: 'Feedback submitted successfully',
    };
  }

  @Post('registrations/:registrationId/retry-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry payment for a pending or expired event registration',
  })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'New payment initiated — redirect user to paymentUrl',
  })
  async retryEventPayment(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.eventsService.retryEventPayment(registrationId, user.id);
  }

  @Get('registrations/:registrationId/payment-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for an event registration' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration payment status',
  })
  async getRegistrationPaymentStatus(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @GetUser() user: UserEntity,
  ) {
    return this.eventsService.getRegistrationPaymentStatus(
      registrationId,
      user.id,
    );
  }
}
