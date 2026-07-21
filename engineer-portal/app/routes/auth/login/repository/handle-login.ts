import { useMutation } from "@tanstack/react-query";
import type { TErrorMessage, TSuccess } from "~/types";
import toast from "react-hot-toast";
import type { LoginFormType } from "~/routes/auth/login/fragments/form/manage-login-form";
import { rememberDays, setToStorage } from "~/utils/storage";
import { setToCookie } from "~/utils/storage";
import { TOKEN_KEY, USER_KEY } from "~/utils/http";
import type { LoginResponse } from "~/routes/auth/types";
import { loginUser } from "~/routes/auth/login/requests/login-user";
import {
    createAuthSession,
    MEMBERSHIP_STATUS_COOKIE_KEY,
    REGISTRATION_STATUS_COOKIE_KEY,
    writeAuthSession,
} from "~/utils/otp-session";

export function useLoginUser(onSuccess?: TSuccess<LoginResponse>) {
    return useMutation<LoginResponse, TErrorMessage, LoginFormType>({
        mutationFn: loginUser,
        onSuccess: (data) => {
            if (!("accessToken" in data)) {
                toast.success(data.message);
                onSuccess?.(data);
                return;
            }

            const rememberTtl = rememberDays();
            setToCookie(TOKEN_KEY, data.accessToken, rememberTtl);
            setToCookie("global-rt", data.refreshToken ?? "", rememberTtl);
            setToCookie(MEMBERSHIP_STATUS_COOKIE_KEY, data.user.membershipStatus ?? "", rememberTtl);
            setToCookie(REGISTRATION_STATUS_COOKIE_KEY, data.user.registrationStatus ?? "", rememberTtl);
            setToStorage(USER_KEY, data.user);
            writeAuthSession(createAuthSession({
                email: data.user.email,
                name: data.user.fullName ?? data.user.email,
                membershipStatus: data.user.membershipStatus,
                registrationStatus: data.user.registrationStatus,
            }));
            toast.success("Logged in successfully!");
            onSuccess?.(data);
        },
        onError: (error: TErrorMessage) => {
            toast.error(error.response?.data.message ?? "Something went wrong!");
        },
    });
}
