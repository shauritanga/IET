import type { AxiosError } from "axios";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Button, Modal, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import type { AdminEvent, AdminEventPayload, ApiEnvelope, EventAttendeesResponse, EventCategory } from "~/types";

// ── Types ──────────────────────────────────────────────────────────

type EventFormState = {
  title: string;
  category: EventCategory;
  mode: "In-person" | "Online" | "Hybrid";
  startDateTime: string;
  endDateTime: string;
  location: string;
  onlineUrl: string;
  registrationDeadline: string;
  capacity: string;
  fee: string;
  cpdHours: string;
  registrationOpen: boolean;
  description: string;
  coverImage: string;
  guestOfHonor: string;
  speakers: Array<{
    name: string;
    title: string;
    bio: string;
    photo: string;
  }>;
  agenda: Array<{
    time: string;
    title: string;
    description: string;
  }>;
  requirements: string[];
  organizer: {
    name: string;
    contact: string;
    phone: string;
  };
  images: string[];
};

type AttendeesView = {
  event: AdminEvent;
  data: EventAttendeesResponse | null;
  loading: boolean;
  error: string | null;
};

// ── Constants ──────────────────────────────────────────────────────

const MODE_OPTIONS = ["In-person", "Online", "Hybrid"] as const;
const EVENT_FORM_STEPS = ["Basics", "Schedule & Access", "Registration", "Program & Contacts"] as const;

const CATEGORY_OPTIONS: Array<{ value: EventCategory; label: string }> = [
  { value: "CONFERENCE", label: "Conference" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "CPD_COURSE", label: "CPD Course" },
  { value: "ONLINE_SEMINAR", label: "Online Seminar" },
  { value: "AGM", label: "AGM" },
  { value: "NETWORKING", label: "Networking" },
];

const CATEGORY_LABELS: Record<EventCategory, string> = CATEGORY_OPTIONS.reduce(
  (acc, option) => { acc[option.value] = option.label; return acc; },
  {} as Record<EventCategory, string>,
);

// ── Form Helpers ───────────────────────────────────────────────────

function FormLabel({ children }: { children: string }) {
  return (
    <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
      {children}
    </label>
  );
}

function FormInput({ type = "text", placeholder, value, onChange }: {
  type?: string; placeholder?: string; value: string; onChange: (value: string) => void;
}) {
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    />
  );
}

function FormTextarea({ placeholder, value, onChange, rows = 3 }: {
  placeholder?: string; value: string; onChange: (value: string) => void; rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-y rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    />
  );
}

function FormSelect({ options, value, onChange }: {
  options: Array<{ value: string; label: string }>; value: string; onChange: (value: string) => void;
}) {
  return (
    <select
      value={value} onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

// ── Event Utilities ────────────────────────────────────────────────

function emptyFormState(): EventFormState {
  return {
    title: "",
    category: "CONFERENCE",
    mode: "In-person",
    startDateTime: "",
    endDateTime: "",
    location: "",
    onlineUrl: "",
    registrationDeadline: "",
    capacity: "",
    fee: "",
    cpdHours: "",
    registrationOpen: true,
    description: "",
    coverImage: "",
    guestOfHonor: "",
    speakers: [],
    agenda: [],
    requirements: [],
    organizer: { name: "", contact: "", phone: "" },
    images: [],
  };
}

function splitDateTimeLocal(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

function combineDateTimeLocal(dateValue?: string | null, timeValue?: string | null) {
  if (!dateValue || !timeValue) return "";
  return `${String(dateValue).split("T")[0]}T${timeValue.slice(0, 5)}`;
}

function dateOnly(value?: string | null) {
  if (!value) return "";
  return String(value).split("T")[0];
}

function formatDateForTable(value: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function formatMoney(value: number) {
  if (!value) return "Free";
  return `TZS ${new Intl.NumberFormat("en-US").format(value)}`;
}

function modeForEvent(event: AdminEvent): EventFormState["mode"] {
  if (!event.isOnline) return "In-person";
  return event.location ? "Hybrid" : "Online";
}

function toFormState(event: AdminEvent): EventFormState {
  return {
    title: event.title, category: event.category, mode: modeForEvent(event),
    startDateTime: combineDateTimeLocal(event.startDate, event.startTime),
    endDateTime: combineDateTimeLocal(event.endDate ?? event.startDate, event.endTime),
    location: event.location ?? "", onlineUrl: event.onlineUrl ?? "",
    registrationDeadline: dateOnly(event.registrationDeadline), capacity: event.maxParticipants?.toString() ?? "",
    fee: event.registrationFee.toString(), cpdHours: event.cpdPoints.toString(),
    registrationOpen: event.registrationOpen,
    description: event.description ?? "", coverImage: event.coverImage ?? "",
    guestOfHonor: event.guestOfHonor ?? "",
    speakers: (event.speakers ?? []).map((speaker) => ({
      name: speaker.name ?? "",
      title: speaker.title ?? "",
      bio: speaker.bio ?? "",
      photo: speaker.photo ?? "",
    })),
    agenda: (event.agenda ?? []).map((item) => ({
      time: item.time ?? "",
      title: item.title ?? "",
      description: item.description ?? "",
    })),
    requirements: event.requirements ?? [],
    organizer: {
      name: event.organizer?.name ?? "",
      contact: event.organizer?.contact ?? "",
      phone: event.organizer?.phone ?? "",
    },
    images: event.images ?? [],
  };
}

function validateForm(formState: EventFormState) {
  if (!formState.title.trim()) return "Event title is required.";
  if (!formState.category) return "Event category is required.";
  if (!formState.startDateTime) return "Start date and time are required.";
  if (!formState.location.trim()) return "Venue / location is required.";
  if (!formState.capacity.trim()) return "Capacity is required.";
  const capacity = Number(formState.capacity);
  const fee = formState.fee.trim() ? Number(formState.fee) : 0;
  const cpdHours = formState.cpdHours.trim() ? Number(formState.cpdHours) : 0;
  if (Number.isNaN(capacity) || capacity < 1) return "Capacity must be a valid number.";
  if (Number.isNaN(fee) || fee < 0) return "Fee must be zero or a valid positive number.";
  if (Number.isNaN(cpdHours) || cpdHours < 0) return "CPD hours must be zero or a valid positive number.";
  return null;
}

function validateStep(formState: EventFormState, step: number) {
  if (step === 0) {
    if (!formState.title.trim()) return "Event title is required.";
    if (!formState.category) return "Event category is required.";
  }
  if (step === 1) {
    if (!formState.startDateTime) return "Start date and time are required.";
    if (!formState.location.trim()) return "Venue / location is required.";
  }
  if (step === 2) {
    if (!formState.capacity.trim()) return "Capacity is required.";
    const capacity = Number(formState.capacity);
    const fee = formState.fee.trim() ? Number(formState.fee) : 0;
    const cpdHours = formState.cpdHours.trim() ? Number(formState.cpdHours) : 0;
    if (Number.isNaN(capacity) || capacity < 1) return "Capacity must be a valid number.";
    if (Number.isNaN(fee) || fee < 0) return "Fee must be zero or a valid positive number.";
    if (Number.isNaN(cpdHours) || cpdHours < 0) return "CPD hours must be zero or a valid positive number.";
  }
  return null;
}

function toPayload(formState: EventFormState, publish: boolean): AdminEventPayload {
  const start = splitDateTimeLocal(formState.startDateTime);
  const end = splitDateTimeLocal(formState.endDateTime || formState.startDateTime);
  const speakers = formState.speakers
    .map((speaker) => ({
      name: speaker.name.trim(),
      title: speaker.title.trim() || undefined,
      bio: speaker.bio.trim() || undefined,
      photo: speaker.photo.trim() || undefined,
    }))
    .filter((speaker) => speaker.name);
  const agenda = formState.agenda
    .map((item) => ({
      time: item.time.trim(),
      title: item.title.trim(),
      description: item.description.trim() || undefined,
    }))
    .filter((item) => item.time && item.title);
  const requirements = formState.requirements.map((item) => item.trim()).filter(Boolean);
  const images = formState.images.map((item) => item.trim()).filter(Boolean);
  const organizer = {
    name: formState.organizer.name.trim() || undefined,
    contact: formState.organizer.contact.trim() || undefined,
    phone: formState.organizer.phone.trim() || undefined,
  };
  return {
    title: formState.title.trim(), description: formState.description.trim() || undefined,
    category: formState.category, startDate: start.date, startTime: start.time,
    endDate: end.date, endTime: end.time, location: formState.location.trim(),
    isOnline: formState.mode !== "In-person",
    onlineUrl: formState.mode !== "In-person" ? formState.onlineUrl.trim() || undefined : undefined,
    registrationDeadline: formState.registrationDeadline || undefined,
    registrationFee: formState.fee.trim() ? Number(formState.fee) : 0,
    cpdPoints: formState.cpdHours.trim() ? Number(formState.cpdHours) : 0,
    maxParticipants: Number(formState.capacity), isPublished: publish,
    registrationOpen: formState.registrationOpen,
    guestOfHonor: formState.guestOfHonor.trim() || undefined,
    speakers,
    agenda,
    requirements,
    organizer,
    coverImage: formState.coverImage || undefined,
    images,
  };
}

function eventLocationLabel(event: AdminEvent) {
  if (!event.isOnline) return event.location || "—";
  if (!event.location) return "Online";
  return `${event.location} · Online`;
}

function eventRegistrationsLabel(event: AdminEvent) {
  const capacity = event.maxParticipants ? event.maxParticipants.toString() : "Unlimited";
  return `${event.registeredCount} / ${capacity}`;
}

// ── Row Action Menu ────────────────────────────────────────────────

const ROW_MENU_WIDTH = 150;
const ROW_MENU_ESTIMATED_HEIGHT = 82;
const ROW_MENU_GAP = 6;
const ROW_MENU_VIEWPORT_PADDING = 8;

function RowMenu({ onAttendees, onEdit }: { onAttendees: () => void; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < ROW_MENU_ESTIMATED_HEIGHT + ROW_MENU_GAP;
      const top = openUp
        ? Math.max(ROW_MENU_VIEWPORT_PADDING, rect.top - ROW_MENU_ESTIMATED_HEIGHT - ROW_MENU_GAP)
        : rect.bottom + ROW_MENU_GAP;
      const left = Math.max(
        ROW_MENU_VIEWPORT_PADDING,
        Math.min(window.innerWidth - ROW_MENU_WIDTH - ROW_MENU_VIEWPORT_PADDING, rect.right - ROW_MENU_WIDTH),
      );
      setMenuPosition({ top, left });
    }
    setOpen((current) => {
      const next = !current;
      if (!next) setMenuPosition(null);
      return next;
    });
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-[1.5px] border-[var(--border)] bg-white text-[var(--muted)] transition-colors duration-150 hover:border-[var(--red-dark)] hover:text-[var(--red-dark)]"
        style={{ background: open ? "var(--bg)" : undefined }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          style={{ top: menuPosition?.top ?? 0, left: menuPosition?.left ?? 0 }}
          className="fixed z-[200] w-[150px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-white shadow-[0_8px_24px_rgba(0,0,0,.12)]"
        >
          <button
            type="button"
            onClick={() => { setOpen(false); onAttendees(); }}
            className="flex w-full items-center gap-[9px] px-[14px] py-[9px] text-left text-[12.5px] font-semibold text-[var(--text)] hover:bg-[var(--bg)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Attendees
          </button>
          <div className="mx-[10px] h-px bg-[var(--border)]" />
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-[9px] px-[14px] py-[9px] text-left text-[12.5px] font-semibold text-[var(--text)] hover:bg-[var(--bg)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ── Attendees Full Page ────────────────────────────────────────────

function AttendeesPage({ view, onBack }: { view: AttendeesView; onBack: () => void }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Breadcrumb */}
      <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red-dark)", fontWeight: 700, fontSize: 12, padding: 0, display: "flex", alignItems: "center", gap: 5 }}
          onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Events
        </button>
        <span style={{ color: "var(--border)" }}>/</span>
        <span style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600, color: "var(--text)" }}>
          {view.event.title}
        </span>
        <span style={{ color: "var(--border)" }}>/</span>
        <span style={{ fontWeight: 600, color: "var(--muted)" }}>Attendees</span>
      </nav>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Attendees</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {view.event.title} · {formatDateForTable(view.event.startDate)}
          </p>
        </div>
        {view.data && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--red-dark)", background: "var(--red-pale)", borderRadius: 8, padding: "5px 12px" }}>
            {view.data.total} registered
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {view.loading ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading attendees…</p>
          </div>
        ) : view.error ? (
          <div style={{ padding: "24px", background: "var(--red-pale)", borderRadius: 10, margin: 16, border: "1px solid #f0b0b0" }}>
            <p style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>{view.error}</p>
          </div>
        ) : !view.data || view.data.attendees.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No registrations yet</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>Attendees will appear here once registrations come in.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Ticket #</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Paid</th>
                  <th>Checked In</th>
                </tr>
              </thead>
              <tbody>
                {view.data.attendees.map((a) => (
                  <tr key={a.id}>
                    <td className="text-[12px] font-semibold">{a.fullName}</td>
                    <td className="font-mono text-[11.5px]">{a.ticketNumber}</td>
                    <td className="text-[11.5px]">{a.email}</td>
                    <td className="text-[11.5px]">{a.attendeeType}</td>
                    <td>
                      <StatusBadge tone={a.status === "CONFIRMED" ? "approved" : "pending"}>
                        {a.status}
                      </StatusBadge>
                    </td>
                    <td className="text-[11.5px]">{formatMoney(a.amountPaid)}</td>
                    <td>
                      {a.checkedIn
                        ? <StatusBadge tone="approved">Yes</StatusBadge>
                        : <StatusBadge tone="pending">No</StatusBadge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function EventsAndTrainingPage() {
  const [eventRows, setEventRows] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formState, setFormState] = useState<EventFormState>(emptyFormState());
  const [formStep, setFormStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [attendeesView, setAttendeesView] = useState<AttendeesView | null>(null);

  const isEditing = editingEventId !== null;
  const editingEvent = eventRows.find((event) => event.id === editingEventId) ?? null;

  async function loadEvents() {
    setLoading(true);
    setPageError(null);
    try {
      const { data } = await http.get<ApiEnvelope<AdminEvent[]>>("/admin/events");
      setEventRows(data.data ?? []);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setPageError(apiError.response?.data?.message ?? "Failed to load events.");
      setEventRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadEvents(); }, []);

  async function openAttendeesPage(event: AdminEvent) {
    const view: AttendeesView = { event, data: null, loading: true, error: null };
    setAttendeesView(view);
    try {
      const { data } = await http.get<ApiEnvelope<EventAttendeesResponse>>(
        `/admin/events/${event.id}/registrations`,
      );
      setAttendeesView((v) => v ? { ...v, data: data.data, loading: false } : v);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setAttendeesView((v) => v ? { ...v, error: apiError.response?.data?.message ?? "Failed to load attendees.", loading: false } : v);
    }
  }

  function updateField<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function updateOrganizerField(key: keyof EventFormState["organizer"], value: string) {
    setFormState((current) => ({
      ...current,
      organizer: { ...current.organizer, [key]: value },
    }));
  }

  function updateSpeaker(index: number, key: keyof EventFormState["speakers"][number], value: string) {
    setFormState((current) => ({
      ...current,
      speakers: current.speakers.map((speaker, speakerIndex) =>
        speakerIndex === index ? { ...speaker, [key]: value } : speaker,
      ),
    }));
  }

  function updateAgendaItem(index: number, key: keyof EventFormState["agenda"][number], value: string) {
    setFormState((current) => ({
      ...current,
      agenda: current.agenda.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function updateListItem(key: "requirements" | "images", index: number, value: string) {
    setFormState((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  }

  function removeListItem(key: "requirements" | "images", index: number) {
    setFormState((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function openCreateModal() {
    setEditingEventId(null);
    setFormState(emptyFormState());
    setFormStep(0);
    setFormError(null);
    setIsEventModalOpen(true);
  }

  function openEditModal(event: AdminEvent) {
    setEditingEventId(event.id);
    setFormState(toFormState(event));
    setFormStep(0);
    setFormError(null);
    setIsEventModalOpen(true);
  }

  async function handleCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await http.post<ApiEnvelope<{ url: string }>>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateField("coverImage", data.data.url);
    } catch {
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  function closeModal() {
    if (isSubmitting) return;
    setIsEventModalOpen(false);
    setFormError(null);
  }

  function goToNextStep() {
    const validationError = validateStep(formState, formStep);
    if (validationError) { setFormError(validationError); return; }
    setFormError(null);
    setFormStep((current) => Math.min(EVENT_FORM_STEPS.length - 1, current + 1));
  }

  function goToPreviousStep() {
    setFormError(null);
    setFormStep((current) => Math.max(0, current - 1));
  }

  async function saveEvent(publish: boolean) {
    const validationError = validateForm(formState);
    if (validationError) { setFormError(validationError); return; }
    setIsSubmitting(true);
    setFormError(null);
    const payload = toPayload(formState, publish);
    try {
      if (isEditing && editingEvent) {
        await http.patch<ApiEnvelope<AdminEvent>>(`/admin/events/${editingEvent.id}`, payload);
      } else {
        await http.post<ApiEnvelope<AdminEvent>>("/admin/events", payload);
      }
      await loadEvents();
      setIsEventModalOpen(false);
      setEditingEventId(null);
      setFormState(emptyFormState());
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setFormError(apiError.response?.data?.message ?? "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show attendees full page when selected
  if (attendeesView) {
    return <AttendeesPage view={attendeesView} onBack={() => setAttendeesView(null)} />;
  }

  const isFinalStep = formStep === EVENT_FORM_STEPS.length - 1;

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Events Management</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Create and manage IET Tanzania events, trainings and conferences
          </p>
        </div>
        <Button tone="red" onClick={openCreateModal}>+ Create Event</Button>
      </div>

      {pageError ? (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          <div className="flex items-center justify-between gap-3">
            <span>{pageError}</span>
            <Button tone="outline" onClick={() => void loadEvents()}>Retry</Button>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading events...</div>
          ) : (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Registrations</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventRows.map((event) => (
                  <tr key={event.id}>
                    <td className="text-[12px] font-semibold">{event.title}</td>
                    <td className="text-[11.5px]">{CATEGORY_LABELS[event.category] ?? event.category}</td>
                    <td className="text-[11.5px]">
                      <div>{formatDateForTable(event.startDate)}</div>
                      <div className="text-[10px] text-[var(--muted)]">{event.startTime} - {event.endTime}</div>
                    </td>
                    <td className="text-[11.5px]">{eventLocationLabel(event)}</td>
                    <td className="text-[11.5px]">{eventRegistrationsLabel(event)}</td>
                    <td className="text-[11.5px]">{formatMoney(event.registrationFee)}</td>
                    <td>
                      <StatusBadge tone={event.isPublished ? "approved" : "pending"}>
                        {event.isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                    </td>
                    <td>
                      <RowMenu
                        onAttendees={() => void openAttendeesPage(event)}
                        onEdit={() => openEditModal(event)}
                      />
                    </td>
                  </tr>
                ))}
                {!eventRows.length ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-[12px] text-[var(--muted)]" colSpan={8}>
                      No events found yet. Create the first event to get started.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <Modal
        title={isEditing ? "Edit Event" : "Create New Event"}
        open={isEventModalOpen}
        onClose={closeModal}
        bodyClassName="space-y-[14px]"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-[9px]">
            <Button tone="outline" onClick={formStep === 0 ? closeModal : goToPreviousStep} disabled={isSubmitting}>
              {formStep === 0 ? "Cancel" : "Back"}
            </Button>
            {isFinalStep ? (
              <div className="flex flex-wrap justify-end gap-[9px]">
                <Button tone="dark" onClick={() => void saveEvent(false)} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save as Draft"}
                </Button>
                <Button tone="red" onClick={() => void saveEvent(isEditing ? (editingEvent?.isPublished ?? true) : true)} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create & Publish"}
                </Button>
              </div>
            ) : (
              <Button tone="red" onClick={goToNextStep} disabled={isSubmitting}>Next</Button>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {EVENT_FORM_STEPS.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => {
                if (index <= formStep) {
                  setFormStep(index);
                  setFormError(null);
                }
              }}
              className={`rounded-[10px] border px-3 py-2 text-left transition-colors ${
                index === formStep
                  ? "border-[var(--red)] bg-[var(--red-pale)] text-[var(--red-dark)]"
                  : index < formStep
                    ? "border-[var(--border)] bg-white text-[var(--red-dark)]"
                    : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
              }`}
            >
              <span className="block text-[10px] font-extrabold">Step {index + 1}</span>
              <span className="block text-[11px] font-semibold">{step}</span>
            </button>
          ))}
        </div>

        {formError ? (
          <div className="rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {formError}
          </div>
        ) : null}

        {formStep === 0 ? (
          <div className="space-y-[14px]">
            <div>
              <FormLabel>Event Title *</FormLabel>
              <FormInput placeholder="e.g. IET Annual Engineering Conference 2025" value={formState.title} onChange={(value) => updateField("title", value)} />
            </div>
            <div className="grid gap-[14px] md:grid-cols-2">
              <div>
                <FormLabel>Event Category *</FormLabel>
                <FormSelect options={CATEGORY_OPTIONS} value={formState.category} onChange={(value) => updateField("category", value as EventCategory)} />
              </div>
              <div>
                <FormLabel>Mode *</FormLabel>
                <FormSelect options={MODE_OPTIONS.map((value) => ({ value, label: value }))} value={formState.mode} onChange={(value) => updateField("mode", value as EventFormState["mode"])} />
              </div>
            </div>
            <div>
              <FormLabel>Cover Image</FormLabel>
              {formState.coverImage ? (
                <div className="relative overflow-hidden rounded-[7px] border-[1.5px] border-[var(--border)]">
                  <img src={formState.coverImage} alt="Cover" className="h-[140px] w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateField("coverImage", "")}
                    className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-[2px] text-[10px] font-semibold text-white hover:bg-black/70"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className={`flex h-[80px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[7px] border-[1.5px] border-dashed border-[var(--border)] bg-[var(--bg)] transition-colors hover:border-[var(--red-dark)] hover:bg-[var(--red-pale)] ${isUploadingImage ? "opacity-60 pointer-events-none" : ""}`}>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">{isUploadingImage ? "Uploading..." : "Click to upload cover image"}</span>
                  <span className="text-[10px] text-[var(--muted)]">JPG, PNG or WEBP · max 10 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isUploadingImage} onChange={(e) => void handleCoverImageChange(e)} />
                </label>
              )}
            </div>
            <div>
              <FormLabel>Description</FormLabel>
              <FormTextarea rows={4} placeholder="What members should know about this event..." value={formState.description} onChange={(value) => updateField("description", value)} />
            </div>
          </div>
        ) : null}

        {formStep === 1 ? (
          <div className="space-y-[14px]">
            <div className="grid gap-[14px] md:grid-cols-2">
              <div>
                <FormLabel>Start Date &amp; Time *</FormLabel>
                <FormInput type="datetime-local" value={formState.startDateTime} onChange={(value) => updateField("startDateTime", value)} />
              </div>
              <div>
                <FormLabel>End Date &amp; Time</FormLabel>
                <FormInput type="datetime-local" value={formState.endDateTime} onChange={(value) => updateField("endDateTime", value)} />
              </div>
            </div>
            <div>
              <FormLabel>Venue / Location *</FormLabel>
              <FormInput placeholder={formState.mode === "In-person" ? "Venue name and address" : "Online, venue, or hybrid location"} value={formState.location} onChange={(value) => updateField("location", value)} />
            </div>
            {formState.mode !== "In-person" ? (
              <div>
                <FormLabel>Online Meeting URL</FormLabel>
                <FormInput placeholder="https://zoom.us/j/..." value={formState.onlineUrl} onChange={(value) => updateField("onlineUrl", value)} />
              </div>
            ) : null}
            <div>
              <FormLabel>Registration Deadline</FormLabel>
              <FormInput type="date" value={formState.registrationDeadline} onChange={(value) => updateField("registrationDeadline", value)} />
            </div>
          </div>
        ) : null}

        {formStep === 2 ? (
          <div className="space-y-[14px]">
            <div className="grid gap-[14px] md:grid-cols-3">
              <div>
                <FormLabel>Capacity *</FormLabel>
                <FormInput type="number" placeholder="e.g. 200" value={formState.capacity} onChange={(value) => updateField("capacity", value)} />
              </div>
              <div>
                <FormLabel>Fee (TZS)</FormLabel>
                <FormInput type="number" placeholder="0 for free" value={formState.fee} onChange={(value) => updateField("fee", value)} />
              </div>
              <div>
                <FormLabel>CPD Hours</FormLabel>
                <FormInput type="number" placeholder="e.g. 6" value={formState.cpdHours} onChange={(value) => updateField("cpdHours", value)} />
              </div>
            </div>
            <label className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
              <span>
                <span className="block text-[12px] font-bold text-[var(--red-dark)]">Registration Open</span>
                <span className="block text-[10.5px] text-[var(--muted)]">Members can register while this is enabled.</span>
              </span>
              <input
                type="checkbox"
                checked={formState.registrationOpen}
                onChange={(event) => updateField("registrationOpen", event.target.checked)}
                className="h-4 w-4 accent-[var(--red)]"
              />
            </label>
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-[var(--red-dark)]">Attendee Requirements</p>
                  <p className="text-[10.5px] text-[var(--muted)]">Add anything members should prepare before attending.</p>
                </div>
                <Button type="button" tone="outline" onClick={() => updateField("requirements", [...formState.requirements, ""])}>Add</Button>
              </div>
              <div className="space-y-2">
                {formState.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <FormInput placeholder="e.g. Bring laptop" value={requirement} onChange={(value) => updateListItem("requirements", index, value)} />
                    <Button type="button" tone="outline" onClick={() => removeListItem("requirements", index)}>Remove</Button>
                  </div>
                ))}
                {!formState.requirements.length ? <p className="text-[11px] text-[var(--muted)]">No requirements added.</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        {formStep === 3 ? (
          <div className="space-y-[14px]">
            <div>
              <FormLabel>Guest of Honor</FormLabel>
              <FormInput placeholder="e.g. Eng. Emmanuel Ole Kambainei" value={formState.guestOfHonor} onChange={(value) => updateField("guestOfHonor", value)} />
            </div>
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-[var(--red-dark)]">Speakers</p>
                  <p className="text-[10.5px] text-[var(--muted)]">Add presenter details shown to members.</p>
                </div>
                <Button type="button" tone="outline" onClick={() => updateField("speakers", [...formState.speakers, { name: "", title: "", bio: "", photo: "" }])}>Add</Button>
              </div>
              <div className="space-y-3">
                {formState.speakers.map((speaker, index) => (
                  <div key={index} className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11.5px] font-bold text-[var(--red-dark)]">Speaker {index + 1}</span>
                      <Button type="button" tone="outline" onClick={() => updateField("speakers", formState.speakers.filter((_, speakerIndex) => speakerIndex !== index))}>Remove</Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <FormInput placeholder="Name" value={speaker.name} onChange={(value) => updateSpeaker(index, "name", value)} />
                      <FormInput placeholder="Title" value={speaker.title} onChange={(value) => updateSpeaker(index, "title", value)} />
                      <FormInput placeholder="Photo URL" value={speaker.photo} onChange={(value) => updateSpeaker(index, "photo", value)} />
                      <FormTextarea rows={2} placeholder="Short bio" value={speaker.bio} onChange={(value) => updateSpeaker(index, "bio", value)} />
                    </div>
                  </div>
                ))}
                {!formState.speakers.length ? <p className="text-[11px] text-[var(--muted)]">No speakers added.</p> : null}
              </div>
            </div>
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-[var(--red-dark)]">Agenda</p>
                  <p className="text-[10.5px] text-[var(--muted)]">Outline the event flow for members.</p>
                </div>
                <Button type="button" tone="outline" onClick={() => updateField("agenda", [...formState.agenda, { time: "", title: "", description: "" }])}>Add</Button>
              </div>
              <div className="space-y-3">
                {formState.agenda.map((item, index) => (
                  <div key={index} className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11.5px] font-bold text-[var(--red-dark)]">Agenda item {index + 1}</span>
                      <Button type="button" tone="outline" onClick={() => updateField("agenda", formState.agenda.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <FormInput placeholder="Time, e.g. 08:00 - 09:00" value={item.time} onChange={(value) => updateAgendaItem(index, "time", value)} />
                      <FormInput placeholder="Title" value={item.title} onChange={(value) => updateAgendaItem(index, "title", value)} />
                      <div className="md:col-span-2">
                        <FormTextarea rows={2} placeholder="Description" value={item.description} onChange={(value) => updateAgendaItem(index, "description", value)} />
                      </div>
                    </div>
                  </div>
                ))}
                {!formState.agenda.length ? <p className="text-[11px] text-[var(--muted)]">No agenda items added.</p> : null}
              </div>
            </div>
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-3">
              <p className="mb-3 text-[12px] font-bold text-[var(--red-dark)]">Organizer Contact</p>
              <div className="grid gap-2 md:grid-cols-3">
                <FormInput placeholder="Organizer name" value={formState.organizer.name} onChange={(value) => updateOrganizerField("name", value)} />
                <FormInput placeholder="Email or contact" value={formState.organizer.contact} onChange={(value) => updateOrganizerField("contact", value)} />
                <FormInput placeholder="Phone" value={formState.organizer.phone} onChange={(value) => updateOrganizerField("phone", value)} />
              </div>
            </div>
            <div className="rounded-[12px] border border-[var(--border)] bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-bold text-[var(--red-dark)]">Additional Images</p>
                  <p className="text-[10.5px] text-[var(--muted)]">Optional image URLs for galleries or detail pages.</p>
                </div>
                <Button type="button" tone="outline" onClick={() => updateField("images", [...formState.images, ""])}>Add</Button>
              </div>
              <div className="space-y-2">
                {formState.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <FormInput placeholder="https://..." value={image} onChange={(value) => updateListItem("images", index, value)} />
                    <Button type="button" tone="outline" onClick={() => removeListItem("images", index)}>Remove</Button>
                  </div>
                ))}
                {!formState.images.length ? <p className="text-[11px] text-[var(--muted)]">No additional images added.</p> : null}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
