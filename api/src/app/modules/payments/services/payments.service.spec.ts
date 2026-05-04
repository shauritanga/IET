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

    const registrationRepository = {
      findOne: jest.fn(async ({ where }) => {
        if (where.id === applicationId && (!where.userId || where.userId === userId)) {
          return registration;
        }
        return null;
      }),
      save: jest.fn(async (entity) => entity),
    };

    const paymentGateway = {
      initiatePayment: jest.fn(),
      checkPaymentStatus: jest.fn(),
      usesClickPesa: jest.fn(),
      getCallbackUrl: jest.fn(),
    };

    const service = new PaymentsService(
      paymentRepository as any,
      {} as any,
      registrationRepository as any,
      {
        get: jest.fn((key: string) => {
          if (key === 'APPLICATION_FEE_GRADUATE') return 5000;
          if (key === 'APPLICATION_FEE_STANDARD') return 10000;
          return undefined;
        }),
      } as any,
      paymentGateway as any,
      {} as any,
      {} as any,
    );

    return {
      service,
      registration,
      paymentRepository,
      registrationRepository,
      paymentGateway,
    };
  }

  it('completes application fee payments locally without calling the gateway', async () => {
    const {
      service,
      registration,
      paymentRepository,
      registrationRepository,
      paymentGateway,
    } = createService();

    const result = await service.initiateApplicationPayment(
      userId,
      applicationId,
      {
        applicationType: RegistrationCategory.STANDARD,
        paymentMethod: PaymentMethod.TIGO_PESA,
        phoneNumber: '255712000000',
      },
    );

    expect(paymentGateway.initiatePayment).not.toHaveBeenCalled();
    expect(paymentGateway.checkPaymentStatus).not.toHaveBeenCalled();
    expect(result.paymentCompleted).toBe(true);
    expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(result.transactionRef).toBe(
      'MOCK-APPLICATION-550e8400-e29b-41d4-a716-446655440000',
    );
    expect(registration.paymentCompleted).toBe(true);
    expect(registration.paymentId).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(registration.completedSteps).toContain(RegistrationStep.PAYMENT);
    expect(registrationRepository.save).toHaveBeenCalledWith(registration);
    expect(paymentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentType: PaymentType.APPLICATION_FEE,
        status: PaymentStatus.COMPLETED,
        amount: 10000,
        paymentMethod: PaymentMethod.TIGO_PESA,
        transactionRef:
          'MOCK-APPLICATION-550e8400-e29b-41d4-a716-446655440000',
      }),
    );
  });

  it('reuses and completes an existing in-progress application payment locally', async () => {
    const existingPayment = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      userId,
      paymentType: PaymentType.APPLICATION_FEE,
      amount: 5000,
      currency: 'TZS',
      status: PaymentStatus.PROCESSING,
      paymentMethod: PaymentMethod.HALOPESA,
      referenceId: applicationId,
      referenceType: 'registration',
      transactionRef: undefined,
      receiptNumber: undefined,
      errorMessage: undefined,
      completedAt: undefined,
      providerResponse: {},
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
        paymentMethod: PaymentMethod.HALOPESA,
        phoneNumber: '255712000000',
      },
    );

    expect(paymentGateway.initiatePayment).not.toHaveBeenCalled();
    expect(result.paymentId).toBe(existingPayment.id);
    expect(result.paymentStatus).toBe(PaymentStatus.COMPLETED);
    expect(existingPayment.status).toBe(PaymentStatus.COMPLETED);
    expect(existingPayment.transactionRef).toBe(
      'MOCK-APPLICATION-550e8400-e29b-41d4-a716-446655440001',
    );
  });

  it('keeps prior step validation before completing payment', async () => {
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
