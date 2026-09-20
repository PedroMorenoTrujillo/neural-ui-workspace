import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  input,
  signal,
  type InputSignal,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { NeuTableRenderRow } from '../identity/neu-table-row-identity';
import {
  normalizeNeuTableResize,
  projectNeuTableLayout,
  proposeNeuTableMove,
  proposeNeuTablePin,
  proposeNeuTableReorder,
  proposeNeuTableResize,
  proposeNeuTableVisibility,
  type NeuTableColumnPin,
} from '../layout/neu-table-layout';
import {
  isNeuTableRowDisabled,
  type NeuTableSelectionIntent,
  type NeuTableSelectionProjection,
} from '../selection/neu-table-selection';
import {
  presentNeuTableBasicValue,
  readNeuTableColumnValue,
  resolveNeuTableColumnWidth,
} from '../semantics/neu-table-basic-projections';
import type {
  NeuTableAppearance,
  NeuTableCellContext,
  NeuTableColumn,
  NeuTableHeaderContext,
  NeuTableKey,
  NeuTableLabels,
  NeuTableLayoutState,
  NeuTableLayoutChange,
  NeuTableMetadata,
  NeuTableRowOptions,
  NeuTableSelectionOptions,
  NeuSortEntry,
  NeuTableStateTemplateContext,
} from '../../public/neu-table.types';

@Component({
  selector: 'neu-table-basic-renderer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './neu-table-basic-renderer.component.html',
  styleUrl: './neu-table-basic-renderer.component.scss',
  host: {
    '[attr.data-neu-table-renderer]': '"basic"',
  },
})
export class NeuTableBasicRendererComponent<
  T extends object,
  K extends NeuTableKey,
  F extends string,
> {
  private readonly injector = inject(Injector);
  readonly rows: InputSignal<readonly NeuTableRenderRow<T, K>[]> = input.required();
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly allColumns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly metadata: InputSignal<NeuTableMetadata> = input.required();
  readonly layout: InputSignal<NeuTableLayoutState> = input.required();
  readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>> = input.required();
  readonly selectionOptions: InputSignal<NeuTableSelectionOptions<T>> = input.required();
  readonly selectionProjection: InputSignal<NeuTableSelectionProjection<K>> = input.required();
  readonly sort: InputSignal<readonly NeuSortEntry<F>[]> = input.required();
  readonly appearance: InputSignal<NeuTableAppearance> = input.required();
  readonly labels: InputSignal<NeuTableLabels> = input.required();
  readonly captionTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly toolbarTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly summaryTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly emptyTemplate: InputSignal<TemplateRef<never> | undefined> = input();
  readonly loadingTemplate: InputSignal<TemplateRef<NeuTableStateTemplateContext> | undefined> =
    input();
  readonly errorTemplate: InputSignal<TemplateRef<NeuTableStateTemplateContext> | undefined> =
    input();
  readonly headerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTableHeaderContext<T, F>>>
  > = input.required();
  readonly cellTemplates: InputSignal<ReadonlyMap<string, TemplateRef<NeuTableCellContext<T, K>>>> =
    input.required();
  readonly footerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTableHeaderContext<T, F>>>
  > = input.required();
  readonly retry: InputSignal<() => void> = input.required();
  readonly proposeSelection: InputSignal<(intent: NeuTableSelectionIntent<T, K>) => void> =
    input.required();
  readonly proposeToggleAll: InputSignal<() => void> = input.required();
  readonly proposeLayout: InputSignal<(change: NeuTableLayoutChange | null) => void> =
    input.required();

  protected readonly draggedColumnId = signal<string | null>(null);
  protected readonly resizeGesture = signal<{
    readonly column: NeuTableColumn<T, F>;
    readonly startX: number;
    readonly startWidth: number;
    readonly direction: 1 | -1;
  } | null>(null);
  protected readonly resizePreview = signal<{
    readonly columnId: string;
    readonly width: string;
  } | null>(null);

  protected readonly columnCount: Signal<number> = computed(() =>
    Math.max(1, this.columns().length + (this.hasSelectionColumn() ? 1 : 0)),
  );
  protected readonly stateContext: Signal<NeuTableStateTemplateContext> = computed(() => ({
    loading: this.metadata().loading,
    error: this.metadata().error,
    retry: this.retry(),
  }));
  protected readonly hasFooterTemplates: Signal<boolean> = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );
  protected readonly hasSelectionColumn = computed(() => {
    const options = this.selectionOptions();
    return options.mode !== 'none' && options.indicator !== 'none';
  });
  protected readonly hiddenColumns = computed(
    () => projectNeuTableLayout(this.allColumns(), this.layout()).hiddenColumns,
  );

  protected readonly headerTemplate = (columnId: string) => this.headerTemplates().get(columnId);
  protected readonly cellTemplate = (columnId: string) => this.cellTemplates().get(columnId);
  protected readonly footerTemplate = (columnId: string) => this.footerTemplates().get(columnId);
  protected readonly headerContext = (
    column: NeuTableColumn<T, F>,
  ): NeuTableHeaderContext<T, F> => ({ column, sort: this.sort() });
  protected readonly ariaSort = (column: NeuTableColumn<T, F>) => {
    const field = column.sort?.field ?? column.field;
    const entry = this.sort().find((candidate) => candidate.field === field);
    return entry?.direction === 'asc'
      ? 'ascending'
      : entry?.direction === 'desc'
        ? 'descending'
        : null;
  };
  protected readonly cellContext = (
    renderRow: NeuTableRenderRow<T, K>,
    column: NeuTableColumn<T, F>,
  ): NeuTableCellContext<T, K> => ({
    $implicit: renderRow.row,
    row: renderRow.row,
    key: renderRow.key,
    index: renderRow.index,
    selected: this.selectionProjection().isSelected(renderRow.key),
    expanded: false,
    disabled: this.rowDisabled(renderRow),
    columnId: column.id,
    value: readNeuTableColumnValue(renderRow.row, column),
  });
  protected readonly basicValue = (row: T, column: NeuTableColumn<T, F>) =>
    presentNeuTableBasicValue(readNeuTableColumnValue(row, column));
  protected readonly columnWidth = (column: NeuTableColumn<T, F>) => {
    const preview = this.resizePreview();
    return preview?.columnId === column.id
      ? preview.width
      : resolveNeuTableColumnWidth(column, this.layout());
  };
  protected readonly columnPin = (column: NeuTableColumn<T, F>): NeuTableColumnPin =>
    projectNeuTableLayout(this.allColumns(), this.layout()).pinById.get(column.id) ?? null;
  protected readonly columnPinOffset = (column: NeuTableColumn<T, F>, edge: 'start' | 'end') => {
    const columns = this.columns();
    const index = columns.findIndex((candidate) => candidate.id === column.id);
    const siblings = edge === 'start' ? columns.slice(0, index) : columns.slice(index + 1);
    const widths = siblings
      .filter((candidate) => this.columnPin(candidate) === edge)
      .map((candidate) => this.columnWidth(candidate) ?? candidate.minWidth ?? '0px');
    return widths.length === 0 ? '0px' : `calc(${widths.join(' + ')})`;
  };
  protected readonly rowDisabled = (renderRow: NeuTableRenderRow<T, K>) =>
    isNeuTableRowDisabled(renderRow.row, this.selectionOptions(), this.rowOptions());
  protected readonly rowSelected = (renderRow: NeuTableRenderRow<T, K>) =>
    this.selectionProjection().isSelected(renderRow.key);
  protected readonly selectionIndicator = () => {
    const options = this.selectionOptions();
    return options.mode === 'none' ? 'none' : options.indicator;
  };
  protected readonly selectRow = (
    renderRow: NeuTableRenderRow<T, K>,
    source: NeuTableSelectionIntent<T, K>['source'],
    event: MouseEvent | KeyboardEvent,
  ) =>
    this.proposeSelection()({
      row: renderRow.row,
      key: renderRow.key,
      source,
      shiftKey: event.shiftKey,
      platformModifier: event.metaKey || event.ctrlKey,
    });
  protected readonly isInteractiveEvent = (event: MouseEvent) =>
    event.composedPath().some((target) => {
      const matches = (target as { matches?: (selectors: string) => boolean }).matches;
      return (
        typeof matches === 'function' &&
        matches.call(
          target,
          'a,button,input,select,textarea,[contenteditable="true"],[data-neu-selection-stop]',
        )
      );
    });
  protected readonly onRowClick = (renderRow: NeuTableRenderRow<T, K>, event: MouseEvent) => {
    const options = this.selectionOptions();
    if (options.mode === 'none' || !options.selectOnRowClick || this.isInteractiveEvent(event)) {
      return;
    }
    this.selectRow(renderRow, 'row', event);
  };
  protected readonly onSelectionEnter = (renderRow: NeuTableRenderRow<T, K>, event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.selectRow(renderRow, 'keyboard', event as KeyboardEvent);
  };
  protected readonly onSelectionControlClick = (
    renderRow: NeuTableRenderRow<T, K>,
    event: MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    this.selectRow(renderRow, this.selectionIndicator() === 'radio' ? 'radio' : 'checkbox', event);
  };
  protected readonly onHeaderToggle = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    this.proposeToggleAll()();
  };
  protected readonly onHeaderSelectionEnter = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    this.proposeToggleAll()();
  };
  protected readonly showColumn = (columnId: string) =>
    this.proposeLayout()(proposeNeuTableVisibility(this.layout(), columnId, true));
  protected readonly hideColumn = (columnId: string) =>
    this.proposeLayout()(proposeNeuTableVisibility(this.layout(), columnId, false));
  protected readonly moveColumn = (columnId: string, delta: -1 | 1, event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    const scope = target?.closest('neu-table-basic-renderer');
    const focusToken = `move:${columnId}:${delta}`;
    this.proposeLayout()(proposeNeuTableMove(this.allColumns(), this.layout(), columnId, delta));
    afterNextRender(
      () => {
        const replacement = [
          ...(scope?.querySelectorAll<HTMLElement>('[data-layout-focus]') ?? []),
        ].find((candidate) => candidate.dataset['layoutFocus'] === focusToken);
        (replacement ?? (target?.isConnected === true ? target : null))?.focus();
      },
      { injector: this.injector },
    );
  };
  protected readonly cycleColumnPin = (column: NeuTableColumn<T, F>) => {
    const current = this.columnPin(column);
    const next: NeuTableColumnPin = current === null ? 'start' : current === 'start' ? 'end' : null;
    this.proposeLayout()(proposeNeuTablePin(this.layout(), column.id, next));
  };
  protected readonly onColumnDragStart = (columnId: string) => this.draggedColumnId.set(columnId);
  protected readonly onColumnDrop = (targetId: string, event: DragEvent) => {
    event.preventDefault();
    const sourceId = this.draggedColumnId();
    this.draggedColumnId.set(null);
    if (sourceId !== null) {
      this.proposeLayout()(
        proposeNeuTableReorder(this.allColumns(), this.layout(), sourceId, targetId),
      );
    }
  };
  protected readonly cancelColumnDrag = () => this.draggedColumnId.set(null);
  protected readonly onResizeStart = (column: NeuTableColumn<T, F>, event: PointerEvent) => {
    const target = event.currentTarget as HTMLElement | null;
    const header = target?.closest('th');
    if (target === null || header == null) return;
    target.setPointerCapture(event.pointerId);
    this.resizeGesture.set({
      column,
      startX: event.clientX,
      startWidth: header.getBoundingClientRect().width,
      direction: target.closest('[dir="rtl"]') === null ? 1 : -1,
    });
  };
  protected readonly onResizeMove = (event: PointerEvent) => {
    const gesture = this.resizeGesture();
    if (gesture === null) return;
    const width = gesture.startWidth + (event.clientX - gesture.startX) * gesture.direction;
    const normalized = normalizeNeuTableResize(gesture.column, width);
    if (normalized !== null) {
      this.resizePreview.set({ columnId: gesture.column.id, width: normalized });
    }
  };
  protected readonly commitResize = () => {
    const gesture = this.resizeGesture();
    const preview = this.resizePreview();
    this.resizeGesture.set(null);
    this.resizePreview.set(null);
    if (gesture !== null && preview?.columnId === gesture.column.id) {
      this.proposeLayout()(
        proposeNeuTableResize(this.layout(), gesture.column, Number.parseFloat(preview.width)),
      );
    }
  };
  protected readonly cancelResize = () => {
    this.resizeGesture.set(null);
    this.resizePreview.set(null);
  };
  protected readonly resizeWithKeyboard = (
    column: NeuTableColumn<T, F>,
    delta: -1 | 1,
    event: Event,
  ) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement | null;
    const width = target?.closest('th')?.getBoundingClientRect().width;
    if (width === undefined) return;
    const direction = target?.closest('[dir="rtl"]') === null ? 1 : -1;
    this.proposeLayout()(
      proposeNeuTableResize(this.layout(), column, width + delta * direction * 10),
    );
  };
  protected readonly rowClass = (renderRow: NeuTableRenderRow<T, K>) => {
    const value = this.rowOptions().className?.(renderRow.row);
    return Array.isArray(value) ? value.join(' ') : (value ?? null);
  };
}
