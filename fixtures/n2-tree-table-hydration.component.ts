import { Component, afterNextRender, signal } from '@angular/core';
import {
  NeuTreeTableCellDirective,
  NeuTreeTableComponent,
  NeuTreeTableEmptyDirective,
  NeuTreeTableErrorDirective,
  NeuTreeTableHeaderDirective,
  NeuTreeTableLoadingDirective,
  NeuTreeTableNodeDirective,
  type NeuTreeLoadedRelation,
  type NeuTreeTableColumn,
  type NeuTreeTableHierarchy,
} from './ui-core/tree-table/next/public/public-api';

interface Row {
  readonly id: string;
  readonly name: string;
  readonly value: number;
}
type Field = 'name' | 'value';

const loaded = <K extends string | number>(keys: readonly K[]): NeuTreeLoadedRelation<K> => ({
  status: 'loaded',
  keys,
  relationRevision: 1,
  appliedRequestId: null,
  total: keys.length,
  completeness: 'complete',
});
const rows: readonly Row[] = [
  { id: 'a', name: 'Alpha', value: 1 },
  { id: 'b', name: 'Beta', value: 2 },
  { id: 'c', name: 'Gamma', value: 3 },
];
const hierarchy: NeuTreeTableHierarchy<string> = {
  hierarchyRevision: 1,
  queryRevision: 0,
  roots: loaded(['a', 'c']),
  children: [
    { parentKey: 'a', relation: loaded(['b']) },
    { parentKey: 'b', relation: loaded([]) },
    { parentKey: 'c', relation: loaded([]) },
  ],
};
const columns: readonly NeuTreeTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name' },
  { id: 'value', header: 'Value', field: 'value' },
];

@Component({
  selector: 'n2-tree-table-hydration',
  standalone: true,
  imports: [
    NeuTreeTableComponent,
    NeuTreeTableHeaderDirective,
    NeuTreeTableNodeDirective,
    NeuTreeTableCellDirective,
    NeuTreeTableEmptyDirective,
    NeuTreeTableLoadingDirective,
    NeuTreeTableErrorDirective,
  ],
  template: `
    <output id="n2-tree-ready">{{ ready() }}</output>
    <output id="n2-tree-events">{{ events() }}</output>
    <button id="n2-tree-parent-write" type="button" (click)="reconstruct()">Parent write</button>

    <section id="n2-tree-primary">
      <neu-tree-table
        [data]="data()"
        [hierarchy]="appliedHierarchy()"
        [columns]="appliedColumns()"
        [rowKey]="rowKey"
        [expandedKeys]="expandedKeys()"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
        (queryChange)="record('queryChange')"
        (expandedKeysChange)="record('expandedKeysChange')"
        (selectionChange)="record('selectionChange')"
        (layoutChange)="record('layoutChange')"
        (editStateChange)="record('editStateChange')"
        (dataRequest)="record('dataRequest')"
        (rangeChange)="record('rangeChange')"
        (rowAction)="record('rowAction')"
        (editCommit)="record('editCommit')"
        (editCancel)="record('editCancel')"
        (exportRequest)="record('exportRequest')"
        (featureError)="record('featureError')"
      >
        <ng-template neuTreeTableHeader="name" let-column="column">
          SSR {{ column.header }}
        </ng-template>
        <ng-template neuTreeTableNode let-row let-depth="depth">
          {{ depth }}:{{ row.name }}
        </ng-template>
        <ng-template neuTreeTableCell="value" let-row let-index="logicalIndex">
          {{ index }}={{ row.value }}
        </ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-empty">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="emptyHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableEmpty>SSR empty tree</ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-loading">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="loadingHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableLoading>SSR loading tree</ng-template>
      </neu-tree-table>
    </section>

    <section id="n2-tree-error">
      <neu-tree-table
        [data]="[]"
        [hierarchy]="errorHierarchy"
        [columns]="columns"
        [rowKey]="rowKey"
        [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 18 }"
      >
        <ng-template neuTreeTableError>SSR error tree</ng-template>
      </neu-tree-table>
    </section>
  `,
})
export class N2TreeTableHydrationComponent {
  readonly ready = signal(false);
  readonly events = signal('[]');
  readonly data = signal(rows);
  readonly appliedHierarchy = signal(hierarchy);
  readonly appliedColumns = signal(columns);
  readonly expandedKeys = signal<readonly string[]>(['a']);
  readonly columns = columns;
  readonly rowKey = (row: Row) => row.id;
  readonly emptyHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: loaded([]),
    children: [],
  };
  readonly loadingHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: {
      status: 'loading',
      keys: [],
      relationRevision: 1,
      appliedRequestId: 1,
      total: null,
    },
    children: [],
  };
  readonly errorHierarchy: NeuTreeTableHierarchy<string> = {
    ...hierarchy,
    roots: {
      status: 'error',
      keys: [],
      relationRevision: 1,
      appliedRequestId: 1,
      total: null,
      error: 'failed',
    },
    children: [],
  };

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  record(name: string): void {
    const current = JSON.parse(this.events()) as string[];
    this.events.set(JSON.stringify([...current, name]));
  }

  reconstruct(): void {
    this.data.set(rows.map((row) => ({ ...row })));
    this.appliedColumns.set([...columns]);
    this.appliedHierarchy.set({
      ...hierarchy,
      hierarchyRevision: 2,
      roots: { ...hierarchy.roots, keys: [...hierarchy.roots.keys] },
      children: hierarchy.children.map((entry) => ({
        ...entry,
        relation: { ...entry.relation, keys: [...entry.relation.keys] },
      })),
    });
    this.expandedKeys.set(['a']);
  }
}
