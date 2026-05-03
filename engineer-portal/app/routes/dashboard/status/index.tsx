import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import http from "~/utils/http";
import type { APIResponse } from "~/types/types";
import type {
  Registration,
  ApplicationReviewStage,
  ApplicationStatus,
} from "~/routes/application/type";
import {
  getRegistrationStatusLabel,
  getReviewStageLabel,
  shouldShowMembershipApplicationCta,
  getMembershipApplicationCtaLabel,
} from "~/utils/application-status";
import { FileIcon } from "~/components/portal/icons";

// ─── constants ───────────────────────────────────────────────────────────────

const REVIEW_STAGES: ApplicationReviewStage[] = [
  "SECRETARIAT_REVIEW",
  "EVALUATOR_REVIEW",
  "MPDC_REVIEW",
  "COUNCIL_REVIEW",
  "APPROVAL_NOTICE_SENT",
];

const STAGE_LABELS: Record<ApplicationReviewStage, string> = {
  SECRETARIAT_REVIEW: "Secretariat Review",
  EVALUATOR_REVIEW: "Technical Evaluation",
  MPDC_REVIEW: "MPDC Review",
  COUNCIL_REVIEW: "Council Approval",
  APPROVAL_NOTICE_SENT: "Approved",
};

// Priority order when picking "most relevant" application
const STATUS_PRIORITY: ApplicationStatus[] = [
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "DRAFT",
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function pickBestRegistration(list: Registration[]): Registration | null {
  if (!list.length) return null;
  return (
    STATUS_PRIORITY.map((s) => list.find((r) => r.status === s)).find(Boolean) ??
    list[0]
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusColor(status: ApplicationStatus | null): string {
  switch (status) {
    case "APPROVED": return "#1a6b3c";
    case "IN_REVIEW": return "#a16207";
    case "CHANGES_REQUESTED": return "#c2410c";
    case "REJECTED": return "#b91c1c";
    default: return "#5a6a7a";
  }
}

function statusBg(status: ApplicationStatus | null): string {
  switch (status) {
    case "APPROVED": return "#dcfce7";
    case "IN_REVIEW": return "#fef9c3";
    case "CHANGES_REQUESTED": return "#ffedd5";
    case "REJECTED": return "#fee2e2";
    default: return "#f1f5f9";
  }
}

function stageIndex(stage: ApplicationReviewStage | null | undefined): number {
  if (!stage) return -1;
  return REVIEW_STAGES.indexOf(stage);
}

// ─── fetch ───────────────────────────────────────────────────────────────────

async function fetchApplicationStatus(): Promise<Registration | null> {
  const { data } = await http.get<APIResponse<Registration[]>>("/registrations");
  return pickBestRegistration(data.data ?? []);
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ApplicationStatus | null }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        background: statusBg(status),
        color: statusColor(status),
      }}
    >
      {getRegistrationStatusLabel(status)}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--iet-muted)" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--iet-red-dark)" }}>{value}</span>
    </div>
  );
}

function StageTracker({ currentStage }: { currentStage: ApplicationReviewStage | null | undefined }) {
  const current = stageIndex(currentStage);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
      {REVIEW_STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={stage} style={{ display: "flex", alignItems: "center", flex: i < REVIEW_STAGES.length - 1 ? "1" : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 72 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? "#1a6b3c" : active ? "var(--iet-red-dark)" : "#f1f5f9",
                  border: active ? "3px solid var(--iet-red)" : "2px solid " + (done ? "#1a6b3c" : "#e2e8f0"),
                  color: done || active ? "white" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {done ? (
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 600,
                  color: done ? "#1a6b3c" : active ? "var(--iet-red-dark)" : "#94a3b8",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < REVIEW_STAGES.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginTop: -18,
                  marginInline: 4,
                  background: done ? "#1a6b3c" : "#e2e8f0",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function HistoryTimeline({ history }: { history: Registration["stageHistory"] }) {
  if (!history?.length) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const actionLabel = (action: string) => {
    const map: Record<string, string> = {
      SUBMITTED: "Application submitted",
      ASSIGNED: "Assigned to evaluator",
      ADVANCED: "Advanced to next stage",
      RETURNED_FOR_CHANGES: "Returned for changes",
      REJECTED: "Application rejected",
      APPROVED_BY_COUNCIL: "Approved by Council",
      NOTICE_SENT: "Approval notice sent",
      RESUBMITTED: "Application resubmitted",
    };
    return map[action] ?? action;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {sorted.map((entry, i) => (
        <div key={entry.id} style={{ display: "flex", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i === 0 ? "var(--iet-red)" : "#cbd5e1",
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            {i < sorted.length - 1 && (
              <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginBlock: 4 }} />
            )}
          </div>
          <div style={{ paddingBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--iet-red-dark)" }}>
              {actionLabel(entry.action)}
            </div>
            {entry.toStage && (
              <div style={{ fontSize: 11, color: "var(--iet-muted)", marginTop: 1 }}>
                → {getReviewStageLabel(entry.toStage)}
              </div>
            )}
            {entry.comments && (
              <div
                style={{
                  marginTop: 6,
                  padding: "8px 12px",
                  background: "#fef9c3",
                  border: "1px solid #fde68a",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#713f12",
                  lineHeight: 1.5,
                }}
              >
                {entry.comments}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 4 }}>
              {formatDate(entry.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ApplicationStatusPage() {
  const { data: registration, isLoading, isError, refetch } = useQuery({
    queryKey: ["application-status"],
    queryFn: fetchApplicationStatus,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const status = registration?.status ?? null;
  const showStageTracker = status === "IN_REVIEW" || status === "APPROVED" || registration?.reviewStage != null;
  const hasHistory = (registration?.stageHistory?.length ?? 0) > 0;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--iet-red-dark)" }}>
            Application Status
          </h3>
          <p style={{ fontSize: 11.5, color: "var(--iet-muted)", marginTop: 2 }}>
            Track your membership application progress
          </p>
        </div>
        {shouldShowMembershipApplicationCta(status) && !isLoading && (
          <Link to="/application/personal-details">
            <button
              type="button"
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                background: "var(--iet-red)",
                color: "white",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {getMembershipApplicationCtaLabel(status)}
            </button>
          </Link>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--iet-muted)", fontSize: 13 }}>
          Loading your application…
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          className="card"
          style={{ padding: 24, textAlign: "center", color: "#b91c1c", fontSize: 13 }}
        >
          Failed to load application data.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            style={{ color: "var(--iet-red)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* No application */}
      {!isLoading && !isError && !registration && (
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ marginBottom: 12, color: "#cbd5e1" }}>
            <FileIcon width="40" height="40" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--iet-red-dark)", marginBottom: 6 }}>
            No Application Found
          </div>
          <p style={{ fontSize: 12.5, color: "var(--iet-muted)", marginBottom: 20, maxWidth: 340, margin: "0 auto 20px" }}>
            You haven't started a membership application yet. Apply to join IET Tanzania.
          </p>
          <Link to="/application/personal-details">
            <button
              type="button"
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background: "var(--iet-red)",
                color: "white",
                border: "none",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Apply for Membership
            </button>
          </Link>
        </div>
      )}

      {/* Application data */}
      {!isLoading && !isError && registration && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Overview card */}
          <div className="card">
            <div className="card-head">
              <span className="card-title">Application Overview</span>
              <StatusBadge status={status} />
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
                <InfoRow
                  label="Reference No."
                  value={registration.referenceNumber ?? "Pending"}
                />
                <InfoRow
                  label="Membership Class"
                  value={registration.registrationDetails?.appliedMembershipClass ?? "—"}
                />
                <InfoRow
                  label="Discipline"
                  value={registration.registrationDetails?.engineeringDiscipline ?? "—"}
                />
                <InfoRow
                  label="Submitted"
                  value={formatDate(registration.submittedAt)}
                />
                {registration.reviewStage && (
                  <InfoRow
                    label="Current Stage"
                    value={getReviewStageLabel(registration.reviewStage)}
                  />
                )}
              </div>

              {/* Changes requested / Rejection reason */}
              {status === "CHANGES_REQUESTED" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: "#ffedd5",
                    border: "1px solid #fed7aa",
                    borderRadius: 10,
                    fontSize: 12.5,
                    color: "#7c2d12",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Action Required:</strong> The secretariat has requested changes to your
                  application. Please review the feedback in the timeline below and resubmit.
                </div>
              )}
              {status === "REJECTED" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: "#fee2e2",
                    border: "1px solid #fca5a5",
                    borderRadius: 10,
                    fontSize: 12.5,
                    color: "#7f1d1d",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Application Rejected.</strong> Please review the reason in the timeline
                  below. You may start a new application.
                </div>
              )}
              {status === "APPROVED" && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 16px",
                    background: "#dcfce7",
                    border: "1px solid #86efac",
                    borderRadius: 10,
                    fontSize: 12.5,
                    color: "#14532d",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>Congratulations!</strong> Your membership application has been approved.
                  Your membership certificate and ID will be issued shortly.
                </div>
              )}
            </div>
          </div>

          {/* Review stage tracker */}
          {showStageTracker && (
            <div className="card">
              <div className="card-head">
                <span className="card-title">Review Progress</span>
              </div>
              <div className="card-body">
                <StageTracker currentStage={registration.reviewStage} />
              </div>
            </div>
          )}

          {/* History timeline */}
          {hasHistory && (
            <div className="card">
              <div className="card-head">
                <span className="card-title">Application Timeline</span>
              </div>
              <div className="card-body">
                <HistoryTimeline history={registration.stageHistory} />
              </div>
            </div>
          )}

          {/* Draft state guidance */}
          {status === "DRAFT" && (
            <div className="card">
              <div className="card-head">
                <span className="card-title">Next Steps</span>
              </div>
              <div className="card-body" style={{ fontSize: 12.5, color: "var(--iet-muted)", lineHeight: 1.7 }}>
                Your application is still a draft. Complete all sections and submit to begin the
                review process.
                <div style={{ marginTop: 14 }}>
                  <Link to="/application/personal-details">
                    <button
                      type="button"
                      style={{
                        padding: "8px 18px",
                        borderRadius: 8,
                        background: "var(--iet-red)",
                        color: "white",
                        border: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Continue Application →
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
