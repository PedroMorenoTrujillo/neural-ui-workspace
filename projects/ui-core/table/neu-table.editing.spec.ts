import {
  buildNeuTableEditCommit,
  createNeuTableEditSession,
  reconcileNeuTableEditSource,
  setNeuTableEditDraftValue,
} from './internal/editing/neu-table-editing';
import type { NeuTableColumn } from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly team: string;
}

type Field = 'name' | 'team';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'name', header: 'Name', field: 'name', edit: { field: 'name' } },
  { id: 'team', header: 'Team', field: 'team', edit: { field: 'team' } },
];

describe('NeuTable editing session engine', () => {
  it('owns one immutable cell draft and emits only semantic changes', () => {
    const row: Row = { id: 1, name: 'Ada', team: 'Compiler' };
    const session = createNeuTableEditSession({
      generation: 1,
      state: { kind: 'cell', key: 1, columnId: 'name' },
      row,
      columns,
    })!;

    expect(buildNeuTableEditCommit(session).changes).toEqual([]);
    expect(setNeuTableEditDraftValue(session, 'name', 'Augusta')).toBe(true);
    expect(row.name).toBe('Ada');
    expect(buildNeuTableEditCommit(session)).toEqual({
      key: 1,
      row,
      changes: [
        { columnId: 'name', field: 'name', previous: 'Ada', value: 'Augusta' },
      ],
    });
  });

  it('preserves same-K reconstruction and detects changed relevant source values', () => {
    const session = createNeuTableEditSession({
      generation: 2,
      state: { kind: 'row', key: 1 },
      row: { id: 1, name: 'Ada', team: 'Compiler' },
      columns,
    })!;
    setNeuTableEditDraftValue(session, 'name', 'Augusta');

    const reconstructed: Row = { id: 1, name: 'Ada', team: 'Compiler' };
    expect(reconcileNeuTableEditSource(session, reconstructed, columns)).toBe('equal');
    expect(session.row).toBe(reconstructed);
    expect(session.draft().get('name')?.value).toBe('Augusta');
    expect(
      reconcileNeuTableEditSource(
        session,
        { id: 1, name: 'External', team: 'Compiler' },
        columns,
      ),
    ).toBe('changed');
  });
});
