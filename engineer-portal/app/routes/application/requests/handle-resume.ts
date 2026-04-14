import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationDraftData} from "../type";


export async function getApplicationDraft() {
    const response = await http.get<APIResponse<ApplicationDraftData>>(
        `/registrations/resume`
    );
    return response.data;
}