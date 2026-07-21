import type { APIResponse } from "~/types/types";
import http from "~/utils/http";

export type EventPaymentStatus = {
  registrationId: string;
  status:
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "CANCELLED"
    | "ATTENDED"
    | "NO_SHOW"
    | "EXPIRED";
  paymentStatus: "PAID" | "PENDING";
  paymentId?: string;
  amount?: number;
  currency: string;
  paymentExpiresAt?: string | null;
  message: string;
};

export async function getEventPaymentStatus(registrationId: string) {
  const response = await http.get<APIResponse<EventPaymentStatus>>(
    `/events/registrations/${registrationId}/payment-status`,
  );
  return response.data;
}
