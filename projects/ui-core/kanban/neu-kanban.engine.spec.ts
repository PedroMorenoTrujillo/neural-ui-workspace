import { describe, expect, it } from 'vitest';
import {
  diagnoseKanbanBoard,
  findKanbanCard,
  proposeKanbanCardMove,
} from './neu-kanban.engine';
import type { NeuKanbanCard, NeuKanbanColumn } from './neu-kanban.types';

const card = (id: string, disabled = false): NeuKanbanCard =>
  Object.freeze({ id, title: id, disabled });
const column = (id: string, cards: readonly NeuKanbanCard[]): NeuKanbanColumn =>
  Object.freeze({ id, title: id, cards: Object.freeze([...cards]) });
const board = (): readonly NeuKanbanColumn[] =>
  Object.freeze([
    column('todo', [card('a'), card('b'), card('c'), card('d')]),
    column('doing', [card('e'), card('f')]),
    column('done', []),
  ]);

describe('pure Kanban board identity and movement', () => {
  it('accepts empty and valid applied boards without mutation', () => {
    expect(diagnoseKanbanBoard([])).toBeNull();
    expect(diagnoseKanbanBoard(board())).toBeNull();
  });

  it('diagnoses duplicate column IDs deterministically', () => {
    const invalid = [column('same', []), column('same', [])];
    expect(diagnoseKanbanBoard(invalid)).toEqual({ code: 'duplicate-column-id', id: 'same' });
    expect(proposeKanbanCardMove(invalid, 'a', 'same', 'same', 0)).toBeNull();
  });

  it('diagnoses duplicate card IDs within and across columns', () => {
    expect(diagnoseKanbanBoard([column('a', [card('x'), card('x')])])).toEqual({
      code: 'duplicate-card-id', id: 'x',
    });
    expect(diagnoseKanbanBoard([column('a', [card('x')]), column('b', [card('x')])])).toEqual({
      code: 'duplicate-card-id', id: 'x',
    });
  });

  it('locates reconstructed semantic IDs rather than object references', () => {
    const first = board();
    const second = board();
    expect(first[0].cards[1]).not.toBe(second[0].cards[1]);
    expect(findKanbanCard(first, 'b')?.cardIndex).toBe(1);
    expect(findKanbanCard(second, 'b')?.cardIndex).toBe(1);
    expect(proposeKanbanCardMove(first, 'b', 'todo', 'doing', 1)).toEqual(
      proposeKanbanCardMove(second, 'b', 'todo', 'doing', 1),
    );
  });

  it.each([
    ['top', 'd', 0, 3],
    ['middle', 'a', 2, 0],
    ['end', 'b', 3, 1],
    ['adjacent', 'b', 2, 1],
  ])('uses final-after-removal index for same-column %s', (_, id, toIndex, fromIndex) => {
    expect(proposeKanbanCardMove(board(), String(id), 'todo', 'todo', Number(toIndex))).toEqual({
      kind: 'reorder', cardId: id, columnId: 'todo', fromIndex, toIndex,
    });
  });

  it('suppresses same-index and invalid reorders', () => {
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'todo', 1)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'todo', 4)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'todo', -1)).toBeNull();
  });

  it.each([
    ['top', 'doing', 0],
    ['middle', 'doing', 1],
    ['end', 'doing', 2],
    ['empty', 'done', 0],
  ])('transfers to %s destination position', (_, targetId, toIndex) => {
    expect(proposeKanbanCardMove(board(), 'b', 'todo', String(targetId), Number(toIndex))).toEqual({
      kind: 'transfer', cardId: 'b', fromColumnId: 'todo', toColumnId: targetId,
      fromIndex: 1, toIndex,
    });
  });

  it('blocks disabled movement and missing or stale identities', () => {
    const applied = [column('todo', [card('blocked', true)]), column('done', [])];
    expect(proposeKanbanCardMove(applied, 'blocked', 'todo', 'done', 0)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'doing', 'done', 0)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'missing', 'todo', 'done', 0)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'missing', 0)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'doing', 3)).toBeNull();
    expect(proposeKanbanCardMove(board(), 'b', 'todo', 'doing', 0.5)).toBeNull();
  });

  it('keeps WIP informational and leaves deeply frozen inputs unchanged', () => {
    const applied = Object.freeze([
      Object.freeze({ ...column('todo', [card('a')]), wipLimit: 0 }),
      Object.freeze({ ...column('done', []), wipLimit: 0 }),
    ]);
    const before = JSON.stringify(applied);
    expect(proposeKanbanCardMove(applied, 'a', 'todo', 'done', 0)?.kind).toBe('transfer');
    expect(JSON.stringify(applied)).toBe(before);
  });
});
