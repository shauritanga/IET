// ~/routes/application/repository/useResumeApplication.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getApplicationDraft } from "~/routes/application/requests/handle-resume";
import type { ApplicationDraftData, ApplicationStep } from "~/routes/application/type";
import type { APIResponse, TErrorMessage } from "~/types/types";

const stepRouteMap: Record<ApplicationStep, string> = {
    PERSONAL_DETAILS: "/application/personal-details",
    REGISTRATION_DETAILS: "/application/registration-details",
    EXPERIENCE: "/application/experience",
    REFERENCES: "/application/references",
    DECLARATION: "/application/submission",
    PAYMENT: "/application/submission",
};

// ── Separate hook just for the initial redirect ──────────────────────────────
export const useResumeApplication = () => {
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    const query = useQuery<APIResponse<ApplicationDraftData>, TErrorMessage>({
        queryKey: ["application-draft"],
        queryFn: getApplicationDraft,
        staleTime: Infinity, // ← don't refetch during navigation
        refetchOnWindowFocus: false,
        refetchOnMount: false, // ← don't re-run when stepping between pages
    });

    useEffect(() => {
        if (!query.data || hasRedirected.current) return;

        hasRedirected.current = true;

        const { hasActiveRegistration, currentStep } = query.data.data;

        if (!hasActiveRegistration) {
            navigate("/application/personal-details", { replace: true });
            return;
        }

        const redirectTo = stepRouteMap[currentStep!] ?? "/application/personal-details";
        navigate(redirectTo, { replace: true });
    }, [query.data]);

    return query;
};

// ── Separate hook just for reading draft data (no redirect) ──────────────────
export const useGetApplicationDraft = () => {
    return useQuery<APIResponse<ApplicationDraftData>, TErrorMessage>({
        queryKey: ["application-draft"], // same key — reads from cache, no refetch
        queryFn: getApplicationDraft,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};