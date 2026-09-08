import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { By } from '@angular/platform-browser';
import { NeuKanbanComponent, type NeuKanbanColumn } from './neu-kanban.component';

const COLUMNS: NeuKanbanColumn[] = [
  {
    id: 'todo',
    title: 'To do',
    color: '#2563eb',
    wipLimit: 2,
    cards: [
      {
        id: 'card-a',
        title: 'Qualify inbound lead',
        description: 'Review the new contact and assign the owner.',
        priority: 'high',
        tags: ['CRM', 'Lead'],
        assignee: { name: 'Alice Martin' },
        dueDate: 'Today',
      },
      {
        id: 'card-b',
        title: 'Prepare discount draft',
        priority: 'medium',
        meta: 'Q2 promo',
      },
    ],
  },
  {
    id: 'doing',
    title: 'Doing',
    color: '#f59e0b',
    cards: [{ id: 'card-c', title: 'Update product imagery', priority: 'low' }],
  },
];

describe('NeuKanbanComponent', () => {
  beforeEach(async () => {
    document.documentElement.lang = 'en';
    await TestBed.configureTestingModule({
      imports: [DragDropModule],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  function setup(columns = COLUMNS) {
    const fixture = TestBed.createComponent(NeuKanbanComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.detectChanges();
    return fixture;
  }

  it('should render columns and cards', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('.neu-kanban__column').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.neu-kanban__card').length).toBe(3);
  });

  it('exposes truthful card focus, keyboard instructions, and a visible move trigger per card', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;
    const instructions = fixture.nativeElement.querySelector('.neu-kanban__sr-only');
    const triggers = fixture.nativeElement.querySelectorAll(
      '.neu-kanban__move-trigger',
    ) as NodeListOf<HTMLButtonElement>;

    expect(card.tabIndex).toBe(0);
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('aria-label')).toContain(
      'Qualify inbound lead, To do, position 1 of 2',
    );
    expect(card.getAttribute('aria-describedby')).toBe(instructions.id);
    expect(card.getAttribute('aria-keyshortcuts')).toContain('Escape');
    expect(card.getAttribute('aria-expanded')).toBe('false');
    expect(triggers).toHaveLength(3);
    expect(triggers[0].textContent).toContain('Move');
    expect(fixture.nativeElement.querySelector('.neu-kanban__move-actions')).toBeFalsy();

    card.click();
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelector('.neu-kanban__move-actions') as HTMLElement;
    expect(card.getAttribute('aria-expanded')).toBe('true');
    expect(actions.querySelectorAll('button')).toHaveLength(4);
    expect(card.getAttribute('aria-controls')).toBe(actions.id);
  });

  it('opens one move menu at a time and closes it outside or with Escape', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const triggers = fixture.nativeElement.querySelectorAll(
      '.neu-kanban__move-trigger',
    ) as NodeListOf<HTMLButtonElement>;

    triggers[0].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('.neu-kanban__move-actions')).toHaveLength(1);

    triggers[1].click();
    fixture.detectChanges();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('.neu-kanban__move-actions')).toHaveLength(1);

    const action = fixture.nativeElement.querySelector(
      '.neu-kanban__move-actions button:not(:disabled)',
    ) as HTMLButtonElement;
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.neu-kanban__move-actions')).toBeFalsy();
    expect(document.activeElement).toBe(triggers[1]);

    triggers[0].click();
    fixture.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-kanban__move-actions')).toBeFalsy();
  });

  it('should show counts and wip limit by default', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2/2');
    expect(fixture.nativeElement.querySelector('.neu-kanban__count')?.textContent).toContain('2');
  });

  it('should hide counts and mark exceeded WIP limits when configured', async () => {
    const fixture = setup([
      {
        id: 'todo',
        title: 'To do',
        wipLimit: 1,
        cards: [
          { id: 'card-a', title: 'A' },
          { id: 'card-b', title: 'B' },
        ],
      },
    ]);
    fixture.componentRef.setInput('showCounts', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.neu-kanban__count')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('.neu-kanban__wip--alert')).toBeTruthy();
  });

  it('should hide wip metadata when showWipLimit=false', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('showWipLimit', false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.neu-kanban__wip')).toBeFalsy();
  });

  it('should derive assignee initials when avatar is missing', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('AM');
    expect(fixture.componentInstance.assigneeInitials({ name: 'Ignored', initials: 'IM' })).toBe(
      'IM',
    );
    expect(fixture.componentInstance.assigneeInitials({ name: '  one   two three  ' })).toBe('OT');
  });

  it('should render the assignee avatar image when provided', async () => {
    const fixture = setup([
      {
        id: 'todo',
        title: 'To do',
        cards: [
          {
            id: 'card-a',
            title: 'Qualify inbound lead',
            assignee: { name: 'Alice Martin', avatar: '/avatar.png' },
          },
        ],
      },
    ]);
    await fixture.whenStable();

    const avatar = fixture.nativeElement.querySelector(
      '.neu-kanban__avatar img',
    ) as HTMLImageElement;
    expect(avatar.getAttribute('src')).toBe('/avatar.png');
    expect(avatar.getAttribute('alt')).toBe('Alice Martin');
  });

  it('should apply the configured column width as CSS variable', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('columnWidth', '360px');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.style.getPropertyValue('--neu-kanban-column-width')).toBe('360px');
  });

  it('should render the empty drop hint for empty columns', async () => {
    const fixture = setup([{ id: 'empty', title: 'Empty', cards: [] }]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.neu-kanban__empty')?.textContent).toContain(
      'Drop cards here',
    );
  });

  it.each([
    {
      locale: 'es',
      instructions: 'Para mover una tarjeta con el teclado',
      empty: 'Suelta tarjetas aquí',
      card: 'Qualify inbound lead, To do, posición 1 de 2',
      trigger: 'Mover: Qualify inbound lead',
      group: 'Mover Qualify inbound lead',
      directions: [
        'Mover Qualify inbound lead a la columna anterior',
        'Mover Qualify inbound lead hacia arriba',
        'Mover Qualify inbound lead hacia abajo',
        'Mover Qualify inbound lead a la columna siguiente',
      ],
      selected: 'Qualify inbound lead seleccionada. Destino To do, posición 1.',
      cancelled: 'Movimiento cancelado para Qualify inbound lead.',
      moved: 'Qualify inbound lead se movió a Doing, posición 1.',
    },
    {
      locale: 'en',
      instructions: 'To move a card with the keyboard',
      empty: 'Drop cards here',
      card: 'Qualify inbound lead, To do, position 1 of 2',
      trigger: 'Move: Qualify inbound lead',
      group: 'Move Qualify inbound lead',
      directions: [
        'Move Qualify inbound lead to the previous column',
        'Move Qualify inbound lead up',
        'Move Qualify inbound lead down',
        'Move Qualify inbound lead to the next column',
      ],
      selected: 'Qualify inbound lead selected. Destination To do, position 1.',
      cancelled: 'Move cancelled for Qualify inbound lead.',
      moved: 'Qualify inbound lead moved to Doing, position 1.',
    },
  ])('localizes visible and accessible movement text for $locale', async (expected) => {
    document.documentElement.lang = expected.locale;
    const fixture = setup([...COLUMNS, { id: 'empty', title: 'Empty', cards: [] }]);
    await fixture.whenStable();

    const instructions = fixture.nativeElement.querySelector(
      '.neu-kanban__sr-only:not([aria-live])',
    ) as HTMLElement;
    const empty = fixture.nativeElement.querySelector('.neu-kanban__empty') as HTMLElement;
    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;
    const trigger = fixture.nativeElement.querySelector('.neu-kanban__move-trigger') as HTMLElement;
    const live = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;

    expect(instructions.textContent?.replace(/\s+/g, ' ').trim()).toContain(expected.instructions);
    expect(empty.textContent?.trim()).toBe(expected.empty);
    expect(card.getAttribute('aria-label')).toBe(expected.card);
    expect(trigger.getAttribute('aria-label')).toBe(expected.trigger);

    card.click();
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.neu-kanban__move-actions') as HTMLElement;
    const actionLabels = Array.from(group.querySelectorAll('button')).map((button) =>
      button.getAttribute('aria-label'),
    );
    expect(group.getAttribute('aria-label')).toBe(expected.group);
    expect(actionLabels).toEqual(expected.directions);

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe(expected.selected);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe(expected.cancelled);

    fixture.componentInstance.moveByAction('card-a', 'right');
    fixture.detectChanges();
    expect(live.textContent?.trim()).toBe(expected.moved);
  });

  it('preserves a custom move label and reacts to an active document-locale change', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('moveButtonLabel', 'Reposition');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.neu-kanban__move-trigger',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toContain('Reposition');

    fixture.componentRef.setInput('moveButtonLabel', 'Move');
    document.documentElement.lang = 'es';
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    fixture.detectChanges();

    expect(trigger.textContent).toContain('Mover');
    expect(trigger.getAttribute('aria-label')).toBe('Mover: Qualify inbound lead');
  });

  it('falls back to the injected locale when the document language is empty', async () => {
    document.documentElement.lang = '';
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.neu-kanban__move-trigger')?.textContent).toContain(
      'Move',
    );
  });

  it('onCardDrop should reorder cards within the same column', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const changes: NeuKanbanColumn[][] = [];
    fixture.componentInstance.columnsChange.subscribe((columns) => changes.push(columns));

    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'todo' },
        container: { id: 'todo' },
        previousIndex: 0,
        currentIndex: 1,
      } as any,
      'todo',
    );

    expect(fixture.componentInstance['_columns']()[0].cards[1].id).toBe('card-a');
    expect(changes).toHaveLength(1);
    expect(changes[0][0].cards[1]).toBe(COLUMNS[0].cards[0]);
    expect(COLUMNS[0].cards.map((card) => card.id)).toEqual(['card-a', 'card-b']);
  });

  it('reconciles an optimistic board from a consumer replacement', async () => {
    const fixture = setup();
    await fixture.whenStable();
    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'todo' },
        container: { id: 'todo' },
        previousIndex: 0,
        currentIndex: 1,
      } as any,
      'todo',
    );
    const replacement = [{ id: 'todo', title: 'Server board', cards: [] }];
    fixture.componentRef.setInput('columns', replacement);
    fixture.detectChanges();
    expect(fixture.componentInstance['_columns']()).toEqual(replacement);
    expect(fixture.componentInstance['_columns']()).not.toBe(replacement);
  });

  it('onCardDrop should transfer cards across columns and emit the drop event', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const events: Array<{ fromColumnId: string; toColumnId: string; cardId: string }> = [];
    fixture.componentInstance.cardDrop.subscribe((event) =>
      events.push({
        fromColumnId: event.fromColumnId,
        toColumnId: event.toColumnId,
        cardId: event.card.id,
      }),
    );

    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'todo' },
        container: { id: 'doing' },
        previousIndex: 0,
        currentIndex: 1,
      } as any,
      'doing',
    );

    expect(fixture.componentInstance['_columns']()[0].cards).toHaveLength(1);
    expect(fixture.componentInstance['_columns']()[1].cards[1].id).toBe('card-a');
    expect(events).toEqual([{ fromColumnId: 'todo', toColumnId: 'doing', cardId: 'card-a' }]);
  });

  it('moves within a column through keyboard pick-up, navigation, and confirmation', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const columnsChanges: NeuKanbanColumn[][] = [];
    const drops: string[] = [];
    fixture.componentInstance.columnsChange.subscribe((columns) => columnsChanges.push(columns));
    fixture.componentInstance.cardDrop.subscribe((event) => drops.push(event.card.id));
    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;

    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(card.getAttribute('aria-pressed')).toBe('true');
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    card.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance['_columns']()[0].cards.map((item) => item.id)).toEqual([
      'card-b',
      'card-a',
    ]);
    expect(columnsChanges).toHaveLength(1);
    expect(drops).toEqual(['card-a']);
  });

  it('moves across columns through keyboard and keeps pointer/keyboard payload semantics equal', async () => {
    const pointer = setup();
    const keyboard = setup();
    await Promise.all([pointer.whenStable(), keyboard.whenStable()]);
    const pointerDrops: unknown[] = [];
    const keyboardDrops: unknown[] = [];
    pointer.componentInstance.cardDrop.subscribe((event) => pointerDrops.push(event));
    keyboard.componentInstance.cardDrop.subscribe((event) => keyboardDrops.push(event));

    pointer.componentInstance.onCardDrop(
      { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
      'doing',
    );
    const card = keyboard.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;
    for (const key of [' ', 'ArrowRight', 'End', 'Enter']) {
      card.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }

    expect(keyboardDrops).toEqual(pointerDrops);
  });

  it('cancels keyboard movement without emitting or changing the board', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const columnsChanges = vi.fn();
    const drops = vi.fn();
    fixture.componentInstance.columnsChange.subscribe(columnsChanges);
    fixture.componentInstance.cardDrop.subscribe(drops);
    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;

    for (const key of ['Enter', 'ArrowRight', 'Escape']) {
      card.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    fixture.detectChanges();

    expect(columnsChanges).not.toHaveBeenCalled();
    expect(drops).not.toHaveBeenCalled();
    expect(fixture.componentInstance['_columns']()[0].cards[0].id).toBe('card-a');
    expect(fixture.nativeElement.textContent).toContain('Move cancelled for Qualify inbound lead.');
  });

  it('provides a pointer click alternative to dragging', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const drops = vi.fn();
    fixture.componentInstance.cardDrop.subscribe(drops);
    const firstCardShell = fixture.nativeElement.querySelector(
      '.neu-kanban__card-shell:first-child',
    ) as HTMLElement;
    const trigger = firstCardShell.querySelector('.neu-kanban__move-trigger') as HTMLButtonElement;

    trigger.click();
    fixture.detectChanges();
    const firstCardActions = firstCardShell.querySelectorAll(
      '.neu-kanban__move-actions button',
    ) as NodeListOf<HTMLButtonElement>;

    firstCardActions[3].click();
    fixture.detectChanges();

    expect(drops).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['_columns']()[1].cards[0].id).toBe('card-a');
    expect(fixture.nativeElement.querySelector('.neu-kanban__move-actions')).toBeFalsy();
  });

  it.each([
    ['left', 0],
    ['up', 1],
    ['down', 2],
    ['right', 3],
  ] as const)(
    'executes the %s action through its real click control',
    async (direction, actionIndex) => {
      const fixture = setup([
        { id: 'left', title: 'Left', cards: [] },
        {
          id: 'middle',
          title: 'Middle',
          cards: [
            { id: 'before', title: 'Before' },
            { id: 'moving', title: 'Moving' },
            { id: 'after', title: 'After' },
          ],
        },
        { id: 'right', title: 'Right', cards: [] },
      ]);
      await fixture.whenStable();
      const movingCard = fixture.nativeElement.querySelector(
        '[data-neu-kanban-card-id="moving"]',
      ) as HTMLElement;
      const shell = movingCard.parentElement!;
      const trigger = shell.querySelector('.neu-kanban__move-trigger') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      const button = shell.querySelectorAll<HTMLButtonElement>('.neu-kanban__move-actions button')[
        actionIndex
      ];

      button.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const position = fixture.componentInstance['_columns']()
        .flatMap((column) => column.cards.map((card, index) => [column.id, card.id, index]))
        .find((entry) => entry[1] === 'moving');
      expect(position).toBeTruthy();
      expect(document.activeElement?.getAttribute('data-neu-kanban-card-id')).toBe('moving');
      expect(fixture.nativeElement.textContent).toContain('Moving moved to');
      expect(direction).toBeTruthy();
    },
  );

  it('handles keyboard boundaries, first/last, inactive cards, and irrelevant keys', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const [first, second] = Array.from(
      fixture.nativeElement.querySelectorAll('.neu-kanban__card') as NodeListOf<HTMLElement>,
    );
    const changes = vi.fn();
    fixture.componentInstance.columnsChange.subscribe(changes);

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    for (const key of ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'x']) {
      first.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(changes).not.toHaveBeenCalled();
    expect(fixture.componentInstance['keyboardMove']()).toBeNull();
  });

  it('covers leftward keyboard transfer and empty-column positioning', async () => {
    const fixture = setup([
      { id: 'empty', title: 'Empty', cards: [] },
      { id: 'source', title: 'Source', cards: [{ id: 'moving', title: 'Moving' }] },
    ]);
    await fixture.whenStable();
    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;

    for (const key of [' ', 'ArrowLeft', 'Home', 'Enter']) {
      card.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }

    expect(fixture.componentInstance['_columns']()[0].cards[0].id).toBe('moving');
  });

  it('rejects every invalid or non-moving proposal without outputs', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const changes = vi.fn();
    fixture.componentInstance.columnsChange.subscribe(changes);

    expect(fixture.componentInstance.canMove('missing', 'right')).toBe(false);
    fixture.componentInstance.moveByAction('missing', 'right');
    fixture.componentInstance.moveByAction('card-a', 'left');
    for (const [from, to, previousIndex, currentIndex] of [
      ['todo', 'todo', 0, 0],
      ['todo', 'todo', -1, 1],
      ['todo', 'todo', 2, 0],
      ['todo', 'doing', 0, -1],
      ['todo', 'doing', 0, 2],
    ] as const) {
      fixture.componentInstance.onCardDrop(
        { previousContainer: { id: from }, previousIndex, currentIndex } as any,
        to,
      );
    }

    expect(changes).not.toHaveBeenCalled();
    fixture.destroy();
    fixture.componentInstance.onCardDrop(
      { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 0 } as any,
      'doing',
    );
    expect(changes).not.toHaveBeenCalled();
  });

  it('fails safely when a keyboard destination disappears', async () => {
    const fixture = setup();
    await fixture.whenStable();
    fixture.componentInstance['keyboardMove'].set({
      cardId: 'card-a',
      cardTitle: 'Qualify inbound lead',
      fromColumnId: 'todo',
      previousIndex: 0,
      toColumnId: 'removed',
      currentIndex: 0,
    });
    const card = fixture.nativeElement.querySelector('.neu-kanban__card') as HTMLElement;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.componentInstance['announceKeyboardTarget'](
      fixture.componentInstance['keyboardMove']()!,
    );

    expect(fixture.componentInstance['keyboardMove']()?.toColumnId).toBe('removed');
  });

  it('keeps controlled state authoritative for rejection and accepts an explicit consumer echo', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('stateMode', 'controlled');
    fixture.detectChanges();
    await fixture.whenStable();
    let proposal: NeuKanbanColumn[] | undefined;
    fixture.componentInstance.columnsChange.subscribe((columns) => (proposal = columns));

    fixture.componentInstance.onCardDrop(
      { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
      'doing',
    );

    expect(fixture.componentInstance['_columns']()[0].cards).toHaveLength(2);
    expect(fixture.componentInstance['_columns']()[1].cards).toHaveLength(1);
    expect(proposal?.[0].cards).toHaveLength(1);
    expect(proposal?.[1].cards).toHaveLength(2);

    fixture.componentRef.setInput('columns', proposal!);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance['_columns']()[0].cards).toHaveLength(1);
    expect(fixture.componentInstance['_columns']()[1].cards).toHaveLength(2);
  });

  it('supports a synchronous controlled echo without amplifying events', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('stateMode', 'controlled');
    fixture.detectChanges();
    await fixture.whenStable();
    const drops = vi.fn();
    const changes = vi.fn((columns: NeuKanbanColumn[]) =>
      fixture.componentRef.setInput('columns', columns),
    );
    fixture.componentInstance.columnsChange.subscribe(changes);
    fixture.componentInstance.cardDrop.subscribe(drops);

    fixture.componentInstance.onCardDrop(
      { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
      'doing',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(changes).toHaveBeenCalledTimes(1);
    expect(drops).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance['_columns']()[1].cards).toHaveLength(2);
  });

  it('blocks reentrant movement and survives consumer destruction during an output', async () => {
    const reentrant = setup();
    await reentrant.whenStable();
    const drops = vi.fn();
    const changes = vi.fn(() =>
      reentrant.componentInstance.onCardDrop(
        { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
        'doing',
      ),
    );
    reentrant.componentInstance.columnsChange.subscribe(changes);
    reentrant.componentInstance.cardDrop.subscribe(drops);
    reentrant.componentInstance.onCardDrop(
      { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
      'doing',
    );
    expect(changes).toHaveBeenCalledTimes(1);
    expect(drops).toHaveBeenCalledTimes(1);

    const destroyed = setup();
    await destroyed.whenStable();
    const destroyedDrops = vi.fn();
    destroyed.componentInstance.columnsChange.subscribe(() => destroyed.destroy());
    destroyed.componentInstance.cardDrop.subscribe(destroyedDrops);
    expect(() =>
      destroyed.componentInstance.onCardDrop(
        { previousContainer: { id: 'todo' }, previousIndex: 0, currentIndex: 1 } as any,
        'doing',
      ),
    ).not.toThrow();
    expect(destroyedDrops).not.toHaveBeenCalled();
  });

  it('keeps WIP limits informational for all movement paths', async () => {
    const fixture = setup([
      { id: 'todo', title: 'To do', cards: [{ id: 'a', title: 'A' }] },
      { id: 'doing', title: 'Doing', wipLimit: 1, cards: [{ id: 'b', title: 'B' }] },
    ]);
    await fixture.whenStable();
    fixture.componentInstance.moveByAction('a', 'right');
    fixture.detectChanges();

    expect(fixture.componentInstance['_columns']()[1].cards).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.neu-kanban__wip--alert')).toBeTruthy();
  });

  it('should wire cdkDropListDropped from the DOM container', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const dropSpy = vi.spyOn(fixture.componentInstance, 'onCardDrop');
    const list = fixture.debugElement.query(By.css('.neu-kanban__list'));
    list.triggerEventHandler('cdkDropListDropped', {
      previousContainer: { id: 'todo' },
      container: { id: 'todo' },
      previousIndex: 0,
      currentIndex: 1,
    });
    fixture.detectChanges();

    expect(dropSpy).toHaveBeenCalled();
  });

  it('should ignore drops when source or target columns are unknown', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const snapshot = fixture.componentInstance['_columns']();
    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'missing' },
        container: { id: 'doing' },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'doing',
    );

    expect(fixture.componentInstance['_columns']()).toEqual(snapshot);

    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'todo' },
        container: { id: 'missing' },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'missing',
    );

    expect(fixture.componentInstance['_columns']()).toEqual(snapshot);
  });

  it('does not emit a card drop event when no moved card is resolved', async () => {
    const fixture = setup([{ id: 'todo', title: 'To do', cards: [] }]);
    await fixture.whenStable();
    const drops: unknown[] = [];
    fixture.componentInstance.cardDrop.subscribe((event) => drops.push(event));

    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'todo' },
        container: { id: 'todo' },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'todo',
    );

    expect(drops).toEqual([]);
  });

  it('should keep connected drop lists in sync with column ids', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.connectedDropLists()).toEqual(['todo', 'doing']);
  });
});
