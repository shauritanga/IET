import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    getReferenceCandidate,
    searchReferenceCandidates,
    type ReferenceCandidateDetails,
    type ReferenceRole,
} from "../requests/search-reference-candidates";

export function useSearchReferenceCandidates(q: string, role: ReferenceRole, enabled: boolean) {
    const [debouncedQuery, setDebouncedQuery] = useState(q);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebouncedQuery(q.trim()), 300);
        return () => window.clearTimeout(timer);
    }, [q]);

    return useQuery({
        queryKey: ["reference-candidates", role, debouncedQuery],
        queryFn: () => searchReferenceCandidates(debouncedQuery, role),
        enabled: enabled && debouncedQuery.length >= 2,
        staleTime: 30_000,
    });
}

export async function loadReferenceCandidate(
    membershipNumber: string,
    role: ReferenceRole,
): Promise<ReferenceCandidateDetails> {
    return getReferenceCandidate(membershipNumber, role);
}
