export type AuthenticatedAuthResponse = {
    accessToken: string;
    refreshToken: string;
    user: User;
};

export type TwoFactorChallengeResponse = {
    validate2FA: string;
    message: string;
};

export type LoginResponse = AuthenticatedAuthResponse | TwoFactorChallengeResponse;

export type User = {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    membershipId: string;
    membershipStatus:string;
    registrationStatus:string;
    role: string | null;
    profilePhotoUrl?: string;
};

export type Role = {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
};

export type Permission = {
    id: string;
    name: string;
    model_type: string;
    description: string;
    created_at: string;
    updated_at: string;
};

export type UserMini = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
};

export type RegisterResponse = {
    userId: string;
    email:string;
    verificationSent:true
};

export type VerificationResponse = {
    verified: boolean;
    accessToken: string;
    refreshToken: string;
    user: User;
};

export type TwoFactorValidationResponse = {
    verified: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
};

export type ResendOtpResponse = {
    success?: boolean;
    message: string;
};

export type ResetPasswordResponse = {
    success: boolean;
    message: string;
};
