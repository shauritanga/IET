import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationResponse} from "~/routes/application/type";
import { getApplicationId } from "~/utils/appplication";
import type { DeclarationFormType } from "../form/manage-declaration-form";



export async function submitDeclaration(data: DeclarationFormType) {
    const applicationId = getApplicationId()
    const response = await http.post<APIResponse<ApplicationResponse>>(
        `/registrations/${applicationId}/submit`,
        data
    );
    return response.data;
}