import type { AxiosError } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";

// ── Types ──────────────────────────────────────────────────────────

type Discipline = {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DisciplineForm = {
  name: string;
  parentId: string;
  isActive: boolean;
};

const EMPTY_FORM: DisciplineForm = { name: "", parentId: "", isActive: true };

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

function SitemapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <path d="M12 8v4M5 16v-2h14v2" />
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

function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
          display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)",
        }}
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
            style={{ width: "100%", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: "var(--text)", textAlign: "left" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--bg)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "none")}
          >
            <EditIcon /> Edit
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            style={{ width: "100%", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: "#dc2626", textAlign: "left" }}
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

// ── Modal + form helpers ───────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,10,10,.45)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "var(--white)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--red-dark)" }}>{title}</span>
          <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%" }}>
            <XIcon />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: 8,
  fontFamily: "inherit", fontSize: 12.5, color: "var(--text)", background: "var(--bg)",
  outline: "none", boxSizing: "border-box",
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

function DisciplineFormFields({
  form,
  setForm,
  topLevel,
  excludeId,
}: {
  form: DisciplineForm;
  setForm: React.Dispatch<React.SetStateAction<DisciplineForm>>;
  topLevel: Discipline[];
  excludeId?: string;
}) {
  return (
    <>
      <FormField label="Discipline Name" required>
        <input
          type="text"
          value={form.name}
          placeholder="e.g. Structural"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
      </FormField>
      <FormField label="Parent Discipline">
        <select
          value={form.parentId}
          onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
          style={inputStyle}
        >
          <option value="">— None (top-level) —</option>
          {topLevel
            .filter((d) => d.id !== excludeId)
            .map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
        </select>
      </FormField>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        Active
      </label>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────

export default function DisciplinesPage() {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<DisciplineForm>(EMPTY_FORM);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editTarget, setEditTarget] = useState<Discipline | null>(null);
  const [editForm, setEditForm] = useState<DisciplineForm>(EMPTY_FORM);
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Discipline | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);

  function showToast(msg: string, tone: "success" | "error" = "success") {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3200);
  }

  async function fetchDisciplines() {
    setLoading(true);
    setPageError(null);
    try {
      const { data } = await http.get<ApiEnvelope<Discipline[]>>("/admin/disciplines");
      setDisciplines(data.data ?? []);
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setPageError(e.response?.data?.message ?? "Failed to load disciplines.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchDisciplines(); }, []);

  const topLevel = useMemo(
    () => disciplines.filter((d) => !d.parentId).sort((a, b) => a.name.localeCompare(b.name)),
    [disciplines],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string, Discipline[]>();
    for (const d of disciplines) {
      if (d.parentId) {
        const list = map.get(d.parentId) ?? [];
        list.push(d);
        map.set(d.parentId, list);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [disciplines]);

  // Rows flattened for rendering: each top-level followed by its children.
  const rows = useMemo(() => {
    const out: { discipline: Discipline; depth: number }[] = [];
    for (const parent of topLevel) {
      out.push({ discipline: parent, depth: 0 });
      for (const child of childrenByParent.get(parent.id) ?? []) {
        out.push({ discipline: child, depth: 1 });
      }
    }
    // orphaned children (parent inactive-filtered out) still shown at depth 0
    const shownIds = new Set(out.map((r) => r.discipline.id));
    for (const d of disciplines) {
      if (!shownIds.has(d.id)) out.push({ discipline: d, depth: 0 });
    }
    return out;
  }, [topLevel, childrenByParent, disciplines]);

  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setCreateOpen(true);
  }

  function openEdit(d: Discipline) {
    setEditTarget(d);
    setEditForm({ name: d.name, parentId: d.parentId ?? "", isActive: d.isActive });
    setEditError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Discipline name is required."); return; }
    setCreating(true);
    setCreateError(null);
    try {
      await http.post("/admin/disciplines", {
        name: createForm.name.trim(),
        parentId: createForm.parentId || undefined,
        isActive: createForm.isActive,
      });
      setCreateOpen(false);
      await fetchDisciplines();
      showToast("Discipline created.");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setCreateError(e.response?.data?.message ?? "Failed to create discipline.");
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.name.trim()) { setEditError("Discipline name is required."); return; }
    setEditing(true);
    setEditError(null);
    try {
      await http.patch(`/admin/disciplines/${editTarget.id}`, {
        name: editForm.name.trim(),
        parentId: editForm.parentId || undefined,
        isActive: editForm.isActive,
      });
      setEditTarget(null);
      await fetchDisciplines();
      showToast("Discipline updated.");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setEditError(e.response?.data?.message ?? "Failed to update discipline.");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.delete(`/admin/disciplines/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchDisciplines();
      showToast("Discipline deleted.");
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      showToast(e.response?.data?.message ?? "Failed to delete discipline.", "error");
      setDeleting(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.tone === "error" ? "#dc2626" : "#16a34a",
          color: "#fff", padding: "11px 18px", borderRadius: 10,
          fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Engineering Disciplines</h1>
          <p className="hidden sm:block" style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Manage disciplines and sub-disciplines used to route applications to evaluators
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--red)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
        >
          <PlusIcon /> New Discipline
        </button>
      </div>

      {pageError && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{pageError}</span>
          <button type="button" onClick={() => void fetchDisciplines()} style={{ fontSize: 11.5, fontWeight: 700, color: "var(--red-dark)", background: "none", border: "1px solid var(--red)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* Table (desktop) */}
      <div className="hidden md:block" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "52px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading disciplines…</p>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
              <SitemapIcon />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No disciplines yet</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>Create your first discipline to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>{["Discipline", "Type", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map(({ discipline: d, depth }) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: depth * 22 }}>
                        {depth > 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>↳</span>}
                        <span style={{ fontSize: 12.5, fontWeight: depth === 0 ? 700 : 600, color: "var(--text)" }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{depth === 0 ? "Top-level" : "Sub-discipline"}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                        background: d.isActive ? "#dcfce7" : "#f1f1f1",
                        color: d.isActive ? "#166534" : "var(--muted)",
                      }}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <RowMenu onEdit={() => openEdit(d)} onDelete={() => setDeleteTarget(d)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-2.5 md:hidden">
        {loading ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white" style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>Loading disciplines…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white" style={{ padding: "40px 20px", textAlign: "center", fontSize: 12, color: "var(--muted)" }}>No disciplines yet.</div>
        ) : (
          rows.map(({ discipline: d, depth }) => (
            <div key={d.id} className="rounded-[12px] border border-[var(--border)] bg-white p-3.5" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {depth > 0 && <span style={{ color: "var(--muted)", fontSize: 13 }}>↳</span>}
                  <span style={{ fontSize: 13, fontWeight: depth === 0 ? 700 : 600, color: "var(--text)" }}>{d.name}</span>
                </div>
                <RowMenu onEdit={() => openEdit(d)} onDelete={() => setDeleteTarget(d)} />
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{depth === 0 ? "Top-level" : "Sub-discipline"}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                  background: d.isActive ? "#dcfce7" : "#f1f1f1",
                  color: d.isActive ? "#166534" : "var(--muted)",
                }}>
                  {d.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Discipline">
        <form onSubmit={handleCreate}>
          <DisciplineFormFields form={createForm} setForm={setCreateForm} topLevel={topLevel} />
          {createError && <p style={{ fontSize: 11.5, color: "var(--red)", marginTop: 4, marginBottom: 0 }}>{createError}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setCreateOpen(false)} style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={creating} style={{ fontSize: 12, fontWeight: 700, color: "white", background: creating ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: creating ? "not-allowed" : "pointer" }}>{creating ? "Creating…" : "Create Discipline"}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Discipline">
        <form onSubmit={handleEdit}>
          <DisciplineFormFields form={editForm} setForm={setEditForm} topLevel={topLevel} excludeId={editTarget?.id} />
          {editError && <p style={{ fontSize: 11.5, color: "var(--red)", marginTop: 4, marginBottom: 0 }}>{editError}</p>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setEditTarget(null)} style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={editing} style={{ fontSize: 12, fontWeight: 700, color: "white", background: editing ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: editing ? "not-allowed" : "pointer" }}>{editing ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Discipline">
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0 }}>
            <TrashIcon />
          </div>
          <div>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Delete &ldquo;{deleteTarget?.name}&rdquo;?</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
              Disciplines with sub-disciplines or assigned panel members cannot be deleted.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={() => setDeleteTarget(null)} style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
          <button type="button" disabled={deleting} onClick={handleDelete} style={{ fontSize: 12, fontWeight: 700, color: "white", background: deleting ? "var(--muted)" : "#dc2626", border: "none", borderRadius: 8, padding: "8px 18px", cursor: deleting ? "not-allowed" : "pointer" }}>{deleting ? "Deleting…" : "Delete Discipline"}</button>
        </div>
      </Modal>
    </section>
  );
}
