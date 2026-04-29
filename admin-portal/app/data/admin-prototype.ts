export type StatusTone =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "warning"
  | "blue"
  | "super"
  | "admin"
  | "finance";

export type AvatarTone = "red" | "blue" | "green" | "purple" | "pink" | "orange";
export type ApplicationWorkflowStage =
  | "Secretariat Review"
  | "Evaluator Review"
  | "MPDC Review"
  | "Council Review"
  | "Approval Note Sent";

export const navGroups = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Membership",
    items: [
      { to: "/dashboard/applications", label: "Applications" },
      { to: "/dashboard/members", label: "Members" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/dashboard/events", label: "Events" },
      { to: "/dashboard/payments", label: "Payments" },
      { to: "/dashboard/reports", label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [{ to: "/dashboard/settings", label: "Settings" }],
  },
] as const;

export const pageLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/applications": "Applications",
  "/dashboard/members": "Members",
  "/dashboard/events": "Events",
  "/dashboard/payments": "Payments",
  "/dashboard/reports": "Reports",
  "/dashboard/settings": "Settings",
};

export const dashboardMetrics = [
  { label: "Total Members", value: "4,872", note: "↑ 48 this month" },
  { label: "Pending Applications", value: "12", note: "Needs review" },
  { label: "Revenue (2025)", value: "TZS 28.4M", note: "↑ 12% vs last year" },
  { label: "Upcoming Events", value: "6", note: "Next: Feb 22" },
] as const;

export const applications = [
  {
    id: "app-001",
    name: "James Mbeki",
    email: "j.mbeki@email.co.tz",
    initials: "JM",
    tone: "red" as AvatarTone,
    grade: "Corporate Member",
    discipline: "Civil Engineering",
    submitted: "Jan 28, 2025",
    status: "Pending",
    badge: "pending" as StatusTone,
    stage: "Secretariat Review" as ApplicationWorkflowStage,
    queueOwner: "Secretariat",
    assignedEvaluator: "—",
  },
  {
    id: "app-002",
    name: "Amina Laila",
    email: "a.laila@email.co.tz",
    initials: "AL",
    tone: "blue" as AvatarTone,
    grade: "Associate Member",
    discipline: "Electrical Engineering",
    submitted: "Jan 26, 2025",
    status: "Pending",
    badge: "pending" as StatusTone,
    stage: "Evaluator Review" as ApplicationWorkflowStage,
    queueOwner: "Evaluator",
    assignedEvaluator: "Eng. Joseph Mushi",
  },
  {
    id: "app-003",
    name: "Baraka Njau",
    email: "b.njau@email.co.tz",
    initials: "BN",
    tone: "purple" as AvatarTone,
    grade: "Student Member",
    discipline: "Mechanical Engineering",
    submitted: "Jan 25, 2025",
    status: "Pending",
    badge: "pending" as StatusTone,
    stage: "MPDC Review" as ApplicationWorkflowStage,
    queueOwner: "MPDC",
    assignedEvaluator: "Eng. Neema Kweka",
  },
  {
    id: "app-004",
    name: "Kelvin Tarimo",
    email: "k.tarimo@email.co.tz",
    initials: "KT",
    tone: "green" as AvatarTone,
    grade: "Graduate Member",
    discipline: "Environmental Engineering",
    submitted: "Jan 24, 2025",
    status: "Approved",
    badge: "approved" as StatusTone,
    stage: "Approval Note Sent" as ApplicationWorkflowStage,
    queueOwner: "Council",
    assignedEvaluator: "Eng. Dora Nyerere",
  },
  {
    id: "app-005",
    name: "Grace Mwasumbi",
    email: "g.mwasumbi@email.co.tz",
    initials: "GM",
    tone: "pink" as AvatarTone,
    grade: "Corporate Member",
    discipline: "Structural Engineering",
    submitted: "Jan 22, 2025",
    status: "Rejected",
    badge: "rejected" as StatusTone,
    stage: "Council Review" as ApplicationWorkflowStage,
    queueOwner: "Council",
    assignedEvaluator: "Eng. Lucas Mrema",
  },
  {
    id: "app-006",
    name: "Peter Ndaki",
    email: "p.ndaki@email.co.tz",
    initials: "PN",
    tone: "orange" as AvatarTone,
    grade: "Associate Member",
    discipline: "Mining Engineering",
    submitted: "Jan 20, 2025",
    status: "Pending",
    badge: "pending" as StatusTone,
    stage: "Council Review" as ApplicationWorkflowStage,
    queueOwner: "Council",
    assignedEvaluator: "Eng. Miriam Kileo",
  },
] as const;

export const recentPayments = [
  {
    title: "Annual Subscription",
    detail: "Joram Jackson · M-Pesa",
    amount: "TZS 150,000",
    status: "Confirmed",
    badge: "approved" as StatusTone,
  },
  {
    title: "Event Registration",
    detail: "Sarah Kimaro · Card",
    amount: "TZS 80,000",
    status: "Confirmed",
    badge: "approved" as StatusTone,
  },
  {
    title: "Annual Subscription",
    detail: "Peter Ndaki · Bank",
    amount: "TZS 130,000",
    status: "Pending",
    badge: "pending" as StatusTone,
  },
  {
    title: "Annual Subscription",
    detail: "Martha Swai · M-Pesa",
    amount: "TZS 150,000",
    status: "Confirmed",
    badge: "approved" as StatusTone,
  },
] as const;

export const activityLog = [
  { admin: "Super Admin", initials: "SA", tone: "red" as AvatarTone, action: "Approved application", target: "Kelvin Tarimo (Graduate)", time: "10 mins ago" },
  { admin: "Admin Ally", initials: "AA", tone: "blue" as AvatarTone, action: "Created event", target: "BIM Training – Mar 2025", time: "2 hrs ago" },
  { admin: "Super Admin", initials: "SA", tone: "red" as AvatarTone, action: "Rejected application", target: "Grace Mwasumbi (Corporate)", time: "5 hrs ago" },
  { admin: "Finance Mgr", initials: "FM", tone: "green" as AvatarTone, action: "Confirmed payment", target: "TZS 150,000 – Joram Jackson", time: "Yesterday" },
] as const;

export const members = [
  { name: "Joram Jackson", email: "j.jackson@email.co.tz", initials: "JJ", tone: "red" as AvatarTone, id: "IET/2019/4872", grade: "Corporate", discipline: "Civil Engineering", status: "Active", badge: "approved" as StatusTone, expires: "Dec 2025" },
  { name: "Sarah Kimaro", email: "s.kimaro@email.co.tz", initials: "SK", tone: "blue" as AvatarTone, id: "IET/2020/5103", grade: "Associate", discipline: "Mechanical Engineering", status: "Active", badge: "approved" as StatusTone, expires: "Dec 2025" },
  { name: "Kelvin Tarimo", email: "k.tarimo@email.co.tz", initials: "KT", tone: "green" as AvatarTone, id: "IET/2025/6241", grade: "Graduate", discipline: "Environmental Engineering", status: "Pending Payment", badge: "blue" as StatusTone, expires: "—" },
  { name: "Fatuma Msangi", email: "f.msangi@email.co.tz", initials: "FM", tone: "pink" as AvatarTone, id: "IET/2018/3812", grade: "Fellow", discipline: "Structural Engineering", status: "Active", badge: "approved" as StatusTone, expires: "Dec 2025" },
  { name: "Paul Njoroge", email: "p.njoroge@email.co.tz", initials: "PN", tone: "orange" as AvatarTone, id: "IET/2017/2990", grade: "Corporate", discipline: "Mining Engineering", status: "Expired", badge: "rejected" as StatusTone, expires: "Dec 2024" },
] as const;

export const events = [
  { title: "IET Annual Engineering Conference 2025", type: "Conference", date: "Feb 22, 2025", location: "Dar es Salaam", registrations: "143 / 300", revenue: "TZS 11.4M", status: "Open" },
  { title: "BIM & Digital Engineering Training", type: "Training", date: "Mar 8, 2025", location: "Online", registrations: "67 / 150", revenue: "TZS 3.4M", status: "Open" },
  { title: "Structural Engineering Seminar", type: "Seminar", date: "Mar 15, 2025", location: "Arusha", registrations: "38 / 100", revenue: "TZS 2.3M", status: "Open" },
  { title: "Road Infrastructure Workshop", type: "Workshop", date: "Apr 5, 2025", location: "Dodoma", registrations: "12 / 80", revenue: "TZS 840K", status: "Open" },
  { title: "Professional Ethics CPD", type: "CPD", date: "Apr 20, 2025", location: "Online", registrations: "201 / 500", revenue: "Free", status: "Open" },
] as const;

export const paymentMetrics = [
  { label: "Total Revenue 2025", value: "TZS 28.4M", note: "↑ 12% vs 2024" },
  { label: "Confirmed Payments", value: "4,612", note: "This year" },
  { label: "Pending Verification", value: "23", note: "Needs action" },
] as const;

export const payments = [
  { ref: "SEL-84729103", member: "Joram Jackson", description: "Annual Subscription", amount: "150,000", method: "M-Pesa", date: "Jan 28, 2025", status: "Confirmed", badge: "approved" as StatusTone },
  { ref: "SEL-84701822", member: "Sarah Kimaro", description: "Conference Registration", amount: "80,000", method: "Card", date: "Jan 27, 2025", status: "Confirmed", badge: "approved" as StatusTone },
  { ref: "BNK-20250127", member: "Peter Ndaki", description: "Annual Subscription", amount: "130,000", method: "Bank Transfer", date: "Jan 27, 2025", status: "Pending", badge: "pending" as StatusTone },
  { ref: "SEL-84688340", member: "Martha Swai", description: "Annual Subscription", amount: "150,000", method: "M-Pesa", date: "Jan 26, 2025", status: "Confirmed", badge: "approved" as StatusTone },
  { ref: "BNK-20250124", member: "David Oloo", description: "Annual Subscription", amount: "150,000", method: "Bank Transfer", date: "Jan 24, 2025", status: "Pending", badge: "pending" as StatusTone },
] as const;

export const reports = [
  { title: "Membership Report", description: "Member statistics by grade, discipline and region" },
  { title: "Financial Report", description: "Revenue breakdown by payment method and period" },
  { title: "Events Report", description: "Event attendance, registrations and CPD tracking" },
  { title: "Applications Report", description: "Application throughput, approval rates and timelines" },
  { title: "CPD Report", description: "Member CPD hours, compliance and activity logs" },
  { title: "Analytics Dashboard", description: "Growth trends, retention metrics and forecasting" },
] as const;

export const settings = {
  organization: [
    { label: "Organisation Name", value: "Institution of Engineers Tanzania" },
    { label: "Website", value: "https://iet.or.tz" },
    { label: "Contact Email", value: "info@iet.or.tz" },
    { label: "Phone", value: "+255 22 XXX XXXX" },
  ],
  fees: [
    { label: "Student Member", value: "30,000" },
    { label: "Graduate Member", value: "60,000" },
    { label: "Associate Member", value: "80,000" },
    { label: "Corporate Member", value: "150,000" },
    { label: "Fellow", value: "200,000" },
  ],
  admins: [
    { name: "Super Admin", email: "admin@iet.or.tz", initials: "SA", badge: "super" as StatusTone, tone: "red" as AvatarTone },
    { name: "Admin Ally", email: "ally@iet.or.tz", initials: "AA", badge: "admin" as StatusTone, tone: "blue" as AvatarTone },
    { name: "Finance Mgr", email: "finance@iet.or.tz", initials: "FM", badge: "finance" as StatusTone, tone: "green" as AvatarTone },
  ],
  paymentConfig: [
    { label: "Selcom Merchant ID", value: "IET-TZ-2025-XXXX" },
    { label: "API Key", value: "sk_live_XXXXXXXXXXXXXXXX" },
    { label: "Webhook URL", value: "https://portal.iet.or.tz/api/selcom/webhook" },
  ],
} as const;
