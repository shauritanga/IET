import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { setToCookie, getFromCookie } from "~/utils/storage";
import { submitPersonalDetails } from "~/routes/application/personal-details/requests/submit-personal-details";
import type { APIResponse } from "~/types/types";
import type { ApplicationResponse } from "~/routes/application/type";

/**
 * Auto-creates an application draft on first navigation (like Gmail draft on compose).
 * If an applicationId cookie already exists, it skips creation entirely.
 *
 * Returns:
 *  - isInitializing: true while the draft creation request is in-flight
 *  - isReady: true once we know we have a valid applicationId (existing or freshly created)
 *  - error: any error from draft creation
 */
export function useInitializeApplication() {
    const hasInitialized = useRef(false);

    const { mutate, isPending, isSuccess, isError, error } = useMutation({
        mutationFn: () =>
            submitPersonalDetails({} as any), // empty payload — server creates skeleton draft
        onSuccess: (data: APIResponse<ApplicationResponse>) => {
            setToCookie("application-id", data.data.applicationId);
        },
    });

    useEffect(() => {
        // Guard: only run once per mount, and only if no existing applicationId
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const existingId = getFromCookie("application-id");
        if (!existingId) {
            mutate();
        }
    }, [mutate]);

    const existingId = getFromCookie("application-id");
    const isReady = !!existingId || isSuccess;
    const isInitializing = !existingId && isPending;

    return { isInitializing, isReady, isError, error };
}