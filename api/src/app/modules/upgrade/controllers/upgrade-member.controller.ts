import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { UpgradeService } from '../services/upgrade.service';
import { SubmitUpgradeApplicationDto } from '../dto';

@ApiTags('Membership Upgrades')
@Controller('memberships/upgrades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UpgradeMemberController {
  constructor(private readonly upgradeService: UpgradeService) {}

  // ─── GET /memberships/upgrades/eligible ─────────────────────────────────

  @Get('eligible')
  @ApiOperation({
    summary: 'Check eligibility and get available upgrade categories',
    description:
      'Returns canUpgrade flag, eligible target categories, and missing requirements. ' +
      'Used by the dashboard to show/hide the Upgrade Membership button.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Eligibility check result',
    schema: {
      example: {
        success: true,
        data: {
          canUpgrade: true,
          eligibleCategories: [
            {
              id: 'uuid',
              name: 'Senior Member (SenMIET)',
              description: 'Has eight (8) years of professional experience...',
              yearlyFee: 75000,
              minYearsExperience: 8,
              ruleId: 'uuid',
            },
          ],
          missingRequirements: [],
        },
      },
    },
  })
  async checkEligibility(@GetUser() user: UserEntity) {
    const result = await this.upgradeService.getEligibleUpgradeCategories(user.id);
    return { success: true, data: result };
  }

  // ─── POST /memberships/upgrades/apply ───────────────────────────────────

  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a membership upgrade application',
    description:
      'Backend re-validates eligibility before creating the application. ' +
      'Returns 403 if the member is not eligible or the category is not an eligible target.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Upgrade application submitted successfully',
    schema: {
      example: {
        success: true,
        data: { id: 'uuid', status: 'PENDING', submittedAt: '2025-01-27T10:00:00Z' },
        message: 'Your upgrade application has been submitted and is under review.',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Not eligible to upgrade' })
  async submitUpgradeApplication(
    @GetUser() user: UserEntity,
    @Body() dto: SubmitUpgradeApplicationDto,
  ) {
    const application = await this.upgradeService.submitUpgradeApplication(user.id, dto);
    return {
      success: true,
      data: {
        id: application.id,
        status: application.status,
        fromCategoryId: application.fromCategoryId,
        toCategoryId: application.toCategoryId,
        submittedAt: application.submittedAt,
        applicantNotes: application.applicantNotes,
      },
      message: 'Your upgrade application has been submitted and is under review.',
    };
  }

  // ─── GET /memberships/upgrades/my-applications ──────────────────────────

  @Get('my-applications')
  @ApiOperation({ summary: 'Get all upgrade applications for the logged-in member' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Upgrade application history' })
  async getMyApplications(@GetUser() user: UserEntity) {
    const applications = await this.upgradeService.getMyUpgradeApplications(user.id);
    return { success: true, data: applications };
  }
}
