export type Gender = "MALE" | "FEMALE";

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
}
