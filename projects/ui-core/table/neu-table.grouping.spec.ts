import {
  projectNeuTableGrouping,
  proposeNeuTableGroupToggle,
} from './internal/grouping/neu-table-grouping';
import type { NeuTableColumn } from './public/neu-table.types';

interface Row {
  readonly id: number;
  readonly team: string | null;
}

type Field = 'team';

const columns: readonly NeuTableColumn<Row, Field>[] = [
  { id: 'team', header: 'Team', field: 'team' },
];
const rows = [
  { row: { id: 1, team: 'x' }, track: '1' },
  { row: { id: 2, team: 'x' }, track: '2' },
  { row: { id: 3, team: 'y' }, track: '3' },
] as const;
const options = { mode: 'subheader' as const, scope: 'loaded' as const };

describe('NeuTable loaded-only grouping engine', () => {
  it('creates deterministic private groups and immutable controlled toggles', () => {
    const collapsed = projectNeuTableGrouping({
      rows,
      grouping: { by: ['team'], expandedGroupIds: [] },
      options,
      columns,
    });
    const headers = collapsed.flatMap((node) => (node.kind === 'group-header' ? [node] : []));
    expect(headers).toHaveLength(2);
    expect(headers.map((node) => node.context.rows.length)).toEqual([2, 1]);
    expect(collapsed.some((node) => node.kind === 'row')).toBe(false);

    const id = headers[0].id;
    const applied = { by: ['team'] as const, expandedGroupIds: [] as readonly string[] };
    const change = proposeNeuTableGroupToggle(applied, id)!;
    expect(change.next).not.toBe(applied);
    expect(change.next.expandedGroupIds).toEqual([id]);
    const expanded = projectNeuTableGrouping({
      rows,
      grouping: change.next,
      options,
      columns,
    });
    expect(expanded.filter((node) => node.kind === 'row')).toHaveLength(2);
    expect(expanded.filter((node) => node.kind === 'group-footer')).toHaveLength(1);
  });

  it('keeps stable group identity for reconstructed rows and null values', () => {
    const grouping = { by: ['team'] as const, expandedGroupIds: [] as readonly string[] };
    const first = projectNeuTableGrouping({ rows, grouping, options, columns });
    const reconstructed = projectNeuTableGrouping({
      rows: rows.map((entry) => ({ row: { ...entry.row }, track: entry.track })),
      grouping,
      options,
      columns,
    });
    expect(reconstructed.map((node) => node.track)).toEqual(first.map((node) => node.track));
    expect(
      projectNeuTableGrouping({
        rows: [{ row: { id: 4, team: null }, track: '4' }],
        grouping,
        options,
        columns,
      })[0],
    ).toMatchObject({ kind: 'group-header', context: { value: null } });
  });

  it('projects rowspan metadata and isolates aggregate failures', () => {
    const grouping = {
      by: ['team'] as const,
      expandedGroupIds: ['group:team=string%3Ax', 'group:team=string%3Ay'],
    };
    const grouped = projectNeuTableGrouping({
      rows,
      grouping,
      options: {
        mode: 'rowspan',
        scope: 'loaded',
        aggregate: (groupRows, field) => {
          if (groupRows.length === 1) throw new Error(`aggregate ${field}`);
          return groupRows.length;
        },
      },
      columns,
    });
    const projectedRows = grouped.flatMap((node) => (node.kind === 'row' ? [node] : []));
    const headers = grouped.flatMap((node) => (node.kind === 'group-header' ? [node] : []));

    expect(projectedRows[0].rowspan.get('team')).toBe(2);
    expect(projectedRows[1].rowspan.has('team')).toBe(false);
    expect(headers[0].aggregates).toEqual([{ field: 'team', value: 2, error: null }]);
    expect(headers[1].aggregates[0].error instanceof Error).toBe(true);
  });

  it('derives client group context from the pre-page domain', () => {
    const grouped = projectNeuTableGrouping({
      rows: rows.slice(0, 1),
      domainRows: rows,
      grouping: {
        by: ['team'],
        expandedGroupIds: ['group:team=string%3Ax'],
      },
      options,
      columns,
    });
    const header = grouped.flatMap((node) => (node.kind === 'group-header' ? [node] : []))[0];

    expect(header?.context.rows).toHaveLength(2);
    expect(grouped.filter((node) => node.kind === 'row')).toHaveLength(1);
  });
});
