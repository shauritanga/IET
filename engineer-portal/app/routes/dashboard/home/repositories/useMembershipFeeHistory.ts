import {useQuery} from "@tanstack/react-query";
import type {TErrorMessage} from "~/types/types";
import type {ApiCollectionResponse, MembershipFeeHistoryItem} from "../type";
import {getMembershipFeeHistory} from "../requests/get-membership-fee-history";

export function useMembershipFeeHistory() {
    return useQuery<ApiCollectionResponse<MembershipFeeHistoryItem>, TErrorMessage>({
        queryKey: ["dashboard-membership-fees"],
        queryFn: getMembershipFeeHistory,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}
