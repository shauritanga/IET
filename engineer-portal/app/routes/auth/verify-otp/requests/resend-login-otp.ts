import type { APIResponse } from "~/types/types";
import http from "~/utils/http";
import type { LoginOtpChannel } from "~/utils/otp-session";

export type ResendLoginOtpResponse = {
    channel: LoginOtpChannel;
    destination: string;
    message: string;
};

export async function resendLoginOtp(payload: {
    userId: string;
    channel: LoginOtpChannel;
}) {
    const response = await http.post<APIResponse<ResendLoginOtpResponse>>(
        "/auth/2fa/resend",
        payload,
    );
    return response.data.data;
}
