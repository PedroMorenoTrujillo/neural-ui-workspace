import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export type NeuKanbanStateMode = 'optimistic' | 'controlled';
type NeuKanbanMoveDirection = 'up' | 'down' | 'left' | 'right';

export interface NeuKanbanAssignee {
  name: string;
  avatar?: string;
  initials?: string;
}

export interface NeuKanbanCard {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  assignee?: NeuKanbanAssignee;
  dueDate?: string;
  meta?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NeuKanbanColumn {
  id: string;
  title: string;
  cards: NeuKanbanCard[];
  color?: string;
  wipLimit?: number;
}

export interface NeuKanbanCardDropEvent {
  card: NeuKanbanCard;
  fromColumnId: string;
  toColumnId: string;
  previousIndex: number;
  currentIndex: number;
  columns: NeuKanbanColumn[];
}

interface NeuKanbanKeyboardMove {
  readonly cardId: string;
  readonly cardTitle: string;
  readonly fromColumnId: string;
  readonly previousIndex: number;
  readonly toColumnId: string;
  readonly currentIndex: number;
}

@Component({
  selector: 'neu-kanban',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--neu-kanban-column-width]': 'columnWidth()',
  },
  template: `
    <div class="neu-kanban" cdkDropListGroup [attr.aria-describedby]="instructionsId">
      <p class="neu-kanban__sr-only" [id]="instructionsId">
        To move a card with the keyboard, focus it and press Space or Enter. Use arrow keys, Home,
        or End to choose a destination; press Space or Enter to confirm, or Escape to cancel. Move
        buttons provide a click alternative to dragging.
      </p>
      <p class="neu-kanban__sr-only" aria-live="polite" aria-atomic="true">
        {{ liveMessage() }}
      </p>
      @for (column of _columns(); track column.id) {
        <section class="neu-kanban__column" [attr.aria-label]="column.title">
          <header class="neu-kanban__column-header">
            <div class="neu-kanban__column-title">
              <span
                class="neu-kanban__column-accent"
                [style.background]="column.color || 'var(--neu-primary)'"
                aria-hidden="true"
              ></span>
              <h3 class="neu-kanban__column-name">{{ column.title }}</h3>
            </div>

            <div class="neu-kanban__column-meta">
              @if (showCounts()) {
                <span class="neu-kanban__count">{{ column.cards.length }}</span>
              }
              @if (showWipLimit() && column.wipLimit) {
                <span
                  class="neu-kanban__wip"
                  [class.neu-kanban__wip--alert]="column.cards.length > column.wipLimit"
                >
                  {{ column.cards.length }}/{{ column.wipLimit }}
                </span>
              }
            </div>
          </header>

          <div
            class="neu-kanban__list"
            cdkDropList
            [id]="column.id"
            [cdkDropListData]="column.cards"
            [cdkDropListConnectedTo]="connectedDropLists()"
            (cdkDropListDropped)="onCardDrop($event, column.id)"
          >
            @if (column.cards.length === 0) {
              <p class="neu-kanban__empty">Drop cards here</p>
            }

            @for (card of column.cards; track card.id; let cardIndex = $index) {
              <div class="neu-kanban__card-shell" cdkDrag [cdkDragData]="card">
                <article
                  class="neu-kanban__card"
                  cdkDragHandle
                  role="button"
                  tabindex="0"
                  [attr.aria-label]="cardAriaLabel(card, column, cardIndex)"
                  [attr.aria-describedby]="instructionsId"
                  [attr.aria-pressed]="isKeyboardMoving(card.id) ? 'true' : 'false'"
                  aria-keyshortcuts="Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Home End Escape"
                  [attr.data-neu-kanban-card-id]="card.id"
                  (keydown)="onCardKeydown(card, column.id, cardIndex, $event)"
                >
                  <div class="neu-kanban__card-header">
                    <div>
                      <h4 class="neu-kanban__title">{{ card.title }}</h4>
                    </div>
                    @if (card.priority) {
                      <span
                        class="neu-kanban__priority"
                        [class]="'neu-kanban__priority neu-kanban__priority--' + card.priority"
                      >
                        {{ card.priority }}
                      </span>
                    }
                  </div>

                  @if (card.description) {
                    <p class="neu-kanban__description">{{ card.description }}</p>
                  }

                  @if (card.tags?.length) {
                    <div class="neu-kanban__tags">
                      @for (tag of card.tags; track tag) {
                        <span class="neu-kanban__tag">{{ tag }}</span>
                      }
                    </div>
                  }

                  @if (card.assignee || card.meta || card.dueDate) {
                    <div class="neu-kanban__footer">
                      <div class="neu-kanban__assignee">
                        @if (card.assignee) {
                          <span class="neu-kanban__avatar" [attr.aria-label]="card.assignee.name">
                            @if (card.assignee.avatar) {
                              <img [src]="card.assignee.avatar" [alt]="card.assignee.name" />
                            } @else {
                              {{ assigneeInitials(card.assignee) }}
                            }
                          </span>
                          <span class="neu-kanban__assignee-name">{{ card.assignee.name }}</span>
                        }
                      </div>

                      @if (card.meta || card.dueDate) {
                        <span class="neu-kanban__meta-value">{{ card.meta || card.dueDate }}</span>
                      }
                    </div>
                  }
                </article>
                <div
                  class="neu-kanban__move-actions"
                  role="group"
                  [attr.aria-label]="'Move ' + card.title"
                >
                  <button
                    type="button"
                    [disabled]="!canMove(card.id, 'left')"
                    [attr.aria-label]="'Move ' + card.title + ' to the previous column'"
                    (click)="moveByAction(card.id, 'left')"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    [disabled]="!canMove(card.id, 'up')"
                    [attr.aria-label]="'Move ' + card.title + ' up'"
                    (click)="moveByAction(card.id, 'up')"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    [disabled]="!canMove(card.id, 'down')"
                    [attr.aria-label]="'Move ' + card.title + ' down'"
                    (click)="moveByAction(card.id, 'down')"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    [disabled]="!canMove(card.id, 'right')"
                    [attr.aria-label]="'Move ' + card.title + ' to the next column'"
                    (click)="moveByAction(card.id, 'right')"
                  >
                    →
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
  styleUrl: './neu-kanban.component.scss',
})
export class NeuKanbanComponent {
  readonly columns = input<NeuKanbanColumn[]>([]);
  readonly columnWidth = input<string>('320px');
  readonly showCounts = input<boolean>(true);
  readonly showWipLimit = input<boolean>(true);
  /** `controlled` emits immutable proposals without accepting them locally. */
  readonly stateMode = input<NeuKanbanStateMode>('optimistic');

  readonly columnsChange = output<NeuKanbanColumn[]>();
  readonly cardDrop = output<NeuKanbanCardDropEvent>();

  protected readonly _columns = signal<NeuKanbanColumn[]>([]);
  protected readonly keyboardMove = signal<NeuKanbanKeyboardMove | null>(null);
  protected readonly liveMessage = signal('');
  readonly connectedDropLists = computed(() => this._columns().map((column) => column.id));

  protected readonly instructionsId = inject(NeuIdGenerator).getId('neu-kanban-instructions-');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingFocusCardId = signal<string | null>(null);
  private emittingMove = false;
  private destroyed = false;

  constructor() {
    effect(() => {
      this._columns.set(this._cloneColumns(this.columns()));
    });
    afterRenderEffect(() => {
      const cardId = this.pendingFocusCardId();
      if (!cardId) return;
      this.pendingFocusCardId.set(null);
      this.focusCard(cardId);
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.keyboardMove.set(null);
      this.pendingFocusCardId.set(null);
    });
  }

  assigneeInitials(assignee: NeuKanbanAssignee): string {
    if (assignee.initials) return assignee.initials;
    return assignee.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }

  onCardDrop(event: CdkDragDrop<NeuKanbanCard[]>, targetColumnId: string): void {
    this.proposeMove(
      event.previousContainer.id,
      targetColumnId,
      event.previousIndex,
      event.currentIndex,
    );
  }

  cardAriaLabel(card: NeuKanbanCard, column: NeuKanbanColumn, index: number): string {
    return `${card.title}, ${column.title}, position ${index + 1} of ${column.cards.length}`;
  }

  isKeyboardMoving(cardId: string): boolean {
    return this.keyboardMove()?.cardId === cardId;
  }

  canMove(cardId: string, direction: NeuKanbanMoveDirection): boolean {
    const position = this.cardPosition(cardId);
    if (!position) return false;
    if (direction === 'up') return position.cardIndex > 0;
    if (direction === 'down') return position.cardIndex < position.column.cards.length - 1;
    if (direction === 'left') return position.columnIndex > 0;
    return position.columnIndex < this._columns().length - 1;
  }

  moveByAction(cardId: string, direction: NeuKanbanMoveDirection): void {
    const move = this.directionalMove(cardId, direction);
    if (!move) return;
    this.proposeMove(move.fromColumnId, move.toColumnId, move.previousIndex, move.currentIndex);
  }

  onCardKeydown(
    card: NeuKanbanCard,
    columnId: string,
    cardIndex: number,
    event: KeyboardEvent,
  ): void {
    const active = this.keyboardMove();
    if (!active) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      this.keyboardMove.set({
        cardId: card.id,
        cardTitle: card.title,
        fromColumnId: columnId,
        previousIndex: cardIndex,
        toColumnId: columnId,
        currentIndex: cardIndex,
      });
      this.announceKeyboardTarget(this.keyboardMove()!);
      return;
    }
    if (active.cardId !== card.id) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardMove.set(null);
      this.liveMessage.set(`Move cancelled for ${active.cardTitle}.`);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardMove.set(null);
      this.proposeMove(
        active.fromColumnId,
        active.toColumnId,
        active.previousIndex,
        active.currentIndex,
      );
      return;
    }

    const next = this.keyboardDestination(active, event.key);
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    this.keyboardMove.set(next);
    this.announceKeyboardTarget(next);
  }

  private keyboardDestination(
    move: NeuKanbanKeyboardMove,
    key: string,
  ): NeuKanbanKeyboardMove | null {
    const columns = this._columns();
    let columnIndex = columns.findIndex((column) => column.id === move.toColumnId);
    if (columnIndex < 0) return null;
    let currentIndex = move.currentIndex;
    if (key === 'ArrowLeft') columnIndex = Math.max(0, columnIndex - 1);
    else if (key === 'ArrowRight') columnIndex = Math.min(columns.length - 1, columnIndex + 1);
    else if (key === 'ArrowUp') currentIndex -= 1;
    else if (key === 'ArrowDown') currentIndex += 1;
    else if (key !== 'Home' && key !== 'End') return null;

    const target = columns[columnIndex];
    const maxIndex =
      target.id === move.fromColumnId ? Math.max(0, target.cards.length - 1) : target.cards.length;
    if (key === 'Home') currentIndex = 0;
    else if (key === 'End') currentIndex = maxIndex;
    else currentIndex = Math.max(0, Math.min(currentIndex, maxIndex));
    return { ...move, toColumnId: target.id, currentIndex };
  }

  private directionalMove(
    cardId: string,
    direction: NeuKanbanMoveDirection,
  ): Omit<NeuKanbanKeyboardMove, 'cardId' | 'cardTitle'> | null {
    const position = this.cardPosition(cardId);
    if (!position || !this.canMove(cardId, direction)) return null;
    if (direction === 'up' || direction === 'down') {
      return {
        fromColumnId: position.column.id,
        previousIndex: position.cardIndex,
        toColumnId: position.column.id,
        currentIndex: position.cardIndex + (direction === 'up' ? -1 : 1),
      };
    }
    const targetColumn = this._columns()[position.columnIndex + (direction === 'left' ? -1 : 1)];
    return {
      fromColumnId: position.column.id,
      previousIndex: position.cardIndex,
      toColumnId: targetColumn.id,
      currentIndex: Math.min(position.cardIndex, targetColumn.cards.length),
    };
  }

  private proposeMove(
    fromColumnId: string,
    toColumnId: string,
    previousIndex: number,
    currentIndex: number,
  ): void {
    if (this.destroyed || this.emittingMove) return;
    const nextColumns = this._cloneColumns(this._columns());
    const sourceColumn = nextColumns.find((column) => column.id === fromColumnId);
    const targetColumn = nextColumns.find((column) => column.id === toColumnId);
    const sameColumn = fromColumnId === toColumnId;
    if (
      !sourceColumn ||
      !targetColumn ||
      previousIndex < 0 ||
      previousIndex >= sourceColumn.cards.length ||
      currentIndex < 0 ||
      currentIndex > targetColumn.cards.length ||
      (sameColumn && (currentIndex >= targetColumn.cards.length || previousIndex === currentIndex))
    )
      return;

    const [movedCard] = sourceColumn.cards.splice(previousIndex, 1);
    if (!movedCard) return;
    targetColumn.cards.splice(currentIndex, 0, movedCard);
    if (this.stateMode() === 'optimistic') this._columns.set(nextColumns);
    this.pendingFocusCardId.set(movedCard.id);
    this.liveMessage.set(
      `${movedCard.title} moved to ${targetColumn.title}, position ${currentIndex + 1}.`,
    );

    this.emittingMove = true;
    try {
      this.columnsChange.emit(nextColumns);
      if (this.destroyed) return;
      this.cardDrop.emit({
        card: movedCard,
        fromColumnId,
        toColumnId,
        previousIndex,
        currentIndex,
        columns: nextColumns,
      });
    } finally {
      this.emittingMove = false;
    }
  }

  private cardPosition(cardId: string): {
    readonly column: NeuKanbanColumn;
    readonly columnIndex: number;
    readonly cardIndex: number;
  } | null {
    const columns = this._columns();
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const cardIndex = columns[columnIndex].cards.findIndex((card) => card.id === cardId);
      if (cardIndex >= 0) return { column: columns[columnIndex], columnIndex, cardIndex };
    }
    return null;
  }

  private announceKeyboardTarget(move: NeuKanbanKeyboardMove): void {
    const column = this._columns().find((candidate) => candidate.id === move.toColumnId);
    if (!column) return;
    this.liveMessage.set(
      `${move.cardTitle} selected. Destination ${column.title}, position ${move.currentIndex + 1}.`,
    );
  }

  private focusCard(cardId: string): void {
    const card = Array.from(
      this.host.querySelectorAll<HTMLElement>('[data-neu-kanban-card-id]'),
    ).find((element) => element.dataset['neuKanbanCardId'] === cardId);
    card?.focus({ preventScroll: true });
  }

  private _cloneColumns(columns: NeuKanbanColumn[]): NeuKanbanColumn[] {
    return columns.map((column) => ({
      ...column,
      // The component reorders only the card containers. Preserve each domain
      // object exactly as supplied while keeping caller arrays immutable.
      cards: [...column.cards],
    }));
  }
}
