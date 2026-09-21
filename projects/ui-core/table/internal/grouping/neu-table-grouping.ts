import type {
  NeuTableColumn,
  NeuTableGroupContext,
  NeuTableGroupingChange,
  NeuTableGroupingOptions,
  NeuTableGroupingState,
} from '../../public/neu-table.types';
import { readNeuTableColumnValue } from '../semantics/neu-table-basic-projections';

export interface NeuTableGroupNode<T extends object> {
  readonly kind: 'group-header' | 'group-footer';
  readonly id: string;
  readonly context: NeuTableGroupContext<T>;
  readonly aggregates: readonly NeuTableGroupAggregate[];
  readonly track: string;
}

export interface NeuTableGroupAggregate {
  readonly field: string;
  readonly value: unknown;
  readonly error: unknown | null;
}

export interface NeuTableGroupedRowNode<TRow> {
  readonly kind: 'row';
  readonly row: TRow;
  readonly track: unknown;
  readonly rowspan: ReadonlyMap<string, number>;
}

export type NeuTableGroupingNode<T extends object, TRow> =
  | NeuTableGroupNode<T>
  | NeuTableGroupedRowNode<TRow>;

function canonicalGroupValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  switch (typeof value) {
    case 'string':
      return `string:${value}`;
    case 'number':
      return `number:${Object.is(value, -0) ? '-0' : String(value)}`;
    case 'boolean':
      return `boolean:${String(value)}`;
    case 'bigint':
      return `bigint:${String(value)}`;
    default:
      return `object:${String(value)}`;
  }
}

function readGroupValue<T extends object, F extends string>(
  row: T,
  field: F,
  columns: readonly NeuTableColumn<T, F>[],
  options: NeuTableGroupingOptions<T, F>,
): unknown {
  if (options.value !== undefined) return options.value(row, field);
  const column = columns.find((candidate) => candidate.field === field);
  return column === undefined
    ? (row as Readonly<Record<string, unknown>>)[field]
    : readNeuTableColumnValue(row, column);
}

export function projectNeuTableGrouping<
  T extends object,
  F extends string,
  TRow extends { readonly row: T; readonly track: unknown },
>(args: {
  readonly rows: readonly TRow[];
  readonly domainRows?: readonly TRow[];
  readonly grouping: NeuTableGroupingState<F> | null;
  readonly options: NeuTableGroupingOptions<T, F>;
  readonly columns: readonly NeuTableColumn<T, F>[];
}): readonly NeuTableGroupingNode<T, TRow>[] {
  if (args.grouping === null || args.grouping.by.length === 0) {
    return args.rows.map((row) => ({ kind: 'row', row, track: row.track, rowspan: new Map() }));
  }

  const grouping = args.grouping;
  const expanded = new Set(grouping.expandedGroupIds);
  const nodes: NeuTableGroupingNode<T, TRow>[] = [];
  const contexts = new Map<
    string,
    {
      readonly context: NeuTableGroupContext<T>;
      readonly aggregates: readonly NeuTableGroupAggregate[];
    }
  >();
  const groupRows = (rows: readonly TRow[], field: F) => {
    const groups = new Map<string, { readonly value: unknown; readonly rows: TRow[] }>();
    for (const row of rows) {
      const value = readGroupValue(row.row, field, args.columns, args.options);
      const valueToken = canonicalGroupValue(value);
      const current = groups.get(valueToken);
      if (current === undefined) groups.set(valueToken, { value, rows: [row] });
      else current.rows.push(row);
    }
    return groups;
  };
  const createAggregateProjection = (rows: readonly T[], fields: readonly F[]) =>
    args.options.aggregate === undefined
      ? []
      : fields.map((aggregateField) => {
          try {
            return {
              field: String(aggregateField),
              value: args.options.aggregate?.(rows, aggregateField),
              error: null,
            };
          } catch (error) {
            return { field: String(aggregateField), value: undefined, error };
          }
        });
  const indexLevel = (rows: readonly TRow[], level: number, parentPath: string): void => {
    const field = grouping.by[level];
    if (field === undefined) return;
    for (const [valueToken, group] of groupRows(rows, field)) {
      const id = `${parentPath}${encodeURIComponent(field)}=${encodeURIComponent(valueToken)}`;
      const context: NeuTableGroupContext<T> = {
        id,
        level,
        value: group.value,
        rows: group.rows.map((entry) => entry.row),
        expanded: expanded.has(id),
      };
      contexts.set(id, {
        context,
        aggregates: createAggregateProjection(context.rows, grouping.by),
      });
      indexLevel(group.rows, level + 1, `${id}/`);
    }
  };
  indexLevel(args.domainRows ?? args.rows, 0, 'group:');
  const projectLevel = (rows: readonly TRow[], level: number, parentPath: string): void => {
    const field = grouping.by[level];
    if (field === undefined) {
      for (const row of rows) nodes.push({ kind: 'row', row, track: row.track, rowspan: new Map() });
      return;
    }
    for (const [valueToken, group] of groupRows(rows, field)) {
      const id = `${parentPath}${encodeURIComponent(field)}=${encodeURIComponent(valueToken)}`;
      const isExpanded = expanded.has(id);
      const indexed = contexts.get(id);
      const context =
        indexed?.context ??
        ({
          id,
          level,
          value: group.value,
          rows: group.rows.map((entry) => entry.row),
          expanded: isExpanded,
        } satisfies NeuTableGroupContext<T>);
      const aggregates =
        indexed?.aggregates ?? createAggregateProjection(context.rows, grouping.by);
      nodes.push({
        kind: 'group-header',
        id,
        context,
        aggregates,
        track: `group-header:${id}`,
      });
      if (isExpanded) {
        projectLevel(group.rows, level + 1, `${id}/`);
        nodes.push({
          kind: 'group-footer',
          id,
          context,
          aggregates,
          track: `group-footer:${id}`,
        });
      }
    }
  };
  projectLevel(args.rows, 0, 'group:');

  if (args.options.mode !== 'rowspan') return nodes;
  const domainRows = nodes.filter(
    (node): node is NeuTableGroupedRowNode<TRow> => node.kind === 'row',
  );
  for (const field of grouping.by) {
    let start = 0;
    while (start < domainRows.length) {
      const value = readGroupValue(domainRows[start].row.row, field, args.columns, args.options);
      let end = start + 1;
      while (
        end < domainRows.length &&
        Object.is(
          readGroupValue(domainRows[end].row.row, field, args.columns, args.options),
          value,
        )
      ) {
        end += 1;
      }
      const first = domainRows[start];
      const replacement: NeuTableGroupedRowNode<TRow> = {
        ...first,
        rowspan: new Map(first.rowspan).set(String(field), end - start),
      };
      const nodeIndex = nodes.indexOf(first);
      if (nodeIndex >= 0) nodes[nodeIndex] = replacement;
      start = end;
    }
  }
  return nodes;
}

export function proposeNeuTableGroupToggle<F extends string>(
  grouping: NeuTableGroupingState<F> | null,
  id: string,
): NeuTableGroupingChange<F> | null {
  if (grouping === null) return null;
  const expanded = new Set(grouping.expandedGroupIds);
  if (expanded.has(id)) expanded.delete(id);
  else expanded.add(id);
  return {
    next: { ...grouping, expandedGroupIds: [...expanded] },
    source: 'toggle',
  };
}
