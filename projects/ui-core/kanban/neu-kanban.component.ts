import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  type CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

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

@Component({
  selector: 'neu-kanban',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--neu-kanban-column-width]': 'columnWidth()',
  },
  template: `
    <div class="neu-kanban" cdkDropListGroup>
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

            @for (card of column.cards; track card.id) {
              <article class="neu-kanban__card" cdkDrag [cdkDragData]="card">
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

  readonly columnsChange = output<NeuKanbanColumn[]>();
  readonly cardDrop = output<NeuKanbanCardDropEvent>();

  readonly _columns = signal<NeuKanbanColumn[]>([]);
  readonly connectedDropLists = computed(() => this._columns().map((column) => column.id));

  constructor() {
    effect(() => {
      this._columns.set(this._cloneColumns(this.columns()));
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
    const nextColumns = this._cloneColumns(this._columns());
    const sourceColumn = nextColumns.find((column) => column.id === event.previousContainer.id);
    const targetColumn = nextColumns.find((column) => column.id === targetColumnId);
    if (!sourceColumn || !targetColumn) return;

    if (event.previousContainer.id === targetColumnId) {
      moveItemInArray(targetColumn.cards, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        sourceColumn.cards,
        targetColumn.cards,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this._columns.set(nextColumns);
    this.columnsChange.emit(nextColumns);

    const movedCard = targetColumn.cards[event.currentIndex];
    if (movedCard) {
      this.cardDrop.emit({
        card: movedCard,
        fromColumnId: event.previousContainer.id,
        toColumnId: targetColumnId,
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
        columns: nextColumns,
      });
    }
  }

  private _cloneColumns(columns: NeuKanbanColumn[]): NeuKanbanColumn[] {
    return columns.map((column) => ({
      ...column,
      cards: column.cards.map((card) => ({
        ...card,
        tags: card.tags ? [...card.tags] : undefined,
        assignee: card.assignee ? { ...card.assignee } : undefined,
      })),
    }));
  }
}
