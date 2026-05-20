import http from "~/utils/http";

export type MyRegistration = {
  registrationId: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    category: string;
    registrationFee?: number;
    registrationOpen?: boolean;
    registrationDeadline?: string | null;
  };
  status: "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "ATTENDED" | "NO_SHOW" | "EXPIRED";
  registeredAt: string;
  paymentStatus: "PAID" | "PENDING";
  ticketNumber?: string;
  qrCode?: string;
  paymentExpiresAt?: string;
};

export async function getMyRegistrations(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: MyRegistration[]; meta: { total: number; page: number; totalPages: number } }> {
  const response = await http.get("/events/registrations/me", { params });
  return response.data;
}
