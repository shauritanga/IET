import type { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import {
  MESSAGE_TYPES,
  RECIPIENT_OPTIONS,
  type CommunicationTemplate,
  type MembershipCategory,
  type CommunicationType,
  type CommunicationTarget,
  formatDateTime,
  typeLabel,
} from "../shared";

type SendFormState = {
  templateId: string;
  type: CommunicationType;
  recipients: CommunicationTarget;
  groupId: string;
  subject: string;
  message: string;
};

type SendSummary = {
  id: string;
  type: CommunicationType;
  target: CommunicationTarget;
  groupId: string | null;
  groupName: string | null;
  subject: string | null;
  message: string;
  status: "PENDING" | "SENT" | "FAILED";
  recipientCount: number;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
};

const EMPTY_FORM: SendFormState = {
  templateId: "",
  type: "SMS",
  recipients: "ALL",
  groupId: "",
  subject: "",
  message: "",
};

function SectionLabel({ children }: { children: string }) {
  return (
    <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
      {children}
    </label>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

const baseInputStyle: React.CSSProperties = {
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

const baseSelectStyle: React.CSSProperties = {
  ...baseInputStyle,
  appearance: "none",
  paddingRight: 30,
};

const baseTextareaStyle: React.CSSProperties = {
  ...baseInputStyle,
  minHeight: 160,
  resize: "vertical",
};

export default function CommunicationSendPage() {
  const [form, setForm] = useState<SendFormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SendSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoadingOptions(true);
      try {
        const [categoriesRes, templatesRes] = await Promise.all([
          http.get<ApiEnvelope<MembershipCategory[]>>("/admin/membership-categories?limit=100"),
          http.get<ApiEnvelope<CommunicationTemplate[]>>("/communication/templates?limit=100"),
        ]);

        if (!active) return;
        setCategories(categoriesRes.data.data ?? []);
        setTemplates(templatesRes.data.data ?? []);
      } catch (err) {
        if (!active) return;
        const e = err as AxiosError<{ message?: string }>;
        setError(e.response?.data?.message ?? "Failed to load communication options.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === form.templateId) ?? null,
    [form.templateId, templates],
  );

  useEffect(() => {
    if (!selectedTemplate) return;
    setForm((prev) => ({
      ...prev,
      type: selectedTemplate.type,
      subject: selectedTemplate.subject ?? "",
      message: selectedTemplate.body,
    }));
  }, [selectedTemplate]);

  function setField(field: keyof SendFormState) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: value } as SendFormState;
        if (field === "type" && value === "SMS") {
          next.subject = "";
        }
        if (field === "templateId" && !value) {
          next.subject = prev.type === "EMAIL" ? prev.subject : "";
        }
        return next;
      });
    };
  }

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (loadingOptions) {
      setError("Communication data is still loading.");
      return;
    }
    if (!form.message.trim()) {
      setError("Message body is required.");
      return;
    }
    if (form.type === "EMAIL" && !form.subject.trim()) {
      setError("Subject is required for email messages.");
      return;
    }
    if (form.recipients === "GROUP" && !form.groupId.trim()) {
      setError("Select a membership category for the recipient group.");
      return;
    }
    if (form.recipients === "GROUP" && categories.length === 0) {
      setError("No membership categories are available.");
      return;
    }

    setSending(true);
    try {
      const { data } = await http.post<ApiEnvelope<SendSummary>>("/communication/send", {
        type: form.type,
        recipients: form.recipients,
        groupId: form.recipients === "GROUP" ? form.groupId : undefined,
        subject: form.type === "EMAIL" ? form.subject.trim() : undefined,
        message: form.message.trim(),
      });

      setSuccess(data.data);
      setForm((prev) => ({
        ...EMPTY_FORM,
        type: prev.type,
        recipients: prev.recipients,
      }));
    } catch (err) {
      const e = err as AxiosError<{ message?: string }>;
      setError(e.response?.data?.message ?? "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--red-dark)", margin: 0 }}>Send Message</h1>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            Send SMS or Email messages to all members or a membership category.
          </p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid var(--border)", borderRadius: 999, background: "var(--white)", padding: "7px 12px", fontSize: 11.5, color: "var(--muted)" }}>
          {form.type === "EMAIL" ? <MailIcon /> : <SmsIcon />}
          <span>{typeLabel(form.type)}</span>
        </div>
      </div>

      {error && (
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#166534" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {success.status === "FAILED" ? "Message completed with failures" : "Message sent successfully"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, color: "#166534" }}>
            <span>{success.recipientCount} recipients</span>
            <span>{success.successfulCount} sent</span>
            <span>{success.failedCount} failed</span>
            <span>{success.sentAt ? formatDateTime(success.sentAt) : formatDateTime(success.createdAt)}</span>
          </div>
        </div>
      )}

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <form onSubmit={(event) => void handleSend(event)} style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <div>
              <SectionLabel>Template</SectionLabel>
              <select
                style={baseSelectStyle}
                value={form.templateId}
                onChange={setField("templateId")}
                disabled={loadingOptions}
              >
                <option value="">{loadingOptions ? "Loading templates…" : "Use a template (optional)"}</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({typeLabel(template.type)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <SectionLabel>Message Type</SectionLabel>
              <select
                style={baseSelectStyle}
                value={form.type}
                onChange={setField("type")}
                disabled={loadingOptions}
              >
                {MESSAGE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <div>
              <SectionLabel>Recipients</SectionLabel>
              <select
                style={baseSelectStyle}
                value={form.recipients}
                onChange={setField("recipients")}
                disabled={loadingOptions}
              >
                {RECIPIENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.recipients === "GROUP" ? (
              <div>
                <SectionLabel>Recipient Group</SectionLabel>
                <select
                  style={baseSelectStyle}
                  value={form.groupId}
                  onChange={setField("groupId")}
                  disabled={loadingOptions || categories.length === 0}
                >
                  <option value="">
                    {loadingOptions ? "Loading categories…" : "Select membership category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 14, fontSize: 11.5, color: "var(--muted)" }}>
                All members will receive this message.
              </div>
            )}
          </div>

          {form.type === "EMAIL" && (
            <div>
              <SectionLabel>Subject</SectionLabel>
              <input
                style={baseInputStyle}
                value={form.subject}
                onChange={setField("subject")}
                placeholder="Membership renewal reminder"
                disabled={loadingOptions}
              />
            </div>
          )}

          <div>
            <SectionLabel>Message Body</SectionLabel>
            <textarea
              style={baseTextareaStyle}
              value={form.message}
              onChange={setField("message")}
              placeholder={form.type === "EMAIL" ? "Write the email body here..." : "Write the SMS message here..."}
              disabled={loadingOptions}
            />
          </div>

          {selectedTemplate && (
            <div style={{ marginTop: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", padding: 14, fontSize: 11.5, color: "var(--muted)" }}>
              <div style={{ fontWeight: 700, color: "var(--red-dark)", marginBottom: 4 }}>Selected template preview</div>
              <div><strong>Name:</strong> {selectedTemplate.name}</div>
              <div><strong>Type:</strong> {typeLabel(selectedTemplate.type)}</div>
              {selectedTemplate.subject && <div><strong>Subject:</strong> {selectedTemplate.subject}</div>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              {form.recipients === "GROUP" ? "Messages will be sent to members in the selected category." : "Messages will be sent to all members."}
            </div>
            <button
              type="submit"
              disabled={sending || loadingOptions}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12.5,
                fontWeight: 700,
                color: "white",
                background: sending || loadingOptions ? "var(--muted)" : "var(--red)",
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                cursor: sending || loadingOptions ? "not-allowed" : "pointer",
              }}
            >
              <SendIcon />
              {sending ? "Sending…" : "Send Now"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
