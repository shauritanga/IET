import { useMutation } from "@tanstack/react-query";
import type { TErrorMessage, TSuccess } from "~/types";
import toast from "react-hot-toast";
import type {RegistrationFormType} from "~/routes/auth/register/fragments/form/manage-registration-form";
import type {RegisterResponse} from "~/routes/auth/types";
import {registerUser} from "~/routes/auth/register/requests/register-user";


export function useRegisterUser(onSuccess?: TSuccess<RegisterResponse>) {
    return useMutation<RegisterResponse, TErrorMessage, RegistrationFormType>({
        mutationFn: registerUser,
        onSuccess: (_data) => {
            toast.success("Verification code sent to your email");
            onSuccess?.(_data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Registration failed");
        },
    });
}