export type RegistrationStatus =
    | "DRAFT"
    | "CHANGES_REQUESTED"
    | "IN_REVIEW"
    | "APPROVED"
    | "REJECTED"
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
