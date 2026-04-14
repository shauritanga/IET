import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationResponse} from "~/routes/application/type";
import { getApplicationId } from "~/utils/appplication";
import type { ReferenceDetailsFormType } from "../forms/manage-reference-forms";


export async function submitReferenceDetails(data: ReferenceDetailsFormType) {
    const applicationId = getApplicationId()
    const response = await http.post<APIResponse<ApplicationResponse>>(
        `/registrations/${applicationId}/references`,
        data
    );
    return response.data;
}
