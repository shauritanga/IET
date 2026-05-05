import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Link, useNavigate, useParams } from "react-router";
import { Button, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import { getStoredUser } from "~/utils/auth";
import type { ApiEnvelope } from "~/types";

type ReviewStage =
  | "SECRETARIAT_REVIEW"
  | "EVALUATOR_REVIEW"
  | "SECRETARIAT_EVALUATOR_RECOMMENDATION"
  | "MPDC_REVIEW"
  | "SECRETARIAT_MPDC_RECOMMENDATION"
  | "COUNCIL_REVIEW"
  | "SECRETARIAT_COUNCIL_RECOMMENDATION"
  | "APPROVAL_NOTICE_SENT";

type AppStatus = "IN_REVIEW" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

type ApplicationDetail = {
  id: string;
  referenceNumber?: string;
  applicantName: string;
  email: string;
  applicant: { id: string; fullName: string; email: string; phoneNumber?: string };
  appliedMembershipClass?: string;
  engineeringDiscipline?: string;
  status: AppStatus;
  reviewStage?: ReviewStage;
  assignedEvaluatorId?: string;
  submittedAt?: string;
  stageUpdatedAt?: string;
  reviewComments?: string;
  rejectionReason?: string;
  educations: Array<{ institutionName?: string; qualification?: string; startDate?: string; endDate?: string }>;
  experiences: Array<{ employerName?: string; position?: string; startDate?: string; endDate?: string }>;
  documents: Array<{ id: string; documentType?: string; fileName?: string; fileUrl?: string; status?: string }>;
  references: Array<{ fullName?: string; membershipNumber?: string; membershipCategory?: string; referenceType?: string }>;
  stageHistory: Array<{ fromStage?: ReviewStage; toStage: ReviewStage; action: string; comments?: string; createdAt: string }>;
};

type EvaluatorUser = {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
};

const STAGE_LABELS: Record<ReviewStage, string> = {
  SECRETARIAT_REVIEW: "Secretariat Review",
  EVALUATOR_REVIEW: "Evaluator Review",
  SECRETARIAT_EVALUATOR_RECOMMENDATION: "Secretariat - Evaluator Recommendation",
  MPDC_REVIEW: "MPDC Review",
  SECRETARIAT_MPDC_RECOMMENDATION: "Secretariat - MPDC Recommendation",
  COUNCIL_REVIEW: "Council Review",
  SECRETARIAT_COUNCIL_RECOMMENDATION: "Secretariat - Council Recommendation",
  APPROVAL_NOTICE_SENT: "Approval Notice Sent",
};

const STAGE_TONES: Record<ReviewStage, "pending" | "blue" | "warning" | "approved"> = {
  SECRETARIAT_REVIEW: "warning",
  EVALUATOR_REVIEW: "blue",
  SECRETARIAT_EVALUATOR_RECOMMENDATION: "warning",
  MPDC_REVIEW: "pending",
  SECRETARIAT_MPDC_RECOMMENDATION: "warning",
  COUNCIL_REVIEW: "pending",
  SECRETARIAT_COUNCIL_RECOMMENDATION: "warning",
  APPROVAL_NOTICE_SENT: "approved",
};

const STATUS_LABELS: Record<AppStatus, string> = {
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
};

const STATUS_TONES: Record<AppStatus, "pending" | "approved" | "rejected" | "warning"> = {
  IN_REVIEW: "warning",
  APPROVED: "approved",
  REJECTED: "rejected",
  CHANGES_REQUESTED: "pending",
};

const MEMBERSHIP_CLASSES = ["GRADUATE", "ASSOCIATE", "MIET", "CORPORATE", "SENIOR", "FELLOW", "HONORARY"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function actionLabel(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function evaluatorName(evaluator: EvaluatorUser) {
  return evaluator.fullName || `${evaluator.firstName ?? ""} ${evaluator.lastName ?? ""}`.trim() || evaluator.email;
}

function DetailRows({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <div className="divide-y divide-[var(--border)]">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 py-[9px] text-[12px]">
          <span className="font-bold text-[var(--muted)]">{label}</span>
          <span className="font-semibold text-[var(--text)]">{value}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--border)] pt-4">
      <h2 className="mb-3 text-[13px] font-extrabold text-[var(--red-dark)]">{title}</h2>
      {children}
    </section>
  );
}

function getPrimaryAction(stage?: ReviewStage, role?: string | null) {
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSecretariat = role === "SECRETARIAT" || isAdmin;
  if (stage === "EVALUATOR_REVIEW" && (role === "EVALUATOR" || role === "REVIEWER" || isAdmin)) {
    return { action: "EVALUATOR_RECOMMEND", label: "Submit Recommendation to Secretariat" };
  }
  if (stage === "MPDC_REVIEW" && (role === "MPDC" || isAdmin)) {
    return { action: "MPDC_RECOMMEND", label: "Submit Recommendation to Secretariat" };
  }
  if (stage === "COUNCIL_REVIEW" && (role === "COUNCIL" || isAdmin)) {
    return { action: "COUNCIL_RECOMMEND", label: "Submit Recommendation to Secretariat" };
  }
  if (!isSecretariat) return null;
  if (stage === "SECRETARIAT_REVIEW") return { action: "ASSIGN_EVALUATOR", label: "Assign Evaluator" };
  if (stage === "SECRETARIAT_EVALUATOR_RECOMMENDATION") return { action: "SECRETARIAT_ADVANCE_TO_MPDC", label: "Advance to MPDC" };
  if (stage === "SECRETARIAT_MPDC_RECOMMENDATION") return { action: "SECRETARIAT_ADVANCE_TO_COUNCIL", label: "Advance to Council" };
  if (stage === "SECRETARIAT_COUNCIL_RECOMMENDATION") return { action: "APPROVE", label: "Approve and Notify" };
  return null;
}

export default function ApplicationReviewPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [evaluators, setEvaluators] = useState<EvaluatorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("");
  const [membershipClass, setMembershipClass] = useState("MIET");

  async function loadDetail() {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get<ApiEnvelope<ApplicationDetail>>(`/admin/applications/${applicationId}`);
      setDetail(data.data);
      setMembershipClass(data.data.appliedMembershipClass ?? "MIET");
      setSelectedEvaluatorId(data.data.assignedEvaluatorId ?? "");
    } catch (err) {
      const apiErr = err as AxiosError<{ message?: string }>;
      setError(apiErr.response?.data?.message ?? "Failed to load application.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDetail();
    async function loadEvaluators() {
      try {
        const { data } = await http.get<ApiEnvelope<EvaluatorUser[]>>("/admin/users/evaluators");
        setEvaluators(data.data ?? []);
      } catch {
        setEvaluators([]);
      }
    }
    void loadEvaluators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const primaryAction = useMemo(
    () => getPrimaryAction(detail?.reviewStage, currentUser?.role),
    [detail?.reviewStage, currentUser?.role],
  );
  const isSecretariat = currentUser?.role === "SECRETARIAT" || currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";
  const canAct = detail?.status === "IN_REVIEW" && primaryAction;
  const canTerminate = detail?.status === "IN_REVIEW" && isSecretariat && detail.reviewStage?.startsWith("SECRETARIAT");

  async function performAction(action: string) {
    if (!detail) return;
    if (action === "ASSIGN_EVALUATOR" && !selectedEvaluatorId) {
      setActionError("Select an evaluator before assigning this application.");
      return;
    }
    if (["EVALUATOR_RECOMMEND", "MPDC_RECOMMEND", "COUNCIL_RECOMMEND", "REJECT", "RETURN_FOR_CHANGES"].includes(action) && !comments.trim()) {
      setActionError("Comments or reason are required for this action.");
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
      setComments("");
      await loadDetail();
    } catch (err) {
      const apiErr = err as AxiosError<{ message?: string }>;
      setActionError(apiErr.response?.data?.message ?? "Action failed. Please try again.");
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return <section className="py-8 text-center text-[12px] text-[var(--muted)]">Loading application...</section>;
  }

  if (error || !detail) {
    return (
      <section className="space-y-4">
        <Link to="/dashboard/applications" className="text-[12px] font-bold text-[var(--red-dark)]">Back to applications</Link>
        <div className="rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[12px] font-semibold text-[var(--red)]">
          {error ?? "Application not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-[18px]">
      <nav className="flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
        <Link to="/dashboard/applications" className="font-extrabold text-[var(--red-dark)]">Applications</Link>
        <span>/</span>
        <span>{detail.referenceNumber ?? detail.applicantName}</span>
      </nav>

      <div className="grid gap-[18px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] px-[22px] py-5">
            <div>
              <h1 className="text-[19px] font-black leading-tight text-[var(--red-dark)]">{detail.applicantName}</h1>
              <p className="mt-1 text-[12px] text-[var(--muted)]">{detail.referenceNumber ?? "-"} · {detail.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {detail.reviewStage && <StatusBadge tone={STAGE_TONES[detail.reviewStage]}>{STAGE_LABELS[detail.reviewStage]}</StatusBadge>}
              <StatusBadge tone={STATUS_TONES[detail.status]}>{STATUS_LABELS[detail.status]}</StatusBadge>
            </div>
          </div>

          <div className="space-y-6 px-[22px] py-5">
            <Section title="Applicant and Application">
              <DetailRows rows={[
                ["Applicant", detail.applicant.fullName],
                ["Email", detail.applicant.email],
                ["Phone", detail.applicant.phoneNumber ?? "-"],
                ["Applied Grade", detail.appliedMembershipClass ?? "-"],
                ["Discipline", detail.engineeringDiscipline ?? "-"],
                ["Submitted", formatDate(detail.submittedAt)],
              ]} />
            </Section>

            <Section title="Education">
              {detail.educations.length ? (
                <div className="divide-y divide-[var(--border)]">
                  {detail.educations.map((education, index) => (
                    <div key={index} className="py-3 text-[12px]">
                      <div className="font-bold text-[var(--text)]">{education.qualification ?? "-"}</div>
                      <div className="mt-1 text-[var(--muted)]">{education.institutionName ?? "-"} · {formatDate(education.startDate)} - {formatDate(education.endDate)}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[12px] text-[var(--muted)]">No education records.</p>}
            </Section>

            <Section title="Professional Experience">
              {detail.experiences.length ? (
                <div className="divide-y divide-[var(--border)]">
                  {detail.experiences.map((experience, index) => (
                    <div key={index} className="py-3 text-[12px]">
                      <div className="font-bold text-[var(--text)]">{experience.position ?? "-"}</div>
                      <div className="mt-1 text-[var(--muted)]">{experience.employerName ?? "-"} · {formatDate(experience.startDate)} - {formatDate(experience.endDate)}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[12px] text-[var(--muted)]">No experience records.</p>}
            </Section>

            <Section title="References">
              {detail.references.length ? (
                <div className="divide-y divide-[var(--border)]">
                  {detail.references.map((reference, index) => (
                    <div key={index} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[12px]">
                      <span className="font-bold text-[var(--text)]">{reference.fullName ?? "-"}</span>
                      <span className="text-[var(--muted)]">{reference.referenceType ?? "-"} · {reference.membershipCategory ?? "-"} · {reference.membershipNumber ?? "-"}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[12px] text-[var(--muted)]">No references.</p>}
            </Section>

            <Section title="Documents">
              {detail.documents.length ? (
                <div className="divide-y divide-[var(--border)]">
                  {detail.documents.map((document) => (
                    <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[12px]">
                      <div>
                        <div className="font-bold text-[var(--text)]">{document.documentType ?? "Document"}</div>
                        <div className="text-[var(--muted)]">{document.fileName ?? "-"}</div>
                      </div>
                      {document.fileUrl ? (
                        <a className="font-bold text-[var(--red-dark)]" href={document.fileUrl} target="_blank" rel="noreferrer">Open</a>
                      ) : <span className="text-[var(--muted)]">No file</span>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-[12px] text-[var(--muted)]">No documents.</p>}
            </Section>

            <Section title="Recommendation and Stage History">
              {detail.stageHistory.length ? (
                <div className="space-y-3">
                  {detail.stageHistory.map((history, index) => (
                    <div key={index} className="border-l-2 border-[var(--red)] pl-3 text-[12px]">
                      <div className="font-extrabold text-[var(--text)]">{actionLabel(history.action)}</div>
                      <div className="mt-1 text-[var(--muted)]">
                        {history.fromStage ? STAGE_LABELS[history.fromStage] : "Start"} to {STAGE_LABELS[history.toStage]} · {formatDate(history.createdAt)}
                      </div>
                      {history.comments && <div className="mt-1 text-[var(--text)]">{history.comments}</div>}
                    </div>
                  ))}
                </div>
              ) : <p className="text-[12px] text-[var(--muted)]">No workflow history.</p>}
            </Section>
          </div>
        </div>

        <aside className="h-fit rounded-[12px] border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-[18px] py-[15px]">
            <h2 className="text-[13px] font-extrabold text-[var(--red-dark)]">Workflow Action</h2>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Review bodies recommend back to Secretariat.</p>
          </div>
          <div className="space-y-4 px-[18px] py-4">
            {detail.status !== "IN_REVIEW" ? (
              <p className="text-[12px] font-semibold text-[var(--muted)]">This application is {STATUS_LABELS[detail.status]}.</p>
            ) : (
              <>
                {detail.reviewStage === "SECRETARIAT_REVIEW" && (
                  <label className="block">
                    <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Evaluator</span>
                    <select
                      value={selectedEvaluatorId}
                      onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                      className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
                    >
                      <option value="">Select evaluator...</option>
                      {evaluators.map((evaluator) => (
                        <option key={evaluator.id} value={evaluator.id}>{evaluatorName(evaluator)} - {evaluator.email}</option>
                      ))}
                    </select>
                  </label>
                )}

                {detail.reviewStage === "SECRETARIAT_COUNCIL_RECOMMENDATION" && (
                  <label className="block">
                    <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Approved Membership Grade</span>
                    <select
                      value={membershipClass}
                      onChange={(e) => setMembershipClass(e.target.value)}
                      className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] outline-none focus:border-[var(--red-dark)]"
                    >
                      {MEMBERSHIP_CLASSES.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-[5px] block text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">Recommendation / Reason</span>
                  <textarea
                    rows={5}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add recommendation notes or decision reason..."
                    className="w-full resize-y rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 py-[9px] text-[12.5px] text-[var(--text)] outline-none focus:border-[var(--red-dark)]"
                  />
                </label>

                {actionError && (
                  <div className="rounded-[8px] border border-[#f0b0b0] bg-[var(--red-pale)] px-3 py-2 text-[11.5px] font-semibold text-[var(--red)]">
                    {actionError}
                  </div>
                )}

                <div className="space-y-2">
                  {canAct && primaryAction && (
                    <Button tone="green" className="w-full" disabled={actionPending} onClick={() => void performAction(primaryAction.action)}>
                      {actionPending ? "Saving..." : primaryAction.label}
                    </Button>
                  )}
                  {canTerminate && (
                    <>
                      <Button tone="outline" className="w-full border-[var(--red-light)] text-[var(--red)]" disabled={actionPending} onClick={() => void performAction("RETURN_FOR_CHANGES")}>
                        Return for Changes and Notify
                      </Button>
                      <Button tone="red" className="w-full" disabled={actionPending} onClick={() => void performAction("REJECT")}>
                        Reject and Notify
                      </Button>
                    </>
                  )}
                  {!canAct && !canTerminate && (
                    <p className="text-[12px] font-semibold text-[var(--muted)]">No workflow action is available for your role at this stage.</p>
                  )}
                </div>
              </>
            )}
            <Button tone="outline" className="w-full" onClick={() => navigate("/dashboard/applications")}>Back to Queue</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
