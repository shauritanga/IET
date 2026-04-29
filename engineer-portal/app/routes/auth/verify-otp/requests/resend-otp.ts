import type {ResendOtpFormType} from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";
import http from "~/utils/http";
import type {ResendOtpResponse} from "~/routes/auth/types";

export async function resendOtp(payload: ResendOtpFormType) {
    const { data } = await http.post<ResendOtpResponse>("/auth/resend-verification", payload);
    return data;
}
