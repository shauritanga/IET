import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationResponse} from "~/routes/application/type";
import { getApplicationId } from "~/utils/appplication";
import type { RegistrationDetailsFormType } from "../form/manage-registration-details-form";


export async function submitRegistrationDetails(data: RegistrationDetailsFormType) {
    const applicationId = getApplicationId()
    const response = await http.patch<APIResponse<ApplicationResponse>>(
        `/registrations/${applicationId}/steps/registration-details`,
        data
    );
    return response.data;
}