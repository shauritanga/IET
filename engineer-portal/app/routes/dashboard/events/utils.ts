import type { DashboardEvent } from "../home/type";

export type PortalEventCard = {
  id: string;
  title: string;
  type: "Conference" | "Training" | "Seminar" | "Workshop" | "CPD" | "Forum";
  date: string;
  dateSort: string;
  location: string;
  mode: "Online" | "In-person";
  price: number;
  free: boolean;
  color: string;
  desc: string;
  guest: string | null;
  venue: string;
  start: string;
  end: string | null;
  region: string;
  highlights: string[];
  speaker: string | null;
  registeredCount?: number;
  availableSlots?: number | null;
  isFull?: boolean;
  isRegistered?: boolean;
};

export type CalendarPortalEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color?: "default" | "blue" | "green" | "pink" | "purple";
};

const CATEGORY_LABELS: Record<string, PortalEventCard["type"]> = {
  CONFERENCE: "Conference",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  CPD_COURSE: "CPD",
  ONLINE_SEMINAR: "Training",
  AGM: "Forum",
  NETWORKING: "Forum",
};

const CATEGORY_COLORS: Record<string, string> = {
  CONFERENCE: "linear-gradient(135deg,#390909,#6B1A1A)",
  WORKSHOP: "linear-gradient(135deg,#7B1010,#C62828)",
  SEMINAR: "linear-gradient(135deg,#5D4037,#795548)",
  CPD_COURSE: "linear-gradient(135deg,#4527A0,#512DA8)",
  ONLINE_SEMINAR: "linear-gradient(135deg,#1565C0,#1976D2)",
  AGM: "linear-gradient(135deg,#BF360C,#D84315)",
  NETWORKING: "linear-gradient(135deg,#1B5E20,#2E7D32)",
};

const CALENDAR_COLORS: Record<string, "default" | "blue" | "green" | "pink" | "purple"> = {
  CONFERENCE: "pink",
  WORKSHOP: "blue",
  SEMINAR: "green",
  CPD_COURSE: "purple",
  ONLINE_SEMINAR: "blue",
  AGM: "default",
  NETWORKING: "green",
};

function formatDateLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatTimeLabel(value: string) {
  const [hoursRaw, minutesRaw] = value.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw ?? "0");
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;

  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function eventDateRange(startDate: string, startTime: string, endTime: string) {
  return `${formatDateLabel(startDate)} | ${formatTimeLabel(startTime)} - ${formatTimeLabel(endTime)}`;
}

function eventLocation(event: DashboardEvent) {
  return event.location || (event.isOnline ? "Online" : "—");
}

export function mapDashboardEventToCard(event: DashboardEvent): PortalEventCard {
  const type = CATEGORY_LABELS[event.category] ?? "Conference";
  const price = event.registrationFee ?? 0;
  const free = price === 0;

  return {
    id: event.id,
    title: event.title,
    type,
    date: formatDateLabel(event.startDate),
    dateSort: event.startDate,
    location: eventLocation(event),
    mode: event.isOnline ? "Online" : "In-person",
    price,
    free,
    color: CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.CONFERENCE,
    desc: event.description || `${event.title} hosted by IET Tanzania.`,
    guest: event.guestOfHonor ?? null,
    venue: event.location || (event.isOnline ? "Online" : "—"),
    start: eventDateRange(event.startDate, event.startTime, event.endTime),
    end: event.endDate ? eventDateRange(event.endDate, event.startTime, event.endTime) : null,
    region: event.isOnline ? "Online" : event.location || "—",
    highlights: event.speaker ? [event.speaker] : [],
    speaker: event.speaker ?? null,
    registeredCount: event.registeredCount,
    availableSlots: event.availableSlots ?? null,
    isFull: event.isFull,
    isRegistered: event.isRegistered,
  };
}

export function mapDashboardEventToCalendar(event: DashboardEvent): CalendarPortalEvent {
  const start = new Date(`${event.startDate}T${event.startTime}:00`);
  const end = new Date(`${event.endDate ?? event.startDate}T${event.endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const fallbackStart = new Date();
    return {
      id: event.id,
      start: fallbackStart,
      end: new Date(fallbackStart.getTime() + 60 * 60 * 1000),
      title: event.title,
      color: CALENDAR_COLORS[event.category] ?? "default",
    };
  }

  return {
    id: event.id,
    start,
    end: end > start ? end : new Date(start.getTime() + 60 * 60 * 1000),
    title: event.title,
    color: CALENDAR_COLORS[event.category] ?? "default",
  };
}

export function getEventFilterLabel(category?: string) {
  return category ? CATEGORY_LABELS[category] ?? category : "";
}

export function formatEventDateRange(startDate: string, startTime: string, endTime: string) {
  return eventDateRange(startDate, startTime, endTime);
}

