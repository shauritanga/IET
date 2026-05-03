import { useMutation } from "@tanstack/react-query";
import type { TErrorMessage, TSuccess } from "~/types";
import toast from "react-hot-toast";
import type { VerificationResponse } from "~/routes/auth/types";
import type { VerifyOtpFormType } from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";
import { setToStorage, setToCookie } from "~/utils/storage";
import { TOKEN_KEY, USER_KEY } from "~/utils/http";
import { verifyEmail } from "~/routes/auth/verify-otp/requests/verify-email";
import {
    createAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
} from "~/utils/otp-session";

export function useVerifyEmail(onSuccess?: TSuccess<VerificationResponse>) {
    return useMutation<VerificationResponse, TErrorMessage, VerifyOtpFormType>({
        mutationFn: verifyEmail,
        onSuccess: (_data) => {
            setToCookie(TOKEN_KEY, _data.accessToken);
            setToCookie("global-rt", _data.refreshToken ?? "");
            setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, _data.user.membershipStatus ?? "");
            setToCookie(REGISTRATION_STATUS_COOKIE_KEY, _data.user.registrationStatus ?? "");
            setToStorage(USER_KEY, _data.user);
            writeAuthSession(createAuthSession({
                email: _data.user.email,
                name: _data.user.fullName ?? _data.user.email,
                membershipStatus: _data.user.membershipStatus,
                registrationStatus: _data.user.registrationStatus,
            }));
            toast.success("Email verified successfully");
            onSuccess?.(_data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Invalid verification code");
        },
    });
}
