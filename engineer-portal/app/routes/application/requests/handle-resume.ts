import type {APIResponse} from "~/types/types";
import http from "~/utils/http";
import type {ApplicationDraftData, Registration} from "../type";
import { getApplicationId } from "~/utils/appplication";
import { deleteFromCookie, setToCookie } from "~/utils/storage";

function mapRegistrationToDraftData(registration: Registration | null): APIResponse<ApplicationDraftData> {
    return {
        data: {
            hasActiveRegistration: !!registration,
            applicationId: registration?.id ?? null,
            currentStep: registration?.currentStep ?? null,
            nextStep: null,
            completedSteps: registration?.completedSteps ?? [],
            referenceNumber: registration?.referenceNumber ?? null,
            status: registration?.status ?? null,
            reviewStage: registration?.reviewStage ?? null,
            stageUpdatedAt: registration?.stageUpdatedAt ?? null,
            registration,
        },
    };
}

export async function getApplicationDraft() {
    const applicationId = getApplicationId();

    if (applicationId) {
        try {
            const response = await http.get<APIResponse<Registration>>(
                `/registrations/${applicationId}`
            );
            setToCookie("application-id", response.data.data.id);
            return mapRegistrationToDraftData(response.data.data);
        } catch (error: any) {
            if (error?.response?.status !== 404) throw error;
            deleteFromCookie("application-id");
        }
    }

    const response = await http.get<APIResponse<Registration[]>>("/registrations");
    const activeRegistration =
        response.data.data.find((registration) =>
            registration.status === "DRAFT" || registration.status === "CHANGES_REQUESTED"
        ) ?? null;

    if (activeRegistration) {
        setToCookie("application-id", activeRegistration.id);
    } else {
        deleteFromCookie("application-id");
    }

    return mapRegistrationToDraftData(activeRegistration);
}
