export type ReportColumnType = "string" | "number" | "date" | "boolean" | "enum";
export type ReportFilterType = "enum" | "date-range" | "string";

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: ReportFilterType;
  enumValues?: string[];
}

export interface ReportEntity {
  id: string;
  label: string;
  description: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
}

export interface ReportRelation {
  id: string;
  entityAId: string;
  entityBId: string;
  labelFromA: string;
  labelFromB: string;
}

export interface CannedReport {
  id: string;
  title: string;
  description: string;
  baseId: string;
  relationIds: string[];
  columns: string[];
  filters?: Record<string, unknown>;
}

export interface ReportPreviewResult {
  columns: Array<{ key: string; label: string; type: ReportColumnType }>;
  items: Array<Record<string, unknown>>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ExportFormat = "xlsx" | "csv" | "pdf";

/** Given a base entity id, the relations available to check (either side touches base). */
export function relationsForBase(relations: ReportRelation[], baseId: string) {
  return relations
    .filter((r) => r.entityAId === baseId || r.entityBId === baseId)
    .map((r) => ({
      relation: r,
      targetEntityId: r.entityAId === baseId ? r.entityBId : r.entityAId,
      label: r.entityAId === baseId ? r.labelFromA : r.labelFromB,
    }));
}
