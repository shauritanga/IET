import { useMutation } from "@tanstack/react-query";
import type { TErrorMessage, TSuccess } from "~/types";
import toast from "react-hot-toast";
import type { LoginFormType } from "~/routes/auth/login/fragments/form/manage-login-form";
import { setToStorage } from "~/utils/storage";
import { setToCookie } from "~/utils/storage";
import { TOKEN_KEY, USER_KEY } from "~/utils/http";
import type { LoginResponse } from "~/routes/auth/types";
import { loginUser } from "~/routes/auth/login/requests/login-user";

export function useLoginUser(onSuccess?: TSuccess<LoginResponse>) {
    return useMutation<LoginResponse, TErrorMessage, LoginFormType>({
        mutationFn: loginUser,
        onSuccess: (data) => {
            setToCookie(TOKEN_KEY, data.accessToken);
            setToCookie("global-rt", data.refreshToken ?? "");
            setToCookie("global-ms", data.user.registrationStatus);
            setToStorage(USER_KEY, data.user);
            toast.success("Logged in successfully!");
            onSuccess?.(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Something went wrong!");
        },
    });
}