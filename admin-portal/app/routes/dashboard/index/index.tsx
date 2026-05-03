import type { AxiosError } from "axios";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import http from "~/utils/http";
import type { AdminStats, ApiEnvelope, MemberSummary } from "~/types";
import { Avatar, Button, StatusBadge } from "~/components/prototype-ui";

type DashboardApplicationRow = {
  id: string;
  referenceNumber?: string;
  applicantName: string;
  email: string;
  appliedMembershipClass?: string | null;
  engineeringDiscipline?: string | null;
  status: string;
  submittedAt?: string | null;
  createdAt?: string | null;
};

type DashboardPaymentRow = {
  id: string;
  transactionRef: string;
  memberName: string;
  memberEmail?: string | null;
  description: string;
  amount: number;
  currency: string;
  paymentMethod?: string | null;
  status: string;
  createdAt: string;
};

const MEMBERSHIP_CLASS_LABELS: Record<string, string> = {
  GRADUATE: "Graduate",
  ASSOCIATE: "AMIET",
  MIET: "MIET",
  CORPORATE: "CMIET",
  SENIOR: "SMIET",
  FELLOW: "FIET",
  HONORARY: "Honorary",
};

function MembersKpiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ApplicationsKpiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function RevenueKpiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function EventsKpiIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DashboardCard({
  title,
  action,
  children,
  bodyClassName,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-[18px] py-[15px]">
        <span className="text-[12.5px] font-bold text-[var(--red-dark)]">{title}</span>
        {action ? <div className="text-[11px] font-semibold text-[var(--red)] hover:underline">{action}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function DashboardMetricCard({
  icon,
  value,
  label,
  note,
  noteTone = "success",
  compactValue = false,
}: {
  icon: ReactNode;
  value: string;
  label: string;
  note: string;
  noteTone?: "success" | "warn" | "neutral";
  compactValue?: boolean;
}) {
  const noteClass =
    noteTone === "warn"
      ? "text-[var(--warn)]"
      : noteTone === "neutral"
        ? "text-[var(--muted)]"
        : "text-[var(--success)]";

  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)]">
      <div className="mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[var(--red-pale)] text-[var(--red)]">
        {icon}
      </div>
      <div className={`font-serif-display font-bold leading-none tracking-[-1px] text-[var(--red-dark)] ${compactValue ? "text-[18px]" : "text-[24px]"}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`mt-[6px] text-[10px] font-semibold ${noteClass}`}>{note}</div>
    </article>
  );
}

function DashboardAvatar({
  initials,
  tone,
  small = false,
}: {
  initials: string;
  tone: "red" | "blue" | "green" | "purple" | "pink" | "orange";
  small?: boolean;
}) {
  return <Avatar initials={initials} tone={tone} small={small} />;
}

function formatCurrency(value: number, currency = "TZS") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(value)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

function toneFromId(id: string) {
  const tones: Array<"red" | "blue" | "green" | "purple" | "pink" | "orange"> = [
    "red",
    "blue",
    "green",
    "purple",
    "pink",
    "orange",
  ];

  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) & 0xff;
  return tones[hash % tones.length];
}

function statusTone(status?: string | null): "pending" | "approved" | "rejected" | "warning" | "blue" {
  switch ((status ?? "").toUpperCase()) {
    case "APPROVED":
    case "COMPLETED":
    case "ACTIVE":
      return "approved";
    case "REJECTED":
    case "FAILED":
    case "CANCELLED":
      return "rejected";
    case "CHANGES_REQUESTED":
      return "warning";
    case "IN_REVIEW":
    case "PENDING":
      return "pending";
    default:
      return "blue";
  }
}

function applicationActionLabel(status: string) {
  return status.toUpperCase() === "IN_REVIEW" ? "Review" : "View";
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<DashboardApplicationRow[]>([]);
  const [recentPayments, setRecentPayments] = useState<DashboardPaymentRow[]>([]);
  const [recentMembers, setRecentMembers] = useState<MemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setPageError(null);

      try {
        const [statsResponse, inReviewResponse, approvedResponse, rejectedResponse, changesResponse, paymentsResponse, membersResponse] =
          await Promise.all([
            http.get<ApiEnvelope<AdminStats>>("/admin/dashboard/stats"),
            http.get<ApiEnvelope<DashboardApplicationRow[]>>("/admin/applications?status=IN_REVIEW&limit=6"),
            http.get<ApiEnvelope<DashboardApplicationRow[]>>("/admin/applications?status=APPROVED&limit=6"),
            http.get<ApiEnvelope<DashboardApplicationRow[]>>("/admin/applications?status=REJECTED&limit=6"),
            http.get<ApiEnvelope<DashboardApplicationRow[]>>("/admin/applications?status=CHANGES_REQUESTED&limit=6"),
            http.get<ApiEnvelope<DashboardPaymentRow[]>>("/admin/payments?limit=4"),
            http.get<ApiEnvelope<MemberSummary[]>>("/admin/members?limit=4"),
          ]);

        const allApplications = [
          ...(inReviewResponse.data.data ?? []),
          ...(approvedResponse.data.data ?? []),
          ...(rejectedResponse.data.data ?? []),
          ...(changesResponse.data.data ?? []),
        ];

        const seenIds = new Set<string>();
        const uniqueApplications = allApplications.filter((application) => {
          if (seenIds.has(application.id)) return false;
          seenIds.add(application.id);
          return true;
        });

        uniqueApplications.sort((left, right) => {
          const leftDate = new Date(left.submittedAt ?? left.createdAt ?? 0).getTime();
          const rightDate = new Date(right.submittedAt ?? right.createdAt ?? 0).getTime();
          return rightDate - leftDate;
        });

        setStats(statsResponse.data.data);
        setRecentApplications(uniqueApplications.slice(0, 4));
        setRecentPayments((paymentsResponse.data.data ?? []).slice(0, 4));
        setRecentMembers((membersResponse.data.data ?? []).slice(0, 4));
      } catch (error) {
        const apiError = error as AxiosError<{ message?: string }>;
        setPageError(apiError.response?.data?.message ?? "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const totalMembers = stats?.members.total ?? 0;
  const activeMembers = stats?.members.active ?? 0;
  const pendingApplications = stats?.applications.pending ?? 0;
  const totalRevenue = stats?.payments.totalRevenue ?? 0;
  const revenueThisMonth = stats?.payments.thisMonth ?? 0;
  const upcomingEvents = stats?.events.upcoming ?? 0;
  const totalRegistrations = stats?.events.totalRegistrations ?? 0;

  function displayMemberName(member: MemberSummary) {
    const fullName = member.fullName ?? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
    return fullName || member.email;
  }

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Dashboard Overview</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">Live snapshot of IET Tanzania operations</p>
        </div>
        <Button tone="outline">Export Report</Button>
      </div>

      {pageError ? (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          {pageError}
        </div>
      ) : null}

      <div className="mb-5 grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={<MembersKpiIcon />}
          value={loading ? "—" : formatNumber(totalMembers)}
          label="Total Members"
          note={loading ? "" : `${activeMembers} currently active`}
        />
        <DashboardMetricCard
          icon={<ApplicationsKpiIcon />}
          value={loading ? "—" : String(pendingApplications)}
          label="Pending Applications"
          note={loading ? "" : `${stats?.applications.totalThisYear ?? 0} this year`}
          noteTone="warn"
        />
        <DashboardMetricCard
          icon={<RevenueKpiIcon />}
          value={loading ? "—" : formatCurrency(totalRevenue, stats?.payments.currency ?? "TZS")}
          label="Revenue (2025)"
          note={loading ? "" : `TZS ${new Intl.NumberFormat("en-US").format(revenueThisMonth)} this month`}
          compactValue
        />
        <DashboardMetricCard
          icon={<EventsKpiIcon />}
          value={loading ? "—" : String(upcomingEvents)}
          label="Upcoming Events"
          note={loading ? "" : `${totalRegistrations} registrations`}
          noteTone="neutral"
        />
      </div>

      <div className="mb-[18px] grid gap-[18px] xl:grid-cols-[1.4fr_1fr]">
        <DashboardCard title="Recent Applications" action={<Link to="/dashboard/applications">View all</Link>} bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Grade</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                      Loading applications...
                    </td>
                  </tr>
                ) : recentApplications.length ? (
                  recentApplications.map((application) => {
                    const actionTone = application.status.toUpperCase() === "IN_REVIEW" ? "dark" : "outline";

                    return (
                      <tr key={application.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <DashboardAvatar
                              initials={initialsFromName(application.applicantName)}
                              tone={toneFromId(application.id)}
                            />
                            <div>
                              <div className="text-[12px] font-semibold">{application.applicantName}</div>
                              <div className="text-[10px] text-[var(--muted)]">{application.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-[11.5px]">
                          {application.appliedMembershipClass
                            ? MEMBERSHIP_CLASS_LABELS[application.appliedMembershipClass] ?? application.appliedMembershipClass
                            : "—"}
                        </td>
                        <td className="text-[11.5px]">
                          {formatShortDate(application.submittedAt ?? application.createdAt)}
                        </td>
                        <td>
                          <StatusBadge tone={statusTone(application.status)}>
                            {application.status.replace(/_/g, " ")}
                          </StatusBadge>
                        </td>
                        <td>
                          <Button tone={actionTone}>{applicationActionLabel(application.status)}</Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Payments" action={<Link to="/dashboard/payments">View all</Link>} bodyClassName="p-0">
          <div className="flex flex-col">
            {loading ? (
              <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                Loading payments...
              </div>
            ) : recentPayments.length ? (
              recentPayments.map((payment, index) => (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between px-4 py-[11px] ${index < recentPayments.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div>
                    <div className="text-[12px] font-semibold">{payment.description}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {payment.memberName}{payment.paymentMethod ? ` · ${payment.paymentMethod}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-[var(--red-dark)]">
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                    <StatusBadge tone={statusTone(payment.status)} className="mt-1 text-[9.5px]">
                      {payment.status.replace(/_/g, " ")}
                    </StatusBadge>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                No payments found.
              </div>
            )}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Recent Members" action={<Link to="/dashboard/members">View all</Link>} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table-proto min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th>Member</th>
                <th>Membership No.</th>
                <th>Grade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                    Loading members...
                  </td>
                </tr>
              ) : recentMembers.length ? (
                recentMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <DashboardAvatar
                          initials={initialsFromName(displayMemberName(member))}
                          tone={toneFromId(member.id)}
                          small
                        />
                        <div>
                          <div className="text-[12px] font-semibold">{displayMemberName(member)}</div>
                          <div className="text-[10px] text-[var(--muted)]">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[11.5px]">{member.membershipId ?? "—"}</td>
                    <td className="text-[11.5px]">
                      {member.membershipClass ? MEMBERSHIP_CLASS_LABELS[member.membershipClass] ?? member.membershipClass : "—"}
                    </td>
                    <td>
                      <StatusBadge tone={statusTone(member.membershipStatus ?? "PENDING")}>
                        {(member.membershipStatus ?? "PENDING").replace(/_/g, " ")}
                      </StatusBadge>
                    </td>
                    <td>
                      <Button tone="outline">View</Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </section>
  );
}
