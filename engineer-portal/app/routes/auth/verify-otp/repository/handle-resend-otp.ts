import type {TErrorMessage, TSuccess} from "~/types";
import type {ResendOtpResponse} from "~/routes/auth/types";
import {useMutation} from "@tanstack/react-query";
import type {
    ResendOtpFormType,
} from "~/routes/auth/verify-otp/fragments/form/manage-verify-otp-form";
import toast from "react-hot-toast";
import {resendOtp} from "~/routes/auth/verify-otp/requests/resend-otp";

export function useResendOtp(onSuccess?: TSuccess<ResendOtpResponse>) {
    return useMutation<ResendOtpResponse, TErrorMessage, ResendOtpFormType>({
        mutationFn: resendOtp,
        onSuccess: (_data) => {
            toast.success("OTP resent successfully!");
            onSuccess?.(_data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Failed to resend OTP!");
        },
    });
}