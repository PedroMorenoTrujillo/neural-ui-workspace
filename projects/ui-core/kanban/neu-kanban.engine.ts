import type {
  NeuKanbanCardMove,
  NeuKanbanColumn,
} from './neu-kanban.types';

export interface NeuKanbanBoardDiagnostic {
  readonly code: 'duplicate-column-id' | 'duplicate-card-id';
  readonly id: string;
}

/** First invalid identity in applied traversal order; no object-reference identity. */
export function diagnoseKanbanBoard(
  columns: readonly NeuKanbanColumn[],
): NeuKanbanBoardDiagnostic | null {
  const columnIds = new Set<string>();
  const cardIds = new Set<string>();
  for (const column of columns) {
    if (columnIds.has(column.id)) return { code: 'duplicate-column-id', id: column.id };
    columnIds.add(column.id);
    for (const card of column.cards) {
      if (cardIds.has(card.id)) return { code: 'duplicate-card-id', id: card.id };
      cardIds.add(card.id);
    }
  }
  return null;
}

export interface NeuKanbanCardPosition {
  readonly column: NeuKanbanColumn;
  readonly columnIndex: number;
  readonly cardIndex: number;
}

export function findKanbanCard(
  columns: readonly NeuKanbanColumn[],
  cardId: string,
): NeuKanbanCardPosition | null {
  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    const column = columns[columnIndex];
    const cardIndex = column.cards.findIndex((card) => card.id === cardId);
    if (cardIndex >= 0) return { column, columnIndex, cardIndex };
  }
  return null;
}

/** All pointer, keyboard and button gestures use this single immutable proposal rule. */
export function proposeKanbanCardMove(
  columns: readonly NeuKanbanColumn[],
  cardId: string,
  fromColumnId: string,
  toColumnId: string,
  toIndex: number,
): NeuKanbanCardMove | null {
  if (diagnoseKanbanBoard(columns)) return null;
  const source = findKanbanCard(columns, cardId);
  if (!source || source.column.id !== fromColumnId) return null;
  const card = source.column.cards[source.cardIndex];
  if (card.disabled) return null;
  const target = columns.find((column) => column.id === toColumnId);
  if (!target || !Number.isInteger(toIndex)) return null;
  const sameColumn = fromColumnId === toColumnId;
  const maxIndex = sameColumn ? target.cards.length - 1 : target.cards.length;
  if (toIndex < 0 || toIndex > maxIndex) return null;
  if (sameColumn) {
    if (source.cardIndex === toIndex) return null;
    return {
      kind: 'reorder',
      cardId,
      columnId: fromColumnId,
      fromIndex: source.cardIndex,
      toIndex,
    };
  }
  return {
    kind: 'transfer',
    cardId,
    fromColumnId,
    toColumnId,
    fromIndex: source.cardIndex,
    toIndex,
  };
}
