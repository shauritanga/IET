import type {APIResponse} from "~/types";
import http from "~/utils/http";
import type {RegisterResponse, VerificationResponse} from "~/routes/auth/types";
import type {
    ResendOtpFormType,
    VerifyOtpFormType
} from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";


export async function verifyEmail(payload: VerifyOtpFormType) {
    const { data } = await http.post<APIResponse<VerificationResponse>>("/auth/verify-email", payload);
    return data.data;
}

