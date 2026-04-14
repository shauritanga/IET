import {useQuery} from "@tanstack/react-query";
import type {TErrorMessage} from "~/types/types";
import type {ApiCollectionResponse, DashboardEvent} from "../type";
import {getUpcomingEvents} from "../requests/get-upcoming-events";

export function useUpcomingEvents() {
    return useQuery<ApiCollectionResponse<DashboardEvent>, TErrorMessage>({
        queryKey: ["dashboard-upcoming-events"],
        queryFn: getUpcomingEvents,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });
}
