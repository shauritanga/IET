export type Gender = "MALE" | "FEMALE";

export interface ProfileApplicationDocument {
    id: string;
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    description?: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | string;
    uploadedAt?: string | null;
    verifiedAt?: string | null;
    source?: string;
}

export interface ProfileApplicationEducation {
    id: string;
    institutionName: string;
    qualification: string;
    fieldOfStudy?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    attachmentUrl?: string | null;
}

export interface ProfileApplicationExperience {
    id: string;
    employerName: string;
    position: string;
    startDate?: string | null;
    endDate?: string | null;
    isCurrent: boolean;
    location?: string | null;
}

export interface ProfileApplicationReference {
    id: string;
    referenceType: string;
    fullName: string;
    membershipCategory: string;
    membershipNumber: string;
}

export interface ProfileLatestApplication {
    id: string;
    referenceNumber?: string | null;
    status: string;
    reviewStage?: string | null;
    stageUpdatedAt?: string | null;
    currentStep: string;
    completedSteps: string[];
    submittedAt?: string | null;
    appliedMembershipClass?: string | null;
    engineeringDiscipline?: string | null;
    registrationCategory?: string | null;
    applicationType?: string | null;
    supportingDocumentUrl?: string | null;
    cvAttachment?: string | null;
    reviewComments?: string | null;
    rejectionReason?: string | null;
    paymentCompleted: boolean;
    declarationAgreed: boolean;
    documents: ProfileApplicationDocument[];
    educations: ProfileApplicationEducation[];
    experiences: ProfileApplicationExperience[];
    references: ProfileApplicationReference[];
}

export interface UserProfile {
    id: string;
    createdAt: string;
    updatedAt: string; 

    email: string;
    emailVerified: boolean;

    enable2FA: boolean;

    title: string;
    firstName: string;
    middleName?: string;
    lastName: string;

    gender: Gender;
    dateOfBirth: string; 
    nationality: string;

    phoneNumber: string;
    profilePhotoUrl?: string | null;

    employer: string;
    position: string;
    location: string;

    membershipId: string,
    membershipClass: string,
    membershipStatus: string,
    engineeringDiscipline: string,
    joiningDate: string,
    membershipExpiryDate: string,
    annualMembershipFee: string,
    isMembershipExpired: boolean,
    daysUntilExpiry: number,

    role: string,
    isActive: boolean,

    registrationStatus: string
    registrationReviewStage?: string | null
    registrationStageUpdatedAt?: string | null
    latestApplication?: ProfileLatestApplication | null
}
