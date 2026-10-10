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

  it('bounds keyboard destinations and rejects unknown keys or removed columns', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as unknown as {
      keyboardDestination(move: { cardId: string; cardTitle: string; fromColumnId: string;
        previousIndex: number; toColumnId: string; currentIndex: number }, key: string):
        { toColumnId: string; currentIndex: number } | null;
    };
    const move = { cardId: 'a', cardTitle: 'Alpha', fromColumnId: 'todo',
      previousIndex: 0, toColumnId: 'todo', currentIndex: 0 };
    expect(board.keyboardDestination(move, 'ArrowLeft')).toMatchObject({ toColumnId: 'todo', currentIndex: 0 });
    expect(board.keyboardDestination(move, 'ArrowRight')).toMatchObject({ toColumnId: 'doing', currentIndex: 0 });
    expect(board.keyboardDestination(move, 'ArrowUp')).toMatchObject({ toColumnId: 'todo', currentIndex: 0 });
    expect(board.keyboardDestination(move, 'ArrowDown')).toMatchObject({ toColumnId: 'todo', currentIndex: 1 });
    expect(board.keyboardDestination(move, 'End')).toMatchObject({ toColumnId: 'todo', currentIndex: 2 });
    expect(board.keyboardDestination({ ...move, currentIndex: 2 }, 'Home'))
      .toMatchObject({ toColumnId: 'todo', currentIndex: 0 });
    expect(board.keyboardDestination(move, 'Delete')).toBeNull();
    expect(board.keyboardDestination({ ...move, toColumnId: 'missing' }, 'End')).toBeNull();
  });

  it('provides the Spanish move labels and follows the visual RTL direction', () => {
    document.documentElement.lang = 'es-ES';
    const { fixture } = setup();
    const board = fixture.componentInstance as unknown as {
      resolvedMoveButtonLabel(): string;
      moveDirectionLabel(cardTitle: string, direction: 'left' | 'right' | 'up' | 'down'): string;
      visualColumnDelta(direction: 'left' | 'right'): number;
    };
    expect(board.resolvedMoveButtonLabel()).toBe('Mover');
    expect(board.moveDirectionLabel('Alpha', 'left')).toContain('izquierda');
    expect(board.moveDirectionLabel('Alpha', 'right')).toContain('derecha');
    expect(board.moveDirectionLabel('Alpha', 'up')).toContain('arriba');
    expect(board.moveDirectionLabel('Alpha', 'down')).toContain('abajo');
    expect(board.visualColumnDelta('left')).toBe(-1);
    (fixture.nativeElement as HTMLElement).style.direction = 'rtl';
    expect(board.visualColumnDelta('left')).toBe(1);
    expect(board.visualColumnDelta('right')).toBe(-1);
    fixture.componentRef.setInput('moveButtonLabel', 'Shift');
    fixture.detectChanges();
    expect(board.resolvedMoveButtonLabel()).toBe('Shift');
  });

  it('keeps the Neural button accessible names after rendering movement actions', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    expect(trigger(host, 'a').getAttribute('aria-label')).toBe('Move: Alpha');
    trigger(host, 'a').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const actions = [...host.querySelectorAll<HTMLButtonElement>('.neu-kanban__move-actions button')];
    expect(actions).toHaveLength(4);
    expect(actions.map(button => button.textContent?.trim())).toEqual(['←', '↑', '↓', '→']);
    for (const button of actions) {
      expect(button.getAttribute('aria-label')).toContain('Alpha');
      expect(button.getAttribute('aria-label')).toMatch(/left|right|up|down/i);
      expect(button.getAttribute('aria-disabled')).toBe(String(button.disabled));
    }
    fixture.destroy();
  });

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

  it('renders rich card metadata and an accessible assignee avatar without proposing a move', () => {
    const { fixture, proposals } = setup([{ id: 'todo', title: 'To do', cards: [
      {
        id: 'rich', title: 'Release review', priority: 'high', description: 'Check package',
        assignee: { name: 'Ada Lovelace', avatar: '/ada.png' }, dueDate: 'Tomorrow',
      },
      { id: 'meta', title: 'Follow up', meta: 'Blocked' },
    ] }]);
    const host = fixture.nativeElement as HTMLElement;
    const rich = card(host, 'rich');
    expect(rich.querySelector('.neu-kanban__priority')?.textContent).toContain('high');
    expect(rich.querySelector('.neu-kanban__description')?.textContent).toContain('Check package');
    expect(rich.querySelector<HTMLImageElement>('.neu-kanban__avatar img')?.alt).toBe('Ada Lovelace');
    expect(rich.querySelector('.neu-kanban__meta-value')?.textContent).toContain('Tomorrow');
    expect(card(host, 'meta').querySelector('.neu-kanban__meta-value')?.textContent).toContain('Blocked');
    expect(proposals).toEqual([]);
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

  it('routes every enabled directional action through one immutable move proposal', () => {
    const { fixture, proposals } = setup();
    action(fixture, 'a', 'down');
    action(fixture, 'c', 'up');
    action(fixture, 'd', 'left');
    expect(proposals).toEqual([
      { kind: 'reorder', cardId: 'a', columnId: 'todo', fromIndex: 0, toIndex: 1 },
      { kind: 'reorder', cardId: 'c', columnId: 'todo', fromIndex: 2, toIndex: 1 },
      { kind: 'transfer', cardId: 'd', fromColumnId: 'doing', toColumnId: 'todo', fromIndex: 0, toIndex: 0 },
    ]);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.neu-kanban__card')).toHaveLength(4);
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

  it('uses supplied assignee initials before deriving initials from a name', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    expect(board.assigneeInitials({ name: 'Alice Martin', initials: 'AM' })).toBe('AM');
    expect(board.assigneeInitials({ name: 'Alice Martin' })).toBe('AM');
  });

  it('ignores a drag event with no card payload', () => {
    const { fixture, proposals } = setup();
    const board = fixture.componentInstance as any;
    board.onCardDrop({ item: { data: undefined } }, 'doing');
    expect(proposals).toEqual([]);
  });

  it('refuses move controls for unknown and disabled cards', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    board.openMoveMenu('missing');
    board.openMoveMenu('b');
    expect(board.activeMoveCardId()).toBeNull();
    expect(board.canMove('missing', 'right')).toBe(false);
    expect(board.canMove('b', 'right')).toBe(false);
  });

  it('toggles the same move menu closed and ignores unrelated menu keys', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    const click = new MouseEvent('click', { cancelable: true });
    board.toggleMoveMenu('a', click);
    expect(board.isMoveMenuOpen('a')).toBe(true);
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    board.onMoveMenuKeydown('a', tab);
    expect(tab.defaultPrevented).toBe(false);
    board.toggleMoveMenu('a', click);
    expect(board.isMoveMenuOpen('a')).toBe(false);
  });

  it('keeps move controls open for pointer activity inside their active card', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    board.openMoveMenu('a');
    fixture.detectChanges();
    const controls = (fixture.nativeElement as HTMLElement).querySelector('[data-neu-kanban-move-card-id="a"]')!;
    const target = controls.querySelector('button') ?? controls;
    board.onDocumentPointerDown({ target } as unknown as PointerEvent);
    expect(board.isMoveMenuOpen('a')).toBe(true);
  });

  it('does not begin keyboard movement with an unrelated key', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    board.onCardKeydown(BOARD[0]!.cards[0], 'todo', 0, event);
    expect(board.keyboardMove()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
  });

  it('ignores keyboard movement from another card and unsupported destination keys', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    board.onCardKeydown(BOARD[0]!.cards[0], 'todo', 0,
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(board.keyboardMove()?.cardId).toBe('a');
    board.onCardKeydown(BOARD[1]!.cards[0], 'doing', 0,
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(board.keyboardMove()?.cardId).toBe('a');
    const unsupported = new KeyboardEvent('keydown', { key: 'Delete', cancelable: true });
    board.onCardKeydown(BOARD[0]!.cards[0], 'todo', 0, unsupported);
    expect(unsupported.defaultPrevented).toBe(false);
  });

  it('does not announce a target from a column removed by a parent write', () => {
    const { fixture } = setup();
    const board = fixture.componentInstance as any;
    const before = board.liveMessage();
    board.announceKeyboardTarget({ cardTitle: 'Alpha', toColumnId: 'removed', currentIndex: 0 });
    expect(board.liveMessage()).toBe(before);
  });
});
