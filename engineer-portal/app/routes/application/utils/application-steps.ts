import type { ApplicationDraftData, ApplicationStep } from "~/routes/application/type";

/** Visible application wizard paths (email verification is handled at signup). */
export const APPLICATION_STEP_PATHS = [
    "/application/personal-details",
    "/application/registration-details",
    "/application/experience",
    "/application/references",
    "/application/review",
    "/application/submission",
] as const;

export type ApplicationStepPath = (typeof APPLICATION_STEP_PATHS)[number];

/** Backend steps that gate progress. EMAIL_VERIFICATION is synced silently from signup. */
const orderedBackendSteps: ApplicationStep[] = [
    "PERSONAL_DETAILS",
    "REGISTRATION_DETAILS",
    "EDUCATION_EXPERIENCE",
    "REFERENCES",
    "PAYMENT",
    "DECLARATION",
];

export function getStepIndexFromPath(pathname: string): number {
    return APPLICATION_STEP_PATHS.findIndex((path) => pathname.startsWith(path));
}

export function isAheadOfAllowedStep(currentPath: string, allowedPath: string): boolean {
    const currentIdx = getStepIndexFromPath(currentPath);
    const allowedIdx = getStepIndexFromPath(allowedPath);
    if (currentIdx === -1 || allowedIdx === -1) return false;
    return currentIdx > allowedIdx;
}

/** Farthest step the applicant may open (future steps stay locked). */
export function getFarthestAllowedPath(
    draft: ApplicationDraftData | null | undefined,
): ApplicationStepPath {
    if (!draft?.hasActiveRegistration) {
        return "/application/personal-details";
    }

    if (
        draft.status === "IN_REVIEW" ||
        draft.status === "APPROVED" ||
        draft.status === "REJECTED"
    ) {
        return "/application/review";
    }

    const completed = draft.completedSteps ?? [];

    if (!completed.includes("PERSONAL_DETAILS")) return "/application/personal-details";
    if (!completed.includes("REGISTRATION_DETAILS")) return "/application/registration-details";
    if (!completed.includes("EDUCATION_EXPERIENCE")) return "/application/experience";
    if (!completed.includes("REFERENCES")) return "/application/references";

    return "/application/submission";
}

/** Where to land when resuming an in-progress application. */
export function getApplicationRoute(
    draft: ApplicationDraftData | null | undefined,
): ApplicationStepPath {
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

    const completed = draft.completedSteps ?? [];
    const nextIncomplete = orderedBackendSteps.find((step) => !completed.includes(step));

    switch (nextIncomplete ?? draft.currentStep) {
        case "PERSONAL_DETAILS":
            return "/application/personal-details";
        case "REGISTRATION_DETAILS":
            return "/application/registration-details";
        case "EDUCATION_EXPERIENCE":
            return "/application/experience";
        case "REFERENCES":
            return "/application/references";
        case "EMAIL_VERIFICATION":
        case "PAYMENT":
        case "DECLARATION":
            return "/application/review";
        default:
            return "/application/personal-details";
    }
}

export function isStepCompleted(
    completedSteps: ApplicationStep[],
    stepKey: ApplicationStep | "REVIEW",
): boolean {
    if (stepKey === "REVIEW") {
        return completedSteps.includes("REFERENCES");
    }
    if (stepKey === "EMAIL_VERIFICATION") {
        // Not shown in the wizard; treated as done once signup email is verified
        return (
            completedSteps.includes("EMAIL_VERIFICATION") ||
            completedSteps.includes("REFERENCES")
        );
    }
    if (stepKey === "PAYMENT" || stepKey === "DECLARATION") {
        return (
            completedSteps.includes("PAYMENT") ||
            completedSteps.includes("DECLARATION")
        );
    }
    return completedSteps.includes(stepKey);
}

/** After saving a completed step, return to review when possible. */
export function getRouteAfterSavingStep(
    completedSteps: ApplicationStep[],
    stepKey: ApplicationStep,
    defaultNext: ApplicationStepPath,
): ApplicationStepPath {
    if (completedSteps.includes(stepKey) && completedSteps.includes("REFERENCES")) {
        return "/application/review";
    }
    return defaultNext;
}

export function getSubmitLabel(
    completedSteps: ApplicationStep[],
    stepKey: ApplicationStep,
): string {
    return completedSteps.includes(stepKey) ? "Save changes" : "Save & Continue";
}
