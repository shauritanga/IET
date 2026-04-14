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

export interface Registration {
    id: string;
    status: ApplicationStatus;
    currentStep: ApplicationStep;
    completedSteps: ApplicationStep[];
    personalDetails: PersonalDetails;
    registrationDetails: RegistrationDetails;
    educations: Education[];
    experiences: Experience[];
    documents: Document[];
    references: Reference[];
    emailVerified: boolean;
    paymentCompleted: boolean;
    paymentId: string | null;
    declarationAgreed: boolean;
    declarationSignature: string | null;
    declarationDate: string | null;
    referenceNumber?: string | null;
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
    institutions: OtherInstitution[];
}

export interface OtherInstitution {
    institutionName: string;
    registrationDate: string;
    classRegistered: string;
}

export interface Education {
    id: string;
    institutionName: string;
    qualification: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    grade: string;
    location: string;
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
