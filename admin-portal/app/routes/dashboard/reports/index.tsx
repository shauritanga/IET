import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  FileText,
  Layers,
  Receipt,
  Ticket,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button, Modal, PageHeader } from "~/components/prototype-ui";
import { usePermissions } from "~/providers/permissions";
import http from "~/utils/http";
import { downloadBlob } from "~/utils/download";
import type { ApiEnvelope } from "~/types";
import { ReportPreviewTable } from "./report-preview-table";
import {
  relationsForBase,
  type CannedReport,
  type ExportFormat,
  type ReportEntity,
  type ReportPreviewResult,
  type ReportRelation,
} from "./types";

const PREVIEW_LIMIT = 20;

const REPORT_ICONS: Record<string, LucideIcon> = {
  membership: Users,
  financial: CreditCard,
  applications: FileText,
  events: CalendarDays,
  event_registrations: Ticket,
  upgrade_applications: TrendingUp,
  membership_fees: Receipt,
  membership_categories: Layers,
};

interface BasesResponse {
  entities: ReportEntity[];
  relations: ReportRelation[];
  cannedReports: CannedReport[];
}

function groupColumnsByEntity(entityIds: string[], entities: ReportEntity[]) {
  return entityIds
    .map((id) => entities.find((e) => e.id === id))
    .filter((e): e is ReportEntity => !!e)
    .map((entity) => [entity.label, entity.columns] as const);
}

export default function ReportsPage() {
  const { canRead } = usePermissions();
  const canUseReports = canRead("reports");
  const [tab, setTab] = useState<"templates" | "custom">("templates");
  const [data, setData] = useState<BasesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http
      .get<ApiEnvelope<BasesResponse>>("/admin/reports/bases")
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <PageHeader title="Reports & Analytics" description="Generate and export IET Tanzania operational reports" />

      <div className="mb-4 flex gap-1 border-b border-[var(--border)]">
        {(["templates", "custom"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-[10px] text-[12px] font-bold transition-colors ${
              tab === t
                ? "border-b-2 border-[var(--red)] text-[var(--red-dark)]"
                : "border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {t === "templates" ? "Templates" : "Custom Report"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-[12px] text-[var(--muted)]">Loading…</div>
      ) : !data ? (
        <div className="py-10 text-center text-[12px] text-[var(--muted)]">Failed to load reports.</div>
      ) : tab === "templates" ? (
        <TemplatesTab cannedReports={data.cannedReports} canUseReports={canUseReports} />
      ) : (
        <CustomReportTab entities={data.entities} relations={data.relations} canUseReports={canUseReports} />
      )}
    </section>
  );
}

function TemplatesTab({
  cannedReports,
  canUseReports,
}: {
  cannedReports: CannedReport[];
  canUseReports: boolean;
}) {
  const [activeReport, setActiveReport] = useState<CannedReport | null>(null);
  const [previewResult, setPreviewResult] = useState<ReportPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  /** `${reportId}:${format}` of the export currently in flight, so each card's buttons show their own loading state. */
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  async function loadPreview(report: CannedReport, targetPage: number) {
    setPreviewLoading(true);
    try {
      const res = await http.post<ApiEnvelope<ReportPreviewResult>>("/admin/reports/preview", {
        baseId: report.baseId,
        relationIds: report.relationIds,
        columns: report.columns,
        filters: report.filters,
        page: targetPage,
        limit: PREVIEW_LIMIT,
      });
      setPreviewResult(res.data.data);
    } finally {
      setPreviewLoading(false);
    }
  }

  function openPreview(report: CannedReport) {
    setActiveReport(report);
    setPreviewResult(null);
    setPage(1);
    void loadPreview(report, 1);
  }

  function closeModal() {
    setActiveReport(null);
    setPreviewResult(null);
  }

  function handlePageChange(nextPage: number) {
    if (!activeReport) return;
    setPage(nextPage);
    void loadPreview(activeReport, nextPage);
  }

  async function handleExport(report: CannedReport, format: ExportFormat) {
    const key = `${report.id}:${format}`;
    setExportingKey(key);
    try {
      const res = await http.post(
        "/admin/reports/export",
        {
          baseId: report.baseId,
          relationIds: report.relationIds,
          columns: report.columns,
          filters: report.filters,
          format,
        },
        { responseType: "blob" },
      );
      downloadBlob(res, `${report.id}.${format}`);
    } finally {
      setExportingKey(null);
    }
  }

  return (
    <>
      <div className="grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {cannedReports.map((report) => {
          const exportingFormat = exportingKey?.startsWith(`${report.id}:`)
            ? (exportingKey.split(":")[1] as ExportFormat)
            : null;
          return (
            <TemplateReportCard
              key={report.id}
              report={report}
              icon={REPORT_ICONS[report.id] ?? FileText}
              canUseReports={canUseReports}
              onPreview={() => openPreview(report)}
              onExport={(format) => handleExport(report, format)}
              exportingFormat={exportingFormat}
            />
          );
        })}
      </div>

      <Modal
        title={activeReport?.title ?? ""}
        open={!!activeReport}
        onClose={closeModal}
        maxWidthClassName="max-w-[min(1000px,92vw)]"
      >
        <ReportPreviewTable result={previewResult} loading={previewLoading} page={page} onPageChange={handlePageChange} />
      </Modal>
    </>
  );
}

function TemplateReportCard({
  report,
  icon: Icon,
  canUseReports,
  onPreview,
  onExport,
  exportingFormat,
}: {
  report: CannedReport;
  icon: LucideIcon;
  canUseReports: boolean;
  onPreview: () => void;
  onExport: (format: ExportFormat) => void;
  exportingFormat: ExportFormat | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex h-full flex-col rounded-[16px] border border-[var(--border)] bg-white shadow-[0_1px_3px_rgba(17,17,17,0.06)] transition-[box-shadow,transform] duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(226,12,10,0.12)]">
      <div className="flex flex-1 flex-col items-center gap-[8px] px-5 pb-5 pt-6 text-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--red-pale)] text-[var(--red)]">
          <Icon size={20} />
        </div>
        <div className="text-[13px] font-bold leading-[1.3] text-[var(--red-dark)]">{report.title}</div>
        <p className="text-[11px] leading-[1.5] text-[var(--muted)]">{report.description}</p>
      </div>

      <div className="flex items-center justify-center gap-[8px] border-t border-[var(--border)] px-4 py-3">
        {canUseReports ? (
          <>
            <Button tone="dark" onClick={onPreview}>
              <Eye size={13} />
              Preview
            </Button>
            <div className="relative" ref={menuRef}>
              <Button
                disabled={!!exportingFormat}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Download size={13} />
                {exportingFormat ? "Exporting…" : "Export"}
                <ChevronDown size={11} className={`transition-transform duration-150 ${menuOpen ? "rotate-180" : ""}`} />
              </Button>
              {menuOpen ? (
                <div className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[104px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
                  {(["csv", "xlsx", "pdf"] as ExportFormat[]).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onExport(format);
                      }}
                      className="block w-full px-3 py-[9px] text-left text-[11px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--red-pale)] hover:text-[var(--red-dark)]"
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CustomReportTab({
  entities,
  relations,
  canUseReports,
}: {
  entities: ReportEntity[];
  relations: ReportRelation[];
  canUseReports: boolean;
}) {
  const [baseId, setBaseId] = useState<string>(entities[0]?.id ?? "");
  const [checkedRelationIds, setCheckedRelationIds] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});

  const [previewResult, setPreviewResult] = useState<ReportPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const availableRelations = useMemo(() => relationsForBase(relations, baseId), [relations, baseId]);
  const availableEntityIds = useMemo(() => {
    const checkedTargets = availableRelations
      .filter((r) => checkedRelationIds.has(r.relation.id))
      .map((r) => r.targetEntityId);
    return [baseId, ...checkedTargets];
  }, [availableRelations, checkedRelationIds, baseId]);

  const columnGroups = useMemo(() => groupColumnsByEntity(availableEntityIds, entities), [availableEntityIds, entities]);
  const availableFilters = useMemo(
    () =>
      availableEntityIds
        .map((id) => entities.find((e) => e.id === id))
        .filter((e): e is ReportEntity => !!e)
        .flatMap((e) => e.filters),
    [availableEntityIds, entities],
  );

  function selectBase(nextBaseId: string) {
    setBaseId(nextBaseId);
    setCheckedRelationIds(new Set());
    setSelectedColumns(new Set());
    setFilterValues({});
    setPreviewResult(null);
  }

  function toggleRelation(relationId: string, targetEntityId: string) {
    setCheckedRelationIds((current) => {
      const next = new Set(current);
      if (next.has(relationId)) {
        next.delete(relationId);
        // Drop columns/filters belonging to the entity we just removed.
        const targetEntity = entities.find((e) => e.id === targetEntityId);
        if (targetEntity) {
          setSelectedColumns((cols) => {
            const nextCols = new Set(cols);
            targetEntity.columns.forEach((c) => nextCols.delete(c.key));
            return nextCols;
          });
          setFilterValues((filters) => {
            const nextFilters = { ...filters };
            targetEntity.filters.forEach((f) => delete nextFilters[f.key]);
            return nextFilters;
          });
        }
      } else {
        next.add(relationId);
      }
      return next;
    });
  }

  function toggleColumn(key: string) {
    setSelectedColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setFilterValue(key: string, value: unknown) {
    setFilterValues((current) => ({ ...current, [key]: value }));
  }

  async function runPreview(targetPage: number) {
    if (!baseId || selectedColumns.size === 0) return;
    setPreviewLoading(true);
    try {
      const res = await http.post<ApiEnvelope<ReportPreviewResult>>("/admin/reports/preview", {
        baseId,
        relationIds: Array.from(checkedRelationIds),
        columns: Array.from(selectedColumns),
        filters: filterValues,
        page: targetPage,
        limit: PREVIEW_LIMIT,
      });
      setPreviewResult(res.data.data);
      setPage(targetPage);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleExport(format: ExportFormat) {
    if (!baseId || selectedColumns.size === 0) return;
    setExportingFormat(format);
    try {
      const res = await http.post(
        "/admin/reports/export",
        {
          baseId,
          relationIds: Array.from(checkedRelationIds),
          columns: Array.from(selectedColumns),
          filters: filterValues,
          format,
        },
        { responseType: "blob" },
      );
      downloadBlob(res, `${baseId}-report.${format}`);
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="rounded-[12px] border border-[var(--border)] bg-white p-4">
          <label className="mb-2 block text-[11.5px] font-bold text-[var(--red-dark)]">Base Entity</label>
          <select
            value={baseId}
            onChange={(e) => selectBase(e.target.value)}
            className="h-[36px] w-full rounded-[7px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-[10px] text-[11.5px] text-[var(--text)] outline-none focus:border-[var(--red-dark)] focus:bg-white"
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[10.5px] leading-[1.5] text-[var(--muted)]">
            {entities.find((e) => e.id === baseId)?.description}
          </p>
        </div>

        {availableRelations.length > 0 ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white p-4">
            <label className="mb-2 block text-[11.5px] font-bold text-[var(--red-dark)]">Combine With</label>
            <p className="mb-2 text-[10px] leading-[1.4] text-[var(--muted)]">
              Related tables with a direct relationship to the base entity.
            </p>
            {availableRelations.map(({ relation, targetEntityId, label }) => (
              <label key={relation.id} className="flex items-center gap-2 py-[3px] text-[11.5px] text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={checkedRelationIds.has(relation.id)}
                  onChange={() => toggleRelation(relation.id, targetEntityId)}
                />
                {label}
              </label>
            ))}
          </div>
        ) : null}

        <div className="rounded-[12px] border border-[var(--border)] bg-white p-4">
          <label className="mb-2 block text-[11.5px] font-bold text-[var(--red-dark)]">Columns</label>
          <div className="max-h-[260px] space-y-3 overflow-y-auto">
            {columnGroups.map(([entityLabel, columns]) => (
              <div key={entityLabel}>
                <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.06em] text-[var(--muted)]">{entityLabel}</div>
                {columns.map((column) => (
                  <label key={column.key} className="flex items-center gap-2 py-[3px] text-[11.5px] text-[var(--text)]">
                    <input type="checkbox" checked={selectedColumns.has(column.key)} onChange={() => toggleColumn(column.key)} />
                    {column.label}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {availableFilters.length > 0 ? (
          <div className="rounded-[12px] border border-[var(--border)] bg-white p-4">
            <label className="mb-2 block text-[11.5px] font-bold text-[var(--red-dark)]">Filters</label>
            <div className="space-y-3">
              {availableFilters.map((filter) => (
                <div key={filter.key}>
                  <span className="mb-1 block text-[10.5px] font-semibold text-[var(--text)]">{filter.label}</span>
                  {filter.type === "date-range" ? (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        className="h-[32px] w-full rounded-[6px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] outline-none focus:border-[var(--red-dark)] focus:bg-white"
                        onChange={(e) =>
                          setFilterValue(filter.key, {
                            ...(filterValues[filter.key] as Record<string, string> | undefined),
                            from: e.target.value,
                          })
                        }
                      />
                      <input
                        type="date"
                        className="h-[32px] w-full rounded-[6px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] outline-none focus:border-[var(--red-dark)] focus:bg-white"
                        onChange={(e) =>
                          setFilterValue(filter.key, {
                            ...(filterValues[filter.key] as Record<string, string> | undefined),
                            to: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={(filterValues[filter.key] as string) ?? ""}
                      onChange={(e) => setFilterValue(filter.key, e.target.value)}
                      className="h-[32px] w-full rounded-[6px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] px-2 text-[11px] outline-none focus:border-[var(--red-dark)] focus:bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {canUseReports ? (
          <Button tone="dark" className="w-full" disabled={selectedColumns.size === 0} onClick={() => runPreview(1)}>
            Preview
          </Button>
        ) : null}
      </div>

      <div className="rounded-[12px] border border-[var(--border)] bg-white p-4">
        <ReportPreviewTable
          result={previewResult}
          loading={previewLoading}
          page={page}
          onPageChange={runPreview}
          onExport={canUseReports ? handleExport : undefined}
          exportingFormat={exportingFormat}
        />
      </div>
    </div>
  );
}
