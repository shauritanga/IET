import { deleteFromCookie } from "~/utils/storage";
import { getApplicationId } from "~/utils/appplication";

export function useInitializeApplication() {
    const applicationId = getApplicationId();

    if (!applicationId) {
        deleteFromCookie("application-id");
    }

    return {
        isInitializing: false,
        isReady: true,
        isError: false,
        error: null,
    };
}
