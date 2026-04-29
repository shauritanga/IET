import { getEvents } from "~/routes/dashboard/events/requests/get-events";

export async function getUpcomingEvents() {
    const today = new Date().toISOString().slice(0, 10);
    return getEvents({ limit: 4, fromDate: today });
}
