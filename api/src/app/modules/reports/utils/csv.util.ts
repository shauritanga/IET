/** Escapes cells by doubling embedded quotes, per RFC 4180. */
export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (cell: string) => `"${(cell ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];
  return lines.join('\r\n');
}
