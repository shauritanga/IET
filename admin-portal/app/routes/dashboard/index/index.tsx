import { Link } from "react-router";
import {
  activityLog,
  applications,
  recentPayments,
} from "~/data/admin-prototype";
import { Avatar, Button, StatusBadge } from "~/components/prototype-ui";

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
  action?: React.ReactNode;
  children: React.ReactNode;
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
  icon: React.ReactNode;
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
  bgClassName,
  small = false,
}: {
  initials: string;
  bgClassName: string;
  small?: boolean;
}) {
  return (
    <div
      className={`${bgClassName} flex items-center justify-center rounded-full font-bold text-white ${small ? "h-6 w-6 text-[9px]" : "h-[30px] w-[30px] text-[10px]"}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

const avatarColors: Record<string, string> = {
  red: "bg-[var(--red)]",
  blue: "bg-[#1565C0]",
  green: "bg-[#2E7D32]",
  pink: "bg-[#880E4F]",
};

export default function DashboardOverviewPage() {
  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Dashboard Overview</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">Real-time snapshot of IET Tanzania operations</p>
        </div>
        <Button>⬇ Export Report</Button>
      </div>

      <div className="mb-5 grid gap-[14px] md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          icon={<MembersKpiIcon />}
          value="4,872"
          label="Total Members"
          note="↑ 48 this month"
        />
        <DashboardMetricCard
          icon={<ApplicationsKpiIcon />}
          value="12"
          label="Pending Applications"
          note="⚠ Needs review"
          noteTone="warn"
        />
        <DashboardMetricCard
          icon={<RevenueKpiIcon />}
          value="TZS 28.4M"
          label="Revenue (2025)"
          note="↑ 12% vs last year"
          compactValue
        />
        <DashboardMetricCard
          icon={<EventsKpiIcon />}
          value="6"
          label="Upcoming Events"
          note="Next: Feb 22"
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
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 4).map((application) => (
                  <tr key={application.email}>
                    <td>
                      <div className="flex items-center gap-2">
                        <DashboardAvatar initials={application.initials} bgClassName={avatarColors[application.tone]} />
                        <div>
                          <div className="text-[12px] font-semibold">{application.name}</div>
                          <div className="text-[10px] text-[var(--muted)]">{application.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[11.5px]">{application.grade.replace(" Member", "")}</td>
                    <td className="text-[11.5px]">{application.submitted.replace(", 2025", "")}</td>
                    <td>
                      <StatusBadge tone={application.badge}>{application.status}</StatusBadge>
                    </td>
                    <td>
                      <Button tone={application.badge === "pending" ? "dark" : "outline"}>
                        {application.badge === "pending" ? "Review" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Payments" action={<Link to="/dashboard/payments">View all</Link>} bodyClassName="p-0">
          <div className="flex flex-col">
            {recentPayments.map((payment, index) => (
              <div
                key={`${payment.title}-${payment.detail}`}
                className={`flex items-center justify-between px-4 py-[11px] ${index < recentPayments.length - 1 ? "border-b border-[var(--border)]" : ""}`}
              >
                <div>
                  <div className="text-[12px] font-semibold">{payment.title}</div>
                  <div className="text-[10px] text-[var(--muted)]">{payment.detail}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-bold text-[var(--red-dark)]">{payment.amount}</div>
                  <StatusBadge tone={payment.badge} className="mt-1 text-[9.5px]">
                    {payment.status}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      <DashboardCard title="Recent Admin Activity Log" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="table-proto min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {activityLog.map((item) => (
                <tr key={`${item.admin}-${item.action}-${item.time}`}>
                  <td>
                    <div className="flex items-center gap-[7px]">
                      <DashboardAvatar initials={item.initials} bgClassName={avatarColors[item.tone]} small />
                      <span className="text-[11.5px]">{item.admin}</span>
                    </div>
                  </td>
                  <td className="text-[11.5px]">{item.action}</td>
                  <td className="text-[11.5px]">{item.target}</td>
                  <td className="text-[11.5px]">{item.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </section>
  );
}
