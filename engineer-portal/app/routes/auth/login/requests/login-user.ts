import http from "~/utils/http";
import type {APIResponse} from "~/types";

import type {LoginFormType} from "~/routes/auth/login/fragments/form/manage-login-form";
import type {LoginResponse} from "~/routes/auth/types";

export async function loginUser(payload: LoginFormType) {
    const { data } = await http.post<APIResponse<LoginResponse>>("/auth/login", payload);
    return data.data;
}
