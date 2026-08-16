// ~/routes/application/repository/useResumeApplication.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getApplicationDraft } from "~/routes/application/requests/handle-resume";
import type { ApplicationDraftData } from "~/routes/application/type";
import type { APIResponse, TErrorMessage } from "~/types/types";
import { getApplicationRoute } from "~/routes/application/utils/application-steps";

export { getApplicationRoute } from "~/routes/application/utils/application-steps";

// ── Separate hook just for the initial redirect ──────────────────────────────
export const useResumeApplication = () => {
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    const query = useQuery<APIResponse<ApplicationDraftData>, TErrorMessage>({
        queryKey: ["application-draft"],
        queryFn: getApplicationDraft,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    useEffect(() => {
        if (!query.data || hasRedirected.current) return;

        hasRedirected.current = true;

        const redirectTo = getApplicationRoute(query.data.data);
        navigate(redirectTo, { replace: true });
    }, [query.data]);

    return query;
};

// ── Separate hook just for reading draft data (no redirect) ──────────────────
export const useGetApplicationDraft = () => {
    return useQuery<APIResponse<ApplicationDraftData>, TErrorMessage>({
        queryKey: ["application-draft"],
        queryFn: getApplicationDraft,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
};
