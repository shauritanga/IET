import http from "~/utils/http";
import type { ApiCollectionResponse } from "~/routes/dashboard/home/type";
import type { DashboardEvent } from "~/routes/dashboard/home/type";

export type DashboardEventsQuery = {
  limit?: number;
  fromDate?: string;
  toDate?: string;
  category?: string;
  location?: string;
  search?: string;
};

export async function getEvents(
  query: DashboardEventsQuery = {},
): Promise<ApiCollectionResponse<DashboardEvent>> {
  const response = await http.get<ApiCollectionResponse<DashboardEvent>>("/events", {
    params: query,
  });

  return response.data;
}
