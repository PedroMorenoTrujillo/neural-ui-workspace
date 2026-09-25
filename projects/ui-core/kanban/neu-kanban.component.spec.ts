import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { NeuKanbanComponent } from './neu-kanban.component';
import type { NeuKanbanCardMove, NeuKanbanColumn } from './neu-kanban.types';

const BOARD: readonly NeuKanbanColumn[] = [
  { id: 'todo', title: 'To do', wipLimit: 1, cards: [
    { id: 'a', title: 'Alpha', assignee: { name: 'Alice Martin' }, tags: ['urgent'] },
    { id: 'b', title: 'Beta', disabled: true },
    { id: 'c', title: 'Gamma' },
  ] },
  { id: 'doing', title: 'Doing', cards: [{ id: 'd', title: 'Delta' }] },
  { id: 'done', title: 'Done', cards: [] },
];

describe('NeuKanbanComponent controlled board', () => {
  beforeEach(async () => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function setup(columns: readonly NeuKanbanColumn[] = BOARD) {
    const fixture = TestBed.createComponent(NeuKanbanComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
    const proposals: NeuKanbanCardMove[] = [];
    fixture.componentInstance.cardMove.subscribe((proposal) => proposals.push(proposal));
    return { fixture, proposals };
  }

  function card(host: HTMLElement, id: string): HTMLElement {
    const found = Array.from(host.querySelectorAll<HTMLElement>('[data-neu-kanban-card-id]'))
      .find((node) => node.dataset['neuKanbanCardId'] === id);
    if (!found) throw new Error('Card not rendered: ' + id);
    return found;
  }

  function trigger(host: HTMLElement, id: string): HTMLButtonElement {
    const found = Array.from(host.querySelectorAll<HTMLButtonElement>('.neu-kanban__move-trigger'))
      .find((node) => node.dataset['neuKanbanMoveTriggerCardId'] === id);
    if (!found) throw new Error('Trigger not rendered: ' + id);
    return found;
  }

  function key(node: HTMLElement, value: string): void {
    node.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }));
  }

  function action(fixture: ReturnType<typeof setup>['fixture'], id: string,
    direction: 'left' | 'right' | 'up' | 'down'): void {
    const host = fixture.nativeElement as HTMLElement;
    trigger(host, id).click();
    fixture.detectChanges();
    const actions = host.querySelector('.neu-kanban__move-actions');
    const index = { left: 0, up: 1, down: 2, right: 3 }[direction];
    (actions?.querySelectorAll('button')[index] as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function drop(fixture: ReturnType<typeof setup>['fixture'], cardId: string,
    sourceId: string, targetId: string, currentIndex: number): void {
    const lists = fixture.debugElement.queryAll(By.directive(CdkDropList));
    const source = lists.find((entry) => entry.injector.get(CdkDropList).id === sourceId);
    const target = lists.find((entry) => entry.injector.get(CdkDropList).id === targetId);
    const drag = fixture.debugElement.queryAll(By.directive(CdkDrag))
      .find((entry) => entry.injector.get(CdkDrag).data.id === cardId);
    if (!source || !target || !drag) throw new Error('Missing CDK fixture');
    target.injector.get(CdkDropList).dropped.emit({
      item: drag.injector.get(CdkDrag),
      previousContainer: source.injector.get(CdkDropList),
      container: target.injector.get(CdkDropList),
      previousIndex: 0,
      currentIndex,
    } as never);
    fixture.detectChanges();
  }

  it('renders ordered columns, cards, controls and empty state', () => {
    const { fixture } = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(Array.from(host.querySelectorAll('.neu-kanban__column-name')).map((n) => n.textContent))
      .toEqual(['To do', 'Doing', 'Done']);
    expect(host.querySelectorAll('.neu-kanban__card')).toHaveLength(4);
    expect(card(host, 'a').getAttribute('role')).toBe('button');
    expect(card(host, 'a').tabIndex).toBe(0);
    expect(card(host, 'a').getAttribute('aria-describedby'))
      .toBe(host.querySelector('.neu-kanban__sr-only')?.id);
    expect(host.querySelector('.neu-kanban__empty')?.textContent).toContain('Drop cards here');
    expect(host.textContent).toContain('AM');
    expect(host.textContent).toContain('urgent');
  });

  it('keeps WIP informational and honors presentation inputs', () => {
    const { fixture } = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.neu-kanban__wip')?.textContent).toContain('3/1');
    expect(host.querySelector('.neu-kanban__wip--alert')).not.toBeNull();
    fixture.componentRef.setInput('showCounts', false);
    fixture.componentRef.setInput('showWipLimit', false);
    fixture.componentRef.setInput('columnWidth', '360px');
    fixture.detectChanges();
    expect(host.querySelector('.neu-kanban__count')).toBeNull();
    expect(host.querySelector('.neu-kanban__wip')).toBeNull();
    expect(host.style.getPropertyValue('--neu-kanban-column-width')).toBe('360px');
  });

  it('keeps disabled cards readable but unavailable for movement', () => {
    const { fixture, proposals } = setup();
    const host = fixture.nativeElement as HTMLElement;
    expect(card(host, 'b').getAttribute('aria-disabled')).toBe('true');
    expect(trigger(host, 'b').disabled).toBe(true);
    expect(fixture.debugElement.queryAll(By.directive(CdkDrag))
      .find((entry) => entry.injector.get(CdkDrag).data.id === 'b')
      ?.injector.get(CdkDrag).disabled).toBe(true);
    key(card(host, 'b'), 'Enter');
    drop(fixture, 'b', 'todo', 'doing', 0);
    expect(proposals).toEqual([]);
  });

  it('emits same-column reorder once without optimistic mutation', () => {
    const { fixture, proposals } = setup();
    drop(fixture, 'c', 'todo', 'todo', 0);
    expect(proposals).toEqual([{ kind: 'reorder', cardId: 'c', columnId: 'todo',
      fromIndex: 2, toIndex: 0 }]);
    const host = fixture.nativeElement as HTMLElement;
    expect(Array.from(host.querySelector('.neu-kanban__column')!.querySelectorAll('.neu-kanban__title'))
      .map((node) => node.textContent)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('emits cross-column transfer once without moving applied data', () => {
    const { fixture, proposals } = setup();
    drop(fixture, 'a', 'todo', 'doing', 1);
    expect(proposals).toEqual([{ kind: 'transfer', cardId: 'a', fromColumnId: 'todo',
      toColumnId: 'doing', fromIndex: 0, toIndex: 1 }]);
    expect(card(fixture.nativeElement, 'a').closest('.neu-kanban__column')
      ?.querySelector('.neu-kanban__column-name')?.textContent).toBe('To do');
    expect(fixture.nativeElement.querySelector('[aria-live]')?.textContent).toContain('requested');
  });

  it('suppresses no-op and stale source drops', () => {
    const { fixture, proposals } = setup();
    drop(fixture, 'a', 'todo', 'todo', 0);
    const target = fixture.debugElement.queryAll(By.directive(CdkDropList))[0].injector.get(CdkDropList);
    const drag = fixture.debugElement.queryAll(By.directive(CdkDrag))[0].injector.get(CdkDrag);
    target.dropped.emit({ item: drag, previousContainer: { id: 'unknown' }, currentIndex: 1 } as never);
    expect(proposals).toEqual([]);
  });

  it('accepts only a parent-applied reconstruction and never echoes it', () => {
    const { fixture, proposals } = setup();
    drop(fixture, 'a', 'todo', 'doing', 1);
    const accepted: readonly NeuKanbanColumn[] = Object.freeze([
      Object.freeze({ ...BOARD[0], cards: Object.freeze(BOARD[0].cards.filter((c) => c.id !== 'a')) }),
      Object.freeze({ ...BOARD[1], cards: Object.freeze([...BOARD[1].cards, { ...BOARD[0].cards[0] }]) }),
      BOARD[2],
    ]);
    fixture.componentRef.setInput('columns', accepted);
    fixture.detectChanges();
    expect(card(fixture.nativeElement, 'a').closest('.neu-kanban__column')
      ?.querySelector('.neu-kanban__column-name')?.textContent).toBe('Doing');
    expect(proposals).toHaveLength(1);
    expect(BOARD[0].cards).toHaveLength(3);
  });

  it('allows parent rejection with no board change or echo', () => {
    const { fixture, proposals } = setup();
    drop(fixture, 'a', 'todo', 'done', 0);
    fixture.componentRef.setInput('columns', BOARD.map((column) => ({
      ...column, cards: column.cards.map((entry) => ({ ...entry })),
    })));
    fixture.detectChanges();
    expect(card(fixture.nativeElement, 'a').closest('.neu-kanban__column')
      ?.querySelector('.neu-kanban__column-name')?.textContent).toBe('To do');
    expect(proposals).toHaveLength(1);
  });

  it('uses one proposal contract for visible actions and keyboard', () => {
    const { fixture, proposals } = setup();
    const host = fixture.nativeElement as HTMLElement;
    action(fixture, 'a', 'right');
    expect(proposals[0]).toEqual({ kind: 'transfer', cardId: 'a', fromColumnId: 'todo',
      toColumnId: 'doing', fromIndex: 0, toIndex: 0 });
    const node = card(host, 'a');
    key(node, 'Enter');
    key(node, 'ArrowRight');
    key(node, 'Enter');
    expect(proposals[1]).toEqual(proposals[0]);
  });

  it('supports keyboard Home/End, cancel and no-op boundaries', () => {
    const { fixture, proposals } = setup();
    const host = fixture.nativeElement as HTMLElement;
    const node = card(host, 'c');
    key(node, ' ');
    key(node, 'Home');
    key(node, ' ');
    expect(proposals[0]).toEqual({ kind: 'reorder', cardId: 'c', columnId: 'todo',
      fromIndex: 2, toIndex: 0 });
    key(node, 'Enter');
    key(node, 'End');
    key(node, 'Escape');
    fixture.detectChanges();
    expect(proposals).toHaveLength(1);
    expect(host.querySelector('[aria-live]')?.textContent).toContain('cancelled');
  });

  it('maps physical arrows under RTL without reversing applied order', () => {
    document.documentElement.dir = 'rtl';
    const { fixture, proposals } = setup();
    (fixture.nativeElement as HTMLElement).style.direction = 'rtl';
    action(fixture, 'd', 'right');
    expect(proposals[0]).toEqual({ kind: 'transfer', cardId: 'd', fromColumnId: 'doing',
      toColumnId: 'todo', fromIndex: 0, toIndex: 0 });
  });

  it('shows deterministic diagnostics for duplicate identities', () => {
    const { fixture, proposals } = setup([
      { id: 'x', title: 'A', cards: [{ id: 'duplicate', title: 'A' }] },
      { id: 'y', title: 'B', cards: [{ id: 'duplicate', title: 'B' }] },
    ]);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('duplicate-card-id');
    expect(host.querySelectorAll('.neu-kanban__column')).toHaveLength(0);
    expect(proposals).toEqual([]);
  });

  it('closes action menu on Escape/outside with focus restoration', async () => {
    const { fixture } = setup();
    const host = fixture.nativeElement as HTMLElement;
    const button = trigger(host, 'a');
    button.click();
    fixture.detectChanges();
    expect(host.querySelector('.neu-kanban__move-actions')).not.toBeNull();
    key(host.querySelector('.neu-kanban__move-actions button') as HTMLElement, 'Escape');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.querySelector('.neu-kanban__move-actions')).toBeNull();
    expect(document.activeElement).toBe(button);
    button.click();
    fixture.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.querySelector('.neu-kanban__move-actions')).toBeNull();
  });

  it('blocks reentrant proposals and retains frozen inputs', () => {
    const applied = Object.freeze(BOARD.map((column) => Object.freeze({
      ...column, cards: Object.freeze(column.cards.map((entry) => Object.freeze({ ...entry }))),
    })));
    const before = JSON.stringify(applied);
    const { fixture, proposals } = setup(applied);
    fixture.componentInstance.cardMove.subscribe(() => action(fixture, 'a', 'right'));
    action(fixture, 'a', 'right');
    expect(proposals).toHaveLength(1);
    expect(JSON.stringify(applied)).toBe(before);
    fixture.destroy();
  });
});
