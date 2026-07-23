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
  Headers,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { UserEntity } from '../../user/entities/user.entity';
import { PaymentsService } from '../services/payments.service';
import {
  InitiatePaymentDto,
  PaymentQueryDto,
  MpesaCallbackDto,
  SelcomCallbackDto,
  SelcomC2bCallbackDto,
  SelcomWebhookDto,
} from '../dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ============================================
  // USER ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a payment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment initiated successfully',
    schema: {
      example: {
        success: true,
        data: {
          paymentId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 10000,
          currency: 'TZS',
          paymentMethod: 'MPESA',
          status: 'PROCESSING',
          mobileMoneyRef: 'REF123456',
        },
        message:
          'Payment initiated. Please check your phone to complete payment.',
      },
    },
  })
  async initiatePayment(
    @GetUser() user: UserEntity,
    @Body() dto: InitiatePaymentDto,
  ) {
    const result = await this.paymentsService.initiatePayment(user.id, dto);
    const message = result.paymentUrl
      ? 'Payment initiated. Please complete payment using the provided URL.'
      : 'Payment initiated. Please check your phone to complete payment.';
    return {
      success: true,
      data: result,
      message,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Payment type filter',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
  })
  async getUserPayments(
    @GetUser() user: UserEntity,
    @Query() query: PaymentQueryDto,
  ) {
    const result = await this.paymentsService.getUserPayments(user.id, query);
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

  @Get(':paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  @ApiParam({ name: 'paymentId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
  })
  async getPaymentDetails(
    @GetUser() user: UserEntity,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    const result = await this.paymentsService.getPaymentById(
      paymentId,
      user.id,
    );
    return {
      success: true,
      data: {
        paymentId: result.id,
        type: result.paymentType,
        amount: result.amount,
        currency: result.currency,
        status: result.status,
        paymentMethod: result.paymentMethod,
        transactionRef: result.transactionRef,
        phoneNumber: result.phoneNumber,
        description: result.description,
        metadata: result.metadata,
        createdAt: result.createdAt,
        completedAt: result.completedAt,
        receiptNumber: result.receiptNumber,
        receiptUrl: result.receiptUrl,
      },
    };
  }

  // ============================================
  // WEBHOOK ENDPOINTS
  // ============================================

  @Post('webhooks/mpesa')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa payment callback' })
  @ApiHeader({
    name: 'X-Signature',
    description: 'HMAC signature for verification',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Callback processed',
    schema: {
      example: { ResultCode: 0, ResultDesc: 'Success' },
    },
  })
  async handleMpesaCallback(
    @Body() data: MpesaCallbackDto,
    @Headers('X-Signature') _signature: string,
  ) {
    // TODO: Verify signature
    // const isValid = this.verifyMpesaSignature(data, signature);
    // if (!isValid) {
    //     return { ResultCode: 1, ResultDesc: 'Invalid signature' };
    // }

    return this.paymentsService.handleMpesaCallback(data);
  }

  @Post('webhooks/selcom')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Selcom payment callback (legacy)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Callback processed',
    schema: { example: { status: 'OK' } },
  })
  async handleSelcomCallback(
    @Body() data: SelcomCallbackDto,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handleSelcomCallback(data, headers);
  }

  @Post('webhooks/selcom/lookup')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Selcom C2B lookup callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lookup processed',
    schema: {
      example: {
        reference: 'ref123',
        resultcode: '000',
        result: 'SUCCESS',
        message: 'Lookup successful',
      },
    },
  })
  async handleSelcomLookup(
    @Body() data: SelcomC2bCallbackDto,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handleSelcomLookup(data, headers);
  }

  @Post('webhooks/selcom/validation')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Selcom C2B validation callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation processed',
    schema: {
      example: {
        reference: 'ref123',
        resultcode: '000',
        result: 'SUCCESS',
        message: 'Validation successful',
      },
    },
  })
  async handleSelcomValidation(
    @Body() data: SelcomC2bCallbackDto,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handleSelcomValidation(data, headers);
  }

  @Post('webhooks/selcom/notification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Selcom C2B notification callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification processed',
    schema: {
      example: {
        reference: 'ref123',
        resultcode: '000',
        result: 'SUCCESS',
        message: 'Payment confirmed',
      },
    },
  })
  async handleSelcomNotification(
    // Relaxed pipe: accept Selcom's exact payload (and any extra fields) without
    // stripping/transforming, so the HMAC signature stays verifiable and an
    // undocumented extra field can't cause a 400.
    @Body(
      new ValidationPipe({
        whitelist: false,
        forbidNonWhitelisted: false,
        transform: false,
      }),
    )
    data: SelcomWebhookDto,
    @Headers() headers: Record<string, string>,
  ) {
    return this.paymentsService.handleSelcomNotification(data, headers);
  }

  @Post('webhooks/dpo')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DPO payment callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Callback processed',
  })
  async handleDPOCallback(@Body() _data: any) {
    // TODO: Implement DPO callback handling
    return { status: 'OK' };
  }

  // ============================================
  // ADMIN/DEBUG ENDPOINTS
  // ============================================

  @Get('gateway/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment gateway configuration status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gateway status retrieved',
    schema: {
      example: {
        success: true,
        data: {
          mpesa: { configured: false, mode: 'mock' },
          airtel: { configured: false, mode: 'mock' },
          tigo: { configured: false, mode: 'mock' },
          selcom: { configured: false, mode: 'mock' },
          dpo: { configured: false, mode: 'mock' },
        },
      },
    },
  })
  async getGatewayStatus() {
    return {
      success: true,
      data: this.paymentsService.getGatewayStatus(),
    };
  }
}
