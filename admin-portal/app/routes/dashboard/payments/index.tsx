import { useMemo, useState } from "react";
import { Button, StatusBadge } from "~/components/prototype-ui";
import { payments as initialPayments } from "~/data/admin-prototype";

type PaymentRecord = {
  ref: string;
  member: string;
  description: string;
  amount: string;
  method: string;
  date: string;
  status: string;
};

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

function PaymentsMetricCard({
  icon,
  value,
  label,
  note,
  compactValue = false,
  iconClassName = "bg-[var(--red-pale)] text-[var(--red)]",
  valueClassName = "text-[var(--red-dark)]",
  noteClassName = "text-[var(--muted)]",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  note: string;
  compactValue?: boolean;
  iconClassName?: string;
  valueClassName?: string;
  noteClassName?: string;
}) {
  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)]">
      <div className={`mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] ${iconClassName}`}>
        {icon}
      </div>
      <div className={`font-serif-display font-bold leading-none tracking-[-1px] ${compactValue ? "text-[18px]" : "text-[24px]"} ${valueClassName}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className={`mt-[6px] text-[10px] font-semibold ${noteClassName}`}>{note}</div>
    </article>
  );
}

export default function PaymentsPage() {
  const [methodFilter, setMethodFilter] = useState("All Methods");
  const [paymentRows, setPaymentRows] = useState<Array<PaymentRecord>>(
    initialPayments.map((payment) => ({
      ref: payment.ref,
      member: payment.member,
      description: payment.description,
      amount: payment.amount,
      method: payment.method,
      date: payment.date,
      status: payment.status,
    })),
  );

  const visiblePayments = useMemo(() => {
    if (methodFilter === "All Methods") return paymentRows;
    return paymentRows.filter((payment) => payment.method === methodFilter);
  }, [methodFilter, paymentRows]);

  function updatePaymentStatus(ref: string, status: string) {
    setPaymentRows((current) =>
      current.map((payment) => (payment.ref === ref ? { ...payment, status } : payment)),
    );
  }

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
          <Button>⬇ Export CSV</Button>
          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
            className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
          >
            {["All Methods", "M-Pesa", "Bank Transfer", "Card"].map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-[18px] grid gap-[14px] md:grid-cols-3">
        <PaymentsMetricCard
          icon={<RevenueIcon />}
          value="TZS 28.4M"
          label="Total Revenue 2025"
          note="↑ 12% vs 2024"
          compactValue
        />
        <PaymentsMetricCard
          icon={<ConfirmedIcon />}
          value="4,612"
          label="Confirmed Payments"
          note="This year"
          iconClassName="bg-[#E8F5E9] text-[var(--success)]"
          valueClassName="text-[var(--success)]"
        />
        <PaymentsMetricCard
          icon={<PendingIcon />}
          value="23"
          label="Pending Verification"
          note="Needs action"
          iconClassName="bg-[#FFF8E1] text-[var(--warn)]"
          valueClassName="text-[var(--warn)]"
          noteClassName="text-[var(--warn)]"
        />
      </div>

      <section className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
        <div className="overflow-x-auto">
          <table className="table-proto min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Member</th>
                <th>Description</th>
                <th>Amount (TZS)</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((payment) => (
                <tr key={payment.ref}>
                  <td className="font-mono text-[11px]">{payment.ref}</td>
                  <td className="text-[11.5px]">{payment.member}</td>
                  <td className="text-[11.5px]">{payment.description}</td>
                  <td className="text-[11.5px]">{payment.amount}</td>
                  <td className="text-[11.5px]">{payment.method}</td>
                  <td className="text-[11.5px]">{payment.date}</td>
                  <td>
                    <StatusBadge tone={payment.status === "Pending" ? "pending" : "approved"}>
                      {payment.status}
                    </StatusBadge>
                  </td>
                  <td>
                    {payment.status === "Pending" ? (
                      <div className="flex gap-[5px]">
                        <Button tone="green" onClick={() => updatePaymentStatus(payment.ref, "Confirmed")}>
                          Confirm
                        </Button>
                        <Button onClick={() => updatePaymentStatus(payment.ref, "Rejected")}>Reject</Button>
                      </div>
                    ) : (
                      <Button>Receipt</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
