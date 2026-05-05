export type RegistrationStatus =
    | "DRAFT"
    | "CHANGES_REQUESTED"
    | "IN_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | string
    | null
    | undefined;

export type ReviewStage =
    | "SECRETARIAT_REVIEW"
    | "EVALUATOR_REVIEW"
    | "MPDC_REVIEW"
    | "COUNCIL_REVIEW"
    | "APPROVAL_NOTICE_SENT"
    | string
    | null
    | undefined;

export const getRegistrationStatusLabel = (status: RegistrationStatus) => {
    switch (status) {
        case "DRAFT":
            return "Draft Application";
        case "CHANGES_REQUESTED":
            return "Changes Requested";
        case "IN_REVIEW":
            return "Pending Application";
        case "APPROVED":
            return "Approved Application";
        case "REJECTED":
            return "Rejected Application";
        default:
            return "No Application";
    }
};

export const getReviewStageLabel = (stage: ReviewStage) => {
    switch (stage) {
        case "SECRETARIAT_REVIEW":
            return "Reviewed by Secretariat";
        case "EVALUATOR_REVIEW":
            return "Assigned to Evaluator";
        case "SECRETARIAT_EVALUATOR_RECOMMENDATION":
            return "Secretariat Recommendation";
        case "MPDC_REVIEW":
            return "Reviewed by MPDC";
        case "SECRETARIAT_MPDC_RECOMMENDATION":
            return "Secretariat MPDC Recommendation";
        case "COUNCIL_REVIEW":
            return "Awaiting Council Approval";
        case "SECRETARIAT_COUNCIL_RECOMMENDATION":
            return "Secretariat Council Recommendation";
        case "APPROVAL_NOTICE_SENT":
            return "Approval Note Sent";
        default:
            return "Awaiting Review";
    }
};

export const shouldShowMembershipApplicationCta = (status: RegistrationStatus) =>
    status === null ||
    status === undefined ||
    status === "DRAFT" ||
    status === "CHANGES_REQUESTED" ||
    status === "REJECTED";

export const getMembershipApplicationCtaLabel = (status: RegistrationStatus) =>
    status === "DRAFT" || status === "CHANGES_REQUESTED"
        ? "Continue Application"
        : status === "REJECTED"
            ? "Start New Application"
        : "Apply for Membership";
