import http from "~/utils/http";
import type {APIResponse} from "~/types";

import type {LoginResponse} from "~/routes/auth/types";
import type {ForgotPasswordFormType} from "~/routes/auth/forgot-password/fragments/form/manage-forgot-password-form";

export async function forgotPassword(payload: ForgotPasswordFormType) {
    const { data } = await http.post<APIResponse<LoginResponse>>("/auth/forgot-password", payload);
    return data.data;
}
