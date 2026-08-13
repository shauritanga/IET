import { Button } from "~/components/prototype-ui";
import type { ExportFormat, ReportPreviewResult } from "./types";

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

export function ReportPreviewTable({
  result,
  loading,
  page,
  onPageChange,
  onExport,
  exportingFormat,
}: {
  result: ReportPreviewResult | null;
  loading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  /** Omit to render preview-only, with no export buttons (e.g. inside the Templates modal, where export lives on the card). */
  onExport?: (format: ExportFormat) => void;
  exportingFormat?: ExportFormat | null;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--muted)]">
          {result ? (
            <>
              Showing <strong>{result.items.length}</strong> of <strong>{result.total}</strong> row{result.total !== 1 ? "s" : ""}
            </>
          ) : (
            "No preview yet"
          )}
        </span>
        {onExport ? (
          <div className="flex items-center gap-2">
            {(["csv", "xlsx", "pdf"] as ExportFormat[]).map((format) => (
              <Button
                key={format}
                tone="dark"
                disabled={!result || result.items.length === 0 || !!exportingFormat}
                onClick={() => onExport(format)}
              >
                {exportingFormat === format ? "Exporting…" : `Export ${format.toUpperCase()}`}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[var(--border)]">
        <table className="min-w-full border-separate border-spacing-0 text-[11.5px]">
          <thead>
            <tr>
              {(result?.columns ?? []).map((col) => (
                <th
                  key={col.key}
                  className="border-b border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left font-bold text-[var(--red-dark)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={result?.columns.length ?? 1} className="px-3 py-5 text-center text-[var(--muted)]">
                  Loading…
                </td>
              </tr>
            ) : !result || result.items.length === 0 ? (
              <tr>
                <td colSpan={result?.columns.length ?? 1} className="px-3 py-5 text-center text-[var(--muted)]">
                  No rows to preview. Pick columns and click Preview.
                </td>
              </tr>
            ) : (
              result.items.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-b-0">
                  {result.columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-[var(--text)]">
                      {formatCell(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--border)] text-[12px] font-bold text-[var(--text)] disabled:opacity-40"
          >
            ‹
          </button>
          <span className="text-[11px] text-[var(--muted)]">
            Page {result.page} of {result.totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(result.totalPages, page + 1))}
            disabled={page === result.totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--border)] text-[12px] font-bold text-[var(--text)] disabled:opacity-40"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}
