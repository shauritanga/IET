export type AdminRole =
  | "ADMIN"
  | "SUPER_ADMIN"
  | "SECRETARIAT"
  | "EVALUATOR"
  | "MPDC"
  | "COUNCIL"
  | "REVIEWER";

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
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean | null;
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

export type TwoFactorChallengeResponse = {
  validate2FA: string;
  message: string;
};

export type AuthResponse = LoginResponse | TwoFactorChallengeResponse;

export type TwoFactorValidationResponse = {
  verified: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: LoginUser;
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
  profilePhotoUrl?: string | null;
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

export type EventCategory =
  | "CPD_COURSE"
  | "CONFERENCE"
  | "WORKSHOP"
  | "SEMINAR"
  | "ONLINE_SEMINAR"
  | "AGM"
  | "NETWORKING";

export type AdminEvent = {
  id: string;
  title: string;
  category: EventCategory;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  guestOfHonor?: string | null;
  speakers?: Array<{
    name: string;
    title?: string;
    bio?: string;
    photo?: string;
  }>;
  agenda?: Array<{
    time: string;
    title: string;
    description?: string;
  }>;
  registrationDeadline?: string | null;
  registrationFee: number;
  cpdPoints: number;
  maxParticipants?: number | null;
  requirements?: string[];
  organizer?: {
    name?: string;
    contact?: string;
    phone?: string;
  };
  registeredCount: number;
  isPublished: boolean;
  registrationOpen: boolean;
  coverImage?: string | null;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type EventAttendee = {
  id: string;
  ticketNumber: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  attendeeType: string;
  status: string;
  amountPaid: number;
  checkedIn: boolean;
  checkedInAt?: string | null;
  registeredAt: string;
};

export type EventAttendeesResponse = {
  eventId: string;
  eventTitle: string;
  total: number;
  attendees: EventAttendee[];
};

export type AdminEventPayload = {
  title: string;
  description?: string;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  location?: string;
  isOnline: boolean;
  onlineUrl?: string;
  guestOfHonor?: string;
  speakers?: Array<{
    name: string;
    title?: string;
    bio?: string;
    photo?: string;
  }>;
  agenda?: Array<{
    time: string;
    title: string;
    description?: string;
  }>;
  registrationDeadline?: string;
  registrationFee?: number;
  cpdPoints?: number;
  maxParticipants?: number;
  requirements?: string[];
  organizer?: {
    name?: string;
    contact?: string;
    phone?: string;
  };
  isPublished?: boolean;
  registrationOpen?: boolean;
  coverImage?: string;
  images?: string[];
};
