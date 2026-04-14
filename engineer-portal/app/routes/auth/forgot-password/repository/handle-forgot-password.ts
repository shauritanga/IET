import { useMutation } from "@tanstack/react-query";
import type {TErrorMessage, TSuccess} from "~/types";
import type {LoginResponse} from "~/routes/auth/types";
import toast from "react-hot-toast";
import {forgotPassword} from "~/routes/auth/forgot-password/requests/forgot-password";
import type {ForgotPasswordFormType} from "~/routes/auth/forgot-password/fragments/form/manage-forgot-password-form";

export function useForgotPassword(onSuccess?: TSuccess<LoginResponse>) {
    return useMutation<LoginResponse, TErrorMessage, ForgotPasswordFormType>({
        mutationFn: forgotPassword,
        onSuccess: (_data) => {
            toast.success("Password reset instruction sent to your email!");
            onSuccess?.(_data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Password reset instructions failed to send!");
        },
    });
}