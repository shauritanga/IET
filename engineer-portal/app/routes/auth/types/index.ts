export type LoginResponse = {
    accessToken: string;
    refreshToken:string
    user: User;
};

export type User = {
    id: string;
    fullName: string;
    email: string;
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
    refreshToken:string;
    user: User;
}

export type ResendOtpResponse = {
    success:boolean;
    message: string;
}
