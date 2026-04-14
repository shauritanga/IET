import { useMutation } from "@tanstack/react-query";
import type { TErrorMessage, TSuccess } from "~/types";
import toast from "react-hot-toast";
import type { ResetPasswordResponse} from "~/routes/auth/types";
import type {ResetPasswordFormType} from "~/routes/auth/reset-password/fragments/form/manage-reset-password-form";
import {resetPassword} from "~/routes/auth/reset-password/requests/reset-password";


export function useResetPassword(onSuccess?: TSuccess<ResetPasswordResponse>) {
    return useMutation<ResetPasswordResponse, TErrorMessage, ResetPasswordFormType>({
        mutationFn: resetPassword,
        onSuccess: (_data) => {
            toast.success("Password reset successfully");
            onSuccess?.(_data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Failed to reset password!");
        },
    });
}