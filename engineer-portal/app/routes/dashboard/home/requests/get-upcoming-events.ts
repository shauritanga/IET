import http from "~/utils/http";
import type {ApiCollectionResponse, DashboardEvent} from "../type";

export async function getUpcomingEvents() {
    const today = new Date().toISOString().slice(0, 10);
    const response = await http.get<ApiCollectionResponse<DashboardEvent>>(
        `/events?limit=2&fromDate=${today}`,
    );
    return response.data;
}
