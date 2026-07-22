import type { AxiosError } from "axios";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import http from "~/utils/http";
import type { ApiEnvelope, MemberSummary } from "~/types";

type MemberRow = MemberSummary & {
  profilePhotoUrl?: string | null;
  membershipId?: string | null;
  membershipClass?: string | null;
  membershipCategory?: {
    id: string;
    name: string;
    yearlyFee: number;
    minYearsExperience: number;
    description?: string | null;
  } | null;
  membershipStatus?: string | null;
  engineeringDiscipline?: string | null;
  expiryDate?: string | null;
};

type MembershipCategory = {
  id: string;
  name: string;
  yearlyFee: number;
  minYearsExperience: number;
  description: string | null;
};

type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  feesCreated: number;
  feesUpdated: number;
  errors: Array<{ row: number; membershipId?: string; email?: string; reason: string }>;
  warnings: Array<{ row: number; field: string; value: string; reason: string }>;
};

type CreateMemberForm = {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  membershipCategoryId: string;
  engineeringDiscipline: string;
};

const EMPTY_FORM: CreateMemberForm = {
  email: "",
  firstName: "",
  middleName: "",
  lastName: "",
  phoneNumber: "",
  membershipCategoryId: "",
  engineeringDiscipline: "",
};

const DISCIPLINES = [
  "Civil", "Mechanical", "Electrical", "Electronics", "Chemical",
  "Mining", "Agricultural", "Environmental", "Computer",
  "Telecommunications", "Petroleum", "Biomedical", "Industrial",
  "Marine", "Aeronautical", "Other",
];

const CLASS_LABELS: Record<string, string> = {
  GRADUATE: "Graduate", ASSOCIATE: "AMIET", MIET: "MIET",
  CORPORATE: "CMIET", SENIOR: "SMIET", FELLOW: "FIET", HONORARY: "Honorary",
};

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  ACTIVE:    { dot: "#16a34a", text: "#15803d", bg: "#f0fdf4" },
  PENDING:   { dot: "#d97706", text: "#b45309", bg: "#fffbeb" },
  EXPIRED:   { dot: "#dc2626", text: "#b91c1c", bg: "#fef2f2" },
  SUSPENDED: { dot: "#6b7280", text: "#4b5563", bg: "#f9fafb" },
  REVOKED:   { dot: "#7c3aed", text: "#6d28d9", bg: "#f5f3ff" },
};

function initials(m: MemberRow) {
  const f = m.firstName ?? m.fullName?.split(" ")[0] ?? "";
  const l = m.lastName ?? m.fullName?.split(" ")[1] ?? "";
  return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "?";
}

function displayName(m: MemberRow) {
  if (m.fullName) return m.fullName;
  return `${m.firstName ?? ""} ${m.middleName ?? ""} ${m.lastName ?? ""}`.trim().replace(/\s+/g, " ") || m.email;
}

function displayMembershipGrade(m: MemberRow) {
  return (
    m.membershipCategory?.name ??
    (m.membershipClass ? CLASS_LABELS[m.membershipClass] ?? m.membershipClass : null) ??
    "—"
  );
}

function formatMoney(amount: number | string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "TZS 0";
  return `TZS ${value.toLocaleString()}`;
}

// ── Icon Components ────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function TotalMembersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
function PendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function ExpiredIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
function ViewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function RenewIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12A9 9 0 0 1 18.3 5.6L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Shared UI ──────────────────────────────────────────────────────

function MembersKpiCard({
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

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { dot: "#6b7280", text: "#4b5563", bg: "#f9fafb" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function MemberAvatar({ member, size = 34, fontSize = 11 }: { member: MemberRow; size?: number; fontSize?: number }) {
  const [failed, setFailed] = useState(false);
  const showImage = member.profilePhotoUrl && !failed;

  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,var(--red-dark),var(--red))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 800, flexShrink: 0, overflow: "hidden" }}>
      {showImage ? (
        <img
          src={member.profilePhotoUrl ?? ""}
          alt={`${displayName(member)} avatar`}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : initials(member)}
    </div>
  );
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,10,10,.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "var(--white)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red-dark)" }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", transition: "background .15s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
            <XIcon />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function MemberActionMenu({
  onView,
  onRenew,
  onDelete,
}: {
  onView: () => void;
  onRenew: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
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

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setOpenUp(window.innerHeight - rect.bottom < 150);
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
        aria-label="Member actions"
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
        }}
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            zIndex: 200,
            ...(openUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 10px 28px rgba(0,0,0,.16)",
            minWidth: 150,
            overflow: "hidden",
          }}
        >
          <button type="button" onClick={() => { setOpen(false); onView(); }} style={itemStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
            <ViewIcon /> View
          </button>
          <button type="button" onClick={() => { setOpen(false); onRenew(); }} style={itemStyle}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
            <RenewIcon /> Renew
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button type="button" onClick={() => { setOpen(false); onDelete(); }} style={{ ...itemStyle, color: "var(--red)" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-pale)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}>
            <TrashIcon /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 5 }}>
        {label}{required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8,
  fontFamily: "inherit", fontSize: 12.5, color: "var(--text)", background: "var(--bg)",
  outline: "none", boxSizing: "border-box", transition: "border-color .15s",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: "none", cursor: "pointer",
};

const PAGE_SIZE = 10;

function ListViewIcon({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function GridViewIcon({ active }: { active: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function MembersPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);

  // create member state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMemberForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [membershipCategories, setMembershipCategories] = useState<MembershipCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // import state
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // action state
  const [feeConfig, setFeeConfig] = useState<Record<string, number>>({});
  const [renewTarget, setRenewTarget] = useState<MemberRow | null>(null);
  const [renewForm, setRenewForm] = useState({
    year: String(new Date().getFullYear()),
    amount: "",
  });
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // stats derived from members list
  const stats = {
    total,
    active: members.filter((m) => m.membershipStatus === "ACTIVE").length,
    pending: members.filter((m) => m.membershipStatus === "PENDING").length,
    expired: members.filter((m) => m.membershipStatus === "EXPIRED").length,
  };

  async function loadMembers() {
    setLoading(true);
    setPageError(null);
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (statusFilter) params.set("status", statusFilter);
    if (classFilter) params.set("membershipCategoryId", classFilter);
    if (search) params.set("search", search);
    try {
      const { data } = await http.get<ApiEnvelope<MemberRow[]>>(`/admin/members?${params}`);
      setMembers(data.data ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setPageError(e.response?.data?.message ?? "Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => void loadMembers(), search ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, classFilter]);

  useEffect(() => {
    async function loadFeeConfig() {
      try {
        const { data } = await http.get<ApiEnvelope<Record<string, number>>>("/admin/settings/fees");
        setFeeConfig(data.data ?? {});
      } catch {
        setFeeConfig({});
      }
    }
    void loadFeeConfig();
  }, []);

  useEffect(() => {
    async function loadMembershipCategories() {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const { data } = await http.get<ApiEnvelope<MembershipCategory[]>>(
          "/admin/membership-categories?limit=100",
        );
        setMembershipCategories(data.data ?? []);
      } catch {
        setCategoriesError("Failed to load membership categories.");
      } finally {
        setCategoriesLoading(false);
      }
    }

    void loadMembershipCategories();
  }, []);

  // ── Create member ──────────────────────────────────────────────

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setCreateOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.email.trim()) { setCreateError("Email is required."); return; }
    if (categoriesLoading) { setCreateError("Membership categories are still loading."); return; }
    if (categoriesError) { setCreateError(categoriesError); return; }
    if (membershipCategories.length === 0) { setCreateError("No membership categories are available."); return; }
    if (!createForm.membershipCategoryId.trim()) {
      setCreateError("Membership grade is required.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await http.post("/admin/members", {
        email: createForm.email.trim(),
        firstName: createForm.firstName.trim() || undefined,
        middleName: createForm.middleName.trim() || undefined,
        lastName: createForm.lastName.trim() || undefined,
        phoneNumber: createForm.phoneNumber.trim() || undefined,
        membershipCategoryId: createForm.membershipCategoryId || undefined,
        engineeringDiscipline: createForm.engineeringDiscipline || undefined,
      });
      setCreateOpen(false);
      void loadMembers();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setCreateError(e.response?.data?.message ?? "Failed to create member.");
    } finally {
      setCreating(false);
    }
  }

  function setField(field: keyof CreateMemberForm) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  // ── Import members ─────────────────────────────────────────────

  function openImport() {
    setImportResult(null);
    setImportError(null);
    setImportOpen(true);
  }

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await http.post<ApiEnvelope<ImportResult>>(
        "/admin/members/import", formData, { headers: { "Content-Type": "multipart/form-data" } },
      );
      setImportResult(data.data);
      void loadMembers();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setImportError(e.response?.data?.message ?? "Import failed.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function openRenew(member: MemberRow) {
    const configuredAmount = member.membershipClass ? feeConfig[member.membershipClass] : undefined;
    setRenewTarget(member);
    setRenewForm({
      year: String(new Date().getFullYear()),
      amount: String(configuredAmount ?? ""),
    });
    setRenewError(null);
  }

  async function handleRenew(e: React.FormEvent) {
    e.preventDefault();
    if (!renewTarget) return;

    const year = Number(renewForm.year);
    const amount = Number(renewForm.amount);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      setRenewError("Enter a valid renewal year.");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setRenewError("Enter a valid paid amount.");
      return;
    }

    setRenewing(true);
    setRenewError(null);
    try {
      await http.post(`/admin/members/${renewTarget.id}/renew`, { year, amount });
      setRenewTarget(null);
      void loadMembers();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setRenewError(e.response?.data?.message ?? "Failed to renew member.");
    } finally {
      setRenewing(false);
    }
  }

  function openDelete(member: MemberRow) {
    setDeleteTarget(member);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await http.delete(`/admin/members/${deleteTarget.id}`);
      setDeleteTarget(null);
      void loadMembers();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setDeleteError(e.response?.data?.message ?? "Failed to delete member.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Members Directory</h1>
          <p className="hidden sm:block" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Manage all IET Tanzania registered members
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--red)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background .15s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-mid)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--red)")}
          >
            <PlusIcon /> Add Member
          </button>
          <button
            onClick={openImport}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--white)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color .15s" }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--red-dark)")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <UploadIcon /> Import Members
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-[14px] xl:grid-cols-4">
        <MembersKpiCard
          icon={<TotalMembersIcon />}
          value={loading ? "—" : total}
          label="Total Members"
          note={loading ? "" : `${stats.active} currently active`}
          noteTone="neutral"
        />
        <MembersKpiCard
          icon={<ActiveIcon />}
          value={loading ? "—" : stats.active}
          label="Active Members"
          note={loading ? "" : total > 0 ? `${Math.round((stats.active / total) * 100)}% of total` : ""}
          noteTone="success"
        />
        <MembersKpiCard
          icon={<PendingIcon />}
          value={loading ? "—" : stats.pending}
          label="Pending Review"
          note={loading ? "" : stats.pending > 0 ? "⚠ Awaiting activation" : "✓ None pending"}
          noteTone={stats.pending > 0 ? "warn" : "neutral"}
        />
        <MembersKpiCard
          icon={<ExpiredIcon />}
          value={loading ? "—" : stats.expired}
          label="Expired"
          note={loading ? "" : stats.expired > 0 ? "Renewal required" : "✓ None expired"}
          noteTone={stats.expired > 0 ? "warn" : "neutral"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-nowrap items-center gap-2 sm:flex-wrap">
        <div className="min-w-0 flex-[1.6] sm:w-[260px] sm:flex-none" style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "7px 12px" }}>
          <span style={{ color: "var(--muted)", flexShrink: 0 }}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontSize: 12, color: "var(--text)", outline: "none", width: "100%", minWidth: 0, fontFamily: "inherit" }}
          />
        </div>

        <div className="min-w-0 flex-1 sm:flex-none" style={{ position: "relative" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto" style={{ ...selectStyle, paddingRight: 28 }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
        </div>

        <div className="min-w-0 flex-1 sm:flex-none" style={{ position: "relative" }}>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full sm:w-auto" style={{ ...selectStyle, paddingRight: 28 }}>
            <option value="">All Grades</option>
            {membershipCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
        </div>

        {(search || statusFilter || classFilter) && (
          <button
            className="hidden sm:block"
            onClick={() => { setSearch(""); setStatusFilter(""); setClassFilter(""); }}
            style={{ fontSize: 11.5, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 600 }}
          >
            Clear filters
          </button>
        )}

        {/* View toggle (desktop only — mobile always uses cards) */}
        <div className="ml-auto hidden sm:flex" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 7, padding: 3, gap: 2 }}>
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              title={v === "list" ? "List view" : "Grid view"}
              style={{ width: 28, height: 26, border: "none", borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", background: view === v ? "var(--white)" : "transparent", color: view === v ? "var(--red-dark)" : "var(--muted)", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}
            >
              {v === "list" ? <ListViewIcon active={view === "list"} /> : <GridViewIcon active={view === "grid"} />}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {pageError && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{pageError}</span>
          <button onClick={() => void loadMembers()} style={{ fontSize: 11.5, fontWeight: 700, color: "var(--red-dark)", background: "none", border: "1px solid var(--red)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* Table / Grid */}
      {(() => {
        const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const pageMembers = members.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
        const from = members.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
        const to = Math.min(safePage * PAGE_SIZE, members.length);

        const ActionButtons = ({ member }: { member: MemberRow }) => (
          <MemberActionMenu
            onView={() => navigate(`/dashboard/members/${member.id}`)}
            onRenew={() => openRenew(member)}
            onDelete={() => openDelete(member)}
          />
        );

        const renderMemberGrid = () => (
          <div className="grid grid-cols-1 gap-2.5 p-0 sm:gap-[14px] sm:p-4 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
            {pageMembers.map((member) => (
              <div key={member.id}
                className="rounded-[12px] border border-[var(--border)] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-[box-shadow,transform] duration-150 sm:hover:-translate-y-[2px] sm:hover:shadow-[0_4px_18px_rgba(226,12,10,0.07)]"
              >
                {/* Identity + status */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <MemberAvatar member={member} size={36} fontSize={12} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName(member)}</div>
                      <div style={{ fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.email}</div>
                    </div>
                  </div>
                  <StatusPill status={member.membershipStatus ?? "PENDING"} />
                </div>

                {/* Details */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)" }}>Grade</div>
                    <div style={{ marginTop: 3 }}>
                      {displayMembershipGrade(member) !== "—"
                        ? <span style={{ fontSize: 11, fontWeight: 700, color: "var(--red-dark)", background: "var(--red-pale)", borderRadius: 5, padding: "1px 7px" }}>{displayMembershipGrade(member)}</span>
                        : <span style={{ fontSize: 11.5, color: "var(--muted)" }}>—</span>}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)" }}>Membership No.</div>
                    <div style={{ marginTop: 3, fontSize: 11.5, fontFamily: "monospace", color: member.membershipId ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.membershipId ?? "—"}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <ActionButtons member={member} />
                </div>
              </div>
            ))}
          </div>
        );

        return (
          <>
            <div className="overflow-hidden md:rounded-[14px] md:border md:border-[var(--border)] md:bg-white">
              {loading ? (
                <div style={{ padding: "48px 20px", textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading members…</p>
                </div>
              ) : members.length === 0 ? (
                <div style={{ padding: "56px 20px", textAlign: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
                    <UsersIcon />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No members found</p>
                  <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{search || statusFilter || classFilter ? "Try adjusting your filters." : "Add your first member to get started."}</p>
                </div>
              ) : view === "list" ? (
                <>
                <div className="hidden md:block" style={{ overflowX: "auto" }}>
                  <table className="table-proto min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        {["Member", "Membership No.", "Grade", "Discipline", "Status", "Actions"].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageMembers.map((member) => (
                        <tr key={member.id}
                          style={{ transition: "background .1s" }}
                          onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-pale)")}
                          onMouseOut={(e) => (e.currentTarget.style.background = "var(--white)")}
                        >
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <MemberAvatar member={member} />
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{displayName(member)}</div>
                                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{member.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--text)" }}>{member.membershipId ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                          <td>
                            {displayMembershipGrade(member) !== "—"
                              ? <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--red-dark)", background: "var(--red-pale)", borderRadius: 6, padding: "2px 8px" }}>{displayMembershipGrade(member)}</span>
                              : <span style={{ color: "var(--muted)", fontSize: 11.5 }}>—</span>}
                          </td>
                          <td style={{ fontSize: 11.5, color: "var(--text)" }}>{member.engineeringDiscipline ?? <span style={{ color: "var(--muted)" }}>—</span>}</td>
                          <td><StatusPill status={member.membershipStatus ?? "PENDING"} /></td>
                          <td><ActionButtons member={member} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden">{renderMemberGrid()}</div>
                </>
              ) : (
                renderMemberGrid()
              )}
            </div>

            {/* Pagination */}
            {!loading && members.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  Showing <strong>{from}–{to}</strong> of <strong>{members.length}</strong> member{members.length !== 1 ? "s" : ""}
                </span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
                  >‹</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 30, height: 30, border: "1.5px solid", borderRadius: 7, cursor: "pointer", fontSize: 11.5, fontWeight: 700, transition: "all .15s",
                        borderColor: safePage === p ? "var(--red)" : "var(--border)",
                        background: safePage === p ? "var(--red)" : "var(--white)",
                        color: safePage === p ? "white" : "var(--text)" }}
                    >{p}</button>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
                  >›</button>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Add Member Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Member">
        <form onSubmit={(e) => void handleCreate(e)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
            <FormField label="First Name">
              <input style={inputStyle} value={createForm.firstName} onChange={setField("firstName")} placeholder="Joram" />
            </FormField>
            <FormField label="Middle Name">
              <input style={inputStyle} value={createForm.middleName} onChange={setField("middleName")} placeholder="Allan" />
            </FormField>
            <FormField label="Last Name">
              <input style={inputStyle} value={createForm.lastName} onChange={setField("lastName")} placeholder="Jackson" />
            </FormField>
          </div>

          <FormField label="Email Address" required>
            <input style={inputStyle} type="email" value={createForm.email} onChange={setField("email")} placeholder="joram@example.co.tz" required />
          </FormField>

          <FormField label="Phone Number">
            <input style={inputStyle} value={createForm.phoneNumber} onChange={setField("phoneNumber")} placeholder="+255712345678" />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <FormField label="Membership Grade">
              <div style={{ position: "relative" }}>
                <select
                  style={{ ...selectStyle, paddingRight: 28 }}
                  value={createForm.membershipCategoryId}
                  onChange={setField("membershipCategoryId")}
                  disabled={categoriesLoading || membershipCategories.length === 0}
                >
                  <option value="">
                    {categoriesLoading ? "Loading categories…" : "Select grade…"}
                  </option>
                  {membershipCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
              </div>
              {categoriesError && (
                <div style={{ marginTop: 5, fontSize: 10.5, color: "var(--red)" }}>{categoriesError}</div>
              )}
            </FormField>
            <FormField label="Discipline">
              <div style={{ position: "relative" }}>
                <select style={{ ...selectStyle, paddingRight: 28 }} value={createForm.engineeringDiscipline} onChange={setField("engineeringDiscipline")}>
                  <option value="">Select…</option>
                  {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}><ChevronIcon /></span>
              </div>
            </FormField>
          </div>

          {createError && (
            <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 14 }}>
              {createError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setCreateOpen(false)}
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || categoriesLoading || membershipCategories.length === 0}
              style={{ fontSize: 12.5, fontWeight: 700, color: "white", background: creating || categoriesLoading || membershipCategories.length === 0 ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: creating || categoriesLoading || membershipCategories.length === 0 ? "not-allowed" : "pointer", transition: "background .15s" }}
            >
              {creating ? "Creating…" : "Create Member"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import members modal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Members">
        <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 16, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.7 }}>
          <p style={{ fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>Excel or CSV Format</p>
          <p>Use <code style={{ background: "var(--red-pale)", color: "var(--red-dark)", borderRadius: 4, padding: "1px 5px" }}>Reg.No.</code> as the legacy membership number and <code style={{ background: "var(--red-pale)", color: "var(--red-dark)", borderRadius: 4, padding: "1px 5px" }}>email</code> for portal access.</p>
          <p>Year columns such as <code style={{ background: "var(--red-pale)", color: "var(--red-dark)", borderRadius: 4, padding: "1px 5px" }}>2012</code>, <code style={{ background: "var(--red-pale)", color: "var(--red-dark)", borderRadius: 4, padding: "1px 5px" }}>2024</code> are imported as paid yearly subscriptions when they contain an amount.</p>
          <p style={{ fontSize: 10.5, marginTop: 4 }}>Accepted files: .xlsx and .csv. Save old .xls files as .xlsx before importing.</p>
        </div>

        {importError && (
          <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 12 }}>
            {importError}
          </div>
        )}

        {importResult && (
          <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderLeft: "4px solid var(--success)", borderRadius: 10, padding: "14px 16px", marginBottom: 12, color: "var(--text)" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginBottom: 8 }}>Import Complete</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: "var(--text)" }}>
              <span><strong>{importResult.created}</strong> created</span>
              <span><strong>{importResult.updated}</strong> updated</span>
              <span><strong>{importResult.skipped}</strong> skipped</span>
              <span><strong>{importResult.feesCreated}</strong> fees created</span>
              <span><strong>{importResult.feesUpdated}</strong> fees updated</span>
              <span style={{ color: importResult.errors.length ? "var(--red)" : "inherit" }}><strong>{importResult.errors.length}</strong> errors</span>
              <span style={{ color: importResult.warnings.length ? "var(--warn)" : "inherit" }}><strong>{importResult.warnings.length}</strong> warnings</span>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {importResult.errors.map((e) => (
                  <div key={`${e.row}-${e.membershipId ?? e.email ?? e.reason}`} style={{ fontSize: 10.5, color: "var(--red)" }}>
                    Row {e.row} ({e.membershipId ?? e.email ?? "unknown"}): {e.reason}
                  </div>
                ))}
              </div>
            )}
            {importResult.warnings.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                {importResult.warnings.slice(0, 20).map((warning) => (
                  <div key={`${warning.row}-${warning.field}-${warning.value}`} style={{ fontSize: 10.5, color: "var(--warn)" }}>
                    Row {warning.row} {warning.field}: {warning.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, height: 110, borderRadius: 10, border: "2px dashed var(--border)", background: "var(--bg)", cursor: importing ? "not-allowed" : "pointer", transition: "border-color .15s, background .15s", opacity: importing ? 0.6 : 1 }}
          onMouseOver={(e) => { if (!importing) { e.currentTarget.style.borderColor = "var(--red-dark)"; e.currentTarget.style.background = "var(--red-pale)"; } }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg)"; }}>
          <span style={{ color: "var(--muted)" }}><UploadIcon /></span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
            {importing ? "Importing…" : "Click to select Excel or CSV file"}
          </span>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" style={{ display: "none" }} disabled={importing} onChange={(e) => void handleImport(e)} />
        </label>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setImportOpen(false)}
            style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
            Close
          </button>
        </div>
      </Modal>

      <Modal open={!!renewTarget} onClose={() => setRenewTarget(null)} title="Renew Membership">
        <form onSubmit={(e) => void handleRenew(e)}>
          {renewTarget && (
            <div style={{ marginBottom: 16, padding: "12px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{displayName(renewTarget)}</div>
              <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--muted)" }}>
                {renewTarget.membershipId ?? "No membership number"} · {displayMembershipGrade(renewTarget)}
              </div>
              {renewForm.amount && (
                <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--muted)" }}>
                  Default amount: <strong style={{ color: "var(--text)" }}>{formatMoney(renewForm.amount)}</strong>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <FormField label="Renewal Year" required>
              <input
                style={inputStyle}
                type="number"
                min={2000}
                max={2100}
                value={renewForm.year}
                onChange={(e) => setRenewForm((prev) => ({ ...prev, year: e.target.value }))}
                required
              />
            </FormField>
            <FormField label="Paid Amount" required>
              <input
                style={inputStyle}
                type="number"
                min={0}
                step={1}
                value={renewForm.amount}
                onChange={(e) => setRenewForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="150000"
                required
              />
            </FormField>
          </div>

          {renewError && (
            <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 14 }}>
              {renewError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setRenewTarget(null)}
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={renewing}
              style={{ fontSize: 12.5, fontWeight: 700, color: "white", background: renewing ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: renewing ? "not-allowed" : "pointer" }}>
              {renewing ? "Renewing…" : "Renew Member"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Member">
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Delete {deleteTarget ? displayName(deleteTarget) : "this member"}?
          </p>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>
            This will hide the member from the directory and deactivate portal access. Existing payments, fees, applications, and event history will remain available in the database.
          </p>

          {deleteError && (
            <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 14 }}>
              {deleteError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setDeleteTarget(null)}
              style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={() => void handleDelete()} disabled={deleting}
              style={{ fontSize: 12.5, fontWeight: 700, color: "white", background: deleting ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: deleting ? "not-allowed" : "pointer" }}>
              {deleting ? "Deleting…" : "Delete Member"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
