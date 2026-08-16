import type { APIResponse } from "~/types/types";
import http from "~/utils/http";

export type ReferenceRole = "proposer" | "supporter";

export type ReferenceCandidateSummary = {
    membershipNumber: string;
    fullName: string;
    membershipCategory: string;
};

export type ReferenceCandidateDetails = ReferenceCandidateSummary & {
    organisation: string;
    email: string;
    phoneNumber: string;
};

export async function searchReferenceCandidates(
    q: string,
    role: ReferenceRole,
): Promise<ReferenceCandidateSummary[]> {
    const response = await http.get<APIResponse<ReferenceCandidateSummary[]>>(
        "/registrations/reference-candidates",
        { params: { q, role } },
    );
    return response.data.data ?? [];
}

export async function getReferenceCandidate(
    membershipNumber: string,
    role: ReferenceRole,
): Promise<ReferenceCandidateDetails> {
    const response = await http.get<APIResponse<ReferenceCandidateDetails>>(
        "/registrations/reference-candidates/details",
        { params: { membershipNumber, role } },
    );
    return response.data.data;
}
