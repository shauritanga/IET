import type { APIResponse } from "~/types/types";
import http from "~/utils/http";
import { getApplicationId } from "~/utils/appplication";
import type { ApplicationPaymentMethod, ApplicationPaymentStatus } from "~/routes/application/type";

export type InitiateApplicationPaymentPayload = {
    applicationType: "GRADUATE" | "STANDARD";
    paymentMethod: ApplicationPaymentMethod;
    phoneNumber?: string;
};

export async function initiateApplicationPayment(
    payload: InitiateApplicationPaymentPayload,
) {
    const applicationId = getApplicationId();
    const response = await http.post<APIResponse<ApplicationPaymentStatus>>(
        `/registrations/${applicationId}/payments`,
        payload,
    );
    return response.data;
}
