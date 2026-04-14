import { BadgeCheck, CalendarDays, ChevronRight, WalletCards, Users } from "lucide-react";

type MetricIconName = "members" | "subscriptions" | "events" | "revenue";
type CertStatus = "Reviewing" | "Approved" | "Expired";

const metricCards: Array<{ label: string; value: string; icon: MetricIconName; trend?: string }> = [
  { label: "Total Members", value: "1,240", icon: "members", trend: "12%" },
  { label: "Active Subscriptions", value: "850", icon: "subscriptions" },
  { label: "Upcoming Events", value: "12", icon: "events" },
  { label: "Total Revenue", value: "TZS 45M", icon: "revenue" },
];

const renewalsChart = [
  { month: "Jan", renewals: 60, joins: 25 },
  { month: "Feb", renewals: 65, joins: 30 },
  { month: "Mar", renewals: 55, joins: 35 },
  { month: "Apr", renewals: 70, joins: 20 },
  { month: "May", renewals: 60, joins: 25 },
  { month: "Jun", renewals: 80, joins: 40 },
  { month: "Jul", renewals: 75, joins: 35 },
  { month: "Aug", renewals: 50, joins: 45 },
  { month: "Sep", renewals: 85, joins: 50 },
  { month: "Oct", renewals: 90, joins: 60 },
];

const topTrainings = [
  { title: "Project Management", participants: 120, percent: 85 },
  { title: "Structural Analysis", participants: 98, percent: 72 },
  { title: "Sustainable Energy", participants: 82, percent: 64 },
  { title: "Ethics in Engineering", participants: 56, percent: 45 },
];

const upcomingSessions = [
  { day: "26", month: "OCT", title: "Advanced Structural Analysis", detail: "Dar es Salaam • 9:00 AM", enrolled: "24/50", tone: "rose" },
  { day: "02", month: "NOV", title: "Environmental Impact Assessment", detail: "Online Zoom • 2:00 PM", enrolled: "88/100", tone: "blue" },
  { day: "15", month: "NOV", title: "Digital Engineering Tools", detail: "IET Hall • 11:30 AM", enrolled: "42/60", tone: "green" },
] as const;

const certifications: Array<{ name: string; role: string; status: CertStatus }> = [
  { name: "Sarah M. Kibu", role: "Professional Engineer (PE)", status: "Reviewing" },
  { name: "David L. Johnson", role: "Consulting Engineer", status: "Approved" },
  { name: "Emmanuel P. Mwangi", role: "Graduate Engineer", status: "Expired" },
];

function metricIcon(name: MetricIconName) {
  if (name === "members") {
    return <Users aria-hidden="true" />;
  }

  if (name === "subscriptions") {
    return <BadgeCheck aria-hidden="true" />;
  }

  if (name === "events") {
    return <CalendarDays aria-hidden="true" />;
  }

  return <WalletCards aria-hidden="true" />;
}

function certStatusClass(status: CertStatus) {
  if (status === "Approved") return "is-approved";
  if (status === "Expired") return "is-expired";
  return "is-reviewing";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "NA";
}

export default function DashboardOverviewPage() {
  const maxChartValue = 100;

  return (
    <section className="admin-dashboard-page">
      <h1 className="admin-dashboard-title">Dashboard</h1>

      <section className="admin-metrics-grid" aria-label="Top statistics">
        {metricCards.map((card) => (
          <article className="admin-metric-card" key={card.label}>
            <div className="admin-metric-top">
              <span className={`admin-metric-icon metric-${card.icon}`}>{metricIcon(card.icon)}</span>
              {card.trend ? (
                <span className="admin-metric-trend">
                  <span aria-hidden="true">↑</span> {card.trend}
                </span>
              ) : null}
            </div>
            <p className="admin-metric-label">{card.label}</p>
            <p className="admin-metric-value">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="admin-main-grid">
        <article className="admin-card admin-chart-card">
          <div className="admin-card-heading">
            <h2>Renewals vs. New Joins</h2>
            <div className="admin-legend" aria-label="Chart legend">
              <span><i className="legend-dot renewals" />Renewals</span>
              <span><i className="legend-dot joins" />New Joins</span>
            </div>
          </div>

          <div className="admin-chart-body">
            <div className="admin-chart-y-axis">
              {[100, 75, 50, 25, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="admin-chart-area">
              <div className="admin-chart-bars">
                {renewalsChart.map((item) => (
                  <div className="admin-chart-group" key={item.month}>
                    <div className="admin-chart-columns">
                      <span
                        className="admin-chart-bar renewals"
                        style={{ height: `${(item.renewals / maxChartValue) * 100}%` }}
                      />
                      <span
                        className="admin-chart-bar joins"
                        style={{ height: `${(item.joins / maxChartValue) * 100}%` }}
                      />
                    </div>
                    <span className="admin-chart-month">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="admin-card admin-training-card">
          <h2>Top Performing Training</h2>
          <div className="admin-training-list">
            {topTrainings.map((training) => (
              <div className="admin-training-item" key={training.title}>
                <div className="admin-training-title-row">
                  <h3>{training.title}</h3>
                  <span>{training.percent}%</span>
                </div>
                <div className="admin-progress-track">
                  <span className="admin-progress-fill" style={{ width: `${training.percent}%` }} />
                </div>
                <p>{training.participants} Participants</p>
              </div>
            ))}
          </div>
          <div className="admin-training-footer">View All Courses</div>
        </article>
      </section>

      <section className="admin-bottom-grid">
        <article className="admin-card">
          <div className="admin-card-heading">
            <h2>Upcoming Training Sessions</h2>
            <button type="button" className="admin-link-accent admin-link-button">View Calendar</button>
          </div>

          <div className="admin-session-list">
            {upcomingSessions.map((session) => (
              <article className="admin-session-item" key={`${session.day}-${session.title}`}>
                <div className={`admin-date-badge ${session.tone}`}>
                  <strong>{session.day}</strong>
                  <span>{session.month}</span>
                </div>
                <div>
                  <h3>{session.title}</h3>
                  <p>{session.detail}</p>
                </div>
                <div className="admin-enrollment">
                  <strong>{session.enrolled}</strong>
                  <span>Registered</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <div className="admin-card-heading">
            <h2>Member Certifications</h2>
            <button type="button" className="admin-link-accent admin-link-button">Manage All</button>
          </div>

          <div className="admin-cert-list">
            {certifications.map((certification) => (
              <article className="admin-cert-item" key={certification.name}>
                <div className="admin-cert-avatar" aria-hidden="true">{initials(certification.name)}</div>
                <div>
                  <h3>{certification.name}</h3>
                  <p>{certification.role}</p>
                </div>
                <span className={`admin-status-pill ${certStatusClass(certification.status)}`}>{certification.status}</span>
                <span className="admin-cert-chevron" aria-hidden="true">
                  <ChevronRight size={16} strokeWidth={2.2} />
                </span>
              </article>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
