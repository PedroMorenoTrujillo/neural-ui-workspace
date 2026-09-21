import type {
  NeuTableExportMatrix,
  NeuTableSerializedExport,
} from '../../export/neu-table-export-serializer.types';

const encoder = new TextEncoder();

function exportText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json;
}

function csvCell(value: unknown): string {
  let text = exportText(value);
  if (typeof value === 'string' && /^[\t ]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function serializeNeuTableCsv(matrix: NeuTableExportMatrix): NeuTableSerializedExport {
  const line = (values: readonly unknown[]) => values.map(csvCell).join(',');
  const content = [
    line(matrix.columns.map((column) => column.header)),
    ...matrix.rows.map(line),
  ].join('\r\n');
  return {
    mediaType: 'text/csv;charset=utf-8',
    bytes: encoder.encode(`\uFEFF${content}`),
  };
}
