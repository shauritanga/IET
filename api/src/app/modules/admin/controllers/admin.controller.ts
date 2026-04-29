import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { EventsService } from '../../events/services/events.service';
import { GuestService } from '../../guest/services/guest.service';
import {
  MemberQueryDto,
  ApplicationQueryDto,
  UpdateApplicationStageDto,
  UpdateMemberStatusDto,
  AnalyticsQueryDto,
} from '../dto';
import { GuestCheckInDto } from '../../guest/dto';
import { CreateEventDto, UpdateEventDto } from '../../events/dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private adminService: AdminService,
    private eventsService: EventsService,
    private guestService: GuestService,
  ) {}

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved',
    schema: {
      example: {
        success: true,
        data: {
          members: { total: 1234, active: 1150, expired: 84, newThisMonth: 45 },
          applications: {
            pending: 23,
            approved: 156,
            rejected: 12,
            totalThisYear: 191,
          },
          payments: {
            totalRevenue: 45600000,
            thisMonth: 5600000,
            pending: 890000,
            currency: 'TZS',
          },
          events: { upcoming: 8, totalRegistrations: 456, avgAttendance: 85.5 },
        },
      },
    },
  })
  async getDashboardStats(@GetUser() _admin: UserEntity) {
    const result = await this.adminService.getDashboardStats();
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  @Get('members')
  @ApiOperation({ summary: 'List all members' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'membershipClass', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'discipline', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Members list retrieved',
  })
  async listMembers(@Query() query: MemberQueryDto) {
    const result = await this.adminService.listMembers(query);
    return {
      success: true,
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

  @Get('members/:memberId')
  @ApiOperation({ summary: 'Get member details (admin view)' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member details retrieved',
  })
  async getMemberDetails(@Param('memberId', ParseUUIDPipe) memberId: string) {
    const result = await this.adminService.getMemberDetails(memberId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch('members/:memberId/status')
  @ApiOperation({ summary: 'Update member status' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member status updated',
  })
  async updateMemberStatus(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @GetUser() admin: UserEntity,
    @Body() dto: UpdateMemberStatusDto,
  ) {
    await this.adminService.updateMemberStatus(memberId, admin.id, dto);
    return {
      success: true,
      message: 'Member status updated successfully',
    };
  }

  @Get('members/export')
  @ApiOperation({ summary: 'Export members to CSV' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="members.csv"')
  async exportMembers(@Query() query: MemberQueryDto, @Res() res: Response) {
    const csv = await this.adminService.exportMembers(query);
    const filename = `members_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // ============================================
  // APPLICATION MANAGEMENT
  // ============================================

  @Get('applications')
  @ApiOperation({ summary: 'List applications for review' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Applications list retrieved',
  })
  async listApplications(@Query() query: ApplicationQueryDto) {
    const result = await this.adminService.listApplications(query);
    return {
      success: true,
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

  @Get('applications/:applicationId')
  @ApiOperation({ summary: 'Get application details' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application details retrieved',
  })
  async getApplicationDetails(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.adminService.getApplicationDetails(applicationId);
    return {
      success: true,
      data: result,
    };
  }

  @Patch('applications/:applicationId/stage')
  @ApiOperation({ summary: 'Update application workflow stage' })
  @ApiParam({ name: 'applicationId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application workflow updated',
    schema: {
      example: {
        success: true,
        data: {
          applicationId: '550e8400-e29b-41d4-a716-446655440000',
          status: 'APPROVED',
          reviewStage: 'APPROVAL_NOTICE_SENT',
          reviewedBy: 'admin-uuid',
          reviewedAt: '2025-01-27T10:00:00Z',
          membershipId: 'IET/ENG/0234',
        },
        message: 'Application workflow updated successfully',
      },
    },
  })
  async updateApplicationStage(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @GetUser() admin: UserEntity,
    @Body() dto: UpdateApplicationStageDto,
  ) {
    const result = await this.adminService.updateApplicationStage(
      applicationId,
      admin.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Application workflow updated successfully',
    };
  }

  // ============================================
  // ANALYTICS
  // ============================================

  @Get('analytics/members')
  @ApiOperation({ summary: 'Get member analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'groupBy', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved',
  })
  async getMemberAnalytics(@Query() query: AnalyticsQueryDto) {
    const result = await this.adminService.getMemberAnalytics(query);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // EVENT CHECK-IN (GUEST & MEMBER)
  // ============================================

  @Post('events/check-in')
  @ApiOperation({ summary: 'Check-in guest/member at event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Check-in successful',
    schema: {
      example: {
        success: true,
        data: {
          guestName: 'John Doe',
          organization: 'ABC Company',
          checkedInAt: '2025-01-27T08:30:00Z',
        },
        message: 'Check-in successful',
      },
    },
  })
  async checkInGuest(
    @GetUser() admin: UserEntity,
    @Body() dto: GuestCheckInDto,
  ) {
    const result = await this.guestService.checkInGuest(
      dto.ticketNumber,
      admin.id,
    );
    return {
      success: true,
      data: result,
      message: 'Check-in successful',
    };
  }

  // ============================================
  // EVENT MANAGEMENT
  // ============================================

  @Get('events')
  @ApiOperation({ summary: 'List all events for admin' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin events retrieved',
  })
  async listEvents() {
    const result = await this.eventsService.listAdminEvents();
    return {
      success: true,
      data: result,
    };
  }

  @Post('events')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event created',
  })
  async createEvent(@GetUser() admin: UserEntity, @Body() dto: CreateEventDto) {
    const event = await this.eventsService.createEvent(dto, admin.id);
    return {
      success: true,
      data: event,
      message: 'Event created successfully',
    };
  }

  @Patch('events/:eventId')
  @ApiOperation({ summary: 'Update an event' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event updated',
  })
  async updateEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @GetUser() admin: UserEntity,
    @Body() dto: UpdateEventDto,
  ) {
    const event = await this.eventsService.updateEvent(eventId, dto, admin.id);
    return {
      success: true,
      data: event,
      message: 'Event updated successfully',
    };
  }
}
