import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { RefreshCw, Send, Trash2, Wallet } from "lucide-react";
import { Button, Modal, StatusBadge } from "~/components/prototype-ui";
import http from "~/utils/http";
import { getStoredUser } from "~/utils/auth";
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
  year: number;
  source: "PAYMENT" | "MEMBERSHIP_FEE";
  sourceLabel?: string | null;
};

type PaymentSummary = {
  totalRevenue: number;
  thisMonth: number;
  pending: number;
  currency: string;
  counts?: {
    completed: number;
    pending: number;
    failed: number;
    total: number;
  };
};

type PaymentLedgerMeta = NonNullable<ApiEnvelope<PaymentRecord[]>["meta"]> & {
  years?: number[];
  summary?: PaymentSummary;
};

type PaymentLedgerResponse = ApiEnvelope<PaymentRecord[]> & {
  meta?: PaymentLedgerMeta;
};

const STATUS_OPTIONS = ["All Statuses", "COMPLETED", "PENDING", "PROCESSING", "FAILED", "CANCELLED"] as const;
const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "APPLICATION_FEE", label: "Application Fee" },
  { value: "MEMBERSHIP_FEE", label: "Membership Fee" },
  { value: "EVENT_REGISTRATION", label: "Event Registration" },
  { value: "UPGRADE_FEE", label: "Upgrade Fee" },
] as const;
const YEAR_OPTION_ALL = "";
const PAGE_SIZE = 10;

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

const SOURCE_LABELS: Record<string, string> = {
  PAYMENT: "Gateway Payment",
  MEMBERSHIP_FEE: "Imported Fee",
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

function buildPaginationItems(current: number, total: number): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    items.push("...");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < total - 1) {
    items.push("...");
  }

  items.push(total);
  return items;
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
  const [yearFilter, setYearFilter] = useState(YEAR_OPTION_ALL);
  const [years, setYears] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const currentRole = getStoredUser()?.role;
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isAdmin = isSuperAdmin || currentRole === "ADMIN";
  const [deleteTarget, setDeleteTarget] = useState<PaymentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [sendLinkTarget, setSendLinkTarget] = useState<PaymentRecord | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string, ms = 3500) {
    setToast(message);
    setTimeout(() => setToast(null), ms);
  }

  // Only actual (failed/cancelled) payment records may be deleted — never
  // membership-fee rows or completed/in-flight payments.
  function canDelete(p: PaymentRecord) {
    return (
      isSuperAdmin &&
      p.source === "PAYMENT" &&
      (p.status === "FAILED" || p.status === "CANCELLED")
    );
  }

  // A payment link can be (re)sent for any unpaid real payment.
  function canSendLink(p: PaymentRecord) {
    return (
      isSuperAdmin &&
      p.source === "PAYMENT" &&
      p.status !== "COMPLETED" &&
      p.status !== "REFUNDED"
    );
  }

  const canCheckStatus = (p: PaymentRecord) => isAdmin && p.source === "PAYMENT";

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.delete(`/admin/payments/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToast("Payment deleted.");
      await loadPayments();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      showToast(apiError.response?.data?.message ?? "Failed to delete payment.", 4000);
    } finally {
      setDeleting(false);
    }
  }

  async function handleCheckStatus(p: PaymentRecord) {
    setCheckingId(p.id);
    try {
      const res = await http.post<ApiEnvelope<{ id: string; status: string }>>(
        `/admin/payments/${p.id}/check-status`,
      );
      const status = res.data.data?.status;
      showToast(status ? `Status: ${status}` : "Status refreshed.");
      await loadPayments();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      showToast(apiError.response?.data?.message ?? "Failed to check status.", 4000);
    } finally {
      setCheckingId(null);
    }
  }

  async function handleSendLink() {
    if (!sendLinkTarget) return;
    setSendingLink(true);
    try {
      const res = await http.post<
        ApiEnvelope<{ sentEmail: boolean; sentSms: boolean }>
      >(`/admin/payments/${sendLinkTarget.id}/resend-link`);
      const { sentEmail, sentSms } = res.data.data ?? {};
      const channels = [sentEmail && "email", sentSms && "SMS"].filter(Boolean).join(" & ");
      setSendLinkTarget(null);
      showToast(channels ? `Payment link sent by ${channels}.` : "Payment link generated.");
      await loadPayments();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      showToast(apiError.response?.data?.message ?? "Failed to send payment link.", 4000);
    } finally {
      setSendingLink(false);
    }
  }

  async function loadPayments() {
    setLoading(true);
    setPageError(null);

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter !== "All Statuses") params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (yearFilter) params.set("year", yearFilter);

    try {
      const paymentsRes = await http.get<PaymentLedgerResponse>(`/admin/payments?${params}`);

      setPayments(paymentsRes.data.data ?? []);
      setTotal(paymentsRes.data.meta?.total ?? 0);
      setSummary(paymentsRes.data.meta?.summary ?? null);
      const metaYears = paymentsRes.data.meta?.years ?? [];
      const derivedYears = Array.from(
        new Set([
          ...metaYears,
          ...(paymentsRes.data.data ?? []).map((payment) => payment.year),
        ]),
      ).filter((value): value is number => Number.isFinite(value));
      setYears(derivedYears.sort((a, b) => b - a));
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
  }, [statusFilter, typeFilter, yearFilter, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const completedCount = summary?.counts?.completed ?? payments.filter((p) => p.status === "COMPLETED").length;
  const pendingCount = summary?.counts?.pending ?? payments.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length;
  const startItem = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(total, safePage * PAGE_SIZE);

  // Shared action buttons (used by both the desktop table and the mobile cards).
  function renderActions(p: PaymentRecord) {
    if (!isAdmin) return null;
    const hasAny = canCheckStatus(p) || canSendLink(p) || canDelete(p);
    return (
      <div className="flex items-center gap-2">
        {canCheckStatus(p) && (
          <button
            type="button"
            onClick={() => void handleCheckStatus(p)}
            disabled={checkingId === p.id}
            title="Check payment status"
            aria-label="Check payment status"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--red-light)] hover:text-[var(--red)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={checkingId === p.id ? "animate-spin" : ""} />
          </button>
        )}
        {canSendLink(p) && (
          <button
            type="button"
            onClick={() => setSendLinkTarget(p)}
            title="Send payment link (email + SMS)"
            aria-label="Send payment link"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--red-light)] hover:text-[var(--red)]"
          >
            <Send size={13} />
          </button>
        )}
        {canDelete(p) && (
          <button
            type="button"
            onClick={() => setDeleteTarget(p)}
            title="Delete payment"
            aria-label="Delete payment"
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[#f0b0b0] hover:bg-[#fef2f2] hover:text-[#dc2626]"
          >
            <Trash2 size={13} />
          </button>
        )}
        {!hasAny && <span className="text-[11px] text-[var(--muted)]">—</span>}
      </div>
    );
  }

  return (
    <section>
      <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Payments</h1>
          <p className="mt-[2px] hidden text-[11px] text-[var(--muted)] sm:block">
            Track all member payments, imported fee records, and subscriptions
          </p>
        </div>
        <div className="flex flex-nowrap gap-2 sm:flex-wrap">
          <select
            value={yearFilter}
            onChange={(e) => {
              setPage(1);
              setYearFilter(e.target.value);
            }}
            className="h-[34px] min-w-0 flex-1 sm:w-auto sm:flex-none rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          >
            <option value={YEAR_OPTION_ALL}>All Years</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value);
            }}
            className="h-[34px] min-w-0 flex-1 sm:w-auto sm:flex-none rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="h-[34px] min-w-0 flex-1 sm:w-auto sm:flex-none rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
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
          note="Filtered ledger"
        />
        <MetricCard
          icon={<ConfirmedIcon />}
          value={completedCount.toString()}
          label="Completed"
          note="Filtered ledger"
          iconClassName="bg-[#E8F5E9] text-[var(--success)]"
          valueClassName="text-[var(--success)]"
        />
        <MetricCard
          icon={<PendingIcon />}
          value={pendingCount.toString()}
          label="Pending / Processing"
          note="Filtered ledger"
          iconClassName="bg-[#FFF8E1] text-[var(--warn)]"
          valueClassName="text-[var(--warn)]"
          noteClassName="text-[var(--warn)]"
        />
      </div>

      {/* Desktop / tablet: table */}
      <section className="hidden overflow-hidden rounded-[12px] border border-[var(--border)] bg-white md:block">
        <div className="overflow-x-auto">
          {loading ? (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: isAdmin ? 10 : 9 }).map((__, j) => (
                      <td key={j}>
                        <div
                          className="skeleton-bar h-[12px]"
                          style={{ width: j === 1 ? "70%" : j === 0 ? "60%" : "45%" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table-proto min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  {isAdmin && <th>Actions</th>}
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
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-[4px] text-[11px] font-semibold ${
                          p.source === "MEMBERSHIP_FEE"
                            ? "bg-[#f0fdf4] text-[#166534]"
                            : "bg-[#eff6ff] text-[#1d4ed8]"
                        }`}
                      >
                        {SOURCE_LABELS[p.source] ?? p.sourceLabel ?? p.source}
                      </span>
                    </td>
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
                    {isAdmin && <td>{renderActions(p)}</td>}
                  </tr>
                ))}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 9} className="px-4 py-12 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--red-pale)] text-[var(--red)]">
                        <Wallet size={22} />
                      </div>
                      <p className="text-[13px] font-bold text-[var(--red-dark)]">No payments found</p>
                      <p className="mt-1 text-[11.5px] text-[var(--muted)]">
                        Try adjusting the year, type, or status filters above.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Mobile: card list */}
      <div className="md:hidden">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-[12px] border border-[var(--border)] bg-white p-3.5">
                <div className="skeleton-bar mb-2 h-[14px] w-1/2" />
                <div className="skeleton-bar mb-3 h-[12px] w-1/3" />
                <div className="skeleton-bar h-[12px] w-2/3" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--red-pale)] text-[var(--red)]">
              <Wallet size={22} />
            </div>
            <p className="text-[13px] font-bold text-[var(--red-dark)]">No payments found</p>
            <p className="mt-1 text-[11.5px] text-[var(--muted)]">Try adjusting the filters above.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="rounded-[12px] border border-[var(--border)] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-[var(--text)]">{p.memberName}</div>
                    {p.memberEmail && (
                      <div className="truncate text-[10.5px] text-[var(--muted)]">{p.memberEmail}</div>
                    )}
                  </div>
                  <StatusBadge tone={statusTone(p.status)}>{p.status}</StatusBadge>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-[18px] font-extrabold tracking-[-0.5px] text-[var(--red-dark)]">
                    {formatMoney(p.amount, p.currency)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-[3px] text-[10.5px] font-semibold ${
                      p.source === "MEMBERSHIP_FEE"
                        ? "bg-[#f0fdf4] text-[#166534]"
                        : "bg-[#eff6ff] text-[#1d4ed8]"
                    }`}
                  >
                    {SOURCE_LABELS[p.source] ?? p.sourceLabel ?? p.source}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                  {[
                    ["Type", TYPE_LABELS[p.paymentType] ?? p.paymentType],
                    ["Method", METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod],
                    ["Date", formatDate(p.completedAt ?? p.createdAt)],
                    ["Ref", p.transactionRef],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
                        {label}
                      </div>
                      <div
                        className={`mt-[1px] truncate text-[11.5px] font-semibold text-[var(--text)] ${
                          label === "Ref" ? "font-mono text-[10.5px]" : ""
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                {(p.receiptUrl || isAdmin) && (
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
                    {p.receiptUrl ? (
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11.5px] font-semibold text-[var(--red)] hover:underline"
                      >
                        View receipt
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">No receipt</span>
                    )}
                    {renderActions(p)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] border border-[var(--border)] bg-white px-4 py-2.5">
          <span className="text-[11px] text-[var(--muted)]">
            Showing <strong>{startItem}</strong>-<strong>{endItem}</strong> of <strong>{total}</strong> payments
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--white)] text-[13px] font-bold text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹
            </button>
            {buildPaginationItems(safePage, totalPages).map((item, index) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-[30px] w-[22px] items-center justify-center text-[13px] font-bold text-[var(--muted)]"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-[1.5px] text-[11.5px] font-bold transition-colors duration-150 ${
                    safePage === item
                      ? "border-[var(--red)] bg-[var(--red)] text-white"
                      : "border-[var(--border)] bg-[var(--white)] text-[var(--text)]"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--white)] text-[13px] font-bold text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-toast-in fixed right-5 top-5 z-[6000] rounded-[10px] bg-[#111] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          {toast}
        </div>
      )}

      <Modal
        title="Delete Payment"
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button tone="red" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Payment"}
            </Button>
          </div>
        }
      >
        {deleteTarget ? (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--text)]">
              Permanently delete this <strong>{deleteTarget.status}</strong> payment
              {deleteTarget.memberName ? <> for <strong>{deleteTarget.memberName}</strong></> : null}?
            </p>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[11px] text-[var(--muted)]">
              <div>Ref: <span className="font-mono">{deleteTarget.transactionRef}</span></div>
              <div>Amount: {formatMoney(deleteTarget.amount, deleteTarget.currency)}</div>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              This removes the payment record only. It does not affect the member&rsquo;s
              application or event registration, which can still be paid again.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        title="Send Payment Link"
        open={Boolean(sendLinkTarget)}
        onClose={() => setSendLinkTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button tone="outline" onClick={() => setSendLinkTarget(null)} disabled={sendingLink}>
              Cancel
            </Button>
            <Button tone="dark" onClick={() => void handleSendLink()} disabled={sendingLink}>
              {sendingLink ? "Sending..." : "Generate & Send"}
            </Button>
          </div>
        }
      >
        {sendLinkTarget ? (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--text)]">
              Generate a fresh payment link and send it to
              {sendLinkTarget.memberName ? <> <strong>{sendLinkTarget.memberName}</strong></> : " the member"} by
              <strong> email and SMS</strong>?
            </p>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[11px] text-[var(--muted)]">
              {sendLinkTarget.memberEmail && <div>Email: {sendLinkTarget.memberEmail}</div>}
              <div>Amount: {formatMoney(sendLinkTarget.amount, sendLinkTarget.currency)}</div>
              <div>Current status: {sendLinkTarget.status}</div>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              A failed or cancelled payment is re-opened so the member can complete it.
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
