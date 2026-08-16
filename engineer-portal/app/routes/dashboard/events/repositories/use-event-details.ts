import { useQuery } from "@tanstack/react-query";
import { getEventDetails } from "../requests/get-event-details";

export function useEventDetails(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-details", eventId],
    queryFn: () => getEventDetails(eventId!),
    enabled: !!eventId,
  });
}
