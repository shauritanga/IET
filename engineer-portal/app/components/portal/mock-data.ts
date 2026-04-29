export type KpiItem = {
    value: string
    label: string
    note: string
    noteVariant?: "default" | "ok"
    icon: "star" | "clock" | "calendar" | "payment" | "check"
    valueClassName?: string
    iconClassName?: string
}

export type ActivityItem = {
    text: string
    emphasis?: string
    time: string
    icon: "payment" | "calendar" | "file" | "check" | "user"
    iconClassName?: string
}

export type UpcomingEventItem = {
    day: string
    month: string
    title: string
    meta: string
    dark?: boolean
}

export type PaymentRecord = {
    ref: string
    description: string
    date: string
    amount: string
    method: string
    status: string
}

export type BenefitItem = {
    title: string
    description: string
    icon: "book" | "users" | "calendar" | "clock" | "check" | "dollar"
}

export type EventItem = {
    id: number
    title: string
    type: "Conference" | "Training" | "Seminar" | "Workshop" | "CPD" | "Forum"
    date: string
    dateSort: string
    location: string
    mode: "Online" | "In-person"
    price: number
    free: boolean
    color: string
    desc: string
    guest: string | null
    venue: string
    start: string
    end: string | null
    region: string
    highlights: string[]
}

export const overviewKpis: KpiItem[] = [
    { value: "2019", label: "Member Since", note: "✓ 6 years active", noteVariant: "ok", icon: "star" },
    { value: "36", label: "CPD Hours (2024)", note: "↑ 12 hrs above target", noteVariant: "ok", icon: "clock" },
    { value: "5", label: "Events Attended", note: "↑ 2 this quarter", noteVariant: "ok", icon: "calendar" },
    { value: "TZS 0", label: "Outstanding Balance", note: "✓ All dues cleared", noteVariant: "ok", icon: "payment", valueClassName: "text-[20px]" },
]

export const paymentKpis: KpiItem[] = [
    { value: "150,000", label: "Total Paid (2025) · TZS", note: "✓ Annual Subscription", noteVariant: "ok", icon: "payment" },
    { value: "0", label: "Outstanding Balance · TZS", note: "✓ Fully settled", noteVariant: "ok", icon: "check", valueClassName: "text-[#1a6b3c]", iconClassName: "bg-[#E8F5E9] text-[#1a6b3c]" },
    { value: "May 2025", label: "Next Due Date", note: "Annual renewal reminder", icon: "calendar", valueClassName: "text-[22px]" },
]

export const recentActivities: ActivityItem[] = [
    { text: "Annual subscription paid", emphasis: "TZS 150,000", time: "Jan 10, 2025 · M-Pesa", icon: "payment" },
    { text: 'Attended "Sustainable Infrastructure" Seminar', emphasis: "6 CPD hrs", time: "Dec 14, 2024 · Dar es Salaam", icon: "calendar", iconClassName: "bg-[#E8F5E9] text-[#1a6b3c]" },
    { text: "Uploaded CPD Activity Record for Q4 2024", time: "Dec 8, 2024", icon: "file", iconClassName: "bg-[#FFF8E1] text-[#F57F17]" },
    { text: "Registered for Construction Innovation Workshop", time: "Nov 29, 2024", icon: "check" },
    { text: "Profile information updated", time: "Nov 22, 2024", icon: "user", iconClassName: "bg-[#E8F5E9] text-[#1a6b3c]" },
]

export const upcomingEvents: UpcomingEventItem[] = [
    { day: "22", month: "Feb", title: "IET Annual Engineering Conference", meta: "Dar es Salaam · 08:00–17:00" },
    { day: "08", month: "Mar", title: "BIM & Digital Engineering Training", meta: "Online · 09:00–13:00", dark: true },
    { day: "15", month: "Mar", title: "Structural Engineering Seminar", meta: "Arusha · All day" },
    { day: "05", month: "Apr", title: "Road Infrastructure Workshop", meta: "Dodoma · 09:00–16:00", dark: true },
]

export const paymentHistory: PaymentRecord[] = [
    { ref: "IET-2025-0041", description: "Annual Membership – 2025", date: "Jan 10, 2025", amount: "150,000", method: "M-Pesa", status: "Paid" },
    { ref: "IET-2024-0031", description: "Engineering Conference Registration", date: "Oct 5, 2024", amount: "50,000", method: "Bank Transfer", status: "Paid" },
    { ref: "IET-2024-0012", description: "Annual Membership – 2024", date: "Jan 8, 2024", amount: "130,000", method: "M-Pesa", status: "Paid" },
    { ref: "IET-2023-0009", description: "BIM Training Workshop", date: "Nov 20, 2023", amount: "80,000", method: "Cash", status: "Paid" },
    { ref: "IET-2023-0003", description: "Annual Membership – 2023", date: "Jan 12, 2023", amount: "120,000", method: "Bank Transfer", status: "Paid" },
]

export const membershipBenefits: BenefitItem[] = [
    { title: "Technical Resources", description: "Access to engineering journals, standards and publications", icon: "book" },
    { title: "Professional Network", description: "Connect with 5,000+ engineers across Tanzania", icon: "users" },
    { title: "Priority Event Access", description: "Early registration and discounts on conferences and seminars", icon: "calendar" },
    { title: "CPD Tracking", description: "Official log recognized by ERB and regulatory bodies", icon: "clock" },
    { title: "Professional Recognition", description: "IET post-nominals and verified member certificate", icon: "check" },
    { title: "Member Discounts", description: "Reduced fees on training, workshops and insurance programs", icon: "dollar" },
]

export const events: EventItem[] = [
    { id: 1, title: "IET Annual Engineering Conference 2025", type: "Conference", date: "Feb 22, 2025", dateSort: "2025-02-22", location: "Dar es Salaam", mode: "In-person", price: 80000, free: false, color: "linear-gradient(135deg,#390909,#6B1A1A)", desc: "The flagship annual gathering of IET Tanzania members. Keynote presentations, panel discussions and networking.", guest: "Eng. Emmanuel Ole Kambainei", venue: "Julius Nyerere Convention Centre, Dar es Salaam", start: "Feb 22, 2025 | 8:00 AM - 5:00 PM", end: "Feb 22, 2025 | 5:00 PM", region: "Dar es Salaam", highlights: ["Keynote addresses", "Panel discussions", "Networking reception", "Annual awards ceremony"] },
    { id: 2, title: "BIM & Digital Engineering Training", type: "Training", date: "Mar 8, 2025", dateSort: "2025-03-08", location: "Online", mode: "Online", price: 50000, free: false, color: "linear-gradient(135deg,#1565C0,#1976D2)", desc: "Hands-on training in Building Information Modelling and digital tools for modern engineering practice.", guest: null, venue: "Online (Zoom)", start: "Mar 8, 2025 | 9:00 AM - 1:00 PM", end: "Mar 10, 2025 | 9:00 AM - 1:00 PM", region: "Online", highlights: ["BIM fundamentals", "Revit hands-on", "Clash detection", "Digital delivery workflows"] },
    { id: 3, title: "Structural Engineering Seminar – Arusha", type: "Seminar", date: "Mar 15, 2025", dateSort: "2025-03-15", location: "Arusha", mode: "In-person", price: 60000, free: false, color: "linear-gradient(135deg,#5D4037,#795548)", desc: "Deep-dive seminar on structural analysis, design best practices and innovative construction methods.", guest: "Prof. Anna Mmari", venue: "Ngurdoto Mountain Lodge, Arusha", start: "Mar 15, 2025 | 8:00 AM - 5:00 PM", end: "Mar 15, 2025 | 5:00 PM", region: "Arusha", highlights: ["Seismic design", "Steel connections", "Concrete detailing"] },
    { id: 4, title: "Road Infrastructure & Quality Assurance Workshop", type: "Workshop", date: "Apr 5, 2025", dateSort: "2025-04-05", location: "Dodoma", mode: "In-person", price: 70000, free: false, color: "linear-gradient(135deg,#390909,#7B1010)", desc: "Practical workshop on road design standards, quality control and compliance with TANROADS specifications.", guest: "Eng. Fredrick Msalame", venue: "Dodoma Hotel, Dodoma", start: "Apr 5, 2025 | 8:00 AM - 3:00 PM", end: "Apr 6, 2025 | 8:00 AM - 3:00 PM", region: "Dodoma", highlights: ["TANROADS standards", "Pavement design", "Site supervision", "Materials testing"] },
    { id: 5, title: "Professional Ethics & Engineering Standards", type: "CPD", date: "Apr 20, 2025", dateSort: "2025-04-20", location: "Online", mode: "Online", price: 0, free: true, color: "linear-gradient(135deg,#4527A0,#512DA8)", desc: "CPD session covering professional ethics, ERB compliance and IET code of conduct. Free for all members.", guest: null, venue: "Online (Zoom)", start: "Apr 20, 2025 | 10:00 AM - 12:00 PM", end: null, region: "Online", highlights: ["ERB compliance", "Code of ethics", "Professional liability", "Case studies"] },
    { id: 6, title: "Construction Industry Innovation Forum", type: "Forum", date: "May 10, 2025", dateSort: "2025-05-10", location: "Dar es Salaam", mode: "In-person", price: 100000, free: false, color: "linear-gradient(135deg,#BF360C,#D84315)", desc: "Industry leaders and engineers explore innovation, technology and the future of construction in Tanzania.", guest: "Hon. Minister of Works", venue: "Hyatt Regency, Dar es Salaam", start: "May 10, 2025 | 8:00 AM - 6:00 PM", end: "May 10, 2025 | 6:00 PM", region: "Dar es Salaam", highlights: ["Prefab construction", "Green building", "PropTech", "Smart infrastructure"] },
    { id: 7, title: "Water & Sanitation Engineering Symposium", type: "Seminar", date: "May 28, 2025", dateSort: "2025-05-28", location: "Dar es Salaam", mode: "In-person", price: 65000, free: false, color: "linear-gradient(135deg,#006064,#00838F)", desc: "Symposium on water treatment, pipeline engineering and sustainable sanitation solutions for Tanzania.", guest: "Eng. Grace Mwasumbi", venue: "Royal Palm Hotel, Dar es Salaam", start: "May 28, 2025 | 8:00 AM - 4:00 PM", end: "May 28, 2025 | 4:00 PM", region: "Dar es Salaam", highlights: ["Water treatment", "Pipeline design", "WASH standards", "Climate resilience"] },
    { id: 8, title: "AutoCAD & Civil 3D Masterclass", type: "Training", date: "Jun 4, 2025", dateSort: "2025-06-04", location: "Online", mode: "Online", price: 45000, free: false, color: "linear-gradient(135deg,#1B5E20,#2E7D32)", desc: "Comprehensive training in AutoCAD Civil 3D for road, drainage and land development projects.", guest: null, venue: "Online (Teams)", start: "Jun 4, 2025 | 9:00 AM - 12:00 PM", end: "Jun 6, 2025 | 9:00 AM - 12:00 PM", region: "Online", highlights: ["AutoCAD basics", "Civil 3D corridors", "Drainage modelling", "Sheet production"] },
    { id: 9, title: "IET Young Engineers Bootcamp", type: "Workshop", date: "Jun 18, 2025", dateSort: "2025-06-18", location: "Arusha", mode: "In-person", price: 30000, free: false, color: "linear-gradient(135deg,#880E4F,#AD1457)", desc: "Intensive bootcamp for graduate and student members. Career mentorship, leadership and technical skills.", guest: "Eng. Dr. Charles Tarimo", venue: "Arusha International Conference Centre", start: "Jun 18, 2025 | 8:00 AM - 6:00 PM", end: "Jun 20, 2025 | 3:00 PM", region: "Arusha", highlights: ["CV writing", "Interview skills", "Leadership", "Technical problem-solving"] },
    { id: 10, title: "Environmental Impact Assessment Training", type: "CPD", date: "Jul 3, 2025", dateSort: "2025-07-03", location: "Online", mode: "Online", price: 0, free: true, color: "linear-gradient(135deg,#1A237E,#283593)", desc: "CPD course on EIA methodology, regulatory framework and report writing for engineering projects. Free for members.", guest: null, venue: "Online (Zoom)", start: "Jul 3, 2025 | 10:00 AM - 12:00 PM", end: null, region: "Online", highlights: ["EIA process", "NEMC requirements", "Stakeholder engagement", "Report writing"] },
]

export const profileDocumentItems = [
    { label: "Membership Certificate", action: "Download" },
    { label: "CPD Record 2024", action: "Download" },
    { label: "Good Standing Letter", action: "Request" },
    { label: "Tax Invoice 2025", action: "Download" },
]
