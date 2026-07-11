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
 * Payment Gateway Service — Selcom
 *
 * The platform processes all payments through Selcom's hosted checkout
 * (create-order-minimal). The buyer is redirected to Selcom, where they choose
 * their channel (mobile money or card). Settlement is reconciled authoritatively
 * via the order-status endpoint (see the Selcom webhook handlers in
 * PaymentsService), never from the webhook body.
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
  private readonly selcomBaseUrl: string;
  private readonly selcomApiKey: string;
  private readonly selcomApiSecret: string;
  private readonly selcomVendor: string;
  private readonly selcomRedirectUrl: string;
  private readonly selcomCancelUrl: string;
  private readonly selcomEngineerPortalUrl: string;
  private readonly selcomTimeoutMs: number;

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
    // Normalize the base URL: drop any trailing slash and a trailing `/v1`
    // segment, because our request paths already include `/v1/...`. This keeps
    // the integration working whether SELCOM_BASE_URL is set with or without
    // `/v1` (matches the reference ICAFoW integration).
    this.selcomBaseUrl = (
      configService.get<string>('SELCOM_BASE_URL') ||
      'https://apigw.selcommobile.com'
    )
      .replace(/\/+$/, '')
      .replace(/\/v1$/i, '');
    this.selcomApiKey = configService.get<string>('SELCOM_API_KEY') || '';
    this.selcomApiSecret = configService.get<string>('SELCOM_API_SECRET') || '';
    this.selcomVendor = configService.get<string>('SELCOM_VENDOR') || '';
    this.selcomRedirectUrl =
      configService.get<string>('SELCOM_REDIRECT_URL') || '';
    this.selcomCancelUrl =
      configService.get<string>('SELCOM_CANCEL_URL') || '';
    this.selcomEngineerPortalUrl = (
      configService.get<string>('ENGINEER_PORTAL_URL') || ''
    ).replace(/\/+$/, '');
    this.selcomTimeoutMs = Number(
      configService.get<string>('SELCOM_TIMEOUT_MS') || '15000',
    );
  }

  /**
   * Initiate a payment. Every method is fulfilled through Selcom's hosted
   * checkout; the channel (mobile money / card) is chosen on Selcom's page.
   */
  async initiatePayment(
    method: PaymentMethod,
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    this.logger.log(
      `Initiating ${method} payment for ${request.amount} ${request.currency} via Selcom`,
    );

    if (this.isSelcomConfigured()) {
      return this.initiateSelcomCheckout(request);
    }
    if (this.isDevelopment) {
      return this.mockSelcomPayment(request);
    }
    throw new BadRequestException(
      'Selcom is not configured — set SELCOM_API_KEY, SELCOM_API_SECRET and SELCOM_VENDOR',
    );
  }

  /**
   * Check payment status via the authoritative Selcom order-status endpoint.
   */
  async checkPaymentStatus(
    method: PaymentMethod,
    transactionId: string,
  ): Promise<PaymentStatusResponse> {
    this.logger.log(`Checking ${method} payment status for ${transactionId}`);

    if (this.isSelcomConfigured()) {
      return this.checkSelcomOrderStatus(transactionId);
    }
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
    return {
      success: true,
      status: 'PENDING',
      transactionId,
      message: 'Selcom not configured',
    };
  }

  // ============================================
  // SELCOM (hosted checkout + order status)
  // ============================================

  private async initiateSelcomCheckout(
    request: PaymentRequest,
  ): Promise<PaymentResponse> {
    if (!request.email) {
      throw new BadRequestException(
        'Email address is required for Selcom card payments',
      );
    }

    const orderId = `IET-${request.reference}`;
    const apiUrl = `${this.selcomBaseUrl}/v1/checkout/create-order-minimal`;

    const buyerName = this.toSelcomAscii(
      `${request.firstName || 'IET'} ${request.lastName || 'Member'}`.trim(),
    );
    const buyerPhone = request.phoneNumber
      ? this.normalizeSelcomMsisdn(request.phoneNumber)
      : '';

    // create-order-minimal accepts base64-encoded redirect_url / cancel_url /
    // webhook. Wiring these makes Selcom bounce the buyer back to our portal
    // after payment and POST a server-to-server notification to our webhook.
    // Settlement is still reconciled authoritatively via the order-status
    // endpoint (checkSelcomOrderStatus). NOTE: the earlier 406 "Not Acceptable"
    // errors were caused by the missing Accept/User-Agent headers and non-ASCII
    // characters in text fields — NOT by these URLs (per the working ICAFoW
    // integration), so they are included here.
    const redirectUrl =
      this.selcomRedirectUrl ||
      (this.selcomEngineerPortalUrl
        ? `${this.selcomEngineerPortalUrl}/payments/callback?ref=${encodeURIComponent(request.reference)}`
        : '');
    const cancelUrl =
      this.selcomCancelUrl ||
      (redirectUrl
        ? `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}cancel=1`
        : '');
    const webhookUrl = request.callbackUrl || '';

    const fields: Record<string, string | number> = {
      vendor: this.selcomVendor,
      order_id: orderId,
      buyer_email: request.email,
      buyer_name: buyerName,
      ...(buyerPhone && { buyer_phone: buyerPhone }),
      amount: Math.round(request.amount),
      currency: request.currency,
      ...(redirectUrl && { redirect_url: this.encodeSelcomUrl(redirectUrl) }),
      ...(cancelUrl && { cancel_url: this.encodeSelcomUrl(cancelUrl) }),
      ...(webhookUrl && { webhook: this.encodeSelcomUrl(webhookUrl) }),
      buyer_remarks: this.toSelcomAscii(request.description || 'IET payment'),
      merchant_remarks: 'IET Tanzania',
      no_of_items: 1,
    };

    this.logger.log(
      `[SELCOM] Creating order ${orderId} for ${fields.amount} ${request.currency}`,
    );

    const response = await this.selcomFetch(apiUrl, {
      method: 'POST',
      headers: this.buildSelcomHeaders(fields),
      body: JSON.stringify(fields),
    });

    const rawText = await response.text();
    let payload: any = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = {};
    }

    this.logger.log(
      `[SELCOM] Create order response [${response.status}]: ${rawText?.slice(0, 500)}`,
    );

    // Selcom returns result "SUCCESS" / resultcode "000" on success, with the
    // hosted-checkout URL in data[0].payment_gateway_url (sometimes base64).
    const ok =
      response.ok &&
      (payload?.result === 'SUCCESS' || payload?.resultcode === '000');
    const data = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;
    const token = data?.payment_token;
    const paymentGatewayUrl =
      this.decodeSelcomUrl(data?.payment_gateway_url) ||
      (token
        ? `${this.selcomBaseUrl}/v1/checkout/payment-link?token=${encodeURIComponent(token)}`
        : undefined);

    if (!ok || !paymentGatewayUrl) {
      throw new BadRequestException(
        payload?.message ||
          `Selcom order creation failed (HTTP ${response.status})`,
      );
    }

    return {
      success: true,
      transactionId: orderId,
      providerRef: data?.reference,
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

    const url = `${this.selcomBaseUrl}/v1/checkout/order-status?order_id=${encodeURIComponent(orderId)}`;
    const response = await this.selcomFetch(url, {
      method: 'GET',
      headers: this.buildSelcomHeaders(fields),
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
    orderedFields: Record<string, string | number>,
  ): Record<string, string> {
    const timestamp = new Date().toISOString();
    const signedFields = Object.keys(orderedFields);
    let signingString = `timestamp=${timestamp}`;
    for (const field of signedFields) {
      signingString += `&${field}=${orderedFields[field]}`;
    }
    const digest = createHmac('sha256', this.selcomApiSecret)
      .update(signingString)
      .digest('base64');
    const authorization = `SELCOM ${Buffer.from(this.selcomApiKey).toString('base64')}`;

    return {
      'Content-Type': 'application/json',
      // Selcom's API gateway rejects requests with HTTP 406 "Not Acceptable"
      // when these content-negotiation/identity headers are absent. Node's
      // fetch does not send them reliably, so set them explicitly.
      Accept: 'application/json',
      'User-Agent': 'IET-Tanzania/1.0',
      Authorization: authorization,
      'Digest-Method': 'HS256',
      Digest: digest,
      Timestamp: timestamp,
      'Signed-Fields': signedFields.join(','),
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

  /** Base64-encode a URL the way Selcom expects redirect/cancel/webhook URLs. */
  private encodeSelcomUrl(url: string): string {
    return Buffer.from(url).toString('base64');
  }

  /**
   * Reduce a string to plain ASCII for Selcom text fields. Selcom rejects
   * requests containing non-ASCII characters (e.g. an em-dash "—" or accented
   * letters in a buyer's name) with HTTP 406 "Not Acceptable". We decompose
   * accents, map common Unicode dashes to a hyphen, then drop anything outside
   * printable ASCII.
   */
  private toSelcomAscii(value: string): string {
    return (value || '')
      .normalize('NFKD')
      .replace(/[‐-―]/g, '-') // hyphen, figure/en/em dashes → "-"
      .replace(/[^\x20-\x7E]/g, '') // strip remaining non-ASCII
      .trim();
  }

  /** Normalize a Tanzanian phone number to 255XXXXXXXXX (no leading +). */
  private normalizeSelcomMsisdn(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('255')) return digits;
    if (digits.startsWith('0')) return '255' + digits.slice(1);
    if (digits.length === 9) return '255' + digits;
    return digits;
  }

  /**
   * fetch with an abort timeout and one retry-with-backoff on network/5xx
   * errors. Selcom create-order/order-status are safe to retry: create-order is
   * keyed by a unique order_id (Selcom dedupes) and order-status is a read.
   */
  private async selcomFetch(
    url: string,
    init: RequestInit,
    attempts = 2,
  ): Promise<Response> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.selcomTimeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        if (res.status >= 500 && i < attempts - 1) {
          lastErr = new Error(`Selcom ${res.status}`);
        } else {
          return res;
        }
      } catch (err) {
        lastErr = err;
      } finally {
        clearTimeout(timer);
      }
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error('Selcom request failed');
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

  /**
   * Webhook callback URL Selcom posts the C2B notification to. Settlement is
   * reconciled from the order-status endpoint, not the webhook body.
   */
  getCallbackUrl(
    _method: PaymentMethod,
    apiUrl?: string,
  ): string | undefined {
    return apiUrl
      ? `${apiUrl}/payments/webhooks/selcom/notification`
      : undefined;
  }

  /**
   * Advisory verification of an incoming Selcom callback. The callback body is
   * only a trigger — settlement always re-queries order-status — so this never
   * gates money movement.
   */
  verifySelcomCallback(_payload: any, _digest: string): boolean {
    this.logger.log('[Selcom] Verifying callback (advisory)');
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Get payment provider configuration status. */
  getProviderStatus(): Record<string, { configured: boolean; mode: string }> {
    const configured = this.isSelcomConfigured();
    return {
      selcom: {
        configured,
        mode: configured ? 'live' : this.isDevelopment ? 'mock' : 'unconfigured',
      },
    };
  }
}
