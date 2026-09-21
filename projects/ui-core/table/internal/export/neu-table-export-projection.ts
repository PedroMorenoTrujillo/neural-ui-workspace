import type {
  NeuRowKey,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableExportRequest,
  NeuTableFilterOptions,
  NeuTableKey,
  NeuTableMetadata,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSortOptions,
  NeuTableVirtualizationOptions,
} from '../../public/neu-table.types';
import {
  createNeuTableFieldResolver,
  filterNeuTableRows,
  normalizeNeuTableQuery,
  paginateNeuTableRows,
  partitionNeuTableSource,
  searchNeuTableRows,
  sortNeuTableRows,
} from '../client-pipeline/neu-table-client-pipeline';
import { neuTableIdentityToken } from '../identity/neu-table-row-identity';
import { readNeuTableColumnValue } from '../semantics/neu-table-basic-projections';
import type { NeuTableExportMatrix } from './neu-table-export-serializer.types';

export interface NeuTableExportColumnProjection<T extends object> {
  readonly key: string;
  readonly header: string;
  readonly value: (row: T) => unknown;
}

export type NeuTableExportProjection<T extends object> =
  | {
      readonly kind: 'local';
      readonly rows: readonly T[];
      readonly columns: readonly NeuTableExportColumnProjection<T>[];
    }
  | { readonly kind: 'delegated' };

function dedupeRows<T extends object, K extends NeuTableKey>(
  rows: readonly T[],
  rowKey: NeuRowKey<T, K>,
): readonly T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const token = neuTableIdentityToken(rowKey(row));
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

export function projectNeuTableExportColumns<T extends object, F extends string>(
  columns: readonly NeuTableColumn<T, F>[],
): readonly NeuTableExportColumnProjection<T>[] {
  return columns
    .filter((column) => column.value !== undefined || column.field !== undefined)
    .map((column) => ({
      key: column.id,
      header: column.header,
      value: (row) => readNeuTableColumnValue(row, column),
    }));
}

export function projectNeuTableExport<T extends object, K extends NeuTableKey, F extends string>(
  options: {
    readonly request: NeuTableExportRequest<F>;
    readonly dataMode: NeuTableDataMode;
    readonly data: readonly T[];
    readonly metadata: NeuTableMetadata;
    readonly queryMatchesApplied: boolean;
    readonly columns: readonly NeuTableColumn<T, F>[];
    readonly selection: NeuTableSelection<K, F>;
    readonly rowKey: NeuRowKey<T, K>;
    readonly rowOptions: NeuTableRowOptions<T, K>;
    readonly sortOptions: NeuTableSortOptions;
    readonly filterOptions: NeuTableFilterOptions<T, F>;
    readonly paginationOptions: NeuTablePaginationOptions;
    readonly virtualizationOptions: NeuTableVirtualizationOptions;
  },
): NeuTableExportProjection<T> {
  const columns = projectNeuTableExportColumns(options.columns);
  const partition = partitionNeuTableSource(
    options.data,
    options.rowKey,
    options.rowOptions.pin,
    false,
  );
  const loaded = dedupeRows(
    [...partition.start, ...partition.normal, ...partition.end],
    options.rowKey,
  );

  if (options.dataMode === 'remote') {
    const loadedTokens = new Set(loaded.map((row) => neuTableIdentityToken(options.rowKey(row))));
    const selected = options.selection;
    const missingSelectedKey =
      selected.kind === 'keys' &&
      selected.keys.some((key) => !loadedTokens.has(neuTableIdentityToken(key)));
    const fullyLoaded =
      options.metadata.totalItems !== null &&
      options.metadata.totalItems <= partition.normal.length;
    if (
      !options.queryMatchesApplied ||
      options.request.scope === 'all' ||
      (options.request.scope === 'filtered' && !fullyLoaded) ||
      (options.request.scope === 'selected' &&
        (selected.kind === 'all-matching' || missingSelectedKey))
    ) {
      return { kind: 'delegated' };
    }
    if (options.request.scope === 'selected' && selected.kind === 'keys') {
      const selectedTokens = new Set(selected.keys.map(neuTableIdentityToken));
      return {
        kind: 'local',
        rows: loaded.filter((row) => selectedTokens.has(neuTableIdentityToken(options.rowKey(row)))),
        columns,
      };
    }
    return { kind: 'local', rows: loaded, columns };
  }

  const query = normalizeNeuTableQuery(options.request.query, options.sortOptions);
  const resolver = createNeuTableFieldResolver(options.columns);
  const searched = searchNeuTableRows(
    partition.normal,
    query.search,
    options.filterOptions.globalFields,
    resolver,
  );
  const filteredNormal = filterNeuTableRows(
    searched,
    query.filters,
    resolver,
    options.filterOptions,
  );
  const sortedNormal = sortNeuTableRows(filteredNormal, query.sort, resolver);
  const filtered = dedupeRows(
    [...partition.start, ...sortedNormal, ...partition.end],
    options.rowKey,
  );
  const page = dedupeRows(
    [
      ...partition.start,
      ...paginateNeuTableRows(
        sortedNormal,
        query.page,
        query.pageSize,
        options.paginationOptions.enabled && !options.virtualizationOptions.enabled,
      ).rows,
      ...partition.end,
    ],
    options.rowKey,
  );

  if (options.request.scope === 'page') return { kind: 'local', rows: page, columns };
  if (options.request.scope === 'filtered') return { kind: 'local', rows: filtered, columns };
  if (options.request.scope === 'loaded' || options.request.scope === 'all') {
    return { kind: 'local', rows: loaded, columns };
  }

  const selection = options.selection;
  if (selection.kind === 'keys') {
    const selectedTokens = new Set(selection.keys.map(neuTableIdentityToken));
    return {
      kind: 'local',
      rows: loaded.filter((row) => selectedTokens.has(neuTableIdentityToken(options.rowKey(row)))),
      columns,
    };
  }

  const selectionFilterOptions = {
    ...options.filterOptions,
    globalFields: selection.scope.globalFields,
  };
  const matchingPartition = (rows: readonly T[]) =>
    filterNeuTableRows(
      searchNeuTableRows(rows, selection.scope.search, selection.scope.globalFields, resolver),
      selection.scope.filters,
      resolver,
      selectionFilterOptions,
    );
  const excluded = new Set(selection.excludedKeys.map(neuTableIdentityToken));
  const selectedRows = dedupeRows(
    [
      ...matchingPartition(partition.start),
      ...sortNeuTableRows(matchingPartition(partition.normal), query.sort, resolver),
      ...matchingPartition(partition.end),
    ],
    options.rowKey,
  ).filter((row) => !excluded.has(neuTableIdentityToken(options.rowKey(row))));
  return { kind: 'local', rows: selectedRows, columns };
}

export function createNeuTableExportMatrix<T extends object>(
  projection: Extract<NeuTableExportProjection<T>, { readonly kind: 'local' }>,
): NeuTableExportMatrix {
  return {
    columns: projection.columns.map(({ key, header }) => ({ key, header })),
    rows: projection.rows.map((row) => projection.columns.map((column) => column.value(row))),
  };
}
