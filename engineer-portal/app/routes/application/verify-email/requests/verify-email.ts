import type { APIResponse } from "~/types/types";
import http from "~/utils/http";
import { getApplicationId } from "~/utils/appplication";

export async function verifyApplicationEmail(code: string) {
    const applicationId = getApplicationId();
    const response = await http.post<APIResponse<{ emailVerified: boolean; completedSteps: string[]; nextStep: string }>>(
        `/registrations/${applicationId}/verify-email`,
        { verificationCode: code },
    );
    return response.data;
}

export async function resendVerificationCode() {
    const applicationId = getApplicationId();
    const response = await http.post<APIResponse<{ sent: boolean }>>(
        `/registrations/${applicationId}/resend-verification`,
    );
    return response.data;
}
