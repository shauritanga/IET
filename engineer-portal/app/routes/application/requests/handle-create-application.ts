import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {PersonalDetailsFormType} from "~/routes/application/personal-details/forms/manage-personal-details-form";
import type {ApplicationResponse} from "~/routes/application/type";


export async function createApplication(data: PersonalDetailsFormType) {
    const response = await http.post<APIResponse<ApplicationResponse>>(
        "/registrations",
        data
    );
    return response.data;
}