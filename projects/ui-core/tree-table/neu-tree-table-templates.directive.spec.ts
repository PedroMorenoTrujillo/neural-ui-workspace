import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { NeuTableColumn } from '@neural-ui/core/table';
import {
  NeuTreeTableManagedRowDirective,
} from './neu-tree-table-templates.directive';
import type {
  InternalNeuTreeTableRow,
  NeuTreeTableBodyDataEntry,
  NeuTreeTableNode,
} from './neu-tree-table.types';

type Data = Record<string, unknown>;

@Component({
  imports: [NeuTreeTableManagedRowDirective],
  template: `
    <table>
      <tbody>
        <tr [neuTreeTableManagedRow]="entry">
          <td class="plain-cell">Node</td>
          <td><button class="interactive" type="button">Action</button></td>
        </tr>
      </tbody>
    </table>
  `,
})
class ManagedRowHostComponent {
  entry!: NeuTreeTableBodyDataEntry<Data>;
}

function createEntry(
  overrides: Partial<NeuTreeTableBodyDataEntry<Data>> = {},
): NeuTreeTableBodyDataEntry<Data> {
  const node: NeuTreeTableNode<Data> = { id: 'node', label: 'Node', data: { owner: 'UI' } };
  const row: InternalNeuTreeTableRow<Data> = {
    owner: 'UI',
    id: 'node',
    label: 'Node',
    __treeLevel: 1,
    __treeHasChildren: true,
    __treeExpanded: false,
    __treeDisabled: false,
    __treeParentId: 'parent',
    __treePosInSet: 2,
    __treeSetSize: 3,
    __treeNode: node,
  };
  const column: NeuTableColumn<Data> = { key: 'label', header: 'Node' };
  return {
    kind: 'node',
    key: 'node',
    $implicit: node,
    node,
    data: node.data,
    row,
    level: 1,
    leaf: false,
    expanded: false,
    selected: true,
    partial: false,
    editing: false,
    rowIndex: 0,
    logicalIndex: 0,
    frozen: false,
    columns: [column],
    toggleSelection: vi.fn(),
    toggleExpansion: vi.fn(),
    focus: vi.fn(),
    focusParent: vi.fn(),
    focusFirstChild: vi.fn(),
    focusPrevious: vi.fn(),
    focusNext: vi.fn(),
    edit: {
      editing: false,
      draft: {},
      setValue: vi.fn(),
      init: vi.fn(),
      save: vi.fn(() => true),
      cancel: vi.fn(),
    },
    ...overrides,
  };
}

describe('NeuTreeTableManagedRowDirective', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ManagedRowHostComponent] }).compileComponents();
  });

  it('owns the complete tree-row ARIA and roving-focus contract', () => {
    const fixture = TestBed.createComponent(ManagedRowHostComponent);
    fixture.componentInstance.entry = createEntry();
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tr') as HTMLTableRowElement;

    expect(row.getAttribute('role')).toBe('row');
    expect(row.dataset['neuTreeNodeId']).toBe('node');
    expect(row.getAttribute('aria-level')).toBe('2');
    expect(row.getAttribute('aria-expanded')).toBe('false');
    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(row.hasAttribute('aria-disabled')).toBe(false);
    expect(row.getAttribute('aria-posinset')).toBe('2');
    expect(row.getAttribute('aria-setsize')).toBe('3');
    expect(row.tabIndex).toBe(0);

    fixture.destroy();
    const leafFixture = TestBed.createComponent(ManagedRowHostComponent);
    leafFixture.componentInstance.entry = createEntry({
      rowIndex: 2,
      leaf: true,
      selected: false,
      row: {
        ...(fixture.componentInstance.entry.row as InternalNeuTreeTableRow<Data>),
        __treeDisabled: true,
      },
    });
    leafFixture.detectChanges();
    const updatedRow = leafFixture.nativeElement.querySelector('tr') as HTMLTableRowElement;
    expect(updatedRow.getAttribute('aria-expanded')).toBeNull();
    expect(updatedRow.getAttribute('aria-selected')).toBe('false');
    expect(updatedRow.getAttribute('aria-disabled')).toBe('true');
    expect(updatedRow.tabIndex).toBe(-1);

    updatedRow.focus();
    leafFixture.detectChanges();
    expect(updatedRow.tabIndex).toBe(0);
  });

  it('delegates plain-row focus and selection but protects interactive descendants', () => {
    const fixture = TestBed.createComponent(ManagedRowHostComponent);
    const entry = createEntry();
    fixture.componentInstance.entry = entry;
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tr') as HTMLTableRowElement;

    row.dispatchEvent(new FocusEvent('focus'));
    fixture.nativeElement.querySelector('.plain-cell').click();
    fixture.nativeElement.querySelector('.interactive').click();

    expect(entry.focus).toHaveBeenCalledTimes(1);
    expect(entry.toggleSelection).toHaveBeenCalledTimes(1);

    fixture.componentInstance.entry = createEntry({
      row: { ...(entry.row as InternalNeuTreeTableRow<Data>), __treeDisabled: true },
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.plain-cell').click();
    expect(fixture.componentInstance.entry.toggleSelection).not.toHaveBeenCalled();
  });

  it('maps keyboard navigation, expansion, and selection without swallowing unrelated keys', () => {
    const fixture = TestBed.createComponent(ManagedRowHostComponent);
    let entry = createEntry();
    fixture.componentInstance.entry = entry;
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tr') as HTMLTableRowElement;

    const press = (key: string, target: HTMLElement = row) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      return event;
    };

    expect(press('ArrowUp').defaultPrevented).toBe(true);
    expect(press('ArrowDown').defaultPrevented).toBe(true);
    expect(press('ArrowLeft').defaultPrevented).toBe(true);
    expect(press('ArrowRight').defaultPrevented).toBe(true);
    expect(press('Enter').defaultPrevented).toBe(true);
    expect(press(' ').defaultPrevented).toBe(true);
    expect(press('Home').defaultPrevented).toBe(false);
    expect(entry.focusPrevious).toHaveBeenCalledTimes(1);
    expect(entry.focusNext).toHaveBeenCalledTimes(1);
    expect(entry.focusParent).toHaveBeenCalledTimes(1);
    expect(entry.toggleExpansion).toHaveBeenCalledTimes(1);
    expect(entry.toggleSelection).toHaveBeenCalledTimes(2);

    entry = createEntry({ expanded: true });
    fixture.componentInstance.entry = entry;
    fixture.detectChanges();
    press('ArrowLeft');
    press('ArrowRight');
    expect(entry.toggleExpansion).toHaveBeenCalledTimes(1);
    expect(entry.focusFirstChild).toHaveBeenCalledTimes(1);

    entry = createEntry({ leaf: true });
    fixture.componentInstance.entry = entry;
    fixture.detectChanges();
    press('ArrowRight');
    expect(entry.toggleExpansion).not.toHaveBeenCalled();
    expect(entry.focusFirstChild).not.toHaveBeenCalled();

    const interactive = fixture.nativeElement.querySelector('.interactive') as HTMLButtonElement;
    expect(press('ArrowDown', interactive).defaultPrevented).toBe(false);

    entry = createEntry({
      row: { ...(entry.row as InternalNeuTreeTableRow<Data>), __treeDisabled: true },
    });
    fixture.componentInstance.entry = entry;
    fixture.detectChanges();
    expect(press('ArrowDown').defaultPrevented).toBe(false);
    expect(entry.focusNext).not.toHaveBeenCalled();
  });

  it('exposes the directive instance for advanced body-section consumers', () => {
    const fixture = TestBed.createComponent(ManagedRowHostComponent);
    fixture.componentInstance.entry = createEntry();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(NeuTreeTableManagedRowDirective)).injector.get(
      NeuTreeTableManagedRowDirective,
    ).context()).toBe(fixture.componentInstance.entry);
  });
});
