export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export type ApiEnvelope<T> = {
  success?: boolean;
  status?: number;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
};

export type LoginUser = {
  id: string;
  email: string;
  fullName: string;
  membershipId: string | null;
  membershipStatus: string | null;
  role: string | null;
  profilePhotoUrl?: string | null;
  registrationStatus?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
};

export type AdminStats = {
  members: {
    total: number;
    active: number;
    expired: number;
    newThisMonth: number;
  };
  applications: {
    pending: number;
    approved: number;
    rejected: number;
    totalThisYear: number;
  };
  payments: {
    totalRevenue: number;
    thisMonth: number;
    pending: number;
    currency: string;
  };
  events: {
    upcoming: number;
    totalRegistrations: number;
    avgAttendance: number;
  };
};

export type MemberSummary = {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  membershipId?: string | null;
  membershipClass?: string | null;
  membershipStatus?: string | null;
  engineeringDiscipline?: string | null;
};

export type ApplicationSummary = {
  id?: string;
  applicationId?: string;
  fullName?: string;
  applicantName?: string;
  email?: string;
  membershipClass?: string | null;
  status?: string;
  submittedAt?: string | null;
  createdAt?: string | null;
};
