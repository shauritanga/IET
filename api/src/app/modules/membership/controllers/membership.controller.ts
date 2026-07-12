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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { MembershipService } from '../services/membership.service';
import { InitiateFeePaymentDto } from '../dto';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Memberships')
@Controller('memberships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List available membership categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Membership categories retrieved successfully',
  })
  async getMembershipCategories() {
    const result = await this.membershipService.getMembershipCategories();
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // MEMBERSHIP DETAILS
  // ============================================

  @Get('me')
  @ApiOperation({ summary: 'Get current user membership details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Membership details retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          membershipId: 'IET/ENG/0234',
          membershipClass: 'MIET',
          status: 'ACTIVE',
          engineeringDiscipline: 'Mechanical',
          location: 'Dar es salaam, Tanzania',
          joiningDate: '2022-07-10',
          expiryDate: '2026-07-10',
          annualFee: 10000,
          nextPaymentDue: '2025-07-10',
          daysUntilExpiry: 165,
        },
      },
    },
  })
  async getMembershipDetails(@GetUser() user: UserEntity) {
    const result = await this.membershipService.getMembershipDetails(user.id);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // FEE MANAGEMENT
  // ============================================

  @Get('me/fees')
  @ApiOperation({ summary: 'Get fee history for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2025 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fee history retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            year: 2025,
            membershipClass: 'SENIOR_MEMBER',
            fee: 10000,
            status: 'EXPIRING',
            paidAt: null,
            dueDate: '2025-07-10',
          },
          {
            year: 2024,
            membershipClass: 'FELLOW',
            fee: 5000,
            status: 'PAID',
            paidAt: '2024-06-15T10:00:00Z',
            receiptNumber: 'IET/RCT/2024/0123',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 3,
          totalPages: 1,
        },
      },
    },
  })
  async getFeeHistory(
    @GetUser() user: UserEntity,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('year') year?: number,
  ) {
    const result = await this.membershipService.getFeeHistory(
      user.id,
      page || 1,
      limit || 10,
      year,
    );
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

  @Post('me/fees/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate membership fee payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment initiated successfully',
    schema: {
      example: {
        success: true,
        data: {
          paymentId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 10000,
          currency: 'TZS',
          paymentMethod: 'MPESA',
          status: 'PENDING',
          mobileMoneyRef: 'REF123456',
        },
        message: 'Payment initiated. Please check your phone.',
      },
    },
  })
  async initiateFeePayment(
    @GetUser() user: UserEntity,
    @Body() dto: InitiateFeePaymentDto,
  ) {
    const result = await this.membershipService.initiateFeePayment(
      user.id,
      dto,
    );
    return {
      success: true,
      data: result,
      message: 'Payment initiated. Please check your phone.',
    };
  }

  @Get('me/fees/:year/receipt')
  @ApiOperation({ summary: 'Get payment receipt for a specific year' })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          receiptNumber: 'IET/RCT/2025/0234',
          year: 2025,
          amount: 10000,
          currency: 'TZS',
          paymentMethod: 'MPESA',
          transactionRef: 'TXN123456',
          paidAt: '2025-01-27T10:00:00Z',
          pdfUrl: 'https://cdn.iet.or.tz/receipts/uuid.pdf',
        },
      },
    },
  })
  async getReceipt(
    @GetUser() user: UserEntity,
    @Param('year', ParseIntPipe) year: number,
  ) {
    const result = await this.membershipService.getReceipt(user.id, year);
    return {
      success: true,
      data: result,
    };
  }
}
