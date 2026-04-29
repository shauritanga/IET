import type { APIResponse } from "~/types";
import http from "~/utils/http";
import type { TwoFactorValidationResponse } from "~/routes/auth/types";

export type ValidateTwoFactorPayload = {
    userId: string;
    token: string;
};

export async function validateTwoFactor(payload: ValidateTwoFactorPayload) {
    const { data } = await http.post<APIResponse<TwoFactorValidationResponse>>("/auth/2fa/validate", payload);
    return data.data;
}
