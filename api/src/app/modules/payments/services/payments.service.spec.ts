import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  ApplicationStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  RegistrationCategory,
  RegistrationStep,
} from '../../../common/enums';

describe('PaymentsService application payments', () => {
  const userId = '9d3f401c-ae20-4d62-82bb-df3b5c1705c2';
  const applicationId = '37384d69-7faf-48c8-9b9e-17b68f5c78f9';

  const requiredSteps = [
    RegistrationStep.PERSONAL_DETAILS,
    RegistrationStep.REGISTRATION_DETAILS,
    RegistrationStep.EDUCATION_EXPERIENCE,
    RegistrationStep.REFERENCES,
  ];

  function createService(registrationOverrides: Record<string, any> = {}) {
    const registration = {
      id: applicationId,
      userId,
      status: ApplicationStatus.DRAFT,
      completedSteps: [...requiredSteps],
      paymentCompleted: false,
      paymentId: null,
      currentStep: RegistrationStep.REFERENCES,
      ...registrationOverrides,
    };

    const paymentRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(async (payment) => {
        payment.id = payment.id ?? '550e8400-e29b-41d4-a716-446655440000';
        return payment;
      }),
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ maxNum: 0 }),
      })),
    };

    const userRepository = {
      findOneBy: jest.fn().mockResolvedValue({
        id: userId,
        email: 'member@iet.or.tz',
        firstName: 'Test',
        lastName: 'Member',
        phoneNumber: '255712000000',
      }),
    };

    const registrationRepository = {
      findOne: jest.fn(async ({ where }) => {
        if (
          where.id === applicationId &&
          (!where.userId || where.userId === userId)
        ) {
          return registration;
        }
        return null;
      }),
      save: jest.fn(async (entity) => entity),
    };

    // The platform routes every payment through Selcom hosted checkout.
    const paymentGateway = {
      initiatePayment: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'IET-550e8400-e29b-41d4-a716-446655440000',
        paymentUrl: 'https://apigw.selcommobile.com/checkout/abc123',
        status: 'PENDING',
        message: 'Checkout created. Redirect customer to the payment page.',
      }),
      checkPaymentStatus: jest.fn(),
      getCallbackUrl: jest
        .fn()
        .mockReturnValue(
          'https://api.iet.or.tz/api/v1/payments/webhooks/selcom/notification',
        ),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      userRepository as any,
      registrationRepository as any,
      {} as any, // eventRegistrationRepository
      {} as any, // guestRegistrationRepository
      {
        get: jest.fn((key: string) => {
          if (key === 'APPLICATION_FEE_GRADUATE') return 5000;
          if (key === 'APPLICATION_FEE_STANDARD') return 10000;
          return undefined;
        }),
      } as any, // configService
      paymentGateway as any,
      {} as any, // smsService
      {} as any, // emailService
    );

    return {
      service,
      registration,
      paymentRepository,
      userRepository,
      registrationRepository,
      paymentGateway,
    };
  }

  it('creates a Selcom checkout session for a fresh application payment', async () => {
    const { service, paymentGateway } = createService();

    const result = await service.initiateApplicationPayment(
      userId,
      applicationId,
      {
        applicationType: RegistrationCategory.STANDARD,
        paymentMethod: PaymentMethod.SELCOM,
        phoneNumber: '255712000000',
      },
    );

    expect(paymentGateway.initiatePayment).toHaveBeenCalledTimes(1);
    expect(paymentGateway.initiatePayment).toHaveBeenCalledWith(
      PaymentMethod.SELCOM,
      expect.objectContaining({ amount: 10000, currency: 'TZS' }),
    );
    expect(result.paymentCompleted).toBe(false);
    expect(result.paymentStatus).toBe(PaymentStatus.PROCESSING);
    expect(result.paymentMethod).toBe(PaymentMethod.SELCOM);
    expect(result.paymentUrl).toBe(
      'https://apigw.selcommobile.com/checkout/abc123',
    );
  });

  it('resumes an existing in-progress Selcom session without calling the gateway', async () => {
    const existingPayment = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId,
      paymentType: PaymentType.APPLICATION_FEE,
      amount: 5000,
      currency: 'TZS',
      status: PaymentStatus.PROCESSING,
      paymentMethod: PaymentMethod.SELCOM,
      referenceId: applicationId,
      referenceType: 'registration',
      paymentUrl: 'https://apigw.selcommobile.com/checkout/existing',
      mobileMoneyRef: 'IET-550e8400-e29b-41d4-a716-446655440001',
      metadata: {
        applicationId,
        applicationType: RegistrationCategory.GRADUATE,
      },
    };
    const { service, paymentRepository, paymentGateway } = createService();
    paymentRepository.findOne.mockResolvedValueOnce(existingPayment);

    const result = await service.initiateApplicationPayment(
      userId,
      applicationId,
      {
        applicationType: RegistrationCategory.GRADUATE,
        paymentMethod: PaymentMethod.SELCOM,
        phoneNumber: '255712000000',
      },
    );

    expect(paymentGateway.initiatePayment).not.toHaveBeenCalled();
    expect(result.paymentId).toBe(existingPayment.id);
    expect(result.paymentStatus).toBe(PaymentStatus.PROCESSING);
    expect(result.paymentUrl).toBe(existingPayment.paymentUrl);
    expect(result.message).toBe('Existing payment session resumed');
  });

  it('keeps prior step validation before creating a payment', async () => {
    const { service, paymentRepository, paymentGateway } = createService({
      completedSteps: [RegistrationStep.PERSONAL_DETAILS],
    });

    await expect(
      service.initiateApplicationPayment(userId, applicationId, {
        applicationType: RegistrationCategory.STANDARD,
        paymentMethod: PaymentMethod.SELCOM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(paymentRepository.save).not.toHaveBeenCalled();
    expect(paymentGateway.initiatePayment).not.toHaveBeenCalled();
  });
});
