import type {ResendOtpFormType} from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";
import http from "~/utils/http";
import type {APIResponse} from "~/types";
import type {ResendOtpResponse} from "~/routes/auth/types";

export async function resendOtp(payload: ResendOtpFormType) {
    const { data } = await http.post<APIResponse<ResendOtpResponse>>("/auth/resend-verification", payload);
    return data.data;
}