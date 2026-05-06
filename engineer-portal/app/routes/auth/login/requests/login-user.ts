import http from "~/utils/http";
import type {APIResponse} from "~/types";

import type {LoginFormType} from "~/routes/auth/login/fragments/form/manage-login-form";
import type {LoginResponse} from "~/routes/auth/types";

const PORTAL = "MEMBER_PORTAL";

export async function loginUser(payload: LoginFormType) {
    const { data } = await http.post<APIResponse<LoginResponse>>("/auth/login", {
        ...payload,
        portal: PORTAL,
    });
    return data.data;
}
