import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";

type MemberDetails = {
  id: string;
  membershipId?: string | null;
  personalDetails: {
    fullName?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    nationality?: string | null;
    employer?: string | null;
    position?: string | null;
    location?: string | null;
    profilePhotoUrl?: string | null;
  };
  membershipDetails: {
    membershipClass?: string | null;
    status?: string | null;
    engineeringDiscipline?: string | null;
    joiningDate?: string | null;
    expiryDate?: string | null;
    annualFee?: number | null;
  };
  registration?: {
    referenceNumber?: string | null;
    status?: string | null;
    submittedAt?: string | null;
    educations?: unknown[];
    experiences?: unknown[];
    documents?: unknown[];
    references?: unknown[];
  } | null;
  paymentHistory: Array<{
    id: string;
    amount?: number | null;
    currency?: string | null;
    status?: string | null;
    type?: string | null;
    paymentMethod?: string | null;
    createdAt?: string | null;
  }>;
  feeHistory: Array<{
    id: string;
    year: number;
    amount: number;
    currency?: string | null;
    status?: string | null;
    dueDate?: string | null;
    paidAt?: string | null;
  }>;
  eventParticipation: Array<{
    eventId: string;
    eventTitle?: string | null;
    eventDate?: string | null;
    status?: string | null;
    attendedAt?: string | null;
  }>;
  accountInfo: {
    emailVerified?: boolean | null;
    enable2FA?: boolean | null;
    isActive?: boolean | null;
    role?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
};

const CLASS_LABELS: Record<string, string> = {
  GRADUATE: "Graduate",
  ASSOCIATE: "AMIET",
  MIET: "MIET",
  CORPORATE: "CMIET",
  SENIOR: "SMIET",
  FELLOW: "FIET",
  HONORARY: "Honorary",
};

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  ACTIVE: { dot: "#16a34a", text: "#15803d", bg: "#f0fdf4" },
  PENDING: { dot: "#d97706", text: "#b45309", bg: "#fffbeb" },
  EXPIRED: { dot: "#dc2626", text: "#b91c1c", bg: "#fef2f2" },
  SUSPENDED: { dot: "#6b7280", text: "#4b5563", bg: "#f9fafb" },
  REVOKED: { dot: "#7c3aed", text: "#6d28d9", bg: "#f5f3ff" },
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatMoney(amount?: number | null, currency = "TZS") {
  if (amount == null) return "—";
  return `${currency} ${amount.toLocaleString()}`;
}

function valueOrDash(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function displayName(member: MemberDetails) {
  const personal = member.personalDetails;
  return personal.fullName
    || `${personal.firstName ?? ""} ${personal.middleName ?? ""} ${personal.lastName ?? ""}`.replace(/\s+/g, " ").trim()
    || personal.email
    || "Member";
}

function initials(member: MemberDetails) {
  return displayName(member)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";
}

function StatusPill({ status }: { status?: string | null }) {
  const label = status ?? "PENDING";
  const cfg = STATUS_CONFIG[label] ?? { dot: "#6b7280", text: "#4b5563", bg: "#f9fafb" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.text, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function Section({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section style={{ borderTop: "1px solid var(--border)", paddingTop: compact ? 14 : 18 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--red-dark)", marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  );
}

function DetailRows({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "grid",
            gridTemplateColumns: "140px minmax(0,1fr)",
            gap: 12,
            padding: "9px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 750, color: "var(--muted)" }}>{label}</div>
          <div style={{ fontSize: 12.5, fontWeight: 650, color: "var(--text)", overflowWrap: "anywhere" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--muted)", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 750, color: "var(--text)", overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

function InlineMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 650 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "var(--text)", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

export default function MemberDetailsPage() {
  const { memberId } = useParams();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMember() {
      if (!memberId) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await http.get<ApiEnvelope<MemberDetails>>(`/admin/members/${memberId}`);
        setMember(data.data);
      } catch (err) {
        const e = err as AxiosError<{ message?: string }>;
        setError(e.response?.data?.message ?? "Failed to load member details.");
      } finally {
        setLoading(false);
      }
    }
    void loadMember();
  }, [memberId]);

  if (loading) {
    return (
      <section style={{ padding: "36px 0", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
        Loading member details…
      </section>
    );
  }

  if (error || !member) {
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Link to="/dashboard/members" style={{ fontSize: 12, fontWeight: 700, color: "var(--red-dark)", textDecoration: "none" }}>← Members</Link>
        <div style={{ background: "var(--red-pale)", border: "1px solid #f0b0b0", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "var(--red)" }}>
          {error ?? "Member not found."}
        </div>
      </section>
    );
  }

  const name = displayName(member);
  const membershipClass = member.membershipDetails.membershipClass;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--muted)" }}>
        <Link to="/dashboard/members" style={{ color: "var(--red-dark)", fontWeight: 800, textDecoration: "none" }}>Members</Link>
        <span>/</span>
        <span>{name}</span>
      </nav>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "20px 22px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 15, minWidth: 0 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,var(--red-dark),var(--red))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, overflow: "hidden", flexShrink: 0 }}>
              {member.personalDetails.profilePhotoUrl ? (
                <img src={member.personalDetails.profilePhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials(member)}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "var(--red-dark)", margin: 0, lineHeight: 1.15 }}>{name}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 7 }}>
                <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{member.membershipId ?? "No membership number"}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 750 }}>{membershipClass ? CLASS_LABELS[membershipClass] ?? membershipClass : "No grade"}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{member.membershipDetails.engineeringDiscipline ?? "No discipline"}</span>
              </div>
            </div>
          </div>
          <StatusPill status={member.membershipDetails.status} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, padding: "16px 22px", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
          <SummaryItem label="Email" value={valueOrDash(member.personalDetails.email)} />
          <SummaryItem label="Phone" value={valueOrDash(member.personalDetails.phoneNumber)} />
          <SummaryItem label="Expiry Date" value={formatDate(member.membershipDetails.expiryDate)} />
          <SummaryItem label="Account Active" value={valueOrDash(member.accountInfo.isActive)} />
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 28 }}>
            <Section title="Personal Information" compact>
              <DetailRows rows={[
                ["Email", valueOrDash(member.personalDetails.email)],
                ["Phone", valueOrDash(member.personalDetails.phoneNumber)],
                ["Gender", valueOrDash(member.personalDetails.gender)],
                ["Date of Birth", formatDate(member.personalDetails.dateOfBirth)],
                ["Nationality", valueOrDash(member.personalDetails.nationality)],
                ["Employer", valueOrDash(member.personalDetails.employer)],
                ["Position", valueOrDash(member.personalDetails.position)],
                ["Location", valueOrDash(member.personalDetails.location)],
              ]} />
            </Section>

            <Section title="Membership and Account" compact>
              <DetailRows rows={[
                ["Membership No.", valueOrDash(member.membershipId)],
                ["Grade", membershipClass ? CLASS_LABELS[membershipClass] ?? membershipClass : "—"],
                ["Discipline", valueOrDash(member.membershipDetails.engineeringDiscipline)],
                ["Joining Date", formatDate(member.membershipDetails.joiningDate)],
                ["Expiry Date", formatDate(member.membershipDetails.expiryDate)],
                ["Annual Fee", formatMoney(member.membershipDetails.annualFee)],
                ["Email Verified", valueOrDash(member.accountInfo.emailVerified)],
                ["2FA Enabled", valueOrDash(member.accountInfo.enable2FA)],
              ]} />
            </Section>
          </div>

          <Section title="Fee History">
            {member.feeHistory.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted)" }}>No membership fee records found.</p>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 12 }}>
                <table className="table-proto min-w-full border-separate border-spacing-0">
                  <thead><tr>{["Year", "Amount", "Status", "Due Date", "Paid At"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {member.feeHistory.map((fee) => (
                      <tr key={fee.id}>
                        <td>{fee.year}</td>
                        <td>{formatMoney(fee.amount, fee.currency ?? "TZS")}</td>
                        <td><StatusPill status={fee.status} /></td>
                        <td>{formatDate(fee.dueDate)}</td>
                        <td>{formatDate(fee.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Registration and Activity">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 28 }}>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Application</h3>
                <DetailRows rows={[
                  ["Reference", valueOrDash(member.registration?.referenceNumber)],
                  ["Status", valueOrDash(member.registration?.status)],
                  ["Submitted", formatDate(member.registration?.submittedAt)],
                ]} />
              </div>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Records</h3>
                <InlineMetric label="Education" value={member.registration?.educations?.length ?? 0} />
                <InlineMetric label="Experience" value={member.registration?.experiences?.length ?? 0} />
                <InlineMetric label="Documents" value={member.registration?.documents?.length ?? 0} />
                <InlineMetric label="References" value={member.registration?.references?.length ?? 0} />
              </div>
              <div>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Activity</h3>
                <InlineMetric label="Recent Payments" value={member.paymentHistory.length} />
                <InlineMetric label="Event Registrations" value={member.eventParticipation.length} />
                <InlineMetric label="Created" value={formatDate(member.accountInfo.createdAt)} />
                <InlineMetric label="Updated" value={formatDate(member.accountInfo.updatedAt)} />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </section>
  );
}
