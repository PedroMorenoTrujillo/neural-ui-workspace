import { readNeuFieldValue } from '../shared/neu-field-value-resolver';
import { neuExactKeyToken } from '../shared/neu-exact-key';
import type {
  NormalizedTreeHierarchy,
  TreeProjection,
} from '../hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeTableColumn,
  NeuTreeTableDataMode,
  NeuTreeTableExportOptions,
  NeuTreeTableExportOutcome,
  NeuTreeTableExportRequest,
  NeuTreeTableKey,
  NeuTreeTableSelection,
} from '../../public/neu-tree-table.types';
import { loadNeuTreeTableExportSerializer } from './neu-tree-table-export-loader';
import type { NeuTreeTableExportMatrix } from './neu-tree-table-export.types';

export interface NeuTreeTableExportSnapshot<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> {
  readonly browser: boolean;
  readonly active: () => boolean;
  readonly mode: NeuTreeTableDataMode;
  readonly request: NeuTreeTableExportRequest<F>;
  readonly options: NeuTreeTableExportOptions;
  readonly columns: readonly NeuTreeTableColumn<T, F>[];
  readonly projection: TreeProjection<T, K>;
  readonly normalized: NormalizedTreeHierarchy<T, K>;
  readonly selection: NeuTreeTableSelection<K>;
}

export type NeuTreeTableExportExecution =
  | { readonly kind: 'outcome'; readonly outcome: NeuTreeTableExportOutcome }
  | { readonly kind: 'delegated' };

function loadedRows<T, K extends NeuTreeTableKey>(
  normalized: NormalizedTreeHierarchy<T, K>,
): readonly T[] {
  const rows: T[] = [];
  const visited = new Set<string>();
  const stack = [...normalized.roots].reverse();
  while (stack.length > 0) {
    const token = stack.pop();
    if (token === undefined || visited.has(token) || !normalized.reachable.has(token)) continue;
    visited.add(token);
    const node = normalized.nodes.get(token);
    if (node === undefined) continue;
    rows.push(node.value);
    const children = normalized.children.get(token) ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child !== undefined) stack.push(child);
    }
  }
  return rows;
}

function projectRows<T extends object, K extends NeuTreeTableKey, F extends string>(
  snapshot: NeuTreeTableExportSnapshot<T, K, F>,
): { readonly delegated: boolean; readonly values: readonly T[] } {
  if (snapshot.request.scope === 'visible') {
    const seen = new Set<string>();
    return {
      delegated: false,
      values: snapshot.projection.visible.flatMap((node) => {
        if (seen.has(node.token)) return [];
        seen.add(node.token);
        return [node.value];
      }),
    };
  }
  if (snapshot.request.scope === 'loaded') {
    return { delegated: false, values: loadedRows(snapshot.normalized) };
  }
  const values: T[] = [];
  const seen = new Set<string>();
  for (const key of snapshot.selection.keys) {
    const token = neuExactKeyToken(key);
    if (seen.has(token)) continue;
    seen.add(token);
    const value = snapshot.normalized.nodes.get(token)?.value;
    if (value === undefined) return { delegated: snapshot.mode === 'remote', values: [] };
    values.push(value);
  }
  return { delegated: false, values };
}

export function buildNeuTreeTableExportMatrix<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(
  snapshot: NeuTreeTableExportSnapshot<T, K, F>,
): { readonly delegated: boolean; readonly matrix: NeuTreeTableExportMatrix } {
  const rows = projectRows(snapshot);
  return {
    delegated: rows.delegated,
    matrix: {
      columns: snapshot.columns.map((column) => ({ key: column.id, header: column.header })),
      rows: rows.values.map((value) =>
        snapshot.columns.map((column) => readNeuFieldValue(value, column)),
      ),
    },
  };
}

function download(
  serialized: { readonly mediaType: string; readonly bytes: Uint8Array },
  filename: string,
): void {
  const documentRef = globalThis.document;
  const browser = documentRef.defaultView;
  if (browser === null) throw new Error('Browser window is unavailable for export download.');
  const copy = new Uint8Array(serialized.bytes.byteLength);
  copy.set(serialized.bytes);
  const blob = new Blob([copy.buffer], { type: serialized.mediaType });
  const url = browser.URL.createObjectURL(blob);
  const anchor = documentRef.createElement('a');
  try {
    anchor.hidden = true;
    anchor.href = url;
    anchor.download = filename;
    documentRef.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    browser.URL.revokeObjectURL(url);
  }
}

export async function executeNeuTreeTableExport<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
>(snapshot: NeuTreeTableExportSnapshot<T, K, F>): Promise<NeuTreeTableExportExecution> {
  if (!snapshot.options.formats.includes(snapshot.request.format)) {
    return {
      kind: 'outcome',
      outcome: { status: 'unsupported', reason: `Export format is disabled: ${snapshot.request.format}` },
    };
  }
  const projection = buildNeuTreeTableExportMatrix(snapshot);
  if (projection.delegated) return { kind: 'delegated' };
  if (!snapshot.browser) {
    return {
      kind: 'outcome',
      outcome: { status: 'unsupported', reason: 'Browser download is unavailable during SSR.' },
    };
  }
  const serializer = await loadNeuTreeTableExportSerializer(snapshot.request.format);
  const serialized = await serializer(projection.matrix);
  if (!snapshot.active()) {
    return {
      kind: 'outcome',
      outcome: { status: 'failed', error: new Error('TreeTable was destroyed during export.') },
    };
  }
  const filename = snapshot.request.filename ?? snapshot.options.defaultFilename;
  download(serialized, filename);
  return {
    kind: 'outcome',
    outcome: { status: 'downloaded', filename, rowCount: projection.matrix.rows.length },
  };
}
