import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
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
import { DOCUMENT } from '@angular/common';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import {
  diagnoseKanbanBoard,
  findKanbanCard,
  proposeKanbanCardMove,
} from './neu-kanban.engine';
import type {
  NeuKanbanAssignee,
  NeuKanbanCard,
  NeuKanbanCardMove,
  NeuKanbanColumn,
} from './neu-kanban.types';

type NeuKanbanMoveDirection = 'up' | 'down' | 'left' | 'right';

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
  imports: [NeuButtonComponent, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragHandle],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[style.--neu-kanban-column-width]': 'columnWidth()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    @if (boardDiagnostic(); as issue) {
      <p class="neu-kanban__diagnostic" role="alert">
        Invalid Kanban board: {{ issue.code }} ({{ issue.id }})
      </p>
    } @else {
    <div class="neu-kanban" cdkDropListGroup [attr.aria-describedby]="instructionsId">
      <p class="neu-kanban__sr-only" [id]="instructionsId">
        {{ labels().instructions }}
      </p>
      <p class="neu-kanban__sr-only" aria-live="polite" aria-atomic="true">
        {{ liveMessage() }}
      </p>
      @for (column of columns(); track column.id) {
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
              <p class="neu-kanban__empty">{{ labels().empty }}</p>
            }

            @for (card of column.cards; track card.id; let cardIndex = $index) {
              <div class="neu-kanban__card-shell" cdkDrag [cdkDragData]="card"
                   [cdkDragDisabled]="card.disabled === true">
                <article
                  class="neu-kanban__card"
                  cdkDragHandle
                  role="button"
                  tabindex="0"
                   [attr.aria-label]="cardAriaLabel(card, column, cardIndex)"
                   [attr.aria-disabled]="card.disabled ? 'true' : null"
                  [attr.aria-describedby]="instructionsId"
                  [attr.aria-pressed]="isKeyboardMoving(card.id) ? 'true' : 'false'"
                  [attr.aria-expanded]="isMoveMenuOpen(card.id)"
                  [attr.aria-controls]="moveActionsId(card.id)"
                  aria-keyshortcuts="Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Home End Escape"
                  [attr.data-neu-kanban-card-id]="card.id"
                  (click)="openMoveMenu(card.id)"
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
                  class="neu-kanban__move-controls"
                  [attr.data-neu-kanban-move-card-id]="card.id"
                  (keydown)="onMoveMenuKeydown(card.id, $event)"
                >
                  <button
                    neu-button variant="ghost" tone="neutral" size="sm"
                    type="button"
                    class="neu-kanban__move-trigger"
                    [disabled]="card.disabled === true"
                    [attr.aria-expanded]="isMoveMenuOpen(card.id)"
                    [attr.aria-controls]="moveActionsId(card.id)"
                    [ariaLabel]="resolvedMoveButtonLabel() + ': ' + card.title"
                    [attr.data-neu-kanban-move-trigger-card-id]="card.id"
                    (click)="toggleMoveMenu(card.id, $event)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4-4 4 4 4M4 8h12m0 4 4 4-4 4M20 16H8" /></svg>
                    <span>{{ resolvedMoveButtonLabel() }}</span>
                  </button>
                  @if (isMoveMenuOpen(card.id)) {
                    <div
                      class="neu-kanban__move-actions"
                      role="group"
                      [id]="moveActionsId(card.id)"
                      [attr.aria-label]="moveGroupLabel(card.title)"
                    >
                      <button
                        neu-button variant="ghost" tone="neutral" size="sm"
                        type="button"
                        [disabled]="!canMove(card.id, 'left')"
                        [ariaLabel]="moveDirectionLabel(card.title, 'left')"
                        (click)="moveByAction(card.id, 'left')"
                      >
                        ←
                      </button>
                      <button
                        neu-button variant="ghost" tone="neutral" size="sm"
                        type="button"
                        [disabled]="!canMove(card.id, 'up')"
                        [ariaLabel]="moveDirectionLabel(card.title, 'up')"
                        (click)="moveByAction(card.id, 'up')"
                      >
                        ↑
                      </button>
                      <button
                        neu-button variant="ghost" tone="neutral" size="sm"
                        type="button"
                        [disabled]="!canMove(card.id, 'down')"
                        [ariaLabel]="moveDirectionLabel(card.title, 'down')"
                        (click)="moveByAction(card.id, 'down')"
                      >
                        ↓
                      </button>
                      <button
                        neu-button variant="ghost" tone="neutral" size="sm"
                        type="button"
                        [disabled]="!canMove(card.id, 'right')"
                        [ariaLabel]="moveDirectionLabel(card.title, 'right')"
                        (click)="moveByAction(card.id, 'right')"
                      >
                        →
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }
    </div>
    }
  `,
  styleUrl: './neu-kanban.component.scss',
})
export class NeuKanbanComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly defaultLocale = inject(NEURAL_LOCALE);
  readonly columns = input<readonly NeuKanbanColumn[]>([]);
  readonly columnWidth = input<string>('320px');
  readonly showCounts = input<boolean>(true);
  readonly showWipLimit = input<boolean>(true);
  /** Visible label for the per-card movement actions trigger. */
  readonly moveButtonLabel = input<string>('Move');
  readonly cardMove = output<NeuKanbanCardMove>();

  protected readonly boardDiagnostic = computed(() => diagnoseKanbanBoard(this.columns()));
  protected readonly keyboardMove = signal<NeuKanbanKeyboardMove | null>(null);
  protected readonly activeMoveCardId = signal<string | null>(null);
  protected readonly liveMessage = signal('');
  protected readonly connectedDropLists = computed(() => this.columns().map((column) => column.id));
  private readonly activeLocale = signal(resolveDocumentLocale(this.doc, this.defaultLocale));
  protected readonly labels = computed(() => kanbanLabels(this.activeLocale()));
  protected readonly resolvedMoveButtonLabel = computed(() => {
    const configured = this.moveButtonLabel().trim();
    return configured && configured !== 'Move' ? configured : this.labels().move;
  });

  protected readonly instructionsId = inject(NeuIdGenerator).getId('neu-kanban-instructions-');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly pendingFocusCardId = signal<string | null>(null);
  private emittingMove = false;
  private destroyed = false;

  constructor() {
    afterRenderEffect(() => {
      const cardId = this.pendingFocusCardId();
      if (!cardId) return;
      this.pendingFocusCardId.set(null);
      this.focusCard(cardId);
    });
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.keyboardMove.set(null);
      this.activeMoveCardId.set(null);
      this.pendingFocusCardId.set(null);
    });

    const win = this.doc.defaultView;
    if (win?.MutationObserver) {
      const observer = new win.MutationObserver(() => {
        this.activeLocale.set(resolveDocumentLocale(this.doc, this.defaultLocale));
      });
      observer.observe(this.doc.documentElement, {
        attributes: true,
        attributeFilter: ['lang'],
      });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }
  }

  protected assigneeInitials(assignee: NeuKanbanAssignee): string {
    if (assignee.initials) return assignee.initials;
    return assignee.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected onCardDrop(drop: unknown, targetColumnId: string): void {
    const event = drop as CdkDragDrop<readonly NeuKanbanCard[]>;
    const card = event.item.data as NeuKanbanCard | undefined;
    if (!card) return;
    this.proposeMove(card.id, event.previousContainer.id, targetColumnId, event.currentIndex);
  }

  protected cardAriaLabel(card: NeuKanbanCard, column: NeuKanbanColumn, index: number): string {
    return this.labels().cardPosition(card.title, column.title, index + 1, column.cards.length);
  }

  protected moveGroupLabel(cardTitle: string): string {
    return this.labels().moveGroup(cardTitle);
  }

  protected moveDirectionLabel(cardTitle: string, direction: NeuKanbanMoveDirection): string {
    return this.labels().moveDirection(cardTitle, direction);
  }

  protected isKeyboardMoving(cardId: string): boolean {
    return this.keyboardMove()?.cardId === cardId;
  }

  protected isMoveMenuOpen(cardId: string): boolean {
    return this.activeMoveCardId() === cardId;
  }

  protected moveActionsId(cardId: string): string {
    return `${this.instructionsId}-actions-${encodeURIComponent(cardId)}`;
  }

  protected openMoveMenu(cardId: string): void {
    if (this.boardDiagnostic() || this.isCardDisabled(cardId)) return;
    this.activeMoveCardId.set(cardId);
  }

  protected toggleMoveMenu(cardId: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.boardDiagnostic() || this.isCardDisabled(cardId)) return;
    this.activeMoveCardId.update((activeCardId) => (activeCardId === cardId ? null : cardId));
  }

  protected onMoveMenuKeydown(cardId: string, event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.isMoveMenuOpen(cardId)) return;
    event.preventDefault();
    event.stopPropagation();
    this.activeMoveCardId.set(null);
    queueMicrotask(() => this.focusMoveTrigger(cardId));
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const activeCardId = this.activeMoveCardId();
    if (!activeCardId || !(event.target instanceof Element)) return;
    const controls = event.target.closest<HTMLElement>('.neu-kanban__move-controls');
    if (controls?.dataset['neuKanbanMoveCardId'] === activeCardId) return;
    this.activeMoveCardId.set(null);
  }

  protected canMove(cardId: string, direction: NeuKanbanMoveDirection): boolean {
    if (this.boardDiagnostic()) return false;
    const position = findKanbanCard(this.columns(), cardId);
    if (!position || position.column.cards[position.cardIndex].disabled) return false;
    if (direction === 'up') return position.cardIndex > 0;
    if (direction === 'down') return position.cardIndex < position.column.cards.length - 1;
    const adjacent = position.columnIndex + this.visualColumnDelta(direction);
    return adjacent >= 0 && adjacent < this.columns().length;
  }

  protected moveByAction(cardId: string, direction: NeuKanbanMoveDirection): void {
    this.activeMoveCardId.set(null);
    const move = this.directionalMove(cardId, direction);
    if (!move) return;
    this.proposeMove(cardId, move.fromColumnId, move.toColumnId, move.currentIndex);
  }

  protected onCardKeydown(
    card: NeuKanbanCard,
    columnId: string,
    cardIndex: number,
    event: KeyboardEvent,
  ): void {
    if (this.boardDiagnostic() || card.disabled) return;
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
      this.liveMessage.set(this.labels().moveCancelled(active.cardTitle));
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.keyboardMove.set(null);
      this.proposeMove(active.cardId, active.fromColumnId, active.toColumnId, active.currentIndex);
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
    const columns = this.columns();
    let columnIndex = columns.findIndex((column) => column.id === move.toColumnId);
    if (columnIndex < 0) return null;
    let currentIndex = move.currentIndex;
    if (key === 'ArrowLeft' || key === 'ArrowRight')
      columnIndex = Math.max(0, Math.min(columns.length - 1,
        columnIndex + this.visualColumnDelta(key === 'ArrowLeft' ? 'left' : 'right')));
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
    const position = findKanbanCard(this.columns(), cardId);
    if (!position || !this.canMove(cardId, direction)) return null;
    if (direction === 'up' || direction === 'down') {
      return {
        fromColumnId: position.column.id,
        previousIndex: position.cardIndex,
        toColumnId: position.column.id,
        currentIndex: position.cardIndex + (direction === 'up' ? -1 : 1),
      };
    }
    const targetColumn = this.columns()[position.columnIndex + this.visualColumnDelta(direction)];
    return {
      fromColumnId: position.column.id,
      previousIndex: position.cardIndex,
      toColumnId: targetColumn.id,
      currentIndex: Math.min(position.cardIndex, targetColumn.cards.length),
    };
  }

  private proposeMove(
    cardId: string,
    fromColumnId: string,
    toColumnId: string,
    toIndex: number,
  ): void {
    if (this.destroyed || this.emittingMove || this.boardDiagnostic()) return;
    const applied = this.columns();
    const proposal = proposeKanbanCardMove(applied, cardId, fromColumnId, toColumnId, toIndex);
    if (!proposal) return;
    const movedCard = findKanbanCard(applied, cardId)?.column.cards[proposal.fromIndex];
    const targetColumn = applied.find((column) => column.id === toColumnId);
    if (!movedCard || !targetColumn) return;
    this.pendingFocusCardId.set(cardId);
    this.liveMessage.set(this.labels().moveRequested(movedCard.title, targetColumn.title, toIndex + 1));

    this.emittingMove = true;
    try {
      this.cardMove.emit(proposal);
    } finally {
      this.emittingMove = false;
    }
  }

  private announceKeyboardTarget(move: NeuKanbanKeyboardMove): void {
    const column = this.columns().find((candidate) => candidate.id === move.toColumnId);
    if (!column) return;
    this.liveMessage.set(
      this.labels().selected(move.cardTitle, column.title, move.currentIndex + 1),
    );
  }

  private focusCard(cardId: string): void {
    const card = Array.from(
      this.host.querySelectorAll<HTMLElement>('[data-neu-kanban-card-id]'),
    ).find((element) => element.dataset['neuKanbanCardId'] === cardId);
    card?.focus({ preventScroll: true });
  }

  private focusMoveTrigger(cardId: string): void {
    if (this.destroyed) return;
    const trigger = Array.from(
      this.host.querySelectorAll<HTMLElement>('[data-neu-kanban-move-trigger-card-id]'),
    ).find((element) => element.dataset['neuKanbanMoveTriggerCardId'] === cardId);
    trigger?.focus({ preventScroll: true });
  }

  private isCardDisabled(cardId: string): boolean {
    const position = findKanbanCard(this.columns(), cardId);
    return !position || position.column.cards[position.cardIndex].disabled === true;
  }

  private visualColumnDelta(direction: 'left' | 'right'): number {
    const rtl = this.doc.defaultView?.getComputedStyle(this.host).direction === 'rtl';
    return direction === 'left' ? (rtl ? 1 : -1) : (rtl ? -1 : 1);
  }
}

interface NeuKanbanLocaleLabels {
  readonly instructions: string;
  readonly empty: string;
  readonly move: string;
  readonly cardPosition: (card: string, column: string, position: number, total: number) => string;
  readonly moveGroup: (card: string) => string;
  readonly moveDirection: (card: string, direction: NeuKanbanMoveDirection) => string;
  readonly moveCancelled: (card: string) => string;
  readonly moveRequested: (card: string, column: string, position: number) => string;
  readonly selected: (card: string, column: string, position: number) => string;
}

function resolveDocumentLocale(doc: Document, fallback: string): string {
  return doc.documentElement.lang.trim() || fallback;
}

function kanbanLabels(locale: string): NeuKanbanLocaleLabels {
  if (locale.toLowerCase().startsWith('es')) {
    return {
      instructions:
        'Para mover una tarjeta con el teclado, enfócala y pulsa Espacio o Intro. Usa las teclas de flecha, Inicio o Fin para elegir un destino; pulsa Espacio o Intro para confirmar, o Escape para cancelar. Los botones Mover ofrecen una alternativa mediante clic al arrastre.',
      empty: 'Suelta tarjetas aquí',
      move: 'Mover',
      cardPosition: (card, column, position, total) =>
        `${card}, ${column}, posición ${position} de ${total}`,
      moveGroup: (card) => `Mover ${card}`,
      moveDirection: (card, direction) => {
        if (direction === 'left') return `Mover ${card} a la columna visualmente izquierda`;
        if (direction === 'right') return `Mover ${card} a la columna visualmente derecha`;
        if (direction === 'up') return `Mover ${card} hacia arriba`;
        return `Mover ${card} hacia abajo`;
      },
      moveCancelled: (card) => `Movimiento cancelado para ${card}.`,
      moveRequested: (card, column, position) =>
        `Movimiento solicitado para ${card} a ${column}, posición ${position}.`,
      selected: (card, column, position) =>
        `${card} seleccionada. Destino ${column}, posición ${position}.`,
    };
  }

  return {
    instructions:
      'To move a card with the keyboard, focus it and press Space or Enter. Use arrow keys, Home, or End to choose a destination; press Space or Enter to confirm, or Escape to cancel. Move buttons provide a click alternative to dragging.',
    empty: 'Drop cards here',
    move: 'Move',
    cardPosition: (card, column, position, total) =>
      `${card}, ${column}, position ${position} of ${total}`,
    moveGroup: (card) => `Move ${card}`,
    moveDirection: (card, direction) => {
      if (direction === 'left') return `Move ${card} to the visually left column`;
      if (direction === 'right') return `Move ${card} to the visually right column`;
      if (direction === 'up') return `Move ${card} up`;
      return `Move ${card} down`;
    },
    moveCancelled: (card) => `Move cancelled for ${card}.`,
    moveRequested: (card, column, position) =>
      `Move requested for ${card} to ${column}, position ${position}.`,
    selected: (card, column, position) =>
      `${card} selected. Destination ${column}, position ${position}.`,
  };
}
