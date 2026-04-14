import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { GuestService } from '../services/guest.service';
import {
  GuestEventRegistrationDto,
  GuestPaymentDto,
  GuestRegistrationQueryDto,
  CreateDevelopmentFeeDto,
  DevelopmentFeePaymentDto,
  CalendarQueryDto,
} from '../dto';

@ApiTags('Guest / Public')
@Controller('public')
@Public()
export class GuestController {
  constructor(private guestService: GuestService) {}

  // ============================================
  // PUBLIC CALENDAR & INSTRUCTIONS
  // ============================================

  @Get('calendar')
  @ApiOperation({ summary: 'Get public events calendar' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events calendar retrieved',
    schema: {
      example: {
        success: true,
        data: {
          year: 2025,
          events: [
            {
              id: 'uuid',
              title: 'Structural Design Workshop',
              category: 'CPD_COURSE',
              startDate: '2025-10-27',
              location: 'Karimjee Hall',
              isOnline: false,
              registrationFee: 50000,
              isFree: false,
            },
          ],
        },
      },
    },
  })
  async getPublicCalendar(@Query() query: CalendarQueryDto) {
    const result = await this.guestService.getPublicCalendar(query);
    return {
      success: true,
      data: result,
    };
  }

  @Get('instructions')
  @ApiOperation({ summary: 'Get system usage instructions for landing page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Instructions retrieved',
  })
  async getInstructions() {
    const result = this.guestService.getSystemInstructions();
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // GUEST EVENT REGISTRATION
  // ============================================

  @Post('events/:eventId/register')
  @ApiOperation({ summary: 'Register as guest for an event' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    schema: {
      example: {
        success: true,
        data: {
          registrationId: 'uuid',
          ticketNumber: 'TKT-2025-00001',
          controlNumber: 'IET-EVT-2025-123456',
          event: {
            title: 'Structural Design Workshop',
            date: '2025-10-27',
            location: 'Karimjee Hall',
          },
          amount: 50000,
          status: 'PENDING',
        },
        message:
          'Registration successful. Please complete payment using the control number.',
      },
    },
  })
  async registerForEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: GuestEventRegistrationDto,
  ) {
    const result = await this.guestService.registerForEvent(eventId, dto);
    const message =
      result.amount === 0
        ? 'Registration confirmed. Check your email for details.'
        : 'Registration successful. Please complete payment using the control number.';
    return {
      success: true,
      data: result,
      message,
    };
  }

  @Post('registrations/:registrationId/pay')
  @ApiOperation({ summary: 'Initiate payment for guest registration' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment initiated',
    schema: {
      example: {
        success: true,
        data: {
          paymentId: 'uuid',
          amount: 50000,
          currency: 'TZS',
          controlNumber: 'IET-EVT-2025-123456',
          mobileMoneyRef: 'REF123456',
        },
        message: 'Payment initiated. Check your phone to complete.',
      },
    },
  })
  async initiatePayment(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: GuestPaymentDto,
  ) {
    const result = await this.guestService.initiateGuestPayment(
      registrationId,
      dto,
    );
    const message = result.paymentUrl
      ? 'Payment initiated. Complete payment at the provided URL.'
      : 'Payment initiated. Check your phone to complete.';
    return {
      success: true,
      data: result,
      message,
    };
  }

  @Get('registrations/lookup')
  @ApiOperation({
    summary: 'Lookup guest registration by ticket number or email',
  })
  @ApiQuery({ name: 'ticketNumber', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration found',
  })
  async lookupRegistration(@Query() query: GuestRegistrationQueryDto) {
    const result = await this.guestService.getGuestRegistration(
      query.ticketNumber,
      query.email,
    );
    return {
      success: true,
      data: {
        registrationId: result.id,
        ticketNumber: result.ticketNumber,
        guestName: result.fullName,
        email: result.email,
        event: result.event
          ? {
              id: result.event.id,
              title: result.event.title,
              date: result.event.startDate,
              location: result.event.location,
            }
          : null,
        status: result.status,
        paymentStatus: result.paymentStatus,
        checkedInAt: result.checkedInAt,
      },
    };
  }

  @Get('registrations/:registrationId/name-tag')
  @ApiOperation({ summary: 'Generate and download name tag' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Name tag generated',
  })
  async getNameTag(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
  ) {
    const result = await this.guestService.generateNameTag(registrationId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('registrations/:registrationId/certificate')
  @ApiOperation({ summary: 'Download participation certificate' })
  @ApiParam({ name: 'registrationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificate generated',
    schema: {
      example: {
        success: true,
        data: {
          certificateUrl: 'https://cdn.iet.or.tz/certificates/uuid.pdf',
          certificateCode: 'IET-CERT-2025-ABC123',
          guestName: 'John Doe',
          eventTitle: 'Structural Design Workshop',
          eventDate: '2025-10-27',
          cpdPoints: 8,
        },
      },
    },
  })
  async getCertificate(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
  ) {
    const result = await this.guestService.generateCertificate(registrationId);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // DEVELOPMENT FEE CONTRIBUTIONS
  // ============================================

  @Post('development-fees')
  @ApiOperation({
    summary: 'Create development fee contribution (temporary account)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contribution record created',
    schema: {
      example: {
        success: true,
        data: {
          feeId: 'uuid',
          controlNumber: 'IET-DEV-2025-123456',
          amount: 100000,
          currency: 'TZS',
          purpose: 'Building Fund',
        },
        message:
          'Contribution recorded. Use the control number to make payment.',
      },
    },
  })
  async createDevelopmentFee(@Body() dto: CreateDevelopmentFeeDto) {
    const result = await this.guestService.createDevelopmentFee(dto);
    return {
      success: true,
      data: result,
      message: 'Contribution recorded. Use the control number to make payment.',
    };
  }

  @Post('development-fees/:feeId/pay')
  @ApiOperation({ summary: 'Initiate payment for development fee' })
  @ApiParam({ name: 'feeId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment initiated',
  })
  async initiateDevelopmentFeePayment(
    @Param('feeId', ParseUUIDPipe) feeId: string,
    @Body() dto: DevelopmentFeePaymentDto,
  ) {
    const result = await this.guestService.initiateDevelopmentFeePayment(
      feeId,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Payment initiated. Check your phone to complete.',
    };
  }

  // ============================================
  // CERTIFICATE VERIFICATION
  // ============================================

  @Get('certificates/verify/:code')
  @ApiOperation({ summary: 'Verify certificate authenticity' })
  @ApiParam({
    name: 'code',
    type: 'string',
    description: 'Certificate verification code',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Certificate verification result',
  })
  async verifyCertificate(@Param('code') code: string) {
    // TODO: Implement certificate verification
    return {
      success: true,
      data: {
        valid: true,
        certificateCode: code,
        message: 'This is a valid IET certificate',
      },
    };
  }
}
