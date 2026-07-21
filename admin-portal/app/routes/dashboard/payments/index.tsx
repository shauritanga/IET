import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
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

  const isSuperAdmin = getStoredUser()?.role === "SUPER_ADMIN";
  const [deleteTarget, setDeleteTarget] = useState<PaymentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Only actual (failed/cancelled) payment records may be deleted — never
  // membership-fee rows or completed/in-flight payments.
  function canDelete(p: PaymentRecord) {
    return (
      isSuperAdmin &&
      p.source === "PAYMENT" &&
      (p.status === "FAILED" || p.status === "CANCELLED")
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await http.delete(`/admin/payments/${deleteTarget.id}`);
      setDeleteTarget(null);
      setToast("Payment deleted.");
      setTimeout(() => setToast(null), 3000);
      await loadPayments();
    } catch (error) {
      const apiError = error as AxiosError<{ message?: string }>;
      setToast(apiError.response?.data?.message ?? "Failed to delete payment.");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDeleting(false);
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

  return (
    <section>
      <div className="mb-[18px] flex items-center justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">Payments</h1>
          <p className="mt-[2px] text-[11px] text-[var(--muted)]">
            Track all member payments, imported fee records, and subscriptions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={yearFilter}
            onChange={(e) => {
              setPage(1);
              setYearFilter(e.target.value);
            }}
            className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
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
            className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
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
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  {isSuperAdmin && <th>Actions</th>}
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
                    {isSuperAdmin && (
                      <td>
                        {canDelete(p) ? (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="text-[11.5px] font-semibold text-[#dc2626] hover:underline"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={isSuperAdmin ? 10 : 9} className="px-4 py-8 text-center text-[12px] text-[var(--muted)]">
                      No payments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      {!loading && total > 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-2">
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
      </section>

      {toast && (
        <div className="fixed right-5 top-5 z-[6000] rounded-[10px] bg-[#111] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
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
    </section>
  );
}
