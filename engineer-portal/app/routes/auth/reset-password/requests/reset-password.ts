import http from "~/utils/http";
import type {APIResponse} from "~/types";
import type {ResetPasswordResponse} from "~/routes/auth/types";
import type {ResetPasswordFormType} from "~/routes/auth/reset-password/fragments/form/manage-reset-password-form";


export async function resetPassword(payload: ResetPasswordFormType) {
    const { data } = await http.post<APIResponse<ResetPasswordResponse>>("/auth/reset-password", payload);
    return data.data;
}