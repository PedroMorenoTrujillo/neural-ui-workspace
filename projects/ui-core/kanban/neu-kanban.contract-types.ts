import type { NeuKanbanComponent } from './neu-kanban.component';
import type {
  NeuKanbanCard,
  NeuKanbanCardMove,
  NeuKanbanCardReorder,
  NeuKanbanCardTransfer,
  NeuKanbanColumn,
} from './neu-kanban.types';

const card: NeuKanbanCard = { id: 'a', title: 'Alpha', disabled: true };
const columns: readonly NeuKanbanColumn[] = [
  { id: 'todo', title: 'To do', cards: [card] },
];
const component = null as unknown as NeuKanbanComponent;
const applied: readonly NeuKanbanColumn[] = component.columns();
component.cardMove.subscribe((proposal: NeuKanbanCardMove) => {
  if (proposal.kind === 'reorder') {
    const reorder: NeuKanbanCardReorder = proposal;
    void reorder.columnId;
    // @ts-expect-error Reorder has no transfer destination.
    void reorder.toColumnId;
  } else {
    const transfer: NeuKanbanCardTransfer = proposal;
    void transfer.toColumnId;
    // @ts-expect-error Transfer has no single-column field.
    void transfer.columnId;
  }
});
void [columns, applied];

// @ts-expect-error Applied cards are readonly.
card.title = 'Mutated';
// @ts-expect-error Applied columns are readonly.
columns[0].cards.push(card);
// @ts-expect-error Legacy optimistic output was removed.
component.columnsChange;
// @ts-expect-error Legacy drop output was removed.
component.cardDrop;
// @ts-expect-error No state mode or optimistic owner.
component.stateMode;
// @ts-expect-error CDK handler is not a public consumer method.
component.onCardDrop;
const invalid: NeuKanbanCardMove = { kind: 'reorder', cardId: 'a', columnId: 'todo',
  fromIndex: 0, toIndex: 1,
  // @ts-expect-error No full board snapshot in proposals.
  columns };
void invalid;
