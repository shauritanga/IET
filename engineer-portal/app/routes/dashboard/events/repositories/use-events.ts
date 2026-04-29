import { useQuery } from "@tanstack/react-query";
import type { ApiCollectionResponse, DashboardEvent } from "~/routes/dashboard/home/type";
import type { TErrorMessage } from "~/types/types";
import { getEvents, type DashboardEventsQuery } from "../requests/get-events";

export function useEvents(query: DashboardEventsQuery = {}) {
  return useQuery<ApiCollectionResponse<DashboardEvent>, TErrorMessage>({
    queryKey: ["dashboard-events", query],
    queryFn: () => getEvents(query),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
