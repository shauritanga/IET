import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";

// ── Types ──────────────────────────────────────────────────────────

type MembershipCategory = {
  id: string;
  name: string;
  yearlyFee: number;
  minYearsExperience: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type CategoryForm = {
  name: string;
  yearlyFee: string;
  minYearsExperience: string;
  description: string;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  yearlyFee: "",
  minYearsExperience: "",
  description: "",
};

const PAGE_SIZE = 10;

// ── Helpers ────────────────────────────────────────────────────────

function formatFee(fee: number) {
  if (fee === 0) return "Contact";
  return `TZS ${fee.toLocaleString()}`;
}

function feeColor(fee: number) {
  return fee === 0 ? "var(--muted)" : "var(--red-dark)";
}

// ── Icons ──────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function BadgeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
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

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
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

// ── Row Action Menu ────────────────────────────────────────────────

function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
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
      // dropdown is ~90px tall; open upward if less than 110px space below
      setOpenUp(window.innerHeight - rect.bottom < 110);
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        style={{
          width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7,
          background: open ? "var(--bg)" : "var(--white)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--muted)", transition: "border-color .15s, background .15s",
        }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--red-dark)"; e.currentTarget.style.color = "var(--red-dark)"; }}
        onMouseOut={(e) => { if (!open) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; } }}
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, zIndex: 200,
          ...(openUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
          background: "var(--white)", border: "1px solid var(--border)", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: 140, overflow: "hidden",
        }}>
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            style={{
              width: "100%", padding: "9px 14px", border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
              fontSize: 12.5, fontWeight: 600, color: "var(--text)", textAlign: "left",
              transition: "background .12s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <EditIcon /> Edit
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            style={{
              width: "100%", padding: "9px 14px", border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 9,
              fontSize: 12.5, fontWeight: 600, color: "#dc2626", textAlign: "left",
              transition: "background .12s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#fef2f2")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────

function KpiCard({ icon, value, label, note }: { icon: React.ReactNode; value: string | number; label: string; note: string }) {
  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)] flex-1">
      <div className="mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[var(--red-pale)] text-[var(--red)]">
        {icon}
      </div>
      <div className="font-bold leading-none tracking-[-1px] text-[var(--red-dark)] text-[24px]">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className="mt-[6px] text-[10px] font-semibold text-[var(--muted)]">{note}</div>
    </article>
  );
}

// ── Modal ──────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,10,10,.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "var(--white)", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red-dark)" }}>{title}</span>
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
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── Form Helpers ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8,
  fontFamily: "inherit", fontSize: 12.5, color: "var(--text)", background: "var(--bg)",
  outline: "none", boxSizing: "border-box", transition: "border-color .15s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: "vertical", minHeight: 80,
};

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

// ── Category Form Fields ───────────────────────────────────────────

function CategoryFormFields({
  form,
  setForm,
}: {
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
}) {
  return (
    <>
      <FormField label="Category Name" required>
        <input
          type="text"
          value={form.name}
          placeholder="e.g. Fellow (FIET)"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--red-dark)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Annual Fee (TZS)" required>
          <input
            type="number"
            value={form.yearlyFee}
            placeholder="e.g. 85000"
            min={0}
            onChange={(e) => setForm((f) => ({ ...f, yearlyFee: e.target.value }))}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--red-dark)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </FormField>
        <FormField label="Min. Years Experience" required>
          <input
            type="number"
            value={form.minYearsExperience}
            placeholder="e.g. 10"
            min={0}
            onChange={(e) => setForm((f) => ({ ...f, minYearsExperience: e.target.value }))}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--red-dark)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea
          value={form.description}
          placeholder="Eligibility criteria and requirements…"
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          style={textareaStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--red-dark)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
      </FormField>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function MembershipCategoriesPage() {
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<MembershipCategory | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<MembershipCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);

  function showToast(msg: string, tone: "success" | "error" = "success") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3200);
  }

  async function fetchCategories() {
    setLoading(true);
    setPageError(null);
    try {
      const { data } = await http.get<ApiEnvelope<MembershipCategory[]>>("/admin/membership-categories?limit=100");
      setCategories(data.data ?? []);
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setPageError(e.response?.data?.message ?? "Failed to load membership categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchCategories(); }, []);

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setCreateOpen(true);
  }

  function openEdit(cat: MembershipCategory) {
    setEditTarget(cat);
    setEditForm({
      name: cat.name,
      yearlyFee: String(cat.yearlyFee),
      minYearsExperience: String(cat.minYearsExperience),
      description: cat.description ?? "",
    });
    setEditError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Category name is required."); return; }
    if (createForm.yearlyFee === "") { setCreateError("Annual fee is required."); return; }
    if (createForm.minYearsExperience === "") { setCreateError("Minimum years of experience is required."); return; }
    setCreating(true);
    setCreateError(null);
    try {
      await http.post("/admin/membership-categories", {
        name: createForm.name.trim(),
        yearlyFee: Number(createForm.yearlyFee),
        minYearsExperience: Number(createForm.minYearsExperience),
        description: createForm.description.trim() || undefined,
      });
      setCreateOpen(false);
      await fetchCategories();
      showToast("Category created successfully.");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setCreateError(e.response?.data?.message ?? "Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.name.trim()) { setEditError("Category name is required."); return; }
    if (editForm.yearlyFee === "") { setEditError("Annual fee is required."); return; }
    if (editForm.minYearsExperience === "") { setEditError("Minimum years of experience is required."); return; }
    setEditing(true);
    setEditError(null);
    try {
      await http.patch(`/admin/membership-categories/${editTarget.id}`, {
        name: editForm.name.trim(),
        yearlyFee: Number(editForm.yearlyFee),
        minYearsExperience: Number(editForm.minYearsExperience),
        description: editForm.description.trim() || undefined,
      });
      setEditTarget(null);
      await fetchCategories();
      showToast("Category updated successfully.");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setEditError(e.response?.data?.message ?? "Failed to update category.");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.delete(`/admin/membership-categories/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchCategories();
      showToast("Category deleted.");
    } catch {
      showToast("Failed to delete category.", "error");
      setDeleting(false);
    }
  }

  const avgFee = categories.length
    ? Math.round(categories.filter((c) => c.yearlyFee > 0).reduce((s, c) => s + c.yearlyFee, 0) / categories.filter((c) => c.yearlyFee > 0).length)
    : 0;

  const maxExp = categories.length ? Math.max(...categories.map((c) => c.minYearsExperience)) : 0;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.tone === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", padding: "11px 18px", borderRadius: 10,
          fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.18)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "slideIn .2s ease",
        }}>
          {toast.tone === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Membership Categories</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Define IET membership grades — fees and eligibility requirements
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--red)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "background .15s", flexShrink: 0 }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-mid)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--red)")}
        >
          <PlusIcon /> New Category
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-[14px] md:grid-cols-3">
        <KpiCard
          icon={<LayersIcon />}
          value={loading ? "—" : categories.length}
          label="Total Categories"
          note="All membership grades"
        />
        <KpiCard
          icon={<BadgeIcon />}
          value={loading ? "—" : avgFee > 0 ? `TZS ${avgFee.toLocaleString()}` : "—"}
          label="Average Annual Fee"
          note="Across paid categories"
        />
        <KpiCard
          icon={<ClockIcon />}
          value={loading ? "—" : maxExp > 0 ? `${maxExp} yrs` : "—"}
          label="Max. Experience Required"
          note="Highest eligibility bar"
        />
      </div>

      {/* Error */}
      {pageError && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => void fetchCategories()}
            style={{ fontSize: 11.5, fontWeight: 700, color: "var(--red-dark)", background: "none", border: "1px solid var(--red)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Table (desktop) */}
      <div className="hidden md:block" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading categories…</p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
              <LayersIcon />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No categories yet</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>Create your first membership category to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
              const safePage = Math.min(page, totalPages);
              const pageCategories = categories.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
              const from = categories.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
              const to = Math.min(safePage * PAGE_SIZE, categories.length);
              return (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {["Category", "Annual Fee", "Min. Experience", "Actions"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    style={{ transition: "background .1s" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--red-pale)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "var(--white)")}
                  >
                    {/* Category name + description */}
                    <td style={{ maxWidth: 380 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, background: "var(--red-pale)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--red)", flexShrink: 0, marginTop: 1,
                        }}>
                          <BadgeIcon />
                        </div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{cat.name}</div>
                          {cat.description && (
                            <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Fee */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: 12.5, fontWeight: 700, color: feeColor(cat.yearlyFee),
                        ...(cat.yearlyFee > 0 ? {
                          background: "var(--red-pale)", borderRadius: 6,
                          padding: "2px 8px", display: "inline-block",
                        } : {}),
                      }}>
                        {formatFee(cat.yearlyFee)}
                      </span>
                    </td>

                    {/* Experience */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      {cat.minYearsExperience === 0 ? (
                        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>No minimum</span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--text)" }}>
                          <span style={{ color: "var(--muted)" }}>
                            <ClockIcon />
                          </span>
                          {cat.minYearsExperience} yr{cat.minYearsExperience !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <RowMenu onEdit={() => openEdit(cat)} onDelete={() => setDeleteTarget(cat)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
              );
            })()}
          </div>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-2.5 md:hidden">
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Loading categories…</div>
        ) : categories.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white" style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>No categories yet.</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="rounded-[12px] border border-[var(--border)] bg-white p-3.5">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", flexShrink: 0 }}>
                    <BadgeIcon />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{cat.name}</div>
                    {cat.description && (
                      <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{cat.description}</div>
                    )}
                  </div>
                </div>
                <RowMenu onEdit={() => openEdit(cat)} onDelete={() => setDeleteTarget(cat)} />
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 24, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)" }}>Annual Fee</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: feeColor(cat.yearlyFee), marginTop: 2 }}>{formatFee(cat.yearlyFee)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)" }}>Min. Experience</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>
                    {cat.minYearsExperience === 0 ? "No minimum" : `${cat.minYearsExperience} yr${cat.minYearsExperience !== 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && categories.length > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const from = categories.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
        const to = Math.min(safePage * PAGE_SIZE, categories.length);
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Showing <strong>{from}–{to}</strong> of <strong>{categories.length}</strong> categor{categories.length !== 1 ? "ies" : "y"}
            </span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === 1 ? "not-allowed" : "pointer", opacity: safePage === 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
              >‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  style={{ width: 30, height: 30, border: "1.5px solid", borderRadius: 7, cursor: "pointer", fontSize: 11.5, fontWeight: 700, transition: "all .15s",
                    borderColor: safePage === p ? "var(--red)" : "var(--border)",
                    background: safePage === p ? "var(--red)" : "var(--white)",
                    color: safePage === p ? "white" : "var(--text)" }}
                >{p}</button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{ width: 30, height: 30, border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--white)", cursor: safePage === totalPages ? "not-allowed" : "pointer", opacity: safePage === totalPages ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", fontSize: 13, fontWeight: 700 }}
              >›</button>
            </div>
          </div>
        );
      })()}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Membership Category">
        <form onSubmit={handleCreate}>
          <CategoryFormFields form={createForm} setForm={setCreateForm} />
          {createError && (
            <p style={{ fontSize: 11.5, color: "var(--red)", marginTop: 4, marginBottom: 0 }}>{createError}</p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{ fontSize: 12, fontWeight: 700, color: "white", background: creating ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: creating ? "not-allowed" : "pointer", transition: "background .15s" }}
            >
              {creating ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Membership Category">
        <form onSubmit={handleEdit}>
          <CategoryFormFields form={editForm} setForm={setEditForm} />
          {editError && (
            <p style={{ fontSize: 11.5, color: "var(--red)", marginTop: 4, marginBottom: 0 }}>{editError}</p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setEditTarget(null)}
              style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              style={{ fontSize: 12, fontWeight: 700, color: "white", background: editing ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: editing ? "not-allowed" : "pointer", transition: "background .15s" }}
            >
              {editing ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Category">
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0 }}>
            <TrashIcon />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
              Delete &ldquo;{deleteTarget?.name}&rdquo;?
            </p>
            <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
              This will permanently remove the category. This action cannot be undone.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            style={{ fontSize: 12, fontWeight: 700, color: "white", background: deleting ? "var(--muted)" : "#dc2626", border: "none", borderRadius: 8, padding: "8px 18px", cursor: deleting ? "not-allowed" : "pointer", transition: "background .15s" }}
          >
            {deleting ? "Deleting…" : "Delete Category"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
