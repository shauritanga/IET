import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Button, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import type { ApiEnvelope } from "~/types";

type PaymentRecord = {
  id: string;
  transactionRef: string;
  receiptNumber?: string | null;
  receiptUrl?: string | null;
  memberName: string;
  memberEmail?: string | null;
  paymentType: string;
  description?: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  completedAt?: string | null;
  createdAt: string;
};

type PaymentSummary = {
  totalRevenue: number;
  thisMonth: number;
  pending: number;
};

const STATUS_OPTIONS = ["All Statuses", "COMPLETED", "PENDING", "PROCESSING", "FAILED", "CANCELLED"] as const;
const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "APPLICATION_FEE", label: "Application Fee" },
  { value: "MEMBERSHIP_FEE", label: "Membership Fee" },
  { value: "EVENT_REGISTRATION", label: "Event Registration" },
  { value: "UPGRADE_FEE", label: "Upgrade Fee" },
] as const;

const METHOD_LABELS: Record<string, string> = {
  AIRTEL_MONEY: "Airtel Money",
  TIGO_PESA: "Tigo Pesa",
  HALOPESA: "Halopesa",
  MPESA: "M-Pesa",
  SELCOM: "Selcom",
  DPO_BANK: "DPO Bank",
};

const TYPE_LABELS: Record<string, string> = {
  APPLICATION_FEE: "Application Fee",
  MEMBERSHIP_FEE: "Membership Fee",
  EVENT_REGISTRATION: "Event Registration",
  UPGRADE_FEE: "Upgrade Fee",
};

function formatMoney(amount: number, currency = "TZS") {
  return `${currency} ${new Intl.NumberFormat("en-US").format(amount)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusTone(status: string): "approved" | "pending" | "rejected" {
  if (status === "COMPLETED") return "approved";
  if (status === "FAILED" || status === "CANCELLED") return "rejected";
  return "pending";
}

function RevenueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function ConfirmedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function MetricCard({
  icon,
  value,
  label,
  note,
  iconClassName = "bg-[var(--red-pale)] text-[var(--red)]",
  valueClassName = "text-[var(--red-dark)]",
  noteClassName = "text-[var(--muted)]",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  note: string;
  iconClassName?: string;
  valueClassName?: string;
  noteClassName?: string;
}) {
  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)]">
      <div className={`mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] ${iconClassName}`}>
        {icon}
      </div>
      <div className={`text-[18px] font-bold leading-none tracking-[-0.5px] ${valueClassName}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`mt-[6px] text-[10px] font-semibold ${noteClassName}`}>{note}</div>
    </article>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [typeFilter, setTypeFilter] = useState("");
  const [total, setTotal] = useState(0);

  async function loadPayments() {
    setLoading(true);
    setPageError(null);

    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (statusFilter !== "All Statuses") params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    try {
      const [paymentsRes, statsRes] = await Promise.all([
        http.get<ApiEnvelope<PaymentRecord[]>>(`/admin/payments?${params}`),
        http.get<ApiEnvelope<{ payments: PaymentSummary }>>("/admin/dashboard/stats"),
      ]);

      setPayments(paymentsRes.data.data ?? []);
      setTotal(paymentsRes.data.meta?.total ?? 0);
      setSummary(statsRes.data.data?.payments ?? null);
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setPageError(apiError.response?.data?.message ?? "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter]);

  const completedCount = payments.filter((p) => p.status === "COMPLETED").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length;

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Payments</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Track all member payments and subscriptions
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>

      {pageError ? (
        <div className="mb-[14px] rounded-[10px] border border-[#f0b0b0] bg-[var(--red-pale)] px-4 py-3 text-[11.5px] font-semibold text-[var(--red)]">
          <div className="flex items-center justify-between gap-3">
            <span>{pageError}</span>
            <Button tone="outline" onClick={() => void loadPayments()}>Retry</Button>
          </div>
        </div>
      ) : null}

      <div className="mb-[18px] grid gap-[14px] md:grid-cols-3">
        <MetricCard
          icon={<RevenueIcon />}
          value={summary ? formatMoney(summary.totalRevenue) : "—"}
          label="Total Revenue"
          note="All completed payments"
        />
        <MetricCard
          icon={<ConfirmedIcon />}
          value={completedCount.toString()}
          label="Completed (this page)"
          note="Confirmed payments"
          iconClassName="bg-[#E8F5E9] text-[var(--success)]"
          valueClassName="text-[var(--success)]"
        />
        <MetricCard
          icon={<PendingIcon />}
          value={pendingCount.toString()}
          label="Pending / Processing"
          note="Awaiting confirmation"
          iconClassName="bg-[#FFF8E1] text-[var(--warn)]"
          valueClassName="text-[var(--warn)]"
          noteClassName="text-[var(--warn)]"
        />
      </div>

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">Loading payments…</div>
          ) : (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-mono text-[11px]">{p.transactionRef}</td>
                    <td>
                      <div className="text-[12px] font-semibold">{p.memberName}</div>
                      {p.memberEmail && (
                        <div className="text-[10.5px] text-[var(--muted)]">{p.memberEmail}</div>
                      )}
                    </td>
                    <td className="text-[11.5px]">{TYPE_LABELS[p.paymentType] ?? p.paymentType}</td>
                    <td className="text-[11.5px] font-semibold">{formatMoney(p.amount, p.currency)}</td>
                    <td className="text-[11.5px]">{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</td>
                    <td className="text-[11.5px]">{formatDate(p.completedAt ?? p.createdAt)}</td>
                    <td>
                      <StatusBadge tone={statusTone(p.status)}>{p.status}</StatusBadge>
                    </td>
                    <td>
                      {p.receiptUrl ? (
                        <a
                          href={p.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11.5px] font-semibold text-[var(--red)] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-[11px] text-[var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {total > payments.length && !loading && (
          <div className="border-t border-[var(--border)] px-4 py-2 text-right text-[11px] text-[var(--muted)]">
            Showing {payments.length} of {total} payments
          </div>
        )}
      </section>
    </section>
  );
}
