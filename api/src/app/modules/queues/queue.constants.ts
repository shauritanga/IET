export const EMAIL_QUEUE = 'email';
export const SMS_QUEUE = 'sms';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: {
    age: 60 * 60 * 24, // 24h
    count: 1000,
  },
  removeOnFail: {
    age: 60 * 60 * 24 * 7, // 7d
  },
};

/** Higher priority / faster retries for time-sensitive OTPs */
export const OTP_JOB_OPTIONS = {
  ...DEFAULT_JOB_OPTIONS,
  attempts: 3,
  priority: 1,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
};

export type EmailJobName =
  | 'send'
  | 'portal-welcome'
  | 'verification'
  | 'login-otp'
  | 'welcome'
  | 'password-reset'
  | 'payment-receipt'
  | 'application-status'
  | 'application-submitted'
  | 'expiry-reminder'
  | 'membership-fee-reminder'
  | 'event-registration';

export type SmsJobName =
  | 'send'
  | 'login-otp'
  | 'verification'
  | 'payment-confirmation'
  | 'application-status'
  | 'expiry-reminder'
  | 'membership-fee-reminder'
  | 'event-reminder';
