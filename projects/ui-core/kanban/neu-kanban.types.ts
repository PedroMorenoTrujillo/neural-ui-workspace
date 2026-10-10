/** Presentation metadata for an assignee; it is never owned or mutated by Kanban. */
export interface NeuKanbanAssignee {
  readonly name: string;
  readonly avatar?: string;
  readonly initials?: string;
}

/** A consumer-owned card. Its ID is unique across one board instance. */
export interface NeuKanbanCard {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly assignee?: NeuKanbanAssignee;
  readonly dueDate?: string;
  readonly meta?: string;
  readonly priority?: 'low' | 'medium' | 'high' | 'urgent';
  /** Disables movement only; the card remains readable and in its applied position. */
  readonly disabled?: boolean;
}

/** An ordered, consumer-owned column. Its ID is unique within one board instance. */
export interface NeuKanbanColumn {
  readonly id: string;
  readonly title: string;
  readonly cards: readonly NeuKanbanCard[];
  readonly color?: string;
  /** Informational only; it never blocks movement. */
  readonly wipLimit?: number;
}

/** Move within the same applied column. `toIndex` is the final post-move index. */
export interface NeuKanbanCardReorder {
  readonly kind: 'reorder';
  readonly cardId: string;
  readonly columnId: string;
  readonly fromIndex: number;
  readonly toIndex: number;
}

/** Move to another applied column. `toIndex` is the final destination index. */
export interface NeuKanbanCardTransfer {
  readonly kind: 'transfer';
  readonly cardId: string;
  readonly fromColumnId: string;
  readonly toColumnId: string;
  readonly fromIndex: number;
  readonly toIndex: number;
}

export type NeuKanbanCardMove = NeuKanbanCardReorder | NeuKanbanCardTransfer;
