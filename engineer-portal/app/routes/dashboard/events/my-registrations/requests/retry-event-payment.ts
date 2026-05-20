import http from "~/utils/http";

export type RetryPaymentResult = {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  status: string;
  paymentId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  paymentExpiresAt: string;
};

export async function retryEventPayment(
  registrationId: string,
): Promise<RetryPaymentResult> {
  const response = await http.post(
    `/events/registrations/${registrationId}/retry-payment`,
  );
  return response.data;
}
