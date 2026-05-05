export type ApplicationResponse = {
    applicationId:string;
    userId:string;
    currentStep:string;
    completedSteps:string[];
    nextStep:string;
}

export interface ApplicationDraftData {
    hasActiveRegistration: boolean;
    applicationId: string | null;
    currentStep: ApplicationStep | null;
    nextStep:     ApplicationStep | null;
    completedSteps: ApplicationStep[];
    referenceNumber: string | null;
    status: ApplicationStatus | null;
    reviewStage?: ApplicationReviewStage | null;
    stageUpdatedAt?: string | null;
    registration: Registration | null;
}

export type ApplicationPaymentMethod =
    | "AIRTEL_MONEY"
    | "TIGO_PESA"
    | "HALOPESA"
    | "SELCOM";

export type ApplicationPaymentStatusType =
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | null;

export interface ApplicationPaymentStatus {
    applicationId: string;
    paymentCompleted: boolean;
    paymentId: string | null;
    paymentStatus: ApplicationPaymentStatusType;
    paymentMethod: ApplicationPaymentMethod | null;
    paymentUrl: string | null;
    phoneNumber: string | null;
    transactionRef: string | null;
    amount: number | null;
    currency: string;
    applicationType: "GRADUATE" | "STANDARD" | null;
    message: string;
}

export type ApplicationStep =
    | "PERSONAL_DETAILS"
    | "REGISTRATION_DETAILS"
    | "EDUCATION_EXPERIENCE"
    | "REFERENCES"
    | "EMAIL_VERIFICATION"
    | "DECLARATION"
    | "PAYMENT";

export type ApplicationStatus =
    | "DRAFT"
    | "IN_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "CHANGES_REQUESTED";

export type ApplicationReviewStage =
    | "SECRETARIAT_REVIEW"
    | "EVALUATOR_REVIEW"
    | "SECRETARIAT_EVALUATOR_RECOMMENDATION"
    | "MPDC_REVIEW"
    | "SECRETARIAT_MPDC_RECOMMENDATION"
    | "COUNCIL_REVIEW"
    | "SECRETARIAT_COUNCIL_RECOMMENDATION"
    | "APPROVAL_NOTICE_SENT";

export interface Registration {
    id: string;
    status: ApplicationStatus;
    reviewStage?: ApplicationReviewStage | null;
    stageUpdatedAt?: string | null;
    assignedEvaluatorId?: string | null;
    assignedAt?: string | null;
    submittedAt?: string | null;
    councilApprovedAt?: string | null;
    approvalNoticeSentAt?: string | null;
    currentStep: ApplicationStep;
    completedSteps: ApplicationStep[];
    personalDetails: PersonalDetails;
    registrationDetails: RegistrationDetails;
    educations: Education[];
    experiences: Experience[];
    documents: RegistrationDocument[];
    references: Reference[];
    emailVerified: boolean;
    paymentCompleted: boolean;
    paymentId: string | null;
    declarationAgreed: boolean;
    declarationSignature: string | null;
    declarationDate: string | null;
    referenceNumber?: string | null;
    supportingDocumentUrl?: string | null;
    cvAttachment?: string | null;
    stageHistory?: ApplicationStageHistory[];
}

export interface ApplicationStageHistory {
    id: string;
    fromStage?: ApplicationReviewStage | null;
    toStage: ApplicationReviewStage;
    action:
        | "SUBMITTED"
        | "ASSIGNED"
        | "ADVANCED"
        | "RETURNED_FOR_CHANGES"
        | "REJECTED"
        | "APPROVED_BY_COUNCIL"
        | "NOTICE_SENT"
        | "RESUBMITTED";
    comments?: string | null;
    assignedEvaluatorId?: string | null;
    createdAt: string;
}

export interface PersonalDetails {
    title: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: "MALE" | "FEMALE";
    dateOfBirth: string;
    nationality: string;
    phoneNumber: string;
    email: string;
    employer: string;
    position: string;
    profilePhotoUrl: string;
}

export interface RegistrationDetails {
    engineeringDiscipline: string;
    applicationType: string;
    existingMembershipNumber: string | null;
    registrationCategory: string;
    appliedMembershipClass: string;
    registeredWithStatutoryBoards: boolean;
    memberOfOtherInstitutions: boolean;
    supportingDocument: string | null;
    supportingDocumentUrl?: string | null;
    institutions: OtherInstitution[];
}

export interface OtherInstitution {
    institutionName: string;
    registrationDate: string;
    classRegistered: string;
}

export interface Education {
    id: string;
    institutionId?: string | null;
    institutionName: string;
    qualification: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    grade: string;
    location: string;
    attachment?: string | null;
    attachmentUrl?: string | null;
    sortOrder: number;
}

export interface Experience {
    id: string;
    employerName: string;
    position: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    responsibilities: string;
    location: string;
    department: string;
    sortOrder: number;
}

export interface RegistrationDocument {
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    description: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    source?: string;
    uploadedAt?: string | null;
    verifiedAt?: string | null;
}

export interface Reference {
    id: string;
    referenceType: "PROPOSER" | "SUPPORTER";
    fullName: string;
    membershipCategory: string;
    membershipNumber: string;
    knownFrom: string;
    email: string;
    phoneNumber: string;
}
