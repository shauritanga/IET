// ~/routes/application/repository/useResumeApplication.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getApplicationDraft } from "~/routes/application/requests/handle-resume";
import type { ApplicationDraftData, ApplicationStep } from "~/routes/application/type";
import type { APIResponse, TErrorMessage } from "~/types/types";

const orderedApplicationSteps: ApplicationStep[] = [
    "PERSONAL_DETAILS",
    "REGISTRATION_DETAILS",
    "EDUCATION_EXPERIENCE",
    "REFERENCES",
    "PAYMENT",
    "DECLARATION",
];

export const getApplicationRoute = (
    draft: ApplicationDraftData | null | undefined,
) => {
    if (!draft?.hasActiveRegistration) {
        return "/application/personal-details";
    }

    if (
        draft.status === "IN_REVIEW" ||
        draft.status === "APPROVED" ||
        draft.status === "REJECTED"
    ) {
        return "/application/welcome";
    }

    const nextIncompleteStep = orderedApplicationSteps.find(
        (step) => !draft.completedSteps.includes(step),
    );

    switch (nextIncompleteStep ?? draft.currentStep) {
        case "PERSONAL_DETAILS":
            return "/application/personal-details";
        case "REGISTRATION_DETAILS":
            return "/application/registration-details";
        case "EDUCATION_EXPERIENCE":
            return "/application/experience";
        case "REFERENCES":
            return "/application/references";
        case "DECLARATION":
        case "EMAIL_VERIFICATION":
        case "PAYMENT":
            return "/application/submission";
        default:
            return "/application/personal-details";
    }
};

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
