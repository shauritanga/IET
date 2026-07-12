import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { AvatarTone, StatusTone } from "~/data/admin-prototype";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const avatarToneClass: Record<AvatarTone, string> = {
  red: "bg-[var(--red)]",
  blue: "bg-[#1565C0]",
  green: "bg-[#2E7D32]",
  purple: "bg-[#4527A0]",
  pink: "bg-[#880E4F]",
  orange: "bg-[#B45309]",
};

const badgeToneClass: Record<StatusTone, string> = {
  pending: "bg-[#FFF3E7] text-[#B45309]",
  approved: "bg-[#E8F5E9] text-[var(--success)]",
  rejected: "bg-[var(--red-light)] text-[var(--red)]",
  active: "bg-[#E8F5E9] text-[var(--success)]",
  warning: "bg-[#FFF3E7] text-[#B45309]",
  blue: "bg-[#E7EFFD] text-[#1565C0]",
  super: "bg-[var(--red-light)] text-[var(--red)]",
  admin: "bg-[#FFF3E7] text-[#B45309]",
  finance: "bg-[#E7EFFD] text-[#1565C0]",
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-[18px] flex items-center justify-between gap-4">
      <div>
        <h1 className="text-[15px] font-extrabold text-[var(--red-dark)]">{title}</h1>
        <p className="mt-[2px] text-[11px] text-[var(--muted)]">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Button({
  children,
  tone = "outline",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "outline" | "dark" | "red" | "green";
}) {
  const toneClass =
    tone === "dark"
      ? "border-[var(--red-dark)] bg-[var(--red-dark)] text-[var(--on-red-dark)] hover:border-[var(--red)] hover:bg-[var(--red)]"
      : tone === "red"
        ? "border-[var(--red)] bg-[var(--red)] text-white hover:bg-[var(--red-mid)] hover:border-[var(--red-mid)]"
        : tone === "green"
          ? "border-[var(--success)] bg-[var(--success)] text-white hover:opacity-90"
          : "border-[var(--border)] bg-white text-[var(--red-dark)] hover:border-[var(--red-light)] hover:bg-[var(--red-pale)]";

  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-[5px] rounded-[7px] border px-4 py-[7px] text-[11.5px] font-semibold transition-all duration-[160ms]",
        toneClass,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  bodyClassName,
  hoverable = false,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  hoverable?: boolean;
}) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-[12px] border border-[var(--border)] bg-white",
        hoverable && "cursor-pointer transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.1)]",
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between border-b border-[var(--border)] px-[18px] py-[15px]">
          <span className="text-[12.5px] font-bold text-[var(--red-dark)]">{title}</span>
          {action ? <div className="text-[11px] font-semibold text-[var(--red)] hover:underline">{action}</div> : null}
        </div>
      ) : null}
      <div className={cx("px-[18px] py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note: string;
}) {
  return (
    <article className="cursor-default rounded-[11px] border border-[var(--border)] bg-white px-4 pb-[13px] pt-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_18px_rgba(226,12,10,0.08)]">
      <div className="mb-[10px] flex h-[34px] w-[34px] items-center justify-center rounded-[8px] bg-[var(--red-pale)] text-[var(--red)]">
        <div className="h-4 w-4 rounded-[4px] border border-current" />
      </div>
      <div className="font-serif-display text-[24px] font-bold leading-none tracking-[-1px] text-[var(--red-dark)]">{value}</div>
      <div className="mt-1 text-[11px] font-medium text-[var(--muted)]">{label}</div>
      <div className="mt-[6px] text-[10px] font-semibold text-[var(--muted)]">{note}</div>
    </article>
  );
}

export function StatusBadge({ tone, children, className }: { tone: StatusTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-[8px] py-[4px] text-[10px] font-extrabold leading-none",
        badgeToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials, tone, small = false }: { initials: string; tone: AvatarTone; small?: boolean }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-full font-bold text-white",
        avatarToneClass[tone],
        small ? "h-6 w-6 text-[9px]" : "h-[30px] w-[30px] text-[10px]",
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function Field({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-[6px] block text-[11.5px] font-semibold text-[var(--text)]">{label}</span>
      <input
        type={type}
        defaultValue={value}
        className="h-[38px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-3 text-[12.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
      />
    </label>
  );
}

export function Select({ defaultValue, options }: { defaultValue: string; options: string[] }) {
  return (
    <select
      defaultValue={defaultValue}
      className="h-[34px] rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] pr-8 text-[11.5px] text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--red-dark)] focus:bg-white"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

export function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-[34px] items-center gap-[7px] rounded-[7px] border border-[var(--border)] bg-white px-[10px]">
      <div className="h-3 w-3 rounded-full border border-[var(--muted)]" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-[160px] border-none bg-transparent text-[12px] text-[var(--text)] outline-none"
      />
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="table-proto min-w-full border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr>
        {columns.map((column) => (
          <th
            key={column}
            className="text-left"
          >
            {column}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableCellMember({
  initials,
  tone,
  name,
  email,
}: {
  initials: string;
  tone: AvatarTone;
  name: string;
  email: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Avatar initials={initials} tone={tone} />
      <div>
        <div className="text-[12px] font-semibold">{name}</div>
        <div className="text-[10px] text-[var(--muted)]">{email}</div>
      </div>
    </div>
  );
}

export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  bodyClassName,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-[rgba(57,9,9,0.4)] px-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="animate-modal-rise flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_20px_50px_rgba(57,9,9,0.2)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-[var(--border)] bg-white px-[22px] py-[18px]">
          <span className="text-[14px] font-bold text-[var(--red-dark)]">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-[var(--border)] text-[var(--muted)] transition-all duration-150 hover:border-[var(--red)] hover:text-[var(--red)]"
          >
            <X size={13} />
          </button>
        </div>
        <div className={cx("min-h-0 overflow-y-auto px-[22px] py-5", bodyClassName)}>{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-[var(--border)] bg-white px-[22px] py-[14px]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
