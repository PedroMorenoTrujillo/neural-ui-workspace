import {
  Component,
  computed,
  input,
  type InputSignal,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { NeuTableRenderRow } from '../identity/neu-table-row-identity';
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
  NeuTableMetadata,
  NeuTableRowOptions,
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
  readonly rows: InputSignal<readonly NeuTableRenderRow<T, K>[]> = input.required();
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly metadata: InputSignal<NeuTableMetadata> = input.required();
  readonly layout: InputSignal<NeuTableLayoutState> = input.required();
  readonly rowOptions: InputSignal<NeuTableRowOptions<T, K>> = input.required();
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

  protected readonly columnCount: Signal<number> = computed(() =>
    Math.max(1, this.columns().length),
  );
  protected readonly stateContext: Signal<NeuTableStateTemplateContext> = computed(() => ({
    loading: this.metadata().loading,
    error: this.metadata().error,
    retry: this.retry(),
  }));
  protected readonly hasFooterTemplates: Signal<boolean> = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );

  protected readonly headerTemplate = (columnId: string) => this.headerTemplates().get(columnId);
  protected readonly cellTemplate = (columnId: string) => this.cellTemplates().get(columnId);
  protected readonly footerTemplate = (columnId: string) => this.footerTemplates().get(columnId);
  protected readonly headerContext = (
    column: NeuTableColumn<T, F>,
  ): NeuTableHeaderContext<T, F> => ({ column, sort: [] });
  protected readonly cellContext = (
    renderRow: NeuTableRenderRow<T, K>,
    column: NeuTableColumn<T, F>,
  ): NeuTableCellContext<T, K> => ({
    $implicit: renderRow.row,
    row: renderRow.row,
    key: renderRow.key,
    index: renderRow.index,
    selected: false,
    expanded: false,
    disabled: this.rowOptions().isDisabled?.(renderRow.row) ?? false,
    columnId: column.id,
    value: readNeuTableColumnValue(renderRow.row, column),
  });
  protected readonly basicValue = (row: T, column: NeuTableColumn<T, F>) =>
    presentNeuTableBasicValue(readNeuTableColumnValue(row, column));
  protected readonly columnWidth = (column: NeuTableColumn<T, F>) =>
    resolveNeuTableColumnWidth(column, this.layout());
  protected readonly rowClass = (renderRow: NeuTableRenderRow<T, K>) => {
    const value = this.rowOptions().className?.(renderRow.row);
    return Array.isArray(value) ? value.join(' ') : (value ?? null);
  };
}
