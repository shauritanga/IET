import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useNavigate } from "react-router";
import { Button, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
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
  assignedEvaluatorId?: string;
  submittedAt?: string;
  stageUpdatedAt?: string;
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

const AVATAR_COLORS = [
  "bg-[var(--red)]",
  "bg-[#1565C0]",
  "bg-[#4527A0]",
  "bg-[#2E7D32]",
  "bg-[#880E4F]",
  "bg-[#F97316]",
];

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function avatarColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
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

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All Stages");
  const [search, setSearch] = useState("");

  async function loadApplications() {
    setLoading(true);
    setPageError(null);
    try {
      const statuses: AppStatus[] = ["IN_REVIEW", "APPROVED", "REJECTED", "CHANGES_REQUESTED"];
      const responses = await Promise.all(
        statuses.map((status) =>
          http.get<ApiEnvelope<ApplicationRow[]>>(`/admin/applications?status=${status}&limit=200`),
        ),
      );
      const seen = new Set<string>();
      const combined = responses
        .flatMap((response) => response.data.data ?? [])
        .filter((row) => {
          if (seen.has(row.id)) return false;
          seen.add(row.id);
          return true;
        });
      setRows(combined);
    } catch (err) {
      const apiErr = err as AxiosError<{ message?: string }>;
      setPageError(apiErr.response?.data?.message ?? "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  const stageOptions = ["All Stages", ...Object.values(STAGE_LABELS)];
  const statusOptions = ["All", ...Object.values(STATUS_LABELS)];

  const visible = useMemo(() => rows.filter((row) => {
    const stageLabel = row.reviewStage ? STAGE_LABELS[row.reviewStage] : "-";
    const statusLabel = STATUS_LABELS[row.status] ?? row.status;
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      row.applicantName?.toLowerCase().includes(term) ||
      row.email?.toLowerCase().includes(term) ||
      row.referenceNumber?.toLowerCase().includes(term);
    return (
      matchesSearch &&
      (stageFilter === "All Stages" || stageLabel === stageFilter) &&
      (statusFilter === "All" || statusLabel === statusFilter)
    );
  }), [rows, search, stageFilter, statusFilter]);

  return (
    <section>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Membership Applications</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Secretariat controls progression; review bodies return recommendations for the next level
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant or reference..."
            className="h-[34px] w-[230px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] text-[11.5px] text-[var(--text)] outline-none focus:border-[var(--red-dark)]"
          />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterSelect value={stageFilter} onChange={setStageFilter} options={stageOptions} />
        </div>
      </div>

      {pageError && (
        <div className="mb-[14px] flex items-center justify-between gap-3 rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          <span>{pageError}</span>
          <Button tone="outline" onClick={() => void loadApplications()}>Retry</Button>
        </div>
      )}

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading applications...</div>
          ) : (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Reference</th>
                  <th>Grade Applied</th>
                  <th>Stage</th>
                  <th>Owner</th>
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
                        <div className={`${avatarColor(row.id)} flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white`}>
                          {initials(row.applicantName ?? "?")}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold">{row.applicantName}</div>
                          <div className="text-[10px] text-[var(--muted)]">{row.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[11px]">{row.referenceNumber ?? "-"}</td>
                    <td className="text-[11.5px]">{row.appliedMembershipClass ?? "-"}</td>
                    <td>
                      {row.reviewStage ? (
                        <StatusBadge tone={STAGE_TONES[row.reviewStage]}>
                          {STAGE_LABELS[row.reviewStage]}
                        </StatusBadge>
                      ) : <span className="text-[var(--muted)]">-</span>}
                    </td>
                    <td className="text-[11.5px]">{row.queueOwnerRole ?? "-"}</td>
                    <td>
                      <StatusBadge tone={STATUS_TONES[row.status]}>
                        {STATUS_LABELS[row.status]}
                      </StatusBadge>
                    </td>
                    <td className="text-[11.5px]">{formatDate(row.submittedAt)}</td>
                    <td>
                      <Button
                        tone={row.status === "IN_REVIEW" ? "dark" : "outline"}
                        onClick={() => navigate(`/dashboard/applications/${row.id}`)}
                      >
                        {row.status === "IN_REVIEW" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-[12px] text-[var(--muted)]" colSpan={8}>
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </section>
  );
}
