type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  onPageChange: (page: number) => void;
};

function pageItems(current: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: Array<number | "..."> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("...");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("...");
  items.push(total);
  return items;
}

const buttonBase = {
  width: 30,
  height: 30,
  border: "1.5px solid var(--border)",
  borderRadius: 7,
  background: "var(--white)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--text)",
  fontSize: 12,
  fontWeight: 700,
} as const;

export function Pagination({ page, pageSize, total, noun, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const current = Math.min(page, totalPages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row" style={{ marginTop: 14 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> {noun}{total !== 1 ? "s" : ""}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          style={{ ...buttonBase, cursor: current === 1 ? "not-allowed" : "pointer", opacity: current === 1 ? 0.4 : 1 }}
        >‹</button>
        {pageItems(current, totalPages).map((item, index) =>
          item === "..." ? (
            <span key={`gap-${index}`} style={{ width: 20, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>…</span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === current ? "page" : undefined}
              onClick={() => onPageChange(item)}
              style={{
                ...buttonBase,
                cursor: "pointer",
                borderColor: item === current ? "var(--red)" : "var(--border)",
                background: item === current ? "var(--red)" : "var(--white)",
                color: item === current ? "white" : "var(--text)",
              }}
            >{item}</button>
          ),
        )}
        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
          style={{ ...buttonBase, cursor: current === totalPages ? "not-allowed" : "pointer", opacity: current === totalPages ? 0.4 : 1 }}
        >›</button>
      </div>
    </div>
  );
}
