import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Res,
  Header,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  PaymentQueryDto,
  CreateMemberDto,
  AdminUserQueryDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  FiscalYearSettingsDto,
  MembershipCategoryQueryDto,
  CreateMembershipCategoryDto,
  UpdateMembershipCategoryDto,
  DisciplineQueryDto,
  CreateDisciplineDto,
  UpdateDisciplineDto,
  EngineeringInstitutionQueryDto,
  CreateEngineeringInstitutionDto,
  UpdateEngineeringInstitutionDto,
  RenewMemberDto,
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
  // ADMIN PORTAL USER MANAGEMENT
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'List admin portal users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async listAdminUsers(
    @GetUser() admin: UserEntity,
    @Query() query: AdminUserQueryDto,
  ) {
    const result = await this.adminService.listAdminUsers(admin, query);
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

  @Post('users')
  @ApiOperation({ summary: 'Create an admin portal user' })
  async createAdminUser(
    @GetUser() admin: UserEntity,
    @Body() dto: CreateAdminUserDto,
  ) {
    const user = await this.adminService.createAdminUser(admin, dto);
    return {
      success: true,
      data: user,
      message: 'Admin user created successfully',
    };
  }

  @Get('users/evaluators')
  @ApiOperation({ summary: 'List active evaluator users' })
  async listEvaluators() {
    const users = await this.adminService.listEvaluators();
    return {
      success: true,
      data: users,
    };
  }

  @Patch('users/:userId')
  @ApiOperation({ summary: 'Update an admin portal user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  async updateAdminUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() admin: UserEntity,
    @Body() dto: UpdateAdminUserDto,
  ) {
    const user = await this.adminService.updateAdminUser(admin, userId, dto);
    return {
      success: true,
      data: user,
      message: 'Admin user updated successfully',
    };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get an admin portal user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  async getAdminUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() admin: UserEntity,
  ) {
    return {
      success: true,
      data: await this.adminService.getAdminUser(admin, userId),
    };
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete an admin portal user' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  async deleteAdminUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() admin: UserEntity,
  ) {
    await this.adminService.deleteAdminUser(admin, userId);
    return {
      success: true,
      message: 'Admin user deleted successfully',
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

  @Post('members')
  @ApiOperation({ summary: 'Create a single member account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Member created' })
  async createMember(@Body() dto: CreateMemberDto) {
    const member = await this.adminService.createMember(dto);
    return { success: true, data: member, message: 'Member created successfully' };
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

  @Post('members/:memberId/renew')
  @ApiOperation({ summary: 'Renew member on behalf of the member' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member renewed successfully',
  })
  async renewMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @GetUser() admin: UserEntity,
    @Body() dto: RenewMemberDto,
  ) {
    const result = await this.adminService.renewMember(memberId, admin.id, dto);
    return {
      success: true,
      data: result,
      message: 'Member renewed successfully',
    };
  }

  @Delete('members/:memberId')
  @ApiOperation({ summary: 'Soft delete a member' })
  @ApiParam({ name: 'memberId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member deleted successfully',
  })
  async deleteMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @GetUser() admin: UserEntity,
  ) {
    await this.adminService.deleteMember(memberId, admin.id);
    return {
      success: true,
      message: 'Member deleted successfully',
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
  async listApplications(
    @GetUser() admin: UserEntity,
    @Query() query: ApplicationQueryDto,
  ) {
    const result = await this.adminService.listApplications(admin, query);
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
    @GetUser() admin: UserEntity,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    const result = await this.adminService.getApplicationDetails(
      admin,
      applicationId,
    );
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
      admin,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Application workflow updated successfully',
    };
  }

  // ============================================
  // MEMBER IMPORT
  // ============================================

  @Post('members/import')
  @ApiOperation({ summary: 'Bulk import members from Excel or CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Import result' })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async importMembers(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Import file is required');
    const lowerName = file.originalname.toLowerCase();
    const allowed =
      lowerName.endsWith('.csv') ||
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      file.mimetype.includes('csv') ||
      file.mimetype.includes('spreadsheet');
    if (!allowed) {
      throw new BadRequestException('Only .xlsx, .xls, and .csv files are accepted');
    }
    const result = await this.adminService.importMembers(file);
    return {
      success: true,
      data: result,
      message: `Import complete: ${result.created} created, ${result.updated} updated, ${result.feesCreated} fees created, ${result.feesUpdated} fees updated`,
    };
  }

  // ============================================
  // MAINTENANCE JOBS
  // ============================================

  @Post('maintenance/deactivate-inactive')
  @ApiOperation({ summary: 'Soft-delete members inactive for 3+ years (EXPIRED status)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inactive members deactivated' })
  async deactivateInactiveMembers() {
    const result = await this.adminService.deactivateInactiveMembers();
    return {
      success: true,
      data: result,
      message: `Deactivated ${result.deactivated} inactive members`,
    };
  }

  @Post('maintenance/expire-unpaid-memberships')
  @ApiOperation({ summary: 'Mark overdue fees and expire unpaid memberships' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Memberships expired' })
  async expireUnpaidMemberships() {
    const result = await this.adminService.expireUnpaidMemberships();
    return {
      success: true,
      data: result,
      message: `${result.feesMarkedOverdue} fees overdue, ${result.membershipsExpired} memberships expired`,
    };
  }

  @Post('maintenance/expire-pending-event-registrations')
  @ApiOperation({
    summary:
      'Expire event registrations whose payment window has elapsed (run periodically)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Registrations expired' })
  async expirePendingEventRegistrations() {
    const count = await this.adminService.expirePendingEventRegistrations();
    return {
      success: true,
      data: { expired: count },
      message: `${count} pending event registration(s) marked as expired`,
    };
  }

  // ============================================
  // SETTINGS — FEE CONFIGURATION
  // ============================================

  @Get('settings/fees')
  @ApiOperation({ summary: 'Get membership fee configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fee configuration retrieved' })
  async getFeeConfig() {
    const fees = await this.adminService.getFeeConfig();
    return { success: true, data: fees };
  }

  @Put('settings/fees')
  @ApiOperation({ summary: 'Update membership fee configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fee configuration updated' })
  async updateFeeConfig(@Body() body: Record<string, number>) {
    const fees = await this.adminService.updateFeeConfig(body);
    return { success: true, data: fees, message: 'Fee configuration updated successfully' };
  }

  @Get('settings/fiscal-year')
  @ApiOperation({ summary: 'Get membership fiscal year configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fiscal year configuration retrieved' })
  async getFiscalYearSettings() {
    const settings = await this.adminService.getFiscalYearSettings();
    return { success: true, data: settings };
  }

  @Put('settings/fiscal-year')
  @ApiOperation({ summary: 'Update membership fiscal year configuration' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Fiscal year configuration updated' })
  async updateFiscalYearSettings(@Body() dto: FiscalYearSettingsDto) {
    const settings = await this.adminService.updateFiscalYearSettings(dto);
    return { success: true, data: settings, message: 'Fiscal year configuration updated successfully' };
  }

  // ============================================
  // PAYMENT MANAGEMENT
  // ============================================

  @Get('payments')
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payments list retrieved' })
  async listPayments(@Query() query: PaymentQueryDto) {
    const result = await this.adminService.listPayments(query);
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
        years: result.years,
        summary: result.summary,
      },
    };
  }

  @Delete('payments/:id')
  @ApiOperation({
    summary: 'Delete a failed or cancelled payment (super admin only)',
  })
  async deletePayment(
    @GetUser() admin: UserEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deletePayment(admin, id);
  }

  @Post('payments/:id/check-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-check a payment status against the gateway' })
  async checkPaymentStatus(
    @GetUser() admin: UserEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.checkPaymentStatus(admin, id);
  }

  @Post('payments/:id/resend-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Regenerate and send a payment link by email + SMS (super admin)',
  })
  async resendPaymentLink(
    @GetUser() admin: UserEntity,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.resendPaymentLink(admin, id);
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

  @Get('events/:eventId/registrations')
  @ApiOperation({ summary: 'List registrations/attendees for a specific event' })
  @ApiParam({ name: 'eventId', type: 'string', format: 'uuid' })
  async getEventAttendees(@Param('eventId', ParseUUIDPipe) eventId: string) {
    const result = await this.eventsService.getEventAttendees(eventId);
    return { success: true, data: result };
  }

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

  // ============================================
  // MEMBERSHIP CATEGORIES
  // ============================================

  @Get('membership-categories')
  @ApiOperation({ summary: 'List membership categories' })
  async getMembershipCategories(@Query() query: MembershipCategoryQueryDto) {
    return this.adminService.getMembershipCategories(query);
  }

  @Post('membership-categories')
  @ApiOperation({ summary: 'Create a membership category' })
  async createMembershipCategory(@Body() dto: CreateMembershipCategoryDto) {
    return this.adminService.createMembershipCategory(dto);
  }

  @Patch('membership-categories/:id')
  @ApiOperation({ summary: 'Update a membership category' })
  async updateMembershipCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipCategoryDto,
  ) {
    return this.adminService.updateMembershipCategory(id, dto);
  }

  @Delete('membership-categories/:id')
  @ApiOperation({ summary: 'Delete a membership category' })
  async deleteMembershipCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteMembershipCategory(id);
  }

  // ============================================
  // DISCIPLINES (admin-managed tree)
  // ============================================

  @Get('disciplines')
  @ApiOperation({ summary: 'List disciplines (flat or tree)' })
  async getDisciplines(@Query() query: DisciplineQueryDto) {
    return this.adminService.getDisciplines(query);
  }

  @Post('disciplines')
  @ApiOperation({ summary: 'Create a discipline' })
  async createDiscipline(@Body() dto: CreateDisciplineDto) {
    return this.adminService.createDiscipline(dto);
  }

  @Patch('disciplines/:id')
  @ApiOperation({ summary: 'Update a discipline' })
  async updateDiscipline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDisciplineDto,
  ) {
    return this.adminService.updateDiscipline(id, dto);
  }

  @Delete('disciplines/:id')
  @ApiOperation({ summary: 'Delete a discipline' })
  async deleteDiscipline(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteDiscipline(id);
  }

  // ============================================
  // ENGINEERING INSTITUTIONS
  // ============================================

  @Get('engineering-institutions')
  @ApiOperation({ summary: 'List engineering institutions' })
  async getEngineeringInstitutions(@Query() query: EngineeringInstitutionQueryDto) {
    return this.adminService.getEngineeringInstitutions(query);
  }

  @Post('engineering-institutions')
  @ApiOperation({ summary: 'Create an engineering institution' })
  async createEngineeringInstitution(@Body() dto: CreateEngineeringInstitutionDto) {
    return this.adminService.createEngineeringInstitution(dto);
  }

  @Patch('engineering-institutions/:id')
  @ApiOperation({ summary: 'Update an engineering institution' })
  async updateEngineeringInstitution(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEngineeringInstitutionDto,
  ) {
    return this.adminService.updateEngineeringInstitution(id, dto);
  }

  @Delete('engineering-institutions/:id')
  @ApiOperation({ summary: 'Delete an engineering institution' })
  async deleteEngineeringInstitution(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteEngineeringInstitution(id);
  }
}
