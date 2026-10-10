import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTreeTableComponent } from './public/neu-tree-table.component-contract';
import type {
  NeuTreeTableEditCancel,
  NeuTreeTableEditChange,
  NeuTreeTableEditCommit,
  NeuTreeTableEditState,
  NeuTreeTableEditingOptions,
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
      [data]="rows()"
      [hierarchy]="hierarchy"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 16 }"
      [expandedKeys]="expandedKeys()"
      [editState]="editState()"
      [editingOptions]="editingOptions()"
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
  readonly rows = signal<readonly Row[]>([
    { id: 1, name: 'Root' },
    { id: 2, name: 'Child' },
  ]);
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
  readonly validate = ({ draft }: { readonly draft: Readonly<Partial<Row>> }) =>
    draft.name === '' ? 'Name is required' : true;
  readonly editState = signal<NeuTreeTableEditState<number>>({ kind: 'none' });
  readonly editingOptions = signal<NeuTreeTableEditingOptions<Row, number, 'name'>>({
    mode: 'cell', validate: this.validate,
  });
  readonly changes = signal<readonly NeuTreeTableEditChange<number>[]>([]);
  readonly commits = signal<readonly NeuTreeTableEditCommit<Row, number, 'name'>[]>([]);
  readonly cancels = signal<readonly NeuTreeTableEditCancel<Row, number>[]>([]);
  readonly actions = signal<readonly NeuTreeTableRowAction<Row, number>[]>([]);
  readonly rowKey = (row: Row) => row.id;
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
    expect(fixture.componentInstance.rows()[0]?.name).toBe('Root');
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

  it('keeps an invalid edit open until the user cancels it', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const cell = fixture.nativeElement.querySelector('tr[data-node-key] td') as HTMLTableCellElement;
    cell.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('[data-tree-editor]') as HTMLInputElement;
    editor.value = '';
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    const actions = fixture.nativeElement.querySelectorAll('.neu-tree-table2__editor-actions button') as NodeListOf<HTMLButtonElement>;
    actions[0]!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.commits()).toHaveLength(0);
    expect(fixture.componentInstance.editState()).toMatchObject({ kind: 'cell', key: 1 });
    actions[1]!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.cancels()).toHaveLength(1);
    expect(fixture.componentInstance.editState()).toEqual({ kind: 'none' });
  });

  it('rejects a stale edit key without fabricating an edited row', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.componentInstance.editState.set({ kind: 'cell', key: 999, columnId: 'name' });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.editState()).toEqual({ kind: 'none' });
    expect(fixture.componentInstance.changes().filter((change) => change.source === 'hidden')).toHaveLength(1);
    expect(fixture.componentInstance.cancels()).toHaveLength(0);
  });

  it('reconciles a pristine editor with a parent row replacement', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.componentInstance.editState.set({ kind: 'cell', key: 1, columnId: 'name' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const editor = fixture.nativeElement.querySelector('[data-tree-editor]') as HTMLInputElement;
    expect(editor.value).toBe('Root');
    fixture.componentInstance.rows.set([{ id: 1, name: 'Server update' }, { id: 2, name: 'Child' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('[data-tree-editor]') as HTMLInputElement).value)
      .toBe('Server update');
    expect(fixture.componentInstance.commits()).toHaveLength(0);
  });

  it('opens a row editor only when an editable column is present', async () => {
    const fixture = TestBed.createComponent(FinalFeaturesHostComponent);
    fixture.componentInstance.editingOptions.set({ mode: 'row', validate: fixture.componentInstance.validate });
    fixture.componentInstance.editState.set({ kind: 'row', key: 1 });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-tree-editor]')).not.toBeNull();
    expect(fixture.componentInstance.editState()).toEqual({ kind: 'row', key: 1 });
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
