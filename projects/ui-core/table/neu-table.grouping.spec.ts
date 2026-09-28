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
  it('preserves type and negative-zero identity in group headers', () => {
    interface TypedRow { readonly group: unknown }
    const typedRows = [null, undefined, -0, 0, true, 2n, '2', { id: 2 }]
      .map((group, index) => ({ row: { group } satisfies TypedRow, track: index }));
    const grouped = projectNeuTableGrouping({
      rows: typedRows,
      grouping: { by: ['group'], expandedGroupIds: [] },
      options: { mode: 'subheader', scope: 'loaded' },
      columns: [{ id: 'group', header: 'Group', field: 'group' }],
    });
    const headers = grouped.flatMap((node) => node.kind === 'group-header' ? [node] : []);
    expect(headers).toHaveLength(8);
    expect(headers.map((node) => node.context.value)).toEqual(
      [null, undefined, -0, 0, true, 2n, '2', { id: 2 }],
    );
    expect(headers[2]?.id).not.toBe(headers[3]?.id);
    expect(headers[5]?.id).not.toBe(headers[6]?.id);
    expect(proposeNeuTableGroupToggle(null, 'missing')).toBeNull();
  });
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

  it('passes rows through when grouping is empty and removes an expanded group on toggle', () => {
    for (const grouping of [null, { by: [] as Field[], expandedGroupIds: [] }]) {
      const projected = projectNeuTableGrouping({ rows, grouping, options, columns });
      expect(projected.map((node) => node.kind)).toEqual(['row', 'row', 'row']);
      expect(projected.map((node) => node.track)).toEqual(['1', '2', '3']);
    }
    const expanded = { by: ['team'] as const, expandedGroupIds: ['group:team=string%3Ax'] };
    expect(proposeNeuTableGroupToggle(expanded, expanded.expandedGroupIds[0])?.next.expandedGroupIds)
      .toEqual([]);
    expect(expanded.expandedGroupIds).toHaveLength(1);
  });

  it('groups by a custom value even when the field has no column', () => {
    const grouping = { by: ['team'] as const, expandedGroupIds: ['group:team=string%3AX'] };
    const projected = projectNeuTableGrouping({
      rows,
      grouping,
      options: { ...options, value: (row: Row) => row.team?.toUpperCase() },
      columns: [],
    });
    const headers = projected.flatMap((node) => node.kind === 'group-header' ? [node] : []);
    expect(headers.map((node) => node.context.value)).toEqual(['X', 'Y']);
    expect(projected.filter((node) => node.kind === 'row')).toHaveLength(2);
  });

  it('builds context for a displayed group missing from the domain and supports two levels', () => {
    const grouping = {
      by: ['team', 'id'] as const,
      expandedGroupIds: ['group:team=string%3Ax', 'group:team=string%3Ax/id=number%3A1'],
    };
    const projected = projectNeuTableGrouping({
      rows: rows.slice(0, 1),
      domainRows: rows.slice(2),
      grouping,
      options,
      columns: [columns[0], { id: 'id', header: 'ID', field: 'id' }],
    });
    const headers = projected.flatMap((node) => node.kind === 'group-header' ? [node] : []);
    expect(headers.map((node) => node.context.value)).toEqual(['x', 1]);
    expect(headers[0].context.rows).toEqual([rows[0].row]);
    expect(projected.filter((node) => node.kind === 'row')).toHaveLength(1);
    expect(projected.filter((node) => node.kind === 'group-footer')).toHaveLength(2);
  });
});
