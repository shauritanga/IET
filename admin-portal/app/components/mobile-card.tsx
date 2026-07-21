import type { ReactNode } from "react";

/**
 * App-style card primitives for mobile. Each list page keeps its table for md+
 * screens (`hidden md:block`) and renders a `MobileCardList` (`md:hidden`) with
 * one `MobileCard` per row so phones get a native-app feel instead of a
 * horizontally-scrolling table.
 */

export function MobileCardList({ children }: { children: ReactNode }) {
  return <div className="space-y-2.5 md:hidden">{children}</div>;
}

export function MobileCard({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const base =
    "rounded-[12px] border border-[var(--border)] bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} w-full text-left transition-colors active:bg-[var(--red-pale)]`}
      >
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

/** Card header: a bold title with optional subtitle, and a right-aligned slot. */
export function MobileCardHeader({
  title,
  subtitle,
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-[var(--text)]">{title}</div>
        {subtitle ? (
          <div className="truncate text-[10.5px] text-[var(--muted)]">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/** Two-column label/value grid for a card's detail fields. */
export function CardFieldGrid({
  fields,
}: {
  fields: Array<{ label: string; value: ReactNode; mono?: boolean }>;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
      {fields.map(({ label, value, mono }) => (
        <div key={label} className="min-w-0">
          <div className="text-[9px] font-bold uppercase tracking-[0.6px] text-[var(--muted)]">
            {label}
          </div>
          <div
            className={`mt-[1px] truncate text-[11.5px] font-semibold text-[var(--text)] ${
              mono ? "font-mono text-[10.5px]" : ""
            }`}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A bordered footer strip for card actions / links. */
export function MobileCardFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
      {children}
    </div>
  );
}
