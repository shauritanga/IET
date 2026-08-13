import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import * as XLSX from 'xlsx';
import {
  createReportEntities,
  createReportRelations,
  ReportEntityDef,
  ReportRelationDef,
  ReportColumnDef,
} from '../config/report-bases';
import { CANNED_REPORTS } from '../config/canned-reports';
import { ReportPreviewDto, ReportExportDto } from '../dto/report-query.dto';
import { toCsv } from '../utils/csv.util';
import { generateReportPdf } from '../utils/pdf.util';

const PREVIEW_MAX_LIMIT = 100;
const EXPORT_ROW_CAP = 50000;

interface ResolvedColumn {
  def: ReportColumnDef;
  alias: string;
}

@Injectable()
export class ReportsService {
  private readonly entities: ReportEntityDef[];
  private readonly relations: ReportRelationDef[];
  private readonly entityById: Map<string, ReportEntityDef>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {
    this.entities = createReportEntities();
    this.relations = createReportRelations();
    this.entityById = new Map(this.entities.map((e) => [e.id, e]));
  }

  listBases() {
    return {
      entities: this.entities.map((entity) => ({
        id: entity.id,
        label: entity.label,
        description: entity.description,
        columns: entity.columns.map(({ key, label, type }) => ({ key, label, type })),
        filters: entity.filters.map((f) => ({
          key: `${entity.id}.${f.key}`,
          label: f.label,
          type: f.type,
          enumValues: f.enumValues,
        })),
      })),
      relations: this.relations.map((rel) => ({
        id: rel.id,
        entityAId: rel.entityAId,
        entityBId: rel.entityBId,
        labelFromA: rel.labelFromA ?? this.entityById.get(rel.entityBId)?.label,
        labelFromB: rel.labelFromB ?? this.entityById.get(rel.entityAId)?.label,
      })),
      cannedReports: CANNED_REPORTS,
    };
  }

  private getEntity(id: string): ReportEntityDef {
    const entity = this.entityById.get(id);
    if (!entity) {
      throw new BadRequestException(`Unknown report entity: ${id}`);
    }
    return entity;
  }

  private sqlAlias(key: string): string {
    return key.replace(/\./g, '__');
  }

  /** Builds the joined/filtered/column-selected query, only ever using whitelisted expressions. */
  private buildQuery(
    baseId: string,
    relationIds: string[] | undefined,
    columns: string[],
    filters?: Record<string, unknown>,
  ) {
    const base = this.getEntity(baseId);
    const qb: SelectQueryBuilder<any> = this.dataSource
      .getRepository(base.entityClass)
      .createQueryBuilder(base.alias);
    qb.select([]);

    const joinedAliasByEntity = new Map<string, string>([[baseId, base.alias]]);

    for (const relationId of relationIds ?? []) {
      const rel = this.relations.find((r) => r.id === relationId);
      if (!rel) continue; // silently ignore unknown relation ids

      if (rel.entityAId === baseId) {
        const target = this.getEntity(rel.entityBId);
        const alias = rel.aliasForB ?? target.alias;
        qb.leftJoin(target.entityClass as new () => any, alias, `${alias}.${rel.entityBColumn} = ${base.alias}.${rel.entityAColumn}`);
        joinedAliasByEntity.set(rel.entityBId, alias);
      } else if (rel.entityBId === baseId) {
        const target = this.getEntity(rel.entityAId);
        const alias = rel.aliasForA ?? target.alias;
        qb.leftJoin(target.entityClass as new () => any, alias, `${alias}.${rel.entityAColumn} = ${base.alias}.${rel.entityBColumn}`);
        joinedAliasByEntity.set(rel.entityAId, alias);
      }
      // relations that don't touch baseId are silently ignored
    }

    const columnIndex = new Map<string, ResolvedColumn>();
    const filterIndex = new Map<string, { def: ReportEntityDef['filters'][number]; alias: string }>();
    for (const [entityId, alias] of joinedAliasByEntity) {
      const entity = this.getEntity(entityId);
      for (const col of entity.columns) columnIndex.set(col.key, { def: col, alias });
      for (const filter of entity.filters) filterIndex.set(`${entityId}.${filter.key}`, { def: filter, alias });
    }

    const selectedColumns = columns
      .map((key) => columnIndex.get(key))
      .filter((c): c is ResolvedColumn => !!c);
    if (selectedColumns.length === 0) {
      throw new BadRequestException('At least one valid column must be selected');
    }
    for (const { def, alias } of selectedColumns) {
      qb.addSelect(def.expr(alias), this.sqlAlias(def.key));
    }

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue;
        const entry = filterIndex.get(key);
        if (!entry) continue; // silently ignore unknown/out-of-scope filter keys
        entry.def.applyTo(qb, entry.alias, value);
      }
    }

    return { qb, base, selectedColumns };
  }

  async preview(dto: ReportPreviewDto) {
    const { qb, selectedColumns } = this.buildQuery(dto.baseId, dto.relationIds, dto.columns, dto.filters);

    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(PREVIEW_MAX_LIMIT, Math.max(1, dto.limit ?? 20));

    const total = await qb.getCount();
    const rawRows = await qb
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany();

    const items = rawRows.map((row) => this.remapRow(row, selectedColumns));

    return {
      columns: selectedColumns.map(({ def }) => ({ key: def.key, label: def.label, type: def.type })),
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async export(dto: ReportExportDto): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const { qb, base, selectedColumns } = this.buildQuery(dto.baseId, dto.relationIds, dto.columns, dto.filters);

    const rawRows = await qb.limit(EXPORT_ROW_CAP).getRawMany();
    const headers = selectedColumns.map(({ def }) => def.label);
    const cellRows = rawRows.map((row) => {
      const remapped = this.remapRow(row, selectedColumns);
      return selectedColumns.map(({ def }) => this.formatCell(remapped[def.key], def.type));
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filenameBase = `${base.label.replace(/\s+/g, '-').toLowerCase()}-${timestamp}`;

    if (dto.format === 'csv') {
      return {
        buffer: Buffer.from(toCsv(headers, cellRows), 'utf-8'),
        contentType: 'text/csv',
        filename: `${filenameBase}.csv`,
      };
    }

    if (dto.format === 'xlsx') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...cellRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, base.label.slice(0, 31));
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${filenameBase}.xlsx`,
      };
    }

    const buffer = await generateReportPdf({ title: base.label, headers, rows: cellRows });
    return { buffer, contentType: 'application/pdf', filename: `${filenameBase}.pdf` };
  }

  private remapRow(row: Record<string, unknown>, columns: ResolvedColumn[]): Record<string, unknown> {
    const remapped: Record<string, unknown> = {};
    for (const { def } of columns) {
      remapped[def.key] = row[this.sqlAlias(def.key)];
    }
    return remapped;
  }

  private formatCell(value: unknown, type: string): string {
    if (value === null || value === undefined) return '';
    if (type === 'date' && value) {
      const date = new Date(value as string);
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    }
    return String(value);
  }
}
