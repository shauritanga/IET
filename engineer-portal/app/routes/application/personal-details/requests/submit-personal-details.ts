import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {PersonalDetailsFormType} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import type {ApplicationResponse} from "~/routes/application/type";
import {getApplicationId} from "~/utils/appplication";


export async function submitPersonalDetails(data: PersonalDetailsFormType) {
    const applicationId = getApplicationId();
    const response = applicationId
        ? await http.patch<APIResponse<ApplicationResponse>>(
            `/registrations/${applicationId}/steps/personal-details`,
            data
        )
        : await http.post<APIResponse<ApplicationResponse>>(
            "/registrations",
            data
        );
    return response.data;
}
