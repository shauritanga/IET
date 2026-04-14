import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationResponse} from "~/routes/application/type";
import { getApplicationId } from "~/utils/appplication";
import type { ExperienceDetailsFormType } from "../form/manage-experience-details-form";


export async function submitExperienceDetails(data: ExperienceDetailsFormType) {
    const applicationId = getApplicationId()
    const response = await http.patch<APIResponse<ApplicationResponse>>(
        `/registrations/${applicationId}/steps/experience-education`,
        data
    );
    return response.data;
}