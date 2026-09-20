import type {
  NeuTableExportMatrix,
  NeuTableSerializedExport,
} from '../../export/neu-table-export-serializer.types';

const encoder = new TextEncoder();

function jsonValue(value: unknown, ancestors: ReadonlySet<object>): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError('Circular export value');
    const next = new Set(ancestors).add(value);
    return value.map((entry) => jsonValue(entry, next));
  }
  if (typeof value === 'object') {
    if (ancestors.has(value)) throw new TypeError('Circular export value');
    if (Object.getPrototypeOf(value) !== Object.prototype) return String(value);
    const next = new Set(ancestors).add(value);
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, jsonValue(Reflect.get(value, key), next)]),
    );
  }
  return String(value);
}

export function serializeNeuTableJson(matrix: NeuTableExportMatrix): NeuTableSerializedExport {
  const rows = matrix.rows.map((values) =>
    Object.fromEntries(
      matrix.columns.map((column, index) => [
        column.key,
        jsonValue(values[index], new Set()),
      ]),
    ),
  );
  return {
    mediaType: 'application/json;charset=utf-8',
    bytes: encoder.encode(JSON.stringify(rows, null, 2)),
  };
}
