import type { InputSignal, OutputEmitterRef } from '@angular/core';
import type {
  NeuRowKey,
  NeuRowTrackBy,
  NeuTableAppearance,
  NeuTableColumn,
  NeuTableDataMode,
  NeuTableDataRequest,
  NeuTableEditCancel,
  NeuTableEditChange,
  NeuTableEditCommit,
  NeuTableEditingOptions,
  NeuTableEditState,
  NeuTableExpandedKeysChange,
  NeuTableExpansionOptions,
  NeuTableExportOutcome,
  NeuTableExportRequest,
  NeuTableFeatureError,
  NeuTableFilterOptions,
  NeuTableGroupingChange,
  NeuTableGroupingOptions,
  NeuTableGroupingState,
  NeuTableInteractionOptions,
  NeuTableKey,
  NeuTableLabels,
  NeuTableLayoutChange,
  NeuTableLayoutState,
  NeuTableMetadata,
  NeuTablePaginationOptions,
  NeuTableQuery,
  NeuTableRangeChange,
  NeuTableRowAction,
  NeuTableRowMove,
  NeuTableRowOptions,
  NeuTableSelection,
  NeuTableSelectionChange,
  NeuTableSelectionOptions,
  NeuTableSortOptions,
  NeuTableVirtualizationOptions,
} from './neu-table.types';

/**
 * Compile-only candidate for the single NeuTable 2 public facade.
 *
 * It deliberately has no Angular decorator or implementation in N2-011A.
 */
export abstract class NeuTableComponent<T extends object, K extends NeuTableKey, F extends string> {
  abstract readonly dataMode: InputSignal<NeuTableDataMode>;
  abstract readonly data: InputSignal<readonly T[]>;
  abstract readonly metadata: InputSignal<NeuTableMetadata>;
  abstract readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]>;
  abstract readonly query: InputSignal<NeuTableQuery<F>>;
  abstract readonly rowKey: InputSignal<NeuRowKey<T, K>>;
  abstract readonly rowTrackBy: InputSignal<NeuRowTrackBy<T> | undefined>;
  abstract readonly selection: InputSignal<NeuTableSelection<K, F>>;
  abstract readonly layout: InputSignal<NeuTableLayoutState>;
  abstract readonly expandedKeys: InputSignal<readonly K[]>;
  abstract readonly editState: InputSignal<NeuTableEditState<K>>;
  abstract readonly grouping: InputSignal<NeuTableGroupingState<F> | null>;

  abstract readonly sortOptions: InputSignal<NeuTableSortOptions>;
  abstract readonly filterOptions: InputSignal<NeuTableFilterOptions<T, F>>;
  abstract readonly paginationOptions: InputSignal<NeuTablePaginationOptions>;
  abstract readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>>;
  abstract readonly virtualizationOptions: InputSignal<NeuTableVirtualizationOptions>;
  abstract readonly editingOptions: InputSignal<NeuTableEditingOptions<T, K, F>>;
  abstract readonly expansionOptions: InputSignal<NeuTableExpansionOptions<T>>;
  abstract readonly groupingOptions: InputSignal<NeuTableGroupingOptions<T, F>>;
  abstract readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>>;
  abstract readonly appearance: InputSignal<NeuTableAppearance>;
  abstract readonly labels: InputSignal<NeuTableLabels>;
  abstract readonly interactionOptions: InputSignal<NeuTableInteractionOptions>;

  abstract readonly queryChange: OutputEmitterRef<NeuTableQuery<F>>;
  abstract readonly selectionChange: OutputEmitterRef<NeuTableSelectionChange<T, K, F>>;
  abstract readonly layoutChange: OutputEmitterRef<NeuTableLayoutChange>;
  abstract readonly expandedKeysChange: OutputEmitterRef<NeuTableExpandedKeysChange<K>>;
  abstract readonly editStateChange: OutputEmitterRef<NeuTableEditChange<K>>;
  abstract readonly groupingChange: OutputEmitterRef<NeuTableGroupingChange<F>>;

  abstract readonly dataRequest: OutputEmitterRef<NeuTableDataRequest<F>>;
  abstract readonly rangeChange: OutputEmitterRef<NeuTableRangeChange>;
  abstract readonly rowAction: OutputEmitterRef<NeuTableRowAction<T, K>>;
  abstract readonly editCommit: OutputEmitterRef<NeuTableEditCommit<T, K, F>>;
  abstract readonly editCancel: OutputEmitterRef<NeuTableEditCancel<T, K>>;
  abstract readonly rowReorder: OutputEmitterRef<NeuTableRowMove<K>>;
  abstract readonly exportRequest: OutputEmitterRef<NeuTableExportRequest<F>>;
  abstract readonly featureError: OutputEmitterRef<NeuTableFeatureError>;

  abstract focusCell(target: { readonly key: K; readonly columnId: string }): boolean;
  abstract scrollTo(target: { readonly index?: number; readonly key?: K }): Promise<void>;
  abstract retryData(): void;
  abstract export(request: NeuTableExportRequest<F>): Promise<NeuTableExportOutcome>;
}
