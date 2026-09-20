import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, type InputSignal, type TemplateRef } from '@angular/core';
import { readNeuFieldValue } from '../../../../internal/neu-field-value-resolver';
import type { TreeProjectionNode } from '../hierarchy/neu-tree-table-hierarchy';
import type {
  NeuTreeRelationStatus,
  NeuTreeTableAppearance,
  NeuTreeTableCellContext,
  NeuTreeTableColumn,
  NeuTreeTableHeaderContext,
  NeuTreeTableHierarchyOptions,
  NeuTreeTableKey,
  NeuTreeTableLabels,
  NeuTreeTableLayoutState,
  NeuTreeTableNodeContext,
  NeuTreeTableRowOptions,
  NeuTreeTableStateContext,
} from '../../public/neu-tree-table.types';

@Component({
  selector: 'neu-tree-table-private-renderer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './neu-tree-table-renderer.component.html',
  styleUrl: './neu-tree-table-renderer.component.scss',
  host: { '[attr.data-neu-tree-table-renderer]': '"basic"' },
})
export class NeuTreeTableRendererComponent<
  T extends object,
  K extends NeuTreeTableKey,
  F extends string,
> {
  readonly rows: InputSignal<readonly TreeProjectionNode<T, K>[]> = input.required();
  readonly columns: InputSignal<readonly NeuTreeTableColumn<T, F>[]> = input.required();
  readonly layout: InputSignal<NeuTreeTableLayoutState> = input.required();
  readonly hierarchyOptions: InputSignal<NeuTreeTableHierarchyOptions> = input.required();
  readonly treeColumnValid: InputSignal<boolean> = input.required();
  readonly rootStatus: InputSignal<NeuTreeRelationStatus> = input.required();
  readonly rootError: InputSignal<unknown> = input();
  readonly rowOptions: InputSignal<NeuTreeTableRowOptions<T>> = input.required();
  readonly appearance: InputSignal<NeuTreeTableAppearance> = input.required();
  readonly labels: InputSignal<NeuTreeTableLabels> = input.required();
  readonly captionTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly toolbarTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly summaryTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly emptyTemplate: InputSignal<TemplateRef<unknown> | undefined> = input();
  readonly loadingTemplate: InputSignal<TemplateRef<NeuTreeTableStateContext> | undefined> =
    input();
  readonly errorTemplate: InputSignal<TemplateRef<NeuTreeTableStateContext> | undefined> = input();
  readonly nodeTemplate: InputSignal<TemplateRef<NeuTreeTableNodeContext<T, K>> | undefined> =
    input();
  readonly headerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableHeaderContext<T, F>>>
  > = input.required();
  readonly cellTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableCellContext<T, K, F>>>
  > = input.required();
  readonly footerTemplates: InputSignal<
    ReadonlyMap<string, TemplateRef<NeuTreeTableHeaderContext<T, F>>>
  > = input.required();

  protected readonly columnCount = computed(() => Math.max(1, this.columns().length));
  protected readonly hasFooter = computed(
    () => this.footerTemplates().size > 0 || this.summaryTemplate() !== undefined,
  );
  protected readonly stateContext: NeuTreeTableStateContext = { retry: () => undefined };

  protected headerTemplate(columnId: string): TemplateRef<NeuTreeTableHeaderContext<T, F>> | null {
    return this.headerTemplates().get(columnId) ?? null;
  }

  protected cellTemplate(columnId: string): TemplateRef<NeuTreeTableCellContext<T, K, F>> | null {
    return this.cellTemplates().get(columnId) ?? null;
  }

  protected footerTemplate(columnId: string): TemplateRef<NeuTreeTableHeaderContext<T, F>> | null {
    return this.footerTemplates().get(columnId) ?? null;
  }

  protected isTreeColumn(column: NeuTreeTableColumn<T, F>): boolean {
    return this.treeColumnValid() && column.id === this.hierarchyOptions().treeColumnId;
  }

  protected headerContext(
    column: NeuTreeTableColumn<T, F>,
    columnIndex: number,
  ): NeuTreeTableHeaderContext<T, F> {
    return { column, columnIndex };
  }

  protected nodeContext(node: TreeProjectionNode<T, K>): NeuTreeTableNodeContext<T, K> {
    return {
      $implicit: node.value,
      value: node.value,
      key: node.key,
      parentKey: node.parentKey,
      depth: node.depth,
      siblingIndex: node.siblingIndex,
      siblingCount: node.siblingCount,
      path: node.path,
      expanded: node.expanded,
      selected: false,
      indeterminate: false,
      disabled: false,
      childStatus: node.relation.status,
      toggleExpansion: () => undefined,
      toggleSelection: () => undefined,
    };
  }

  protected cellContext(
    node: TreeProjectionNode<T, K>,
    column: NeuTreeTableColumn<T, F>,
    columnIndex: number,
  ): NeuTreeTableCellContext<T, K, F> {
    return {
      ...this.nodeContext(node),
      column,
      columnIndex,
      logicalIndex: node.logicalVisibleIndex,
    };
  }

  protected present(value: T, column: NeuTreeTableColumn<T, F>): string | number | null {
    const projected = readNeuFieldValue(value, column);
    if (projected === null || projected === undefined) return null;
    if (typeof projected === 'string' || typeof projected === 'number') return projected;
    if (typeof projected === 'boolean' || typeof projected === 'bigint') return String(projected);
    return null;
  }

  protected columnWidth(column: NeuTreeTableColumn<T, F>): string | undefined {
    return this.layout().widths[column.id] ?? column.width;
  }

  protected rowClass(node: TreeProjectionNode<T, K>): string | readonly string[] | null {
    return this.rowOptions().className?.(node.value) ?? null;
  }

  protected rowId(node: TreeProjectionNode<T, K>): string {
    return `neu-tree-row-${encodeURIComponent(node.token)}`;
  }
}
