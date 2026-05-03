import type { AxiosError } from "axios";
import { type ChangeEvent, useEffect, useState } from "react";
import { Button, Modal, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import type { AdminEvent, AdminEventPayload, ApiEnvelope, EventAttendeesResponse, EventCategory } from "~/types";

type EventFormState = {
  title: string;
  category: EventCategory;
  mode: "In-person" | "Online" | "Hybrid";
  startDateTime: string;
  endDateTime: string;
  location: string;
  capacity: string;
  fee: string;
  cpdHours: string;
  description: string;
  coverImage: string;
};

const MODE_OPTIONS = ["In-person", "Online", "Hybrid"] as const;

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
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<EventCategory, string>,
);

function FormLabel({ children }: { children: string }) {
  return (
    <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
      {children}
    </label>
  );
}

function FormInput({
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    />
  );
}

function FormSelect({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function emptyFormState(): EventFormState {
  return {
    title: "",
    category: "CONFERENCE",
    mode: "In-person",
    startDateTime: "",
    endDateTime: "",
    location: "",
    capacity: "",
    fee: "",
    cpdHours: "",
    description: "",
    coverImage: "",
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

function formatDateForTable(value: string) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
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
    title: event.title,
    category: event.category,
    mode: modeForEvent(event),
    startDateTime: combineDateTimeLocal(event.startDate, event.startTime),
    endDateTime: combineDateTimeLocal(event.endDate ?? event.startDate, event.endTime),
    location: event.location ?? "",
    capacity: event.maxParticipants?.toString() ?? "",
    fee: event.registrationFee.toString(),
    cpdHours: event.cpdPoints.toString(),
    description: event.description ?? "",
    coverImage: event.coverImage ?? "",
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

function toPayload(formState: EventFormState, publish: boolean): AdminEventPayload {
  const start = splitDateTimeLocal(formState.startDateTime);
  const end = splitDateTimeLocal(formState.endDateTime || formState.startDateTime);

  return {
    title: formState.title.trim(),
    description: formState.description.trim() || undefined,
    category: formState.category,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    location: formState.location.trim(),
    isOnline: formState.mode !== "In-person",
    registrationFee: formState.fee.trim() ? Number(formState.fee) : 0,
    cpdPoints: formState.cpdHours.trim() ? Number(formState.cpdHours) : 0,
    maxParticipants: Number(formState.capacity),
    isPublished: publish,
    coverImage: formState.coverImage || undefined,
  };
}

function eventLocationLabel(event: AdminEvent) {
  if (!event.isOnline) return event.location || "—";
  if (!event.location) return "Online";
  return `${event.location} · Online`;
}

function eventStatusLabel(event: AdminEvent) {
  return event.isPublished ? "Open" : "Draft";
}

function eventRegistrationsLabel(event: AdminEvent) {
  const capacity = event.maxParticipants ? event.maxParticipants.toString() : "Unlimited";
  return `${event.registeredCount} / ${capacity}`;
}

export default function EventsAndTrainingPage() {
  const [eventRows, setEventRows] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formState, setFormState] = useState<EventFormState>(emptyFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [attendeesData, setAttendeesData] = useState<EventAttendeesResponse | null>(null);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState<string | null>(null);

  const isEditing = editingEventId !== null;
  const editingEvent = eventRows.find((event) => event.id === editingEventId) ?? null;

  async function openAttendeesModal(event: AdminEvent) {
    setAttendeesData(null);
    setAttendeesError(null);
    setAttendeesLoading(true);
    setAttendeesModalOpen(true);

    try {
      const { data } = await http.get<ApiEnvelope<EventAttendeesResponse>>(
        `/admin/events/${event.id}/registrations`,
      );
      setAttendeesData(data.data);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setAttendeesError(apiError.response?.data?.message ?? "Failed to load attendees.");
    } finally {
      setAttendeesLoading(false);
    }
  }

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

  useEffect(() => {
    void loadEvents();
  }, []);

  function updateField<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setEditingEventId(null);
    setFormState(emptyFormState());
    setFormError(null);
    setIsEventModalOpen(true);
  }

  function openEditModal(event: AdminEvent) {
    setEditingEventId(event.id);
    setFormState(toFormState(event));
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

  async function saveEvent(publish: boolean) {
    const validationError = validateForm(formState);
    if (validationError) {
      setFormError(validationError);
      return;
    }

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

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Events Management</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Create and manage IET Tanzania events, trainings and conferences
          </p>
        </div>
        <Button tone="red" onClick={openCreateModal}>
          + Create Event
        </Button>
      </div>

      {pageError ? (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          <div className="flex items-center justify-between gap-3">
            <span>{pageError}</span>
            <Button tone="outline" onClick={() => void loadEvents()}>
              Retry
            </Button>
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
                      <div className="text-[10px] text-[var(--muted)]">
                        {event.startTime} - {event.endTime}
                      </div>
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
                      <div className="flex items-center gap-[6px]">
                        <Button onClick={() => void openAttendeesModal(event)}>Attendees</Button>
                        <Button onClick={() => openEditModal(event)}>Edit</Button>
                      </div>
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
          <div className="flex justify-end gap-[9px]">
            <Button tone="outline" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button tone="dark" onClick={() => void saveEvent(false)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button tone="red" onClick={() => void saveEvent(isEditing ? (editingEvent?.isPublished ?? true) : true)} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create & Publish"}
            </Button>
          </div>
        }
      >
        {formError ? (
          <div className="rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {formError}
          </div>
        ) : null}

        <div>
          <FormLabel>Event Title *</FormLabel>
          <FormInput
            placeholder="e.g. IET Annual Engineering Conference 2025"
            value={formState.title}
            onChange={(value) => updateField("title", value)}
          />
        </div>

        <div className="grid gap-[14px] md:grid-cols-2">
          <div>
            <FormLabel>Event Category *</FormLabel>
            <FormSelect
              options={CATEGORY_OPTIONS}
              value={formState.category}
              onChange={(value) => updateField("category", value as EventCategory)}
            />
          </div>
          <div>
            <FormLabel>Mode *</FormLabel>
            <FormSelect
              options={MODE_OPTIONS.map((value) => ({ value, label: value }))}
              value={formState.mode}
              onChange={(value) => updateField("mode", value as EventFormState["mode"])}
            />
          </div>
        </div>

        <div className="grid gap-[14px] md:grid-cols-2">
          <div>
            <FormLabel>Start Date &amp; Time *</FormLabel>
            <FormInput
              type="datetime-local"
              value={formState.startDateTime}
              onChange={(value) => updateField("startDateTime", value)}
            />
          </div>
          <div>
            <FormLabel>End Date &amp; Time</FormLabel>
            <FormInput
              type="datetime-local"
              value={formState.endDateTime}
              onChange={(value) => updateField("endDateTime", value)}
            />
          </div>
        </div>

        <div className="grid gap-[14px] md:grid-cols-2">
          <div>
            <FormLabel>Venue / Location *</FormLabel>
            <FormInput
              placeholder="Venue name or Online"
              value={formState.location}
              onChange={(value) => updateField("location", value)}
            />
          </div>
          <div>
            <FormLabel>Capacity *</FormLabel>
            <FormInput
              type="number"
              placeholder="e.g. 200"
              value={formState.capacity}
              onChange={(value) => updateField("capacity", value)}
            />
          </div>
        </div>

        <div className="grid gap-[14px] md:grid-cols-2">
          <div>
            <FormLabel>Fee (TZS)</FormLabel>
            <FormInput
              type="number"
              placeholder="0 for free"
              value={formState.fee}
              onChange={(value) => updateField("fee", value)}
            />
          </div>
          <div>
            <FormLabel>CPD Hours</FormLabel>
            <FormInput
              type="number"
              placeholder="e.g. 6"
              value={formState.cpdHours}
              onChange={(value) => updateField("cpdHours", value)}
            />
          </div>
        </div>

        <div>
          <FormLabel>Cover Image</FormLabel>
          {formState.coverImage ? (
            <div className="relative overflow-hidden rounded-[7px] border-[1.5px] border-[var(--border)]">
              <img
                src={formState.coverImage}
                alt="Cover"
                className="h-[140px] w-full object-cover"
              />
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
              <span className="text-[11px] font-semibold text-[var(--muted)]">
                {isUploadingImage ? "Uploading…" : "Click to upload cover image"}
              </span>
              <span className="text-[10px] text-[var(--muted)]">JPG, PNG or WEBP · max 10 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isUploadingImage}
                onChange={(e) => void handleCoverImageChange(e)}
              />
            </label>
          )}
        </div>

        <div>
          <FormLabel>Description</FormLabel>
          <textarea
            rows={3}
            placeholder="Event description…"
            value={formState.description}
            onChange={(event) => updateField("description", event.target.value)}
            className="w-full resize-y rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          />
        </div>
      </Modal>

      <Modal
        title={
          attendeesData
            ? `${attendeesData.eventTitle} — Attendees (${attendeesData.total})`
            : "Event Attendees"
        }
        open={attendeesModalOpen}
        onClose={() => setAttendeesModalOpen(false)}
        bodyClassName=""
        footer={
          <div className="flex justify-end">
            <Button tone="outline" onClick={() => setAttendeesModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        {attendeesLoading && (
          <div className="py-8 text-center text-[12px] text-[var(--muted)]">
            Loading attendees…
          </div>
        )}
        {attendeesError && (
          <div className="rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
            {attendeesError}
          </div>
        )}
        {attendeesData && !attendeesLoading && (
          attendeesData.attendees.length === 0 ? (
            <div className="py-8 text-center text-[12px] text-[var(--muted)]">
              No registrations yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  {attendeesData.attendees.map((a) => (
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
                        {a.checkedIn ? (
                          <StatusBadge tone="approved">Yes</StatusBadge>
                        ) : (
                          <StatusBadge tone="pending">No</StatusBadge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Modal>
    </section>
  );
}
