import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { TErrorMessage } from "~/types/types";
import { resendVerificationCode } from "../requests/verify-email";

export function useResendCode(onResent: () => void) {
    return useMutation<
        Awaited<ReturnType<typeof resendVerificationCode>>,
        TErrorMessage,
        void
    >({
        mutationFn: resendVerificationCode,
        onSuccess: () => {
            toast.success("Verification code resent to your email.");
            onResent();
        },
        onError: (error) => {
            toast.error(error.response?.data.message ?? "Could not resend code.");
        },
    });
}
