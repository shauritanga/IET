export type DashboardEvent = {
    id: string;
    title: string;
    category: string;
    description?: string | null;
    startDate: string;
    endDate?: string | null;
    startTime: string;
    endTime: string;
    location: string;
    isOnline: boolean;
    guestOfHonor?: string | null;
    speaker?: string | null;
    registrationFee?: number;
    cpdPoints?: number;
    availableSlots?: number | null;
    registeredCount?: number;
    isFull?: boolean;
    isRegistered?: boolean;
    coverImage?: string | null;
};

export type MembershipFeeHistoryItem = {
    id?: string;
    year: number;
    membershipClass: string;
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE" | "EXPIRING" | string;
    paidAt?: string | null;
    dueDate?: string | null;
    receiptNumber?: string | null;
};

export type ApiCollectionResponse<T> = {
    data: T[];
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};
