import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeTableEditCancel,
  NeuTreeTableEditChange,
  NeuTreeTableEditCommit,
  NeuTreeTableEditState,
  NeuTreeTableExpandedKeysChange,
  NeuTreeTableHierarchy,
  NeuTreeTableRowAction,
} from './public/neu-tree-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
}

@Component({
  standalone: true,
  imports: [NeuTreeTableComponent],
  template: `
    <neu-tree-table
      [data]="rows"
      [hierarchy]="hierarchy"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 16 }"
      [expandedKeys]="expandedKeys()"
      [editState]="editState()"
      [editingOptions]="{ mode: 'cell', validate: validate }"
      [interactionOptions]="{
        navigation: 'row',
        wrapFocus: false,
        announceChanges: false,
        contextMenuAction: true
      }"
      (expandedKeysChange)="acceptExpansion($event)"
      (editStateChange)="acceptEdit($event)"
      (editCommit)="commits.update((values) => [...values, $event])"
      (editCancel)="cancels.update((values) => [...values, $event])"
      (rowAction)="actions.update((values) => [...values, $event])"
    />
  `,
})
class FinalFeaturesHostComponent {
  readonly rows: readonly Row[] = [
    { id: 1, name: 'Root' },
    { id: 2, name: 'Child' },
  ];
  readonly hierarchy: NeuTreeTableHierarchy<number> = {
    hierarchyRevision: 1,
    queryRevision: 1,
    roots: {
      status: 'loaded',
      keys: [1],
      relationRevision: 1,
      appliedRequestId: null,
      total: 1,
      completeness: 'complete',
    },
    children: [
      {
        parentKey: 1,
        relation: {
          status: 'loaded',
          keys: [2],
          relationRevision: 1,
          appliedRequestId: null,
          total: 1,
          completeness: 'complete',
        },
      },
    ],
  };
  readonly columns = [
    {
      id: 'name',
      header: 'Name',
      field: 'name' as const,
      value: (row: Row) => row.name,
      edit: {
        field: 'name' as const,
        read: (row: Row) => row.name,
        write: (row: Row, value: unknown): Row => ({ ...row, name: String(value) }),
      },
    },
  ] as const;
  readonly expandedKeys = signal<readonly number[]>([1]);
  readonly editState = signal<NeuTreeTableEditState<number>>({ kind: 'none' });
  readonly changes = signal<readonly NeuTreeTableEditChange<number>[]>([]);
  readonly commits = signal<readonly NeuTreeTableEditCommit<Row, number, 'name'>[]>([]);
  readonly cancels = signal<readonly NeuTreeTableEditCancel<Row, number>[]>([]);
  readonly actions = signal<readonly NeuTreeTableRowAction<Row, number>[]>([]);
  readonly rowKey = (row: Row) => row.id;
  readonly validate = ({ draft }: { readonly draft: Readonly<Partial<Row>> }) =>
    draft.name === '' ? 'Name is required' : true;

  acceptExpansion(change: NeuTreeTableExpandedKeysChange<number>): void {
    this.expandedKeys.set(change.next);
  }

  acceptEdit(change: NeuTreeTableEditChange<number>): void {
    this.changes.update((values) => [...values, change]);
    this.editState.set(change.next);
  }
}

describe('NeuTreeTable 2 final feature integration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('routes row actions without DOM events or selection side effects', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const row = fixture.nativeElement.querySelector('tr[data-node-key]') as HTMLTableRowElement;
    const cell = row.querySelector('td') as HTMLTableCellElement;
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 220));
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    cell.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.actions().map((action) => action.source)).toEqual([
      'click',
      'double-click',
      'context-menu',
      'keyboard',
    ]);
    expect(fixture.componentInstance.actions().every((action) => !('event' in action))).toBe(true);
  });

  it('edits through the private deferred Signal Forms editor and commits exactly once', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cell = fixture.nativeElement.querySelector('tr[data-node-key] td') as HTMLTableCellElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('[data-tree-editor]') as HTMLInputElement;
    expect(editor).toBeTruthy();
    editor.value = 'Renamed';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    const save = fixture.nativeElement.querySelector('.neu-tree-table2__editor-actions button') as HTMLButtonElement;
    save.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.commits()).toHaveLength(1);
    expect(fixture.componentInstance.commits()[0]?.value).toEqual({ id: 1, name: 'Renamed' });
    expect(fixture.componentInstance.rows[0]?.name).toBe('Root');
    expect(fixture.componentInstance.editState()).toEqual({ kind: 'none' });
  });

  it('cancels a filtered/collapsed hidden edit exactly once', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.editState.set({ kind: 'cell', key: 2, columnId: 'name' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.expandedKeys.set([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.cancels()).toHaveLength(1);
    expect(fixture.componentInstance.cancels()[0]?.reason).toBe('hidden');
    expect(fixture.componentInstance.changes().filter((change) => change.source === 'hidden')).toHaveLength(1);
  });

  it('releases 100 editing/action instances without late outputs', async () => {
    for (let index = 0; index < 100; index += 1) {
      const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.destroy();
      expect(fixture.componentInstance.commits()).toHaveLength(0);
      expect(fixture.componentInstance.cancels()).toHaveLength(0);
    }
  }, 15_000);
});
