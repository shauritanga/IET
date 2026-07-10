import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { AdminGuard } from '../../auth/guards/admin.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { UpgradeService } from '../services/upgrade.service';
import {
  ReviewUpgradeApplicationDto,
  UpgradeApplicationQueryDto,
  CreateUpgradeRuleDto,
  UpdateUpgradeRuleDto,
} from '../dto';

@ApiTags('Admin — Upgrade Applications')
@Controller('admin/upgrades')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UpgradeAdminController {
  constructor(private readonly upgradeService: UpgradeService) {}

  // ─── Upgrade Applications ────────────────────────────────────────────────

  @Get('applications')
  @ApiOperation({ summary: 'List all upgrade applications (with filters)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of upgrade applications' })
  async listApplications(@Query() query: UpgradeApplicationQueryDto) {
    const result = await this.upgradeService.listUpgradeApplications(query);
    return {
      success: true,
      data: result.items.map((app) => ({
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,
        applicantNotes: app.applicantNotes,
        applicant: app.user
          ? {
              id: app.user.id,
              fullName: `${app.user.firstName ?? ''} ${app.user.lastName ?? ''}`.trim(),
              email: app.user.email,
              membershipId: app.user.membershipId,
            }
          : null,
        fromCategory: app.fromCategory
          ? { id: app.fromCategory.id, name: app.fromCategory.name }
          : null,
        toCategory: app.toCategory
          ? { id: app.toCategory.id, name: app.toCategory.name }
          : null,
        reviewer: app.reviewedBy
          ? {
              id: app.reviewedBy.id,
              fullName: `${app.reviewedBy.firstName ?? ''} ${app.reviewedBy.lastName ?? ''}`.trim(),
            }
          : null,
      })),
      meta: {
        page: result.page,
        limit: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get a single upgrade application by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Upgrade application details' })
  async getApplication(@Param('id', ParseUUIDPipe) id: string) {
    const app = await this.upgradeService.getUpgradeApplicationDetails(id);
    return { success: true, data: app };
  }

  @Patch('applications/:id/review')
  @ApiOperation({ summary: 'Approve or reject an upgrade application' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application reviewed. On approval the member category is updated.',
  })
  async reviewApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() admin: UserEntity,
    @Body() dto: ReviewUpgradeApplicationDto,
  ) {
    const app = await this.upgradeService.reviewUpgradeApplication(id, admin.id, dto);
    return {
      success: true,
      data: app,
      message:
        app.status === 'APPROVED'
          ? 'Upgrade application approved. Member category has been updated.'
          : 'Upgrade application rejected.',
    };
  }

  // ─── Upgrade Rules ───────────────────────────────────────────────────────

  @Get('rules')
  @ApiOperation({ summary: 'List all upgrade rules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of upgrade rules' })
  async listRules() {
    const rules = await this.upgradeService.listUpgradeRules();
    return { success: true, data: rules };
  }

  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new upgrade rule' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Upgrade rule created' })
  async createRule(
    @GetUser() admin: UserEntity,
    @Body() dto: CreateUpgradeRuleDto,
  ) {
    const rule = await this.upgradeService.createUpgradeRule(admin.id, dto);
    return { success: true, data: rule, message: 'Upgrade rule created successfully.' };
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update an upgrade rule' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Upgrade rule updated' })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() admin: UserEntity,
    @Body() dto: UpdateUpgradeRuleDto,
  ) {
    const rule = await this.upgradeService.updateUpgradeRule(id, admin.id, dto);
    return { success: true, data: rule, message: 'Upgrade rule updated successfully.' };
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (soft-delete) an upgrade rule' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Upgrade rule deleted' })
  async deleteRule(@Param('id', ParseUUIDPipe) id: string) {
    await this.upgradeService.deleteUpgradeRule(id);
    return { success: true, message: 'Upgrade rule deleted successfully.' };
  }
}
