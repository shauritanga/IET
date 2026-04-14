import type { APIResponse } from "~/types/types";
import http from "~/utils/http";
import { getApplicationId } from "~/utils/appplication";
import type { ApplicationPaymentStatus } from "~/routes/application/type";

export async function getApplicationPaymentStatus() {
    const applicationId = getApplicationId();
    const response = await http.get<APIResponse<ApplicationPaymentStatus>>(
        `/registrations/${applicationId}/payment-status`,
    );
    return response.data;
}
