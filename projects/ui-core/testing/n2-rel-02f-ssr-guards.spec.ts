import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NeuSelectComponent } from '../select/neu-select.component';
import { NeuTableComponent } from '../table/public/neu-table.component-contract';
import { NeuTreeTableComponent } from '../tree-table/public/neu-tree-table.component-contract';
import { NeuVirtualListComponent } from '../virtual-list/neu-virtual-list.component';

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'server' }],
  }).compileComponents(),
);

describe('server rendering guards', () => {
  it('renders a table without starting browser viewport work', () => {
    const fixture = TestBed.createComponent(NeuTableComponent<{ id: number; name: string }, number, 'name'>);
    fixture.componentRef.setInput('rowKey', (row: { id: number }) => row.id);
    fixture.componentRef.setInput('data', [{ id: 1, name: 'Alpha' }]);
    fixture.componentRef.setInput('columns', [{ id: 'name', field: 'name', header: 'Name' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Alpha');
  });

  it('renders a tree table without starting browser viewport work', () => {
    const fixture = TestBed.createComponent(NeuTreeTableComponent<{ id: number; name: string }, number, 'name'>);
    fixture.componentRef.setInput('rowKey', (row: { id: number }) => row.id);
    fixture.componentRef.setInput('hierarchyOptions', { treeColumnId: 'name', indentSize: 16 });
    fixture.componentRef.setInput('data', [{ id: 1, name: 'Root' }]);
    fixture.componentRef.setInput('hierarchy', {
      hierarchyRevision: 1,
      queryRevision: 0,
      roots: {
        status: 'loaded',
        keys: [1],
        relationRevision: 1,
        appliedRequestId: null,
        total: 1,
        completeness: 'complete',
      },
      children: [],
    });
    fixture.componentRef.setInput('columns', [{ id: 'name', field: 'name', header: 'Name' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Root');
  });

  it('renders select and virtual list without browser subscriptions', () => {
    const select = TestBed.createComponent(NeuSelectComponent);
    select.detectChanges();
    expect(select.nativeElement.querySelector('[role="combobox"]')).not.toBeNull();

    const list = TestBed.createComponent(NeuVirtualListComponent<number, number>);
    list.componentRef.setInput('itemKey', (value: number) => value);
    list.componentRef.setInput('items', [1, 2]);
    list.detectChanges();
    expect(list.nativeElement.querySelector('[role="list"]')).not.toBeNull();
  });
});
