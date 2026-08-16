import http from "~/utils/http";

export type EventSpeaker = {
  name: string;
  title?: string;
  bio?: string;
  photo?: string;
};

export type EventAgendaItem = {
  time: string;
  title: string;
  description?: string;
};

export type EventOrganizer = {
  name?: string;
  contact?: string;
  phone?: string;
};

export type EventDetails = {
  id: string;
  title: string;
  slug?: string;
  category: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  isOnline: boolean;
  onlineUrl?: string | null;
  guestOfHonor?: string | null;
  speakers?: EventSpeaker[];
  agenda?: EventAgendaItem[];
  agendaPdf?: string | null;
  coverImage?: string | null;
  images?: string[];
  registrationDeadline?: string | null;
  registrationFee: number;
  feePricingMode?: "FLAT" | "DIFFERENT";
  memberRegistrationFee?: number | null;
  nonMemberRegistrationFee?: number;
  cpdPoints: number;
  maxParticipants?: number | null;
  requirements?: string[];
  organizer?: EventOrganizer;
  isPublished: boolean;
  registrationOpen: boolean;
  registeredCount?: number;
  isFull?: boolean;
  isRegistered?: boolean;
};

export async function getEventDetails(
  eventId: string,
): Promise<{ data: EventDetails }> {
  const response = await http.get<{ data: EventDetails }>(`/events/${eventId}`);
  return response.data;
}
