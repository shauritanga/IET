import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Button, Modal, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";
import { getStoredUser } from "~/utils/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewStage =
  | "SECRETARIAT_REVIEW"
  | "EVALUATOR_REVIEW"
  | "MPDC_REVIEW"
  | "COUNCIL_REVIEW"
  | "APPROVAL_NOTICE_SENT";

type AppStatus = "IN_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

type ApplicationRow = {
  id: string;
  referenceNumber?: string;
  applicantName: string;
  email: string;
  appliedMembershipClass?: string;
  engineeringDiscipline?: string;
  status: AppStatus;
  reviewStage?: ReviewStage;
  queueOwnerRole?: string;
  submittedAt?: string;
  stageUpdatedAt?: string;
};

type ApplicationDetail = ApplicationRow & {
  applicant: { id: string; fullName: string; email: string; phoneNumber?: string };
  reviewComments?: string;
  rejectionReason?: string;
  educations: Array<{ institutionName: string; qualification: string; startDate: string; endDate?: string }>;
  experiences: Array<{ employerName: string; position: string; startDate: string; endDate?: string }>;
  references: Array<{ fullName: string; membershipNumber: string; membershipCategory: string; referenceType: string }>;
  stageHistory: Array<{ stage: string; action: string; comments?: string; createdAt: string }>;
};

type EvaluatorUser = {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
};

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<ReviewStage, string> = {
  SECRETARIAT_REVIEW: "Secretariat Review",
  EVALUATOR_REVIEW: "Evaluator Review",
  MPDC_REVIEW: "MPDC Review",
  COUNCIL_REVIEW: "Council Review",
  APPROVAL_NOTICE_SENT: "Approval Notice Sent",
};

const STAGE_TONES: Record<ReviewStage, "pending" | "blue" | "warning" | "approved"> = {
  SECRETARIAT_REVIEW: "warning",
  EVALUATOR_REVIEW: "blue",
  MPDC_REVIEW: "pending",
  COUNCIL_REVIEW: "pending",
  APPROVAL_NOTICE_SENT: "approved",
};

const STATUS_TONES: Record<AppStatus, "pending" | "approved" | "rejected" | "warning"> = {
  IN_REVIEW: "warning",
  APPROVED: "approved",
  REJECTED: "rejected",
  CHANGES_REQUESTED: "pending",
};

const STATUS_LABELS: Record<AppStatus, string> = {
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
};

// ─── Next action label ────────────────────────────────────────────────────────

function nextActionLabel(stage?: ReviewStage): string {
  switch (stage) {
    case "SECRETARIAT_REVIEW": return "Send to Evaluator";
    case "EVALUATOR_REVIEW": return "Advance to MPDC";
    case "MPDC_REVIEW": return "Advance to Council";
    case "COUNCIL_REVIEW": return "Approve & Notify";
    default: return "Advance Stage";
  }
}

function nextAction(stage?: ReviewStage): string {
  switch (stage) {
    case "SECRETARIAT_REVIEW": return "ASSIGN_EVALUATOR";
    case "EVALUATOR_REVIEW": return "ADVANCE_TO_MPDC";
    case "MPDC_REVIEW": return "ADVANCE_TO_COUNCIL";
    case "COUNCIL_REVIEW": return "APPROVE";
    default: return "APPROVE";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-[var(--red)]", "bg-[#1565C0]", "bg-[#4527A0]",
  "bg-[#2E7D32]", "bg-[#880E4F]", "bg-[#F97316]",
];

function avatarColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSelect({ value, options, onChange }: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    >
      {options.map((opt) => <option key={opt}>{opt}</option>)}
    </select>
  );
}

function InfoGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-x-5 gap-y-[10px] rounded-[10px] border border-[var(--border)] bg-[var(--red-pale)] p-4">
      {items.map(({ label, value }) => (
        <div key={label}>
          <div className="text-[9.5px] uppercase tracking-[0.6px] text-[var(--muted)]">{label}</div>
          <div className="mt-[2px] text-[12px] font-semibold text-[var(--text)]">{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const currentUser = getStoredUser();
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [evaluators, setEvaluators] = useState<EvaluatorUser[]>([]);
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("");
  const [membershipClass, setMembershipClass] = useState("MIET");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All Stages");

  async function loadApplications() {
    setLoading(true);
    setPageError(null);
    try {
      // Load IN_REVIEW applications by default; also load all for admin visibility
      const [inReview, others] = await Promise.all([
        http.get<ApiEnvelope<ApplicationRow[]>>("/admin/applications?status=IN_REVIEW&limit=200"),
        http.get<ApiEnvelope<ApplicationRow[]>>("/admin/applications?status=APPROVED&limit=50"),
      ]);
      const combined = [...(inReview.data.data ?? []), ...(others.data.data ?? [])];
      // deduplicate by id
      const seen = new Set<string>();
      setRows(combined.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; }));
    } catch (err) {
      const apiErr = err as AxiosError<{ message?: string }>;
      setPageError(apiErr.response?.data?.message ?? "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadApplications(); }, []);

  async function openDetail(row: ApplicationRow) {
    setSelectedId(row.id);
    setComments("");
    setSelectedEvaluatorId("");
    setMembershipClass(row.appliedMembershipClass ?? "MIET");
    setActionError(null);
    setDetailLoading(true);
    setDetail(null);
    try {
      const { data } = await http.get<ApiEnvelope<ApplicationDetail>>(`/admin/applications/${row.id}`);
      setDetail(data.data);
      setMembershipClass(data.data.appliedMembershipClass ?? "MIET");
      if (data.data.reviewStage === "SECRETARIAT_REVIEW") {
        const evaluatorResponse = await http.get<ApiEnvelope<EvaluatorUser[]>>("/admin/users/evaluators");
        setEvaluators(evaluatorResponse.data.data ?? []);
      }
    } catch {
      setActionError("Failed to load application details.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeModal() {
    if (actionPending) return;
    setSelectedId(null);
    setDetail(null);
    setActionError(null);
    setComments("");
    setSelectedEvaluatorId("");
  }

  async function performAction(action: string) {
    if (!detail) return;
    if (action === "ASSIGN_EVALUATOR" && !selectedEvaluatorId) {
      setActionError("Select an evaluator before sending the application forward.");
      return;
    }
    setActionPending(true);
    setActionError(null);
    try {
      const payload: Record<string, string | undefined> = {
        action,
        comments: comments.trim() || undefined,
      };
      if (action === "ASSIGN_EVALUATOR") payload.evaluatorId = selectedEvaluatorId;
      if (action === "APPROVE") payload.membershipClass = membershipClass;
      await http.patch(`/admin/applications/${detail.id}/stage`, payload);
      await loadApplications();
      closeModal();
    } catch (err) {
      const apiErr = err as AxiosError<{ message?: string }>;
      setActionError(apiErr.response?.data?.message ?? "Action failed. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  const stageOptions = ["All Stages", ...Object.values(STAGE_LABELS)];
  const statusOptions = ["All", "In Review", "Approved", "Rejected", "Changes Requested"];

  const visible = useMemo(() => rows.filter((r) => {
    const stageLabel = r.reviewStage ? STAGE_LABELS[r.reviewStage] : "—";
    const statusLabel = STATUS_LABELS[r.status] ?? r.status;
    const matchStage = stageFilter === "All Stages" || stageLabel === stageFilter;
    const matchStatus = statusFilter === "All" || statusLabel === statusFilter;
    return matchStage && matchStatus;
  }), [rows, stageFilter, statusFilter]);

  const canAdvance = detail?.status === "IN_REVIEW" && detail.reviewStage !== "APPROVAL_NOTICE_SENT";
  const canUseWorkflow =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    (currentUser?.role === "SECRETARIAT" && detail?.reviewStage === "SECRETARIAT_REVIEW") ||
    ((currentUser?.role === "EVALUATOR" || currentUser?.role === "REVIEWER") && detail?.reviewStage === "EVALUATOR_REVIEW") ||
    (currentUser?.role === "MPDC" && detail?.reviewStage === "MPDC_REVIEW") ||
    (currentUser?.role === "COUNCIL" && detail?.reviewStage === "COUNCIL_REVIEW");

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Membership Applications</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Review and move each application through the approval workflow
          </p>
        </div>
        <div className="flex gap-2">
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterSelect value={stageFilter} onChange={setStageFilter} options={stageOptions} />
        </div>
      </div>

      {pageError && (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)] flex items-center justify-between gap-3">
          <span>{pageError}</span>
          <Button tone="outline" onClick={() => void loadApplications()}>Retry</Button>
        </div>
      )}

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading applications…</div>
          ) : (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Grade Applied</th>
                  <th>Discipline</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`${avatarColor(row.id)} flex h-[30px] w-[30px] items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0`}>
                          {initials(row.applicantName ?? "?")}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold">{row.applicantName}</div>
                          <div className="text-[10px] text-[var(--muted)]">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[11.5px]">{row.appliedMembershipClass ?? "—"}</td>
                    <td className="text-[11.5px]">{row.engineeringDiscipline ?? "—"}</td>
                    <td>
                      {row.reviewStage ? (
                        <StatusBadge tone={STAGE_TONES[row.reviewStage]}>
                          {STAGE_LABELS[row.reviewStage]}
                        </StatusBadge>
                      ) : <span className="text-[var(--muted)]">—</span>}
                    </td>
                    <td>
                      <StatusBadge tone={STATUS_TONES[row.status]}>
                        {STATUS_LABELS[row.status]}
                      </StatusBadge>
                    </td>
                    <td className="text-[11.5px]">{formatDate(row.submittedAt)}</td>
                    <td>
                      <Button
                        tone={row.status === "IN_REVIEW" ? "dark" : "outline"}
                        onClick={() => void openDetail(row)}
                      >
                        {row.status === "IN_REVIEW" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[12px] text-[var(--muted)]" colSpan={7}>
                      {loading ? "Loading…" : "No applications found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Detail / Workflow Modal */}
      <Modal
        title={detail ? `Workflow: ${detail.applicantName}` : "Application"}
        open={Boolean(selectedId)}
        onClose={closeModal}
        bodyClassName="space-y-4"
        footer={
          detail && !detailLoading ? (
            <div className="flex justify-end gap-[9px]">
              <Button tone="outline" onClick={closeModal} disabled={actionPending}>Cancel</Button>
              {canAdvance && canUseWorkflow && (
                <>
                  <Button
                    tone="outline"
                    className="border-[var(--red-light)] text-[var(--red)]"
                    onClick={() => void performAction("RETURN_FOR_CHANGES")}
                    disabled={actionPending}
                  >
                    Return for Changes
                  </Button>
                  <Button
                    tone="outline"
                    className="border-[var(--red-light)] text-[var(--red)]"
                    onClick={() => void performAction("REJECT")}
                    disabled={actionPending}
                  >
                    Reject
                  </Button>
                  <Button
                    tone="green"
                    onClick={() => void performAction(nextAction(detail.reviewStage))}
                    disabled={actionPending}
                  >
                    {actionPending ? "Saving…" : nextActionLabel(detail.reviewStage)}
                  </Button>
                </>
              )}
            </div>
          ) : undefined
        }
      >
        {detailLoading ? (
          <div className="py-6 text-center text-[12px] text-[var(--muted)]">Loading details…</div>
        ) : detail ? (
          <>
            <InfoGrid items={[
              { label: "Applicant", value: detail.applicantName },
              { label: "Grade Applied", value: detail.appliedMembershipClass ?? "—" },
              { label: "Discipline", value: detail.engineeringDiscipline ?? "—" },
              { label: "Current Stage", value: detail.reviewStage ? STAGE_LABELS[detail.reviewStage] : "—" },
              { label: "Status", value: STATUS_LABELS[detail.status] },
              { label: "Submitted", value: formatDate(detail.submittedAt) },
            ]} />

            {/* References */}
            {detail.references?.length > 0 && (
              <div>
                <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">References</p>
                <div className="space-y-[6px]">
                  {detail.references.map((ref, i) => (
                    <div key={i} className="flex items-center justify-between rounded-[8px] border border-[var(--border)] px-3 py-[8px] text-[11.5px]">
                      <span className="font-semibold">{ref.fullName}</span>
                      <span className="text-[var(--muted)]">{ref.membershipCategory} · {ref.membershipNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage history */}
            {detail.stageHistory?.length > 0 && (
              <div>
                <p className="mb-[6px] text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Stage History</p>
                <div className="space-y-[4px]">
                  {detail.stageHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="mt-[1px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--red)] mt-[5px]" />
                      <span className="font-semibold text-[var(--text)]">{h.action}</span>
                      {h.comments && <span className="text-[var(--muted)]">— {h.comments}</span>}
                      <span className="ml-auto shrink-0 text-[var(--muted)]">{formatDate(h.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments field */}
            {canAdvance && canUseWorkflow && (
              <div className="space-y-[12px]">
                {detail.reviewStage === "SECRETARIAT_REVIEW" && (
                  <label className="block">
                    <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                      Assigned Evaluator
                    </span>
                    <select
                      value={selectedEvaluatorId}
                      onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                      className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
                    >
                      <option value="">Select evaluator...</option>
                      {evaluators.map((evaluator) => {
                        const name = evaluator.fullName || `${evaluator.firstName ?? ""} ${evaluator.lastName ?? ""}`.trim() || evaluator.email;
                        return <option key={evaluator.id} value={evaluator.id}>{name} - {evaluator.email}</option>;
                      })}
                    </select>
                  </label>
                )}
                {detail.reviewStage === "COUNCIL_REVIEW" && (
                  <label className="block">
                    <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                      Approved Membership Grade
                    </span>
                    <select
                      value={membershipClass}
                      onChange={(e) => setMembershipClass(e.target.value)}
                      className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
                    >
                      {["GRADUATE", "ASSOCIATE", "MIET", "CORPORATE", "SENIOR", "FELLOW", "HONORARY"].map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </label>
                )}
                <div>
                  <label className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                    Notes / Reason
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add notes about this workflow decision..."
                    className="w-full resize-y rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
                  />
                </div>
              </div>
            )}

            {actionError && (
              <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
                {actionError}
              </div>
            )}
          </>
        ) : null}
      </Modal>
    </section>
  );
}
