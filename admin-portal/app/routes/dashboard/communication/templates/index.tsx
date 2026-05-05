import type { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import {
  type CommunicationTemplate,
  type CommunicationType,
  MESSAGE_TYPES,
  formatDateTime,
  typeLabel,
} from "../shared";

type TemplateForm = {
  name: string;
  type: CommunicationType;
  subject: string;
  body: string;
  isActive: boolean;
};

const EMPTY_FORM: TemplateForm = {
  name: "",
  type: "EMAIL",
  subject: "",
  body: "",
  isActive: true,
};

const PAGE_SIZE = 50;

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function TrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function TemplatesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function TypeBadge({ type }: { type: CommunicationType }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "4px 10px", background: type === "EMAIL" ? "#eff6ff" : "#f0fdf4", color: type === "EMAIL" ? "#1d4ed8" : "#15803d", fontSize: 11, fontWeight: 700 }}>
      {typeLabel(type)}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "4px 10px", background: active ? "#f0fdf4" : "#f9fafb", color: active ? "#15803d" : "#4b5563", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16a34a" : "#6b7280" }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 700,
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
      <div style={{ position: "relative", background: "var(--white)", borderRadius: 16, width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--red-dark)" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%" }}
          >
            <XIcon />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
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
    function closeOnScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  function toggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 164;
      const menuHeight = 92;
      const viewportPadding = 8;
      const topSpace = rect.top;
      const bottomSpace = window.innerHeight - rect.bottom;
      const openBelow = bottomSpace >= menuHeight || bottomSpace >= topSpace;
      const top = openBelow
        ? Math.min(rect.bottom + 6, window.innerHeight - menuHeight - viewportPadding)
        : Math.max(viewportPadding, rect.top - menuHeight - 6);
      const left = Math.max(viewportPadding, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding));
      setMenuStyle({
        position: "fixed",
        top,
        left,
        zIndex: 400,
        width: menuWidth,
      });
    }
    setOpen((value) => !value);
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={btnRef}
        type="button"
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
          color: "var(--muted)",
        }}
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div style={{
          ...menuStyle,
          background: "var(--white)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          minWidth: 150,
          maxHeight: "calc(100vh - 16px)",
          overflowY: "auto",
        }}>
          <button
            type="button"
            onClick={() => { setOpen(false); onEdit(); }}
            style={{ width: "100%", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: "var(--text)", textAlign: "left" }}
          >
            <EditIcon /> Edit
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "0 10px" }} />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            style={{ width: "100%", padding: "9px 14px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 600, color: "#dc2626", textAlign: "left" }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      )}
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
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  paddingRight: 28,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 160,
  resize: "vertical",
};

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
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 5 }}>
        {label}
        {required && <span style={{ color: "var(--red)" }}> *</span>}
      </label>
      {children}
      {hint && <div style={{ marginTop: 5, fontSize: 10.5, color: "var(--muted)" }}>{hint}</div>}
    </div>
  );
}

export default function CommunicationTemplatesPage() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CommunicationTemplate | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CommunicationTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [typeFilter, setTypeFilter] = useState<CommunicationType | "">("");

  async function loadTemplates() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      if (typeFilter) params.set("type", typeFilter);
      const { data } = await http.get<ApiEnvelope<CommunicationTemplate[]>>(`/communication/templates?${params.toString()}`);
      setTemplates(data.data ?? []);
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message ?? "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, [typeFilter]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(template: CommunicationTemplate) {
    setEditing(template);
    setForm({
      name: template.name,
      type: template.type,
      subject: template.subject ?? "",
      body: template.body,
      isActive: template.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  }

  function setField(field: keyof TemplateForm) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = field === "isActive" ? (event.target as HTMLInputElement).checked : event.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value } as TemplateForm;
        if (field === "type" && value === "SMS") {
          next.subject = "";
        }
        return next;
      });
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Template name is required.");
      return;
    }
    if (!form.body.trim()) {
      setFormError("Template body is required.");
      return;
    }
    if (form.type === "EMAIL" && !form.subject.trim()) {
      setFormError("Email templates require a subject.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await http.patch(`/communication/templates/${editing.id}`, {
          name: form.name.trim(),
          type: form.type,
          subject: form.type === "EMAIL" ? form.subject.trim() : undefined,
          body: form.body.trim(),
          isActive: form.isActive,
        });
      } else {
        await http.post("/communication/templates", {
          name: form.name.trim(),
          type: form.type,
          subject: form.type === "EMAIL" ? form.subject.trim() : undefined,
          body: form.body.trim(),
          isActive: form.isActive,
        });
      }
      closeForm();
      void loadTemplates();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setFormError(e.response?.data?.message ?? "Failed to save template.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionError(null);
    try {
      await http.delete(`/communication/templates/${deleteTarget.id}`);
      setDeleteTarget(null);
      void loadTemplates();
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setActionError(e.response?.data?.message ?? "Failed to delete template.");
    }
  }

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((template) => template.isActive).length;
  const emailTemplates = templates.filter((template) => template.type === "EMAIL").length;
  const smsTemplates = templates.filter((template) => template.type === "SMS").length;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Templates</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Manage reusable SMS and Email templates for communication campaigns.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--red)", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          <PlusIcon /> New Template
        </button>
      </div>

      <div className="grid gap-[14px] md:grid-cols-4">
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Templates</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{totalTemplates}</div>
        </article>
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Active</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{activeTemplates}</div>
        </article>
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Email</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{emailTemplates}</div>
        </article>
        <article className="rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">SMS</div>
          <div className="mt-1 text-[24px] font-bold leading-none text-[var(--red-dark)]">{smsTemplates}</div>
        </article>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as CommunicationType | "")} style={{ ...selectStyle, width: "auto", paddingRight: 28 }}>
            <option value="">All Types</option>
            {MESSAGE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}>▾</span>
        </div>

        {typeFilter && (
          <button type="button" onClick={() => setTypeFilter("")} style={{ fontSize: 11.5, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 600 }}>
            Clear filter
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)" }}>
          {error}
        </div>
      )}
      {actionError && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)" }}>
          {actionError}
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--red-dark)", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading templates…</p>
          </div>
        ) : templates.length === 0 ? (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--red-pale)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--red)" }}>
              <TemplatesIcon />
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>No templates found</p>
            <p style={{ fontSize: 11.5, color: "var(--muted)" }}>{typeFilter ? "Try clearing the filter." : "Create a template to reuse messages later."}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  {["Name", "Type", "Subject", "Status", "Updated", "Actions"].map((head) => (
                    <th key={head}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{template.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{template.body.slice(0, 90)}{template.body.length > 90 ? "…" : ""}</div>
                      </div>
                    </td>
                    <td><TypeBadge type={template.type} /></td>
                    <td style={{ fontSize: 11.5, color: "var(--text)" }}>{template.subject ?? "—"}</td>
                    <td><ActiveBadge active={template.isActive} /></td>
                    <td style={{ fontSize: 11.5, color: "var(--text)" }}>{formatDateTime(template.updatedAt)}</td>
                    <td><RowMenu onEdit={() => openEdit(template)} onDelete={() => setDeleteTarget(template)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={closeForm} title={editing ? "Edit Template" : "New Template"}>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            <FormField label="Template Name" required>
              <input style={inputStyle} value={form.name} onChange={setField("name")} placeholder="Renewal reminder" />
            </FormField>
            <FormField label="Template Type" required>
              <select style={selectStyle} value={form.type} onChange={setField("type")}>
                {MESSAGE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {form.type === "EMAIL" && (
            <FormField label="Subject" required>
              <input style={inputStyle} value={form.subject} onChange={setField("subject")} placeholder="Membership renewal reminder" />
            </FormField>
          )}

          <FormField label="Template Body" required>
            <textarea style={textareaStyle} value={form.body} onChange={setField("body")} placeholder={form.type === "EMAIL" ? "Write the email body..." : "Write the SMS body..."} />
          </FormField>

          <FormField label="Active" hint="Inactive templates remain saved but hidden from the default list.">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text)" }}>
              <input type="checkbox" checked={form.isActive} onChange={setField("isActive")} />
              Available for use
            </label>
          </FormField>

          {formError && (
            <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--red)", marginBottom: 14 }}>
              {formError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={closeForm} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ fontSize: 12.5, fontWeight: 700, color: "white", background: saving ? "var(--muted)" : "var(--red)", border: "none", borderRadius: 8, padding: "8px 20px", cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : editing ? "Update Template" : "Create Template"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Template" maxWidth={480}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.6, margin: 0 }}>
            Delete <strong>{deleteTarget?.name}</strong>? This removes the template permanently.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={() => setDeleteTarget(null)} style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", background: "var(--white)", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={() => void confirmDelete()} style={{ fontSize: 12.5, fontWeight: 700, color: "white", background: "#dc2626", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer" }}>
              Delete Template
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
