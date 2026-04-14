import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../../../common/enums';

export interface PaymentRequest {
  amount: number;
  currency: string;
  phoneNumber?: string;
  email?: string;
  reference: string;
  description: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  providerRef?: string;
  paymentUrl?: string;
  checkoutRequestId?: string;
  status: 'INITIATED' | 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
  rawResponse?: any;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
  amount?: number;
  paidAt?: Date;
  message: string;
}

/**
 * Payment Gateway Service - Mock Implementation
 *
 * This service provides a unified interface for all payment providers.
 * Each provider has a mock implementation that can be replaced with actual integration.
 *
 * Supported Providers:
 * - M-Pesa Tanzania (via Vodacom)
 * - Airtel Money
 * - Tigo Pesa
 * - Selcom (Card & Mobile Money Aggregator)
 * - DPO (Bank Transfers & Cards)
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
  }

  /**
   * Initiate a payment through the specified provider
   */
  async initiatePayment(
    method: PaymentMethod,
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    this.logger.log(
      `Initiating ${method} payment for ${request.amount} ${request.currency}`,
    );

    switch (method) {
      case PaymentMethod.MPESA:
        return this.initiateMpesa(request);
      case PaymentMethod.AIRTEL_MONEY:
        return this.initiateAirtelMoney(request);
      case PaymentMethod.TIGO_PESA:
        return this.initiateTigoPesa(request);
      case PaymentMethod.SELCOM:
        return this.initiateSelcom(request);
      case PaymentMethod.DPO_BANK:
        return this.initiateDPO(request);
      default:
        throw new BadRequestException(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    method: PaymentMethod,
    transactionId: string,
  ): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking ${method} payment status for ${transactionId}`);

    // Mock implementation - always returns completed
    if (this.isDevelopment) {
      return {
        success: true,
        status: 'COMPLETED',
        transactionId,
        amount: 10000,
        paidAt: new Date(),
        message: 'Payment completed successfully',
      };
    }

    // TODO: Implement actual status check for each provider
    return {
      success: true,
      status: 'PENDING',
      transactionId,
      message: 'Payment status check not implemented',
    };
  }

  // ============================================
  // M-PESA TANZANIA
  // ============================================

  private async initiateMpesa(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      throw new BadRequestException(
        'Phone number is required for M-Pesa payment',
      );
    }

    const formattedPhone = this.formatTanzanianPhone(request.phoneNumber);

    if (this.isDevelopment) {
      return this.mockMpesaPayment(request, formattedPhone);
    }

    // TODO: Implement actual M-Pesa STK Push
    // Required env variables:
    // - MPESA_CONSUMER_KEY
    // - MPESA_CONSUMER_SECRET
    // - MPESA_SHORTCODE
    // - MPESA_PASSKEY
    // - MPESA_CALLBACK_URL
    // - MPESA_ENVIRONMENT (sandbox/production)

    return this.mockMpesaPayment(request, formattedPhone);
  }

  private async mockMpesaPayment(
    request: PaymentRequest,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK M-PESA] STK Push initiated`);
    this.logger.log(`[MOCK M-PESA] Phone: ${phoneNumber}`);
    this.logger.log(
      `[MOCK M-PESA] Amount: ${request.amount} ${request.currency}`,
    );
    this.logger.log(`[MOCK M-PESA] Reference: ${request.reference}`);
    this.logger.log(`[MOCK M-PESA] CheckoutRequestId: ${checkoutRequestId}`);

    return {
      success: true,
      transactionId: checkoutRequestId,
      checkoutRequestId,
      status: 'INITIATED',
      message: 'STK Push sent. Please check your phone and enter M-Pesa PIN.',
      rawResponse: {
        MerchantRequestID: `mock_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. Request accepted for processing',
      },
    };
  }

  // ============================================
  // AIRTEL MONEY
  // ============================================

  private async initiateAirtelMoney(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      throw new BadRequestException(
        'Phone number is required for Airtel Money payment',
      );
    }

    const formattedPhone = this.formatTanzanianPhone(request.phoneNumber);

    if (this.isDevelopment) {
      return this.mockAirtelPayment(request, formattedPhone);
    }

    // TODO: Implement actual Airtel Money API
    // Required env variables:
    // - AIRTEL_CLIENT_ID
    // - AIRTEL_CLIENT_SECRET
    // - AIRTEL_ENVIRONMENT
    // - AIRTEL_CALLBACK_URL

    return this.mockAirtelPayment(request, formattedPhone);
  }

  private async mockAirtelPayment(
    request: PaymentRequest,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const transactionId = `AIRTEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK AIRTEL] Payment initiated`);
    this.logger.log(`[MOCK AIRTEL] Phone: ${phoneNumber}`);
    this.logger.log(
      `[MOCK AIRTEL] Amount: ${request.amount} ${request.currency}`,
    );
    this.logger.log(`[MOCK AIRTEL] TransactionId: ${transactionId}`);

    return {
      success: true,
      transactionId,
      status: 'INITIATED',
      message: 'Payment request sent. Please check your phone to authorize.',
      rawResponse: { mock: true, transactionId },
    };
  }

  // ============================================
  // TIGO PESA
  // ============================================

  private async initiateTigoPesa(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      throw new BadRequestException(
        'Phone number is required for Tigo Pesa payment',
      );
    }

    const formattedPhone = this.formatTanzanianPhone(request.phoneNumber);

    if (this.isDevelopment) {
      return this.mockTigoPayment(request, formattedPhone);
    }

    // TODO: Implement actual Tigo Pesa API
    // Required env variables:
    // - TIGO_ACCOUNT_ID
    // - TIGO_PIN
    // - TIGO_CALLBACK_URL

    return this.mockTigoPayment(request, formattedPhone);
  }

  private async mockTigoPayment(
    request: PaymentRequest,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const transactionId = `TIGO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK TIGO] Payment initiated`);
    this.logger.log(`[MOCK TIGO] Phone: ${phoneNumber}`);
    this.logger.log(
      `[MOCK TIGO] Amount: ${request.amount} ${request.currency}`,
    );
    this.logger.log(`[MOCK TIGO] TransactionId: ${transactionId}`);

    return {
      success: true,
      transactionId,
      status: 'INITIATED',
      message: 'Payment request sent. Please check your phone to authorize.',
      rawResponse: { mock: true, transactionId },
    };
  }

  // ============================================
  // SELCOM (Card & Aggregator)
  // ============================================

  private async initiateSelcom(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (this.isDevelopment) {
      return this.mockSelcomPayment(request);
    }

    // TODO: Implement actual Selcom API
    // Required env variables:
    // - SELCOM_API_KEY
    // - SELCOM_API_SECRET
    // - SELCOM_VENDOR_ID
    // - SELCOM_CALLBACK_URL

    return this.mockSelcomPayment(request);
  }

  private async mockSelcomPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const orderId = `SELCOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentUrl = `https://checkout.selcom.net/mock/${orderId}`;

    this.logger.log(`[MOCK SELCOM] Checkout created`);
    this.logger.log(`[MOCK SELCOM] OrderId: ${orderId}`);
    this.logger.log(
      `[MOCK SELCOM] Amount: ${request.amount} ${request.currency}`,
    );
    this.logger.log(`[MOCK SELCOM] PaymentUrl: ${paymentUrl}`);

    return {
      success: true,
      transactionId: orderId,
      paymentUrl,
      status: 'PENDING',
      message: 'Checkout created. Redirect customer to payment URL.',
      rawResponse: { mock: true, orderId, paymentUrl },
    };
  }

  // ============================================
  // DPO (Direct Pay Online - Bank/Card)
  // ============================================

  private async initiateDPO(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.email) {
      throw new BadRequestException('Email is required for DPO payment');
    }

    if (this.isDevelopment) {
      return this.mockDPOPayment(request);
    }

    // TODO: Implement actual DPO API
    // Required env variables:
    // - DPO_COMPANY_TOKEN
    // - DPO_SERVICE_TYPE
    // - DPO_CALLBACK_URL
    // - DPO_REDIRECT_URL

    return this.mockDPOPayment(request);
  }

  private async mockDPOPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const transToken = `DPO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const paymentUrl = `https://secure.3gdirectpay.com/mock/${transToken}`;

    this.logger.log(`[MOCK DPO] Token created`);
    this.logger.log(`[MOCK DPO] TransToken: ${transToken}`);
    this.logger.log(`[MOCK DPO] Amount: ${request.amount} ${request.currency}`);
    this.logger.log(`[MOCK DPO] Email: ${request.email}`);
    this.logger.log(`[MOCK DPO] PaymentUrl: ${paymentUrl}`);

    return {
      success: true,
      transactionId: transToken,
      paymentUrl,
      status: 'PENDING',
      message: 'Payment token created. Redirect customer to payment URL.',
      rawResponse: { mock: true, transToken, paymentUrl },
    };
  }

  // ============================================
  // WEBHOOK VERIFICATION
  // ============================================

  /**
   * Verify M-Pesa callback signature
   */
  verifyMpesaCallback(_payload: any, _signature: string): boolean {
    // TODO: Implement actual signature verification
    this.logger.log(`[MOCK] Verifying M-Pesa callback signature`);
    return true;
  }

  /**
   * Verify Selcom callback
   */
  verifySelcomCallback(_payload: any, _digest: string): boolean {
    // TODO: Implement actual digest verification
    this.logger.log(`[MOCK] Verifying Selcom callback`);
    return true;
  }

  /**
   * Verify DPO callback
   */
  verifyDPOCallback(_payload: any): boolean {
    // TODO: Implement actual verification
    this.logger.log(`[MOCK] Verifying DPO callback`);
    return true;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatTanzanianPhone(phone: string): string {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Handle different formats
    if (cleaned.startsWith('+255')) {
      return cleaned;
    }
    if (cleaned.startsWith('255')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+255${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('6') || cleaned.startsWith('7')) {
      return `+255${cleaned}`;
    }

    return `+255${cleaned}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get payment provider configuration status
   */
  getProviderStatus(): Record<string, { configured: boolean; mode: string }> {
    return {
      mpesa: {
        configured: !!this.configService.get('MPESA_CONSUMER_KEY'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
      airtel: {
        configured: !!this.configService.get('AIRTEL_CLIENT_ID'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
      tigo: {
        configured: !!this.configService.get('TIGO_ACCOUNT_ID'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
      selcom: {
        configured: !!this.configService.get('SELCOM_API_KEY'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
      dpo: {
        configured: !!this.configService.get('DPO_COMPANY_TOKEN'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
    };
  }
}
