import { useEffect, useState, useCallback, type CSSProperties } from "react";
import { isAxiosError } from "axios";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import { Button, StatusBadge } from "~/components/prototype-ui";

// ─── Types ────────────────────────────────────────────────────────────────────

type UpgradeStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type UpgradeApplication = {
  id: string;
  status: UpgradeStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  applicantNotes?: string;
  applicant?: {
    id: string;
    fullName: string;
    email: string;
    membershipId?: string;
  };
  fromCategory?: { id: string; name: string };
  toCategory?: { id: string; name: string };
  reviewer?: { id: string; fullName: string };
};

type EligibilityDetails = {
  canUpgrade: boolean;
  missingRequirements: string[];
  checks: {
    yearsOfExperience: number;
    cpdPoints: number;
    hasPendingApplication: boolean;
    membershipStatus?: string;
    registrationStatus?: string | null;
    documents: Array<{ type: string; present: boolean; verified: boolean }>;
  };
};

type UpgradeApplicationDetails = UpgradeApplication & {
  eligibility?: EligibilityDetails;
};

type MembershipCategory = {
  id: string;
  name: string;
  code?: string | null;
  level: number;
};

type UpgradeRule = {
  id: string;
  fromCategoryId: string;
  toCategoryId: string;
  minYearsExperience: number;
  minCpdPoints: number;
  requiredDocuments: string[];
  requiresActiveMembership: boolean;
  requiresNoPendingApplication: boolean;
  requiresApproval: boolean;
  isActive: boolean;
  description?: string | null;
  fromCategory?: MembershipCategory;
  toCategory?: MembershipCategory;
};

type ReviewModal = {
  applicationId: string;
  applicantName: string;
  fromCategoryName: string;
  toCategoryName: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<UpgradeStatus, "pending" | "approved" | "rejected" | "warning"> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "warning",
};

const STATUS_LABEL: Record<UpgradeStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const AVATAR_COLORS = [
  "bg-[var(--red)]",
  "bg-[#1565C0]",
  "bg-[#4527A0]",
  "bg-[#2E7D32]",
  "bg-[#880E4F]",
  "bg-[#F97316]",
];

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 12,
  borderRadius: 8,
  border: "1.5px solid var(--border, #e5e7eb)",
  background: "var(--bg, #fff)",
  color: "var(--text-primary, #111)",
  outline: "none",
  boxSizing: "border-box",
};

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "??";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  modal,
  onClose,
  onReviewed,
}: {
  modal: ReviewModal;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<UpgradeApplicationDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setDetailsLoading(true);
    http.get<ApiEnvelope<UpgradeApplicationDetails>>(`/admin/upgrades/applications/${modal.applicationId}`)
      .then((res) => { if (active) setDetails(res.data.data); })
      .catch(() => { if (active) setDetails(null); })
      .finally(() => { if (active) setDetailsLoading(false); });
    return () => { active = false; };
  }, [modal.applicationId]);

  const handleSubmit = async () => {
    if (!decision) return;
    if (decision === "REJECTED" && !rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await http.patch(`/admin/upgrades/applications/${modal.applicationId}/review`, {
        status: decision,
        rejectionReason: decision === "REJECTED" ? rejectionReason : undefined,
      });
      onReviewed();
      onClose();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg, #fff)", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "var(--text-primary, #111)" }}>
          Review Upgrade Application
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--text-muted, #666)" }}>
          <strong>{modal.applicantName}</strong> — {modal.fromCategoryName} → {modal.toCategoryName}
        </p>

        <div style={{ marginBottom: 18, padding: 12, borderRadius: 10, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--text-primary, #111)" }}>Eligibility Snapshot</p>
          {detailsLoading ? (
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted, #666)" }}>Loading eligibility details…</p>
          ) : details?.eligibility ? (
            <div style={{ display: "grid", gap: 6, fontSize: 11.5, color: "var(--text-muted, #666)" }}>
              <span>Experience: <strong>{details.eligibility.checks.yearsOfExperience}</strong> years</span>
              <span>CPD points: <strong>{details.eligibility.checks.cpdPoints}</strong></span>
              <span>Membership: <strong>{details.eligibility.checks.membershipStatus ?? "—"}</strong></span>
              {details.eligibility.checks.documents.length > 0 && (
                <span>Documents: {details.eligibility.checks.documents.map((doc) => `${doc.type} ${doc.present ? "present" : "missing"}`).join(", ")}</span>
              )}
              {details.eligibility.missingRequirements.length > 0 && (
                <div style={{ color: "#b45309", marginTop: 4 }}>
                  {details.eligibility.missingRequirements.map((item) => <div key={item}>• {item}</div>)}
                </div>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted, #666)" }}>Eligibility details unavailable.</p>
          )}
        </div>

        {/* Decision buttons */}
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--text-primary, #111)" }}>
          Decision *
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          {(["APPROVED", "REJECTED"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDecision(d)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: `2px solid ${decision === d ? (d === "APPROVED" ? "#2e7d32" : "#c0392b") : "var(--border, #e5e7eb)"}`,
                background: decision === d ? (d === "APPROVED" ? "#e8f5e9" : "#fdecea") : "transparent",
                color: decision === d ? (d === "APPROVED" ? "#2e7d32" : "#c0392b") : "var(--text-muted, #666)",
                transition: "all 0.15s ease",
              }}
            >
              {d === "APPROVED" ? "✓ Approve" : "✗ Reject"}
            </button>
          ))}
        </div>

        {/* Rejection reason */}
        {decision === "REJECTED" && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--text-primary, #111)" }}>
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Explain why this application is being rejected…"
              style={{
                width: "100%", fontSize: 13, borderRadius: 10, padding: "10px 14px",
                border: "1.5px solid var(--border, #e5e7eb)", background: "var(--bg, #fff)",
                resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
                color: "var(--text-primary, #111)", outline: "none",
              }}
            />
          </div>
        )}

        {error && (
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "#c0392b", background: "#fdecea", padding: "8px 12px", borderRadius: 8 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "9px 20px", fontSize: 13, borderRadius: 8, cursor: "pointer",
              border: "1.5px solid var(--border, #e5e7eb)", background: "transparent",
              color: "var(--text-primary, #111)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !decision}
            style={{
              padding: "9px 22px", fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: "pointer",
              background: decision === "APPROVED" ? "#2e7d32" : decision === "REJECTED" ? "#c0392b" : "var(--red, #c0392b)",
              color: "#fff", border: "none",
              opacity: loading || !decision ? 0.6 : 1,
            }}
          >
            {loading ? "Saving…" : "Confirm Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradeRulesPanel() {
  const [rules, setRules] = useState<UpgradeRule[]>([]);
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fromCategoryId: "",
    toCategoryId: "",
    minYearsExperience: "0",
    minCpdPoints: "0",
    requiredDocuments: "CV",
    description: "",
  });

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rulesRes, categoriesRes] = await Promise.all([
        http.get<ApiEnvelope<UpgradeRule[]>>("/admin/upgrades/rules"),
        http.get<ApiEnvelope<MembershipCategory[]>>("/admin/membership-categories?limit=100"),
      ]);
      setRules(rulesRes.data.data ?? []);
      setCategories(categoriesRes.data.data ?? []);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? err.message : "Failed to load upgrade rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRules(); }, [loadRules]);

  const createRule = async () => {
    if (!form.fromCategoryId || !form.toCategoryId) {
      setError("Choose source and target categories.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await http.post("/admin/upgrades/rules", {
        fromCategoryId: form.fromCategoryId,
        toCategoryId: form.toCategoryId,
        minYearsExperience: Number(form.minYearsExperience || 0),
        minCpdPoints: Number(form.minCpdPoints || 0),
        requiredDocuments: form.requiredDocuments.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean),
        description: form.description || undefined,
        requiresActiveMembership: true,
        requiresNoPendingApplication: true,
        requiresApproval: true,
        isActive: true,
      });
      setForm({ fromCategoryId: "", toCategoryId: "", minYearsExperience: "0", minCpdPoints: "0", requiredDocuments: "CV", description: "" });
      await loadRules();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? err.message : "Failed to create upgrade rule.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule: UpgradeRule) => {
    try {
      await http.patch(`/admin/upgrades/rules/${rule.id}`, { isActive: !rule.isActive });
      await loadRules();
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message ?? err.message : "Failed to update rule.");
    }
  };

  return (
    <section style={{ marginTop: 28 }}>
      <div className="page-header" style={{ marginBottom: 12 }}>
        <div>
          <h2 className="page-title" style={{ fontSize: 16 }}>Upgrade Rules</h2>
          <p className="page-subtitle">Configure backend eligibility paths and requirements.</p>
        </div>
      </div>
      {error && <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fdecea", color: "#c0392b", fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <div className="table-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <select style={fieldStyle} value={form.fromCategoryId} onChange={(e) => setForm((f) => ({ ...f, fromCategoryId: e.target.value }))}>
            <option value="">From category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select style={fieldStyle} value={form.toCategoryId} onChange={(e) => setForm((f) => ({ ...f, toCategoryId: e.target.value }))}>
            <option value="">To category</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <input style={fieldStyle} type="number" min="0" placeholder="Min years" value={form.minYearsExperience} onChange={(e) => setForm((f) => ({ ...f, minYearsExperience: e.target.value }))} />
          <input style={fieldStyle} type="number" min="0" placeholder="Min CPD" value={form.minCpdPoints} onChange={(e) => setForm((f) => ({ ...f, minCpdPoints: e.target.value }))} />
          <input style={fieldStyle} placeholder="Required docs, comma-separated" value={form.requiredDocuments} onChange={(e) => setForm((f) => ({ ...f, requiredDocuments: e.target.value }))} />
          <input style={fieldStyle} placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <Button style={{ marginTop: 12 }} disabled={saving} onClick={createRule}>{saving ? "Saving…" : "Create Rule"}</Button>
      </div>
      {loading ? (
        <div style={{ padding: 20, fontSize: 12, color: "var(--text-muted, #666)" }}>Loading rules…</div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead><tr><th>Path</th><th>Requirements</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ fontSize: 12.5, fontWeight: 600 }}>{rule.fromCategory?.name ?? "—"} → {rule.toCategory?.name ?? "—"}</td>
                  <td style={{ fontSize: 12 }}>Years: {rule.minYearsExperience}, CPD: {rule.minCpdPoints}, Docs: {rule.requiredDocuments?.join(", ") || "None"}</td>
                  <td><StatusBadge tone={rule.isActive ? "active" : "warning"}>{rule.isActive ? "Active" : "Inactive"}</StatusBadge></td>
                  <td style={{ textAlign: "right" }}><Button onClick={() => toggleRule(rule)}>{rule.isActive ? "Deactivate" : "Activate"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UpgradeApplicationsPage() {
  const [applications, setApplications] = useState<UpgradeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<UpgradeStatus | "">("");
  const [search, setSearch] = useState("");
  const [reviewModal, setReviewModal] = useState<ReviewModal | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await http.get<ApiEnvelope<UpgradeApplication[]>>(
        `/admin/upgrades/applications?${params.toString()}`
      );
      setApplications(res.data.data ?? []);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Failed to load upgrade applications.");
      } else {
        setError("Unexpected error.");
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchApplications, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchApplications]);

  const pendingCount = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Upgrade Applications</h1>
          <p className="page-subtitle">
            Review membership upgrade requests from engineers
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 10, background: "var(--red)", color: "#fff",
                borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "2px 9px"
              }}>
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px", fontSize: 13, borderRadius: 8, minWidth: 220,
            border: "1.5px solid var(--border, #e5e7eb)", background: "var(--bg, #fff)",
            color: "var(--text-primary, #111)", outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UpgradeStatus | "")}
          style={{
            padding: "8px 14px", fontSize: 13, borderRadius: 8,
            border: "1.5px solid var(--border, #e5e7eb)", background: "var(--bg, #fff)",
            color: "var(--text-primary, #111)", cursor: "pointer", outline: "none",
          }}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={fetchApplications}
          style={{
            padding: "8px 18px", fontSize: 13, borderRadius: 8, cursor: "pointer",
            border: "1.5px solid var(--border, #e5e7eb)", background: "transparent",
            color: "var(--text-primary, #111)",
          }}
        >
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ padding: "16px 18px", borderRadius: 10, background: "#fdecea", color: "#c0392b", fontSize: 13, marginBottom: 18 }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted, #888)", fontSize: 13 }}>
          Loading upgrade applications…
        </div>
      )}

      {/* Empty */}
      {!loading && !error && applications.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          border: "2px dashed var(--border, #e5e7eb)", borderRadius: 14,
          color: "var(--text-muted, #888)", fontSize: 13
        }}>
          No upgrade applications found.
        </div>
      )}

      {/* Table */}
      {!loading && applications.length > 0 && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>From Category</th>
                <th>To Category</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Reviewed</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const name = app.applicant?.fullName ?? "Unknown";
                const color = avatarColor(name);
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          className={`member-avatar ${color}`}
                          aria-hidden="true"
                          style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}
                        >
                          {initials(name)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "var(--text-primary, #111)" }}>{name}</p>
                          <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-muted, #666)" }}>{app.applicant?.email}</p>
                          {app.applicant?.membershipId && (
                            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted, #666)" }}>{app.applicant.membershipId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{app.fromCategory?.name ?? "—"}</td>
                    <td style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary, #111)" }}>{app.toCategory?.name ?? "—"}</td>
                    <td>
                      <StatusBadge tone={STATUS_TONE[app.status]}>{STATUS_LABEL[app.status]}</StatusBadge>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted, #666)" }}>{formatDate(app.submittedAt)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted, #666)" }}>
                      {app.reviewedAt ? (
                        <div>
                          <p style={{ margin: 0 }}>{formatDate(app.reviewedAt)}</p>
                          {app.reviewer && (
                            <p style={{ margin: 0, fontSize: 11 }}>{app.reviewer.fullName}</p>
                          )}
                        </div>
                      ) : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {app.status === "PENDING" ? (
                        <Button
                          onClick={() => setReviewModal({
                            applicationId: app.id,
                            applicantName: app.applicant?.fullName ?? "Unknown",
                            fromCategoryName: app.fromCategory?.name ?? "—",
                            toCategoryName: app.toCategory?.name ?? "—",
                          })}
                        >
                          Review
                        </Button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-muted, #666)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection reason details for rejected rows */}
      {applications.some((a) => a.status === "REJECTED" && a.rejectionReason) && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted, #666)", marginBottom: 10 }}>Rejection Details</h3>
          {applications.filter((a) => a.status === "REJECTED" && a.rejectionReason).map((app) => (
            <div key={app.id} style={{
              padding: "12px 16px", borderRadius: 10, background: "#fdecea",
              border: "1px solid #f5c6c6", marginBottom: 10, fontSize: 12.5
            }}>
              <strong>{app.applicant?.fullName}</strong> ({app.fromCategory?.name} → {app.toCategory?.name}): {app.rejectionReason}
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <ReviewModal
          modal={reviewModal}
          onClose={() => setReviewModal(null)}
          onReviewed={fetchApplications}
        />
      )}
      <UpgradeRulesPanel />
    </div>
  );
}
