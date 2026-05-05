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

  it('should show counts and wip limit by default', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2/2');
    expect(fixture.nativeElement.querySelector('.neu-kanban__count')?.textContent).toContain('2');
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

    expect(fixture.componentInstance._columns()[0].cards[1].id).toBe('card-a');
    expect(changes).toHaveLength(1);
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

    expect(fixture.componentInstance._columns()[0].cards).toHaveLength(1);
    expect(fixture.componentInstance._columns()[1].cards[1].id).toBe('card-a');
    expect(events).toEqual([{ fromColumnId: 'todo', toColumnId: 'doing', cardId: 'card-a' }]);
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

    const snapshot = fixture.componentInstance._columns();
    fixture.componentInstance.onCardDrop(
      {
        previousContainer: { id: 'missing' },
        container: { id: 'doing' },
        previousIndex: 0,
        currentIndex: 0,
      } as any,
      'doing',
    );

    expect(fixture.componentInstance._columns()).toEqual(snapshot);
  });

  it('should keep connected drop lists in sync with column ids', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.connectedDropLists()).toEqual(['todo', 'doing']);
  });
});
