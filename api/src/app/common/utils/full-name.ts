type NameParts = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

/** First, middle (optional) and last name joined with single spaces. */
export function formatFullName(parts?: NameParts | null): string {
  if (!parts) return '';
  return [parts.firstName, parts.middleName, parts.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}

/** SQL fragment (TypeORM property paths, expanded by the query builder) matching a search term against any part of a person's name. */
export function nameSearchSql(alias: string, param: string): string {
  return `(${alias}.firstName ILIKE ${param} OR ${alias}.middleName ILIKE ${param} OR ${alias}.lastName ILIKE ${param} OR CONCAT_WS(' ', ${alias}.firstName, ${alias}.middleName, ${alias}.lastName) ILIKE ${param})`;
}
