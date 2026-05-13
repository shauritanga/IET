import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../../../common/enums';
import { createHmac } from 'crypto';

export interface PaymentRequest {
  amount: number;
  currency: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
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
  private readonly completedStatuses = new Set([
    'SUCCESS',
    'SUCCESSFUL',
    'SUCCEEDED',
    'COMPLETED',
    'COMPLETE',
    'SETTLED',
    'PAID',
    'APPROVED',
  ]);
  private readonly isDevelopment: boolean;
  private readonly clickPesaBaseUrl: string;
  private readonly clickPesaClientId: string;
  private readonly clickPesaApiKey: string;
  private readonly clickPesaChecksumKey: string;
  private readonly clickPesaUseChecksum: boolean;
  private clickPesaToken: string | null = null;
  private clickPesaTokenExpiresAt = 0;
  private readonly selcomBaseUrl: string;
  private readonly selcomApiKey: string;
  private readonly selcomApiSecret: string;
  private readonly selcomVendor: string;
  private readonly selcomRedirectUrl: string;
  private readonly selcomCancelUrl: string;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    this.clickPesaBaseUrl = configService.get<string>('CLICKPESA_BASE_URL')!;
    this.clickPesaClientId = configService.get<string>('CLICKPESA_CLIENT_ID')!;
    this.clickPesaApiKey = configService.get<string>('CLICKPESA_API_KEY')!;
    this.clickPesaChecksumKey =
      configService.get<string>('CLICKPESA_CHECKSUM_KEY') || '';
    this.clickPesaUseChecksum = !!configService.get<boolean>(
      'CLICKPESA_USE_CHECKSUM',
    );
    this.selcomBaseUrl = configService.get<string>('SELCOM_BASE_URL')!;
    this.selcomApiKey = configService.get<string>('SELCOM_API_KEY') || '';
    this.selcomApiSecret = configService.get<string>('SELCOM_API_SECRET') || '';
    this.selcomVendor = configService.get<string>('SELCOM_VENDOR') || '';
    this.selcomRedirectUrl =
      configService.get<string>('SELCOM_REDIRECT_URL') || '';
    this.selcomCancelUrl =
      configService.get<string>('SELCOM_CANCEL_URL') || '';
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
      case PaymentMethod.AIRTEL_MONEY:
        return this.initiateAirtelMoney(request);
      case PaymentMethod.TIGO_PESA:
        return this.initiateTigoPesa(request);
      case PaymentMethod.HALOPESA:
        return this.initiateHaloPesa(request);
      case PaymentMethod.MPESA:
        return this.initiateMpesa(request);
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

    if (method === PaymentMethod.SELCOM && this.isSelcomConfigured()) {
      return this.checkSelcomOrderStatus(transactionId);
    }

    if (this.usesClickPesa(method)) {
      return this.checkClickPesaPaymentStatus(transactionId);
    }

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

    if (this.isClickPesaConfigured()) {
      return this.initiateClickPesaMobilePayment('MPESA', request, formattedPhone);
    }

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

    if (this.isClickPesaConfigured()) {
      return this.initiateClickPesaMobilePayment(
        'AIRTEL_MONEY',
        request,
        formattedPhone,
      );
    }

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

    if (this.isClickPesaConfigured()) {
      return this.initiateClickPesaMobilePayment(
        'TIGO_PESA',
        request,
        formattedPhone,
      );
    }

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

  private async initiateHaloPesa(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.phoneNumber) {
      throw new BadRequestException(
        'Phone number is required for HaloPesa payment',
      );
    }

    const formattedPhone = this.formatTanzanianPhone(request.phoneNumber);

    if (this.isClickPesaConfigured()) {
      return this.initiateClickPesaMobilePayment(
        'HALOPESA',
        request,
        formattedPhone,
      );
    }

    if (this.isDevelopment) {
      return this.mockHaloPesaPayment(request, formattedPhone);
    }

    return this.mockHaloPesaPayment(request, formattedPhone);
  }

  private async mockHaloPesaPayment(
    request: PaymentRequest,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    await this.delay(200);

    const transactionId = `HALOPESA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`[MOCK HALOPESA] Payment initiated`);
    this.logger.log(`[MOCK HALOPESA] Phone: ${phoneNumber}`);
    this.logger.log(
      `[MOCK HALOPESA] Amount: ${request.amount} ${request.currency}`,
    );
    this.logger.log(`[MOCK HALOPESA] TransactionId: ${transactionId}`);

    return {
      success: true,
      transactionId,
      status: 'INITIATED',
      message: 'Payment request sent. Please check your phone to authorize.',
      rawResponse: { mock: true, transactionId },
    };
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
  // SELCOM (Checkout API + C2B Collection)
  // ============================================

  private async initiateSelcom(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (this.isSelcomConfigured()) {
      return this.initiateSelcomCheckout(request);
    }

    if (this.usesClickPesa(PaymentMethod.SELCOM)) {
      return this.initiateClickPesaCardPayment(request);
    }

    if (this.isDevelopment) {
      return this.mockSelcomPayment(request);
    }

    return this.mockSelcomPayment(request);
  }

  private async initiateSelcomCheckout(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.email) {
      throw new BadRequestException(
        'Email address is required for Selcom card payments',
      );
    }

    const orderId = `IET-${request.reference}`;
    const apiUrl = `${this.selcomBaseUrl}/checkout/create-order`;

    const firstName = request.firstName || 'IET';
    const lastName = request.lastName || 'Member';
    const buyerName = `${firstName} ${lastName}`.trim();
    const buyerPhone = request.phoneNumber
      ? this.formatTanzanianPhone(request.phoneNumber).replace(/^\+/, '')
      : '';

    const fields: Record<string, string> = {
      vendor: this.selcomVendor,
      order_id: orderId,
      buyer_email: request.email || '',
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      amount: String(request.amount),
      currency: request.currency,
      payment_methods: 'ALL',
      redirect_url: Buffer.from(this.selcomRedirectUrl || '').toString('base64'),
      cancel_url: Buffer.from(this.selcomCancelUrl || '').toString('base64'),
      webhook: Buffer.from(request.callbackUrl || '').toString('base64'),
      'billing.firstname': firstName,
      'billing.lastname': lastName,
      'billing.address_1': 'N/A',
      'billing.city': 'Dar es Salaam',
      'billing.state_or_region': 'Dar es Salaam',
      'billing.postcode_or_pobox': '00000',
      'billing.country': 'TZ',
      'billing.phone': buyerPhone || '',
      no_of_items: '1',
    };

    const headers = this.buildSelcomHeaders(fields);

    this.logger.log(
      `[SELCOM] Creating order ${orderId} for ${request.amount} ${request.currency}`,
    );

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(fields),
    });

    const payload = await response.json().catch(() => ({}));

    this.logger.log(
      `[SELCOM] Create order response [${response.status}]: ${JSON.stringify(payload)}`,
    );

    if (!response.ok || payload?.resultcode !== '000') {
      throw new BadRequestException(
        payload?.message ||
          `Selcom order creation failed (HTTP ${response.status})`,
      );
    }

    const paymentGatewayUrl = this.decodeSelcomUrl(
      payload?.data?.[0]?.payment_gateway_url,
    );

    if (!paymentGatewayUrl) {
      throw new BadRequestException(
        'Selcom order creation did not return a checkout URL',
      );
    }

    return {
      success: true,
      transactionId: orderId,
      paymentUrl: paymentGatewayUrl,
      status: 'PENDING',
      message:
        payload?.message ||
        'Checkout created. Redirect customer to the payment page.',
      rawResponse: payload,
    };
  }

  async checkSelcomOrderStatus(orderId: string): Promise<PaymentStatusResponse> {
    const fields: Record<string, string> = { order_id: orderId };
    const headers = this.buildSelcomHeaders(fields);

    const url = `${this.selcomBaseUrl}/checkout/order-status?order_id=${encodeURIComponent(orderId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...headers, Accept: 'application/json' },
    });

    const payload = await response.json().catch(() => ({}));

    this.logger.log(
      `[SELCOM] Order status for ${orderId} [${response.status}]: ${JSON.stringify(payload)}`,
    );

    if (!response.ok) {
      return {
        success: false,
        status: 'PENDING',
        transactionId: orderId,
        message: payload?.message || 'Unable to verify Selcom order status',
      };
    }

    const resultcode = payload?.resultcode || payload?.data?.[0]?.resultcode;
    const rawStatus = String(
      payload?.data?.[0]?.payment_status || payload?.result || '',
    ).toUpperCase();

    const status =
      resultcode === '000' && this.completedStatuses.has(rawStatus)
        ? 'COMPLETED'
        : rawStatus === 'CANCELLED'
          ? 'CANCELLED'
          : rawStatus === 'FAILED'
            ? 'FAILED'
            : 'PENDING';

    return {
      success: true,
      status,
      transactionId: payload?.data?.[0]?.transid || orderId,
      amount: payload?.data?.[0]?.amount,
      message: payload?.message || `Selcom status: ${rawStatus || 'PENDING'}`,
    };
  }

  private buildSelcomHeaders(
    orderedFields: Record<string, string>,
  ): Record<string, string> {
    const timestamp = new Date().toISOString();
    const signedFields = Object.keys(orderedFields).join(',');
    const fieldPairs = Object.entries(orderedFields)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const signingString = `timestamp=${timestamp}&${fieldPairs}`;
    const digest = createHmac('sha256', this.selcomApiSecret)
      .update(signingString)
      .digest('base64');
    const authorization = `SELCOM ${Buffer.from(this.selcomApiKey).toString('base64')}`;

    return {
      Authorization: authorization,
      'Digest-Method': 'HS256',
      Digest: digest,
      Timestamp: timestamp,
      'Signed-Fields': signedFields,
    };
  }

  private decodeSelcomUrl(value?: string): string | undefined {
    if (!value) {
      return undefined;
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    try {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      return /^https?:\/\//i.test(decoded) ? decoded : value;
    } catch {
      return value;
    }
  }

  private isSelcomConfigured(): boolean {
    return Boolean(
      this.selcomApiKey && this.selcomApiSecret && this.selcomVendor,
    );
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

  usesClickPesa(method: PaymentMethod): boolean {
    if (method === PaymentMethod.SELCOM && this.isSelcomConfigured()) {
      return false;
    }
    return (
      this.isClickPesaConfigured() &&
      [
        PaymentMethod.AIRTEL_MONEY,
        PaymentMethod.TIGO_PESA,
        PaymentMethod.HALOPESA,
        PaymentMethod.MPESA,
        PaymentMethod.SELCOM,
      ].includes(method)
    );
  }

  getCallbackUrl(method: PaymentMethod, apiUrl?: string): string | undefined {
    if (method === PaymentMethod.SELCOM && this.isSelcomConfigured()) {
      return apiUrl
        ? `${apiUrl}/payments/webhooks/selcom/notification`
        : undefined;
    }

    if (this.usesClickPesa(method)) {
      return (
        this.configService.get<string>('CLICKPESA_CALLBACK_URL') ||
        (apiUrl ? `${apiUrl}/payments/webhooks/clickpesa` : undefined)
      );
    }

    return apiUrl
      ? `${apiUrl}/payments/webhooks/${method.toLowerCase()}`
      : undefined;
  }

  private isClickPesaConfigured(): boolean {
    return Boolean(this.clickPesaClientId && this.clickPesaApiKey);
  }

  private async getClickPesaToken(): Promise<string> {
    if (this.clickPesaToken && Date.now() < this.clickPesaTokenExpiresAt) {
      return this.clickPesaToken;
    }

    const response = await fetch(`${this.clickPesaBaseUrl}/generate-token`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'client-id': this.clickPesaClientId,
        'api-key': this.clickPesaApiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BadRequestException(
        `ClickPesa authentication failed: ${body || response.statusText}`,
      );
    }

    const payload = (await response.json()) as
      | { token?: string; access_token?: string; expires_in?: number }
      | undefined;

    const rawToken = payload?.token || payload?.access_token;
    const token = rawToken?.replace(/^Bearer\s+/i, '');
    if (!token) {
      throw new BadRequestException('ClickPesa authentication returned no token');
    }

    const expiresInMs = Math.max(((payload?.expires_in || 3600) - 60) * 1000, 60000);
    this.clickPesaToken = token;
    this.clickPesaTokenExpiresAt = Date.now() + expiresInMs;
    return token;
  }

  private async initiateClickPesaMobilePayment(
    channel: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'HALOPESA',
    request: PaymentRequest,
    phoneNumber: string,
  ): Promise<PaymentResponse> {
    const token = await this.getClickPesaToken();
    const normalizedPhoneNumber = phoneNumber.replace(/^\+/, '');
    const requestedChannel = this.mapChannelToClickPesaMethodName(channel);

    const previewBodyBase = {
      amount: String(request.amount),
      currency: request.currency,
      orderReference: request.reference,
      phoneNumber: normalizedPhoneNumber,
      fetchSenderDetails: false,
    };
    const checksum = this.clickPesaUseChecksum
      ? this.buildClickPesaChecksum(previewBodyBase)
      : undefined;
    const previewBody = {
      ...previewBodyBase,
      ...(checksum ? { checksum } : {}),
    };

    this.logger.log(
      `ClickPesa preview checksum payload (${request.reference}): ${this.describeClickPesaChecksumPayload(
        previewBodyBase,
      )}`,
    );
    this.logger.log(
      `ClickPesa preview request body (${request.reference}): ${JSON.stringify(
        previewBody,
      )}`,
    );

    let previewPayload: any = null;

    try {
      const previewResponse = await fetch(
        `${this.clickPesaBaseUrl}/payments/preview-ussd-push-request`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(previewBody),
        },
      );

      previewPayload = await previewResponse.json().catch(() => ({}));

      this.logger.log(
        `ClickPesa preview response for ${requestedChannel} (${request.reference}) [${previewResponse.status} ${previewResponse.statusText}]: ${JSON.stringify(
          previewPayload,
        )}`,
      );

      if (previewResponse.ok) {
        const activeMethods: string[] = Array.isArray(previewPayload?.activeMethods)
          ? previewPayload.activeMethods
              .map((method: any) => String(method?.name || '').toUpperCase())
              .filter(Boolean)
          : [];

        if (
          activeMethods.length > 0 &&
          !activeMethods.includes(requestedChannel)
        ) {
          throw new BadRequestException(
            `Selected payment method is not available for this number. Available methods: ${activeMethods.join(', ')}`,
          );
        }
      } else {
        this.logger.warn(
          `ClickPesa preview failed for ${requestedChannel}: ${
            previewPayload?.message || previewResponse.statusText
          }. Continuing with payment initiation.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.warn(
        `ClickPesa preview request errored for ${requestedChannel}: ${
          error instanceof Error ? error.message : String(error)
        }. Continuing with payment initiation.`,
      );
    }

    const bodyBase = {
      amount: String(request.amount),
      currency: request.currency,
      phoneNumber: normalizedPhoneNumber,
      orderReference: request.reference,
    };
    const initiateChecksum = this.clickPesaUseChecksum
      ? this.buildClickPesaChecksum(bodyBase)
      : undefined;
    const body = {
      ...bodyBase,
      ...(initiateChecksum ? { checksum: initiateChecksum } : {}),
    };

    this.logger.log(
      `ClickPesa initiate checksum payload (${request.reference}): ${this.describeClickPesaChecksumPayload(
        bodyBase,
      )}`,
    );
    this.logger.log(
      `ClickPesa initiate request body (${request.reference}): ${JSON.stringify(
        body,
      )}`,
    );

    const response = await fetch(
      `${this.clickPesaBaseUrl}/payments/initiate-ussd-push-request`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    const payload = await response.json().catch(() => ({}));

    this.logger.log(
      `ClickPesa initiate response for ${requestedChannel} (${request.reference}) [${response.status} ${response.statusText}]: ${JSON.stringify(
        payload,
      )}`,
    );

    if (!response.ok) {
      const providerMessage =
        payload?.message ||
        payload?.error ||
        payload?.errors?.[0]?.message ||
        payload?.details ||
        previewPayload?.message;

      throw new BadRequestException(
        providerMessage
          ? `ClickPesa mobile payment initiation failed for ${requestedChannel}: ${providerMessage}`
          : `ClickPesa mobile payment initiation failed for ${requestedChannel} (HTTP ${response.status} ${response.statusText})`,
      );
    }

    return {
      success: true,
      transactionId:
        payload?.transactionReference ||
        payload?.paymentReference ||
        payload?.requestId ||
        request.reference,
      providerRef:
        payload?.providerReference || payload?.orderReference || request.reference,
      checkoutRequestId: payload?.requestId,
      status: 'PENDING',
      message:
        payload?.message ||
        'Payment request sent. Please confirm the transaction on your phone.',
      rawResponse: {
        preview: previewPayload,
        initiate: payload,
      },
    };
  }

  private mapChannelToClickPesaMethodName(
    channel: 'MPESA' | 'AIRTEL_MONEY' | 'TIGO_PESA' | 'HALOPESA',
  ): string {
    switch (channel) {
      case 'AIRTEL_MONEY':
        return 'AIRTEL-MONEY';
      case 'TIGO_PESA':
        return 'TIGO-PESA';
      case 'HALOPESA':
        return 'HALOPESA';
      case 'MPESA':
        return 'M-PESA';
      default:
        return channel;
    }
  }

  private async initiateClickPesaCardPayment(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    const token = await this.getClickPesaToken();
    const bodyBase = {
      amount: request.amount,
      currency: request.currency,
      orderReference: request.reference,
      description: request.description,
      customerEmail: request.email,
      callbackUrl: request.callbackUrl,
    };
    const checksum = this.clickPesaUseChecksum
      ? this.buildClickPesaChecksum(bodyBase)
      : undefined;
    const body = {
      ...bodyBase,
      ...(checksum ? { checksum } : {}),
    };

    const response = await fetch(
      `${this.clickPesaBaseUrl}/payments/initiate-card-payment`,
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      },
    );

    const payload = await response.json().catch(() => ({}));

    this.logger.log(
      `ClickPesa card initiate response (${request.reference}) [${response.status} ${response.statusText}]: ${JSON.stringify(
        payload,
      )}`,
    );

    if (!response.ok) {
      const providerMessage =
        payload?.message ||
        payload?.error ||
        payload?.errors?.[0]?.message ||
        payload?.details;

      throw new BadRequestException(
        providerMessage
          ? `ClickPesa card payment initiation failed: ${providerMessage}`
          : `ClickPesa card payment initiation failed (HTTP ${response.status} ${response.statusText})`,
      );
    }

    return {
      success: true,
      transactionId:
        payload?.transactionReference ||
        payload?.paymentReference ||
        request.reference,
      paymentUrl:
        payload?.checkoutUrl || payload?.paymentUrl || payload?.redirectUrl,
      status: 'PENDING',
      message:
        payload?.message ||
        'Checkout created. Redirect customer to the payment page.',
      rawResponse: payload,
    };
  }

  private async checkClickPesaPaymentStatus(
    orderReference: string,
  ): Promise<PaymentStatusResponse> {
    const token = await this.getClickPesaToken();
    const response = await fetch(
      `${this.clickPesaBaseUrl}/payments/${orderReference}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const payload = await response.json().catch(() => ({}));

    this.logger.log(
      `ClickPesa status response (${orderReference}) [${response.status} ${response.statusText}]: ${JSON.stringify(
        payload,
      )}`,
    );

    if (!response.ok) {
      return {
        success: false,
        status: 'PENDING',
        transactionId: orderReference,
        message: payload?.message || 'Unable to verify ClickPesa payment status',
      };
    }

    const paymentRecord = Array.isArray(payload) ? payload[0] : payload;
    const rawStatus = String(
      paymentRecord?.status ||
        paymentRecord?.paymentStatus ||
        paymentRecord?.transactionStatus ||
        '',
    ).toUpperCase();

    const status = this.completedStatuses.has(rawStatus)
      ? 'COMPLETED'
      : rawStatus === 'FAILED'
        ? 'FAILED'
        : rawStatus === 'CANCELLED'
          ? 'CANCELLED'
          : 'PENDING';

    return {
      success: true,
      status,
      transactionId:
        paymentRecord?.transactionReference ||
        paymentRecord?.paymentReference ||
        orderReference,
      amount: paymentRecord?.amount || paymentRecord?.collectedAmount,
      paidAt: paymentRecord?.paidAt
        ? new Date(paymentRecord.paidAt)
        : paymentRecord?.updatedAt
          ? new Date(paymentRecord.updatedAt)
          : undefined,
      message:
        paymentRecord?.message || `ClickPesa status: ${rawStatus || 'PENDING'}`,
    };
  }

  private buildClickPesaChecksum(payload: Record<string, any>): string | undefined {
    const secret = this.clickPesaChecksumKey || this.clickPesaApiKey;
    if (!secret) {
      return undefined;
    }

    const canonicalize = (value: any): any => {
      if (value === null || typeof value !== 'object') {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map(canonicalize);
      }

      return Object.keys(value)
        .sort()
        .reduce(
          (acc, key) => {
            if (key === 'checksum' || key === 'checksumMethod') {
              return acc;
            }

            acc[key] = canonicalize(value[key]);
            return acc;
          },
          {} as Record<string, any>,
        );
    };

    const payloadString = JSON.stringify(canonicalize(payload));
    return createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  private describeClickPesaChecksumPayload(payload: Record<string, any>): string {
    const canonicalize = (value: any): any => {
      if (value === null || typeof value !== 'object') {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map(canonicalize);
      }

      return Object.keys(value)
        .sort()
        .reduce(
          (acc, key) => {
            if (key === 'checksum' || key === 'checksumMethod') {
              return acc;
            }

            acc[key] = canonicalize(value[key]);
            return acc;
          },
          {} as Record<string, any>,
        );
    };

    return JSON.stringify(canonicalize(payload));
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
    const clickPesaConfigured = this.isClickPesaConfigured();
    const clickPesaMode = clickPesaConfigured ? 'clickpesa' : this.isDevelopment ? 'mock' : 'live';

    return {
      mpesa: {
        configured:
          clickPesaConfigured || !!this.configService.get('MPESA_CONSUMER_KEY'),
        mode: clickPesaMode,
      },
      airtel: {
        configured:
          clickPesaConfigured || !!this.configService.get('AIRTEL_CLIENT_ID'),
        mode: clickPesaMode,
      },
      tigo: {
        configured:
          clickPesaConfigured || !!this.configService.get('TIGO_ACCOUNT_ID'),
        mode: clickPesaMode,
      },
      halopesa: {
        configured: clickPesaConfigured,
        mode: clickPesaMode,
      },
      selcom: {
        configured: this.isSelcomConfigured(),
        mode: this.isSelcomConfigured()
          ? 'live'
          : clickPesaConfigured
            ? 'clickpesa'
            : this.isDevelopment
              ? 'mock'
              : 'live',
      },
      dpo: {
        configured: !!this.configService.get('DPO_COMPANY_TOKEN'),
        mode: this.isDevelopment ? 'mock' : 'live',
      },
    };
  }
}
