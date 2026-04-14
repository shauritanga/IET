import type {RegistrationFormType} from "~/routes/auth/register/fragments/form/manage-registration-form";
import http from "~/utils/http";
import type {APIResponse} from "~/types";
import type {RegisterResponse} from "~/routes/auth/types";


export async function registerUser(payload: RegistrationFormType) {
    const { data } = await http.post<APIResponse<RegisterResponse>>("/auth/register", payload);
    return data.data;
}