import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";

type EngineeringInstitution = {
  id: string;
  name: string;
  country: string;
  institutionType: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type InstitutionForm = {
  name: string;
  country: string;
  institutionType: string;
  notes: string;
};

const EMPTY_FORM: InstitutionForm = {
  name: "",
  country: "Tanzania",
  institutionType: "UNIVERSITY",
  notes: "",
};

const PAGE_SIZE = 10;

const INSTITUTION_TYPE_LABELS: Record<string, string> = {
  UNIVERSITY: "University",
  COLLEGE: "College",
  TECHNICAL_INSTITUTE: "Technical Institute",
  OTHER: "Other",
};

function formatError(error: unknown, fallback: string) {
  return (error as AxiosError<{ message?: string }>).response?.data?.message ?? fallback;
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" />
      <path d="M4 4v15.5A2.5 2.5 0 0 0 6.5 22H21V4H6.5A2.5 2.5 0 0 0 4 6.5V4Z" />
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function MoreVerticalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DisableIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="8" x2="16" y2="16" />
    </svg>
  );
}

function KpiCard({
  icon,
  value,
  label,
  note,
  noteTone = "neutral",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  note: string;
  noteTone?: "success" | "warn" | "neutral";
}) {
  const noteClass =
    noteTone === "warn"
      ? "text-[var(--warn,#b45309)]"
      : noteTone === "success"
        ? "text-[var(--success,#15803d)]"
        : "text-[var(--muted)]";

  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)] flex-1">
      <div className="mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[var(--red-pale)] text-[var(--red)]">
        {icon}
      </div>
      <div className="font-bold leading-none tracking-[-1px] text-[var(--red-dark)] text-[24px]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`mt-[6px] text-[10px] font-semibold ${noteClass}`}>{note}</div>
    </article>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: active ? "#f0fdf4" : "#f9fafb",
        color: active ? "#15803d" : "#4b5563",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16a34a" : "#6b7280", flexShrink: 0 }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 760,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,10,10,.45)", backdropFilter: "blur(3px)" }} />
      <div
        style={{
          position: "relative",
          background: "var(--white)",
          borderRadius: 16,
          width: "100%",
          maxWidth,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--red-dark)" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", transition: "background .15s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <XIcon />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 10.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".6px",
          color: "var(--muted)",
          marginBottom: 5,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ marginTop: 5, fontSize: 10.5, color: "var(--muted)" }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: 12.5,
  color: "var(--text)",
  background: "var(--bg)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 90,
  resize: "vertical",
};

function InstitutionFormFields({
  form,
  setForm,
}: {
  form: InstitutionForm;
  setForm: React.Dispatch<React.SetStateAction<InstitutionForm>>;
}) {
  return (
    <>
      <FormField label="Institution Name" required>
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          style={inputStyle}
          placeholder="University of Dar es Salaam"
        />
      </FormField>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Country" required>
          <input
            value={form.country}
            onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
            style={inputStyle}
            placeholder="Tanzania"
          />
        </FormField>

        <FormField label="Institution Type" required>
          <div style={{ position: "relative" }}>
            <select
              value={form.institutionType}
              onChange={(event) => setForm((current) => ({ ...current, institutionType: event.target.value }))}
              style={{ ...inputStyle, paddingRight: 28, appearance: "none", cursor: "pointer" }}
            >
              <option value="UNIVERSITY">University</option>
              <option value="COLLEGE">College</option>
              <option value="TECHNICAL_INSTITUTE">Technical Institute</option>
              <option value="OTHER">Other</option>
            </select>
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}>
              <ChevronIcon />
            </span>
          </div>
        </FormField>
      </div>

      <FormField label="Notes">
        <textarea
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          style={textareaStyle}
          placeholder="Optional accreditation notes or internal comments"
        />
      </FormField>
    </>
  );
}

function RowMenu({
  onEdit,
  onDisable,
}: {
  onEdit: () => void;
  onDisable: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function closeOnViewportChange() {
      setOpen(false);
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("scroll", closeOnViewportChange, true);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("scroll", closeOnViewportChange, true);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const estimatedWidth = 150;
      const estimatedHeight = 92;
      const gap = 6;
      const left = Math.max(8, Math.min(rect.right - estimatedWidth, window.innerWidth - estimatedWidth - 8));
      const openUp = rect.bottom + estimatedHeight + gap > window.innerHeight && rect.top > estimatedHeight + gap;

      setMenuStyle({
        position: "fixed",
        left,
        top: openUp ? Math.max(8, rect.top - estimatedHeight - gap) : Math.min(window.innerHeight - estimatedHeight - 8, rect.bottom + gap),
      });
    }
    setOpen((value) => !value);
  }

  const itemStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 14px",
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 12.5,
    fontWeight: 600,
    color: "var(--text)",
    textAlign: "left",
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <button
        ref={btnRef}
        type="button"
        aria-label="Institution actions"
        onClick={toggle}
        style={{
          width: 30,
          height: 30,
          border: "1.5px solid var(--border)",
          borderRadius: 7,
          background: open ? "var(--bg)" : "var(--white)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: open ? "var(--red-dark)" : "var(--muted)",
          transition: "border-color .15s, background .15s, color .15s",
        }}
        onMouseOver={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--red-dark)";
            e.currentTarget.style.color = "var(--red-dark)";
          }
        }}
        onMouseOut={(e) => {
          if (!open) {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--muted)";
          }
        }}
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div
          style={{
            ...menuStyle,
            zIndex: 200,
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 10px 28px rgba(0,0,0,.16)",
            minWidth: 150,
            maxHeight: "calc(100vh - 16px)",
            overflowY: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            style={itemStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <EditIcon /> Edit
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDisable();
            }}
            style={{ ...itemStyle, color: "var(--red)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-pale)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <DisableIcon /> Disable
          </button>
        </div>
      )}
    </div>
  );
}

export default function EngineeringInstitutionsPage() {
  const [items, setItems] = useState<EngineeringInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<InstitutionForm>(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState<EngineeringInstitution | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EngineeringInstitution | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadInstitutions() {
    setLoading(true);
    setPageError(null);
    try {
      const { data } = await http.get<ApiEnvelope<EngineeringInstitution[]>>("/admin/engineering-institutions", {
        params: { limit: 100, search: search || undefined },
      });
      setItems(data.data ?? []);
    } catch (err) {
      setPageError(formatError(err, "Failed to load institutions."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void loadInstitutions(), search ? 250 : 0);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search, activeFilter]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setSaveError(null);
    setFormOpen(true);
  }

  function openEdit(item: EngineeringInstitution) {
    setEditTarget(item);
      setForm({
        name: item.name,
        country: item.country,
        institutionType: item.institutionType,
        notes: item.notes ?? "",
      });
    setSaveError(null);
    setFormOpen(true);
  }

  async function saveInstitution(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      setSaveError("Institution name is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim() || "Tanzania",
        institutionType: form.institutionType,
        isActive: editTarget ? editTarget.isActive : true,
        notes: form.notes.trim() || undefined,
      };

      if (editTarget) {
        await http.patch(`/admin/engineering-institutions/${editTarget.id}`, payload);
      } else {
        await http.post("/admin/engineering-institutions", payload);
      }

      setFormOpen(false);
      await loadInstitutions();
    } catch (err) {
      setSaveError(formatError(err, "Failed to save institution."));
    } finally {
      setSaving(false);
    }
  }

  async function disableInstitution() {
    if (!deleteTarget) return;
    setDeleting(true);
    setPageError(null);
    try {
      await http.delete(`/admin/engineering-institutions/${deleteTarget.id}`);
      setDeleteTarget(null);
      await loadInstitutions();
    } catch (err) {
      setPageError(formatError(err, "Failed to disable institution."));
    } finally {
      setDeleting(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (activeFilter && String(item.isActive) !== activeFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filteredItems.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filteredItems.length);

  const activeCount = items.filter((item) => item.isActive).length;
  const inactiveCount = items.filter((item) => !item.isActive).length;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Engineering Institutions</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Manage the approved institution directory used in member applications.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--red)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-mid)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--red)")}
          >
            <PlusIcon /> Add Institution
          </button>
        </div>
      </div>

      <div className="grid gap-[14px] md:grid-cols-3">
        <KpiCard
          icon={<BookIcon />}
          value={loading ? "—" : items.length}
          label="Total Institutions"
          note="Directory entries"
        />
        <KpiCard
          icon={<ActiveIcon />}
          value={loading ? "—" : activeCount}
          label="Active"
          note={loading ? "" : "Selectable by applicants"}
          noteTone="success"
        />
        <KpiCard
          icon={<DisableIcon />}
          value={loading ? "—" : inactiveCount}
          label="Inactive"
          note={loading ? "" : inactiveCount > 0 ? "Hidden from applicants" : "None hidden"}
          noteTone={inactiveCount > 0 ? "warn" : "neutral"}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 12px", flex: 1, minWidth: 220, maxWidth: 320 }}>
          <span style={{ color: "var(--muted)", flexShrink: 0 }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search institutions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--text)", outline: "none", width: "100%", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            style={{ appearance: "none", cursor: "pointer", width: "auto", padding: "8px 28px 8px 12px", border: "1.5px solid var(--border)", borderRadius: 8, background: "var(--white)", fontSize: 12, color: "var(--text)", fontFamily: "inherit" }}
          >
            <option value="">All visibility</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}>
            <ChevronIcon />
          </span>
        </div>

        {(search || activeFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveFilter("");
            }}
            style={{ fontSize: 11.5, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 600 }}
          >
            Clear filters
          </button>
        )}
      </div>

      {pageError && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => void loadInstitutions()}
            style={{ fontSize: 11.5, fontWeight: 700, color: "var(--red-dark)", background: "none", border: "1px solid var(--red)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--red-dark)" }}>Institution Directory</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              Keep approved institutions consistent for applicant education records.
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>{filteredItems.length} records</div>
        </div>

        {loading ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading institutions…</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
              <BookIcon />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No institutions found</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{search || activeFilter ? "Try adjusting your filters." : "Add the first institution to start the directory."}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="table-proto min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Country</th>
                    <th>Type</th>
                    <th>Visibility</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((item) => (
                    <tr
                      key={item.id}
                      style={{ transition: "background .1s" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-pale)")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "var(--white)")}
                    >
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{item.name}</div>
                          <div style={{ fontSize: 10.5, color: "var(--muted)" }}>Created {new Date(item.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 11.5, color: "var(--text)" }}>{item.country}</td>
                      <td>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--red-dark)", background: "var(--red-pale)", borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap" }}>
                          {INSTITUTION_TYPE_LABELS[item.institutionType] ?? item.institutionType}
                        </span>
                      </td>
                      <td>
                        <StatusPill active={item.isActive} />
                      </td>
                      <td style={{ fontSize: 11.5, color: "var(--text)" }}>
                        {item.notes ? (
                          <span style={{ display: "inline-block", maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.notes}</span>
                        ) : (
                          <span style={{ color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <RowMenu
                          onEdit={() => openEdit(item)}
                          onDisable={() => setDeleteTarget(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && filteredItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  Showing <strong>{from}–{to}</strong> of <strong>{filteredItems.length}</strong> institution{filteredItems.length !== 1 ? "s" : ""}
                </span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={safePage === 1}
                    style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPage(value)}
                      style={{
                        width: 30,
                        height: 30,
                        border: "1.5px solid",
                        borderRadius: 7,
                        cursor: "pointer",
                        fontSize: 11.5,
                        fontWeight: 700,
                        transition: "all .15s",
                        borderColor: safePage === value ? "var(--red)" : "var(--border)",
                        background: safePage === value ? "var(--red)" : "var(--white)",
                        color: safePage === value ? "white" : "var(--text)",
                      }}
                    >
                      {value}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={safePage === totalPages}
                    style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Edit Institution" : "Add Institution"}
        maxWidth={660}
      >
        <form onSubmit={(event) => void saveInstitution(event)}>
          {saveError && (
            <div style={{ marginBottom: 14, border: "1px solid #f0b0b0", background: "var(--red-pale)", color: "var(--red)", borderRadius: 8, padding: 10, fontSize: 12 }}>
              {saveError}
            </div>
          )}

          <InstitutionFormFields form={form} setForm={setForm} />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--muted)",
                background: "var(--white)",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "8px 18px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "white",
                background: saving ? "var(--muted)" : "var(--red)",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "background .15s",
              }}
            >
              {saving ? "Saving…" : editTarget ? "Update Institution" : "Add Institution"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Disable Institution"
        maxWidth={540}
      >
        <div style={{ fontSize: 12.5, color: "var(--text)" }}>
          This will hide <strong>{deleteTarget?.name ?? "this institution"}</strong> from member application forms.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--muted)",
              background: "var(--white)",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              padding: "8px 18px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void disableInstitution()}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "white",
              background: deleting ? "var(--muted)" : "var(--red)",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              cursor: deleting ? "not-allowed" : "pointer",
              transition: "background .15s",
            }}
          >
            {deleting ? "Disabling…" : "Disable"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
