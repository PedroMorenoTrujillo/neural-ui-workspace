import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NeuOrderListComponent,
  NeuPickListComponent,
  type NeuTransferItem,
} from './neu-pick-list.component';

const row = (value: string, label = value, disabled = false): NeuTransferItem => ({
  value, label, ...(disabled ? { disabled } : {}),
});
const values = (items: readonly NeuTransferItem[]) => items.map((item) => item.value);
const drop = (item: unknown, currentIndex?: number) => ({
  data: item,
  targetData: 'source',
  scope: ['neu-pick-list'],
  effect: 'move' as const,
  interaction: 'pointer' as const,
  originalEvent: null,
  ...(currentIndex === undefined ? {} : { currentIndex }),
});
const orderDrop = (item: unknown, currentIndex?: number) => ({
  ...drop(item, currentIndex),
  targetData: 'order',
  scope: ['neu-order-list'],
});

describe('N2-C2 ordered DnD contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuPickListComponent, NeuOrderListComponent],
    }).compileComponents();
  });
  afterEach(() => vi.restoreAllMocks());

  function pick(
    source: readonly NeuTransferItem[],
    target: readonly NeuTransferItem[] = [],
  ): ComponentFixture<NeuPickListComponent<NeuTransferItem, string>> {
    const fixture = TestBed.createComponent(NeuPickListComponent) as ComponentFixture<
      NeuPickListComponent<NeuTransferItem, string>
    >;
    fixture.componentRef.setInput('source', source);
    fixture.componentRef.setInput('target', target);
    fixture.detectChanges();
    return fixture;
  }

  function order(items: readonly NeuTransferItem[]): ComponentFixture<NeuOrderListComponent<NeuTransferItem, string>> {
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<NeuTransferItem, string>
    >;
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture;
  }

  it('PickList reorders visible slots but leaves hidden applied slots untouched', () => {
    const applied = [row('A'), row('B', 'match B'), row('C'), row('D', 'match D')];
    const fixture = pick(applied);
    fixture.componentRef.setInput('filter', true);
    fixture.componentInstance.setFilter('source', 'match');
    fixture.detectChanges();
    const proposals: NeuTransferItem[][] = [];
    const drops: { previousIndex: number; currentIndex: number }[] = [];
    fixture.componentInstance.sourceChange.subscribe((next) => proposals.push(next));
    fixture.componentInstance.itemDrop.subscribe((event) => drops.push(event));

    fixture.componentInstance.onDrop(
      drop(fixture.componentInstance.dragData(applied[3]!, 'source'), 0), 'source',
    );
    expect(values(proposals[0]!)).toEqual(['A', 'D', 'C', 'B']);
    expect(drops).toMatchObject([{ previousIndex: 1, currentIndex: 0 }]);
    expect(values(applied)).toEqual(['A', 'B', 'C', 'D']);
    expect(values(fixture.componentInstance.source())).toEqual(['A', 'B', 'C', 'D']);
  });

  it('PickList uses the same visible-slot semantics for native reorder controls', () => {
    const applied = [row('A'), row('B', 'match B'), row('C'), row('D', 'match D')];
    const fixture = pick(applied);
    fixture.componentRef.setInput('filter', true);
    fixture.componentRef.setInput('sourceSelectionKeys', ['D']);
    fixture.componentInstance.setFilter('source', 'match');
    fixture.detectChanges();
    const proposals: NeuTransferItem[][] = [];
    fixture.componentInstance.sourceChange.subscribe((next) => proposals.push(next));
    fixture.componentInstance.reorderSelection('source', 'top');
    expect(values(proposals[0]!)).toEqual(['A', 'D', 'C', 'B']);
    expect(fixture.componentInstance.isSourceSelected(applied[3]!)).toBe(true);
  });

  it('PickList inserts before the visible destination anchor, not at visible array index', () => {
    const source = [row('X')];
    const target = [row('H1'), row('V1', 'match 1'), row('H2'), row('V2', 'match 2')];
    const fixture = pick(source, target);
    fixture.componentRef.setInput('filter', true);
    fixture.componentInstance.setFilter('target', 'match');
    fixture.detectChanges();
    const proposals: { source: NeuTransferItem[]; target: NeuTransferItem[] }[] = [];
    const drops: number[] = [];
    fixture.componentInstance.itemsChange.subscribe((next) => proposals.push(next));
    fixture.componentInstance.itemDrop.subscribe((event) => drops.push(event.currentIndex));
    fixture.componentInstance.onDrop(
      drop(fixture.componentInstance.dragData(source[0]!, 'source'), 1), 'target',
    );
    expect(values(proposals[0]!.source)).toEqual([]);
    expect(values(proposals[0]!.target)).toEqual(['H1', 'V1', 'H2', 'X', 'V2']);
    expect(drops).toEqual([1]);
    expect(values(target)).toEqual(['H1', 'V1', 'H2', 'V2']);
  });

  it('PickList appends a drop when the filtered destination is empty', () => {
    const fixture = pick([row('X')], [row('H1'), row('H2')]);
    fixture.componentRef.setInput('filter', true);
    fixture.componentInstance.setFilter('target', 'no matches');
    fixture.detectChanges();
    let proposed: readonly NeuTransferItem[] = [];
    fixture.componentInstance.targetChange.subscribe((next) => (proposed = next));
    fixture.componentInstance.onDrop(
      drop(fixture.componentInstance.dragData(fixture.componentInstance.source()[0]!, 'source'), 0),
      'target',
    );
    expect(values(proposed)).toEqual(['H1', 'H2', 'X']);
  });

  it('PickList transfer buttons append in source order and moveAllScope respects the filter', () => {
    const fixture = pick([row('A', 'match A'), row('B'), row('C', 'match C')]);
    fixture.componentRef.setInput('filter', true);
    fixture.componentInstance.setFilter('source', 'match');
    fixture.detectChanges();
    const proposed: NeuTransferItem[][] = [];
    fixture.componentInstance.targetChange.subscribe((next) => proposed.push(next));
    fixture.componentInstance.moveAllToTarget();
    expect(values(proposed.at(-1)!)).toEqual(['A', 'C']);
    fixture.componentRef.setInput('moveAllScope', 'all');
    fixture.detectChanges();
    fixture.componentInstance.moveAllToTarget();
    expect(values(proposed.at(-1)!)).toEqual(['A', 'B', 'C']);
  });

  it('PickList keeps local selection on rejection and prunes only after applied acceptance', () => {
    const A = row('A');
    const B = row('B');
    const fixture = pick([A, B]);
    const component = fixture.componentInstance;
    const selectionChanges = vi.spyOn(component.sourceSelectionChange, 'emit');
    const proposals: { source: NeuTransferItem[]; target: NeuTransferItem[] }[] = [];
    component.itemsChange.subscribe((next) => proposals.push(next));
    component.toggleSource('A');
    component.moveToTarget();
    expect(component.sourceSelection().has('A')).toBe(true);
    expect(values(component.source())).toEqual(['A', 'B']);
    expect(proposals).toHaveLength(1);
    expect(selectionChanges).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('source', [B]);
    fixture.componentRef.setInput('target', [A]);
    fixture.detectChanges();
    expect(component.sourceSelection().has('A')).toBe(false);
    expect(selectionChanges).toHaveBeenCalledTimes(1);
  });

  it('PickList never clears parent-controlled selection on transfer or parent write', () => {
    const A = row('A');
    const fixture = pick([A]);
    fixture.componentRef.setInput('sourceSelectionKeys', ['A']);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const selectionChanges = vi.spyOn(component.sourceSelectionChange, 'emit');
    component.moveToTarget();
    fixture.componentRef.setInput('source', []);
    fixture.componentRef.setInput('target', [A]);
    fixture.detectChanges();
    expect(component.sourceSelectionKeys()).toEqual(['A']);
    expect(component.hasSourceSelection()).toBe(false);
    expect(selectionChanges).not.toHaveBeenCalled();
  });

  it('PickList fails closed for duplicate keys within or across sides with one diagnostic', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = pick([row('A'), row('A')]);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.itemsChange, 'emit');
    fixture.componentInstance.moveAllToTarget();
    fixture.componentInstance.reorderSelection('source', 'top');
    expect(proposals).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('duplicate semantic key A');
    fixture.componentRef.setInput('source', [row('A')]);
    fixture.componentRef.setInput('target', [row('A')]);
    fixture.detectChanges();
    fixture.componentInstance.moveAllToTarget();
    expect(proposals).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('PickList rejects indexless keyboard DnD rather than appending', () => {
    const fixture = pick([row('A')], [row('B')]);
    const proposals = vi.spyOn(fixture.componentInstance.itemsChange, 'emit');
    fixture.componentInstance.onDrop(
      drop(fixture.componentInstance.dragData(fixture.componentInstance.source()[0]!, 'source')),
      'target',
    );
    expect(proposals).not.toHaveBeenCalled();
  });

  it('OrderList moves only visible slots by pointer and native controls', () => {
    const applied = [row('A'), row('B', 'match B'), row('C'), row('D', 'match D')];
    const fixture = order(applied);
    fixture.componentRef.setInput('filter', true);
    fixture.componentInstance.setFilter('match');
    fixture.detectChanges();
    const proposals: NeuTransferItem[][] = [];
    const drops: { previousIndex: number; currentIndex: number }[] = [];
    fixture.componentInstance.orderChange.subscribe((next) => proposals.push(next));
    fixture.componentInstance.itemDrop.subscribe((event) => drops.push(event));
    fixture.componentInstance.onDrop(orderDrop(applied[3], 0));
    expect(values(proposals[0]!)).toEqual(['A', 'D', 'C', 'B']);
    expect(drops).toMatchObject([{ previousIndex: 1, currentIndex: 0 }]);
    fixture.componentInstance.move(1, -1);
    expect(values(proposals[1]!)).toEqual(['A', 'D', 'C', 'B']);
    expect(values(applied)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('OrderList blocks disabled barriers and indexless drops', () => {
    const applied = [row('A'), row('locked', 'match locked', true), row('B', 'match B')];
    const fixture = order(applied);
    fixture.componentRef.setInput('selectionKeys', ['B']);
    fixture.detectChanges();
    const proposals = vi.spyOn(fixture.componentInstance.orderChange, 'emit');
    fixture.componentInstance.moveSelection('top');
    fixture.componentInstance.onDrop(orderDrop(applied[2], 0));
    fixture.componentInstance.onDrop(orderDrop(applied[2]));
    expect(proposals).not.toHaveBeenCalled();
  });

  it('OrderList rejects duplicate keys without selecting an arbitrary first row', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = order([row('A'), row('A')]);
    const proposals = vi.spyOn(fixture.componentInstance.orderChange, 'emit');
    fixture.componentInstance.move(1, -1);
    fixture.componentInstance.onDrop(orderDrop(fixture.componentInstance.items()[1], 0));
    fixture.detectChanges();
    expect(proposals).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('retains semantic identity across reconstructed objects using optionValue', () => {
    interface User { readonly id: number; readonly label: string }
    const fixture = TestBed.createComponent(NeuOrderListComponent) as ComponentFixture<
      NeuOrderListComponent<User, number>
    >;
    fixture.componentRef.setInput('items', [{ id: 1, label: 'One' }, { id: 2, label: 'Two' }]);
    fixture.componentRef.setInput('optionValue', 'id');
    fixture.componentRef.setInput('optionLabel', 'label');
    fixture.componentRef.setInput('selectionKeys', [2]);
    fixture.detectChanges();
    const reconstructed = [{ id: 1, label: 'One again' }, { id: 2, label: 'Two again' }];
    fixture.componentRef.setInput('items', reconstructed);
    fixture.detectChanges();
    expect(fixture.componentInstance.isSelected(reconstructed[1]!)).toBe(true);
    const proposal: User[][] = [];
    fixture.componentInstance.orderChange.subscribe((next) => proposal.push(next));
    fixture.componentInstance.move(1, -1);
    expect(proposal[0]?.[0]).toBe(reconstructed[1]);
  });

  it('keeps native action focus and semantic source/target roles in RTL', () => {
    const fixture = pick([row('A')], [row('B')]);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector(
      '.neu-pick-list__actions button',
    ) as HTMLButtonElement;
    const item = fixture.nativeElement.querySelector(
      '.neu-pick-list__list button',
    ) as HTMLButtonElement;
    item.click();
    fixture.detectChanges();
    action.focus();
    action.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(action);
    expect(action.getAttribute('aria-label')).toContain('target');
    expect(fixture.componentInstance.source()[0]?.value).toBe('A');
  });

  it('releases 50 independently created facade instances', () => {
    for (let index = 0; index < 50; index++) {
      const pickFixture = pick([row(`A${index}`)]);
      pickFixture.componentRef.setInput('dragDrop', true);
      pickFixture.detectChanges();
      pickFixture.destroy();
      const orderFixture = order([row(`B${index}`)]);
      orderFixture.componentRef.setInput('dragDrop', true);
      orderFixture.detectChanges();
      orderFixture.destroy();
    }
  });
});
