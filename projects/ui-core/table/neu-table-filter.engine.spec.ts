import {
  buildNeuTableFilterState,
  matchNeuTableBoolean,
  matchNeuTableDate,
  matchNeuTableNumber,
  matchNeuTableText,
  matchesNeuTableFilter,
  normalizeNeuTableDatePoint,
} from './neu-table-filter.engine';
import type { NeuTableColumn, NeuTableFilterMatchMode } from './neu-table.types';

interface FilterUser {
  name: string;
  score: number;
  active: boolean;
  createdAt: Date | string;
  profile: { department: string };
}

interface OptionFilterRow {
  option: { id: number; label: string };
}

describe('NeuTable filter engine', () => {
  describe('text', () => {
    it('supports every P2.2B text mode case-insensitively', () => {
      expect(matchNeuTableText('Neural Table', 'table', 'contains')).toBe(true);
      expect(matchNeuTableText('Neural Table', 'neural', 'startsWith')).toBe(true);
      expect(matchNeuTableText('Neural Table', 'TABLE', 'endsWith')).toBe(true);
      expect(matchNeuTableText('Neural Table', 'neural table', 'equals')).toBe(true);
      expect(matchNeuTableText('Neural Table', 'other', 'notEquals')).toBe(true);
      expect(matchNeuTableText('Neural Table', 'angular', 'notContains')).toBe(true);
    });
  });

  describe('number', () => {
    it('supports comparisons, zero, negatives, decimals, and inclusive ranges', () => {
      expect(matchNeuTableNumber(0, 0, 'equals')).toBe(true);
      expect(matchNeuTableNumber(-2.5, -2.5, 'equals')).toBe(true);
      expect(matchNeuTableNumber(10.25, 10, 'notEquals')).toBe(true);
      expect(matchNeuTableNumber(4, 5, 'lt')).toBe(true);
      expect(matchNeuTableNumber(5, 5, 'lte')).toBe(true);
      expect(matchNeuTableNumber(6, 5, 'gt')).toBe(true);
      expect(matchNeuTableNumber(5, 5, 'gte')).toBe(true);
      expect(matchNeuTableNumber(5, { from: 5, to: 10 }, 'between')).toBe(true);
      expect(matchNeuTableNumber(10, { from: 5, to: 10 }, 'between')).toBe(true);
      expect(matchNeuTableNumber(4.99, { from: 5, to: 10 }, 'between')).toBe(false);
    });

    it('rejects invalid active ranges but keeps empty ranges inactive', () => {
      expect(matchNeuTableNumber(50, { from: 'invalid', to: 100 }, 'between')).toBe(false);
      expect(matchNeuTableNumber(50, { from: 10, to: 'invalid' }, 'between')).toBe(false);
      expect(matchNeuTableNumber(50, { from: null, to: null }, 'between')).toBe(true);
    });
  });

  describe('date', () => {
    it('keeps legacy date columns on the old textual comparison', () => {
      const legacyColumn: NeuTableColumn<FilterUser, string> = {
        key: 'createdAt',
        header: 'Created',
        filterType: 'date',
      };

      expect(
        matchesNeuTableFilter(
          { createdAt: '2026-08-20T10:30:00Z' } as FilterUser,
          legacyColumn,
          '10:30',
        ),
      ).toBe(true);
    });

    it('matches Date, ISO instant, and date-only rows without local timezone conversion', () => {
      const dateOnlyColumn: NeuTableColumn<FilterUser, string> = {
        key: 'createdAt',
        header: 'Created',
        filterConfig: {
          kind: 'date',
          mode: 'is',
          precision: 'date-only',
          accessor: (row) => row.createdAt,
        },
      };
      const filter = '2026-08-20';

      expect(
        matchesNeuTableFilter(
          { createdAt: new Date('2026-08-20T10:30:00Z') } as FilterUser,
          dateOnlyColumn,
          filter,
        ),
      ).toBe(true);
      expect(
        matchesNeuTableFilter(
          { createdAt: '2026-08-20T10:30:00Z' } as FilterUser,
          dateOnlyColumn,
          filter,
        ),
      ).toBe(true);
      expect(
        matchesNeuTableFilter({ createdAt: '2026-08-20' } as FilterUser, dateOnlyColumn, filter),
      ).toBe(true);
      expect(
        matchesNeuTableFilter({ createdAt: 'not-a-date' } as FilterUser, dateOnlyColumn, filter),
      ).toBe(false);
    });

    it('supports is, isNot, before, after, and inclusive between', () => {
      expect(matchNeuTableDate('2026-08-20', '2026-08-20', 'is')).toBe(true);
      expect(matchNeuTableDate('2026-08-21', '2026-08-20', 'isNot')).toBe(true);
      expect(matchNeuTableDate('2026-08-19', '2026-08-20', 'before')).toBe(true);
      expect(matchNeuTableDate('2026-08-21', '2026-08-20', 'after')).toBe(true);
      expect(
        matchNeuTableDate('2026-08-20', { from: '2026-08-01', to: '2026-08-20' }, 'between'),
      ).toBe(true);
      expect(
        matchNeuTableDate('2026-07-31', { from: '2026-08-01', to: '2026-08-20' }, 'between'),
      ).toBe(false);
    });

    it('rejects invalid active ranges but keeps empty ranges inactive', () => {
      expect(
        matchNeuTableDate(
          '2026-08-10',
          { from: 'not-a-date', to: '2026-08-20' },
          'between',
        ),
      ).toBe(false);
      expect(
        matchNeuTableDate(
          '2026-08-10',
          { from: '2026-08-01', to: 'not-a-date' },
          'between',
        ),
      ).toBe(false);
      expect(
        matchNeuTableDate('2026-08-10', { from: null, to: null }, 'between'),
      ).toBe(true);
    });

    it('compares instants as UTC timestamps and rejects invalid values', () => {
      expect(
        matchNeuTableDate('2026-08-20T10:30:00Z', '2026-08-20T10:30:00Z', 'is', 'instant'),
      ).toBe(true);
      expect(
        matchNeuTableDate('2026-08-20T10:30:01Z', '2026-08-20T10:30:00Z', 'is', 'instant'),
      ).toBe(false);
      expect(normalizeNeuTableDatePoint('20/08/2026')).toBeNull();
    });
  });

  describe('boolean and typed accessors', () => {
    it('treats null and undefined as inactive and keeps false active', () => {
      expect(matchNeuTableBoolean(true, null)).toBe(true);
      expect(matchNeuTableBoolean(false, undefined)).toBe(true);
      expect(matchNeuTableBoolean(true, true)).toBe(true);
      expect(matchNeuTableBoolean(false, true)).toBe(false);
      expect(matchNeuTableBoolean(false, false)).toBe(true);
      expect(matchNeuTableBoolean(true, false)).toBe(false);
    });

    it('uses the original T row through an accessor and serializes typed state', () => {
      const column: NeuTableColumn<FilterUser, string> = {
        key: 'department',
        header: 'Department',
        filterConfig: {
          kind: 'text',
          mode: 'equals',
          accessor: (row) => row.profile.department,
        },
      };
      expect(
        matchesNeuTableFilter(
          {
            name: 'Ana',
            score: 10,
            active: true,
            createdAt: '2026-08-20',
            profile: { department: 'Engineering' },
          },
          column,
          'engineering',
        ),
      ).toBe(true);
      expect(buildNeuTableFilterState(column, 'engineering')).toEqual({
        kind: 'text',
        mode: 'equals',
        value: 'engineering',
      });
    });
  });

  it('uses kind-specific default modes when building typed state', () => {
    const textColumn: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name',
      filterConfig: { kind: 'text' },
    };
    const numberColumn: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number' },
    };
    const dateColumn: NeuTableColumn<FilterUser, string> = {
      key: 'createdAt',
      header: 'Created',
      filterConfig: { kind: 'date' },
    };
    const selectColumn: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name select',
      filterConfig: { kind: 'select' },
    };

    expect(buildNeuTableFilterState(textColumn, 'Ana')).toEqual({
      kind: 'text',
      mode: 'contains',
      value: 'Ana',
    });
    expect(buildNeuTableFilterState(numberColumn, 10)).toEqual({
      kind: 'number',
      mode: 'equals',
      value: 10,
    });
    expect(buildNeuTableFilterState(dateColumn, '2026-08-20')).toEqual({
      kind: 'date',
      mode: 'is',
      value: { precision: 'date-only', value: '2026-08-20' },
    });
    expect(buildNeuTableFilterState(selectColumn, 'Ana')).toEqual({
      kind: 'select',
      mode: 'equals',
      value: 'Ana',
    });

    const multiSelectColumn: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name multi-select',
      filterConfig: { kind: 'multiSelect' },
    };
    expect(buildNeuTableFilterState(multiSelectColumn, ['Ana'])).toEqual({
      kind: 'multiSelect',
      mode: 'in',
      value: ['Ana'],
    });
    expect(buildNeuTableFilterState(multiSelectColumn, [])).toBeNull();
    expect(buildNeuTableFilterState(multiSelectColumn, 'Ana')).toBeNull();
  });

  it('does not expose a mode on boolean filter configuration', () => {
    const validColumn: NeuTableColumn<FilterUser, string> = {
      key: 'active',
      header: 'Active',
      filterConfig: { kind: 'boolean', accessor: (row) => row.active },
    };
    expect(validColumn.filterConfig?.kind).toBe('boolean');

    const invalidColumn: NeuTableColumn<FilterUser, string> = {
      key: 'active',
      header: 'Active',
      filterConfig: {
        kind: 'boolean',
        // @ts-expect-error Boolean filtering derives mode from the filter value.
        mode: 'all',
      },
    };
    expect(invalidColumn.filterConfig?.kind).toBe('boolean');
  });

  it('exposes only configurable match modes', () => {
    const textMode: NeuTableFilterMatchMode = 'contains';
    const multiSelectMode: NeuTableFilterMatchMode = 'in';
    expect([textMode, multiSelectMode]).toEqual(['contains', 'in']);

    // @ts-expect-error Boolean state values are not configurable match modes.
    const booleanMode: NeuTableFilterMatchMode = 'true';
    // @ts-expect-error Custom predicates are not standard match modes.
    const customMode: NeuTableFilterMatchMode = 'custom';
    expect([booleanMode, customMode]).toEqual(['true', 'custom']);
  });

  it('does not build typed state for invalid number or date ranges', () => {
    const numberColumn: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number', mode: 'between' },
    };
    const dateColumn: NeuTableColumn<FilterUser, string> = {
      key: 'createdAt',
      header: 'Created',
      filterConfig: { kind: 'date', mode: 'between' },
    };

    expect(
      buildNeuTableFilterState(numberColumn, { from: 'invalid', to: 100 }),
    ).toBeNull();
    expect(
      buildNeuTableFilterState(dateColumn, { from: '2026-08-01', to: 'not-a-date' }),
    ).toBeNull();
  });

  it('keeps legacy number-range textual while modern number is numeric', () => {
    const legacy: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterType: 'number-range',
    };
    const modern: NeuTableColumn<FilterUser, string> = {
      ...legacy,
      filterConfig: { kind: 'number', mode: 'between' },
    };
    const row = { score: 120 } as FilterUser;
    expect(matchesNeuTableFilter(row, legacy, '20')).toBe(true);
    expect(matchesNeuTableFilter(row, modern, { from: 100, to: 130 })).toBe(true);
    expect(matchesNeuTableFilter(row, modern, { from: 0, to: 100 })).toBe(false);
  });

  describe('select and multiSelect', () => {
    it('matches primitive Select values including zero without string coercion', () => {
      const column: NeuTableColumn<FilterUser, string> = {
        key: 'score',
        header: 'Score',
        filterConfig: { kind: 'select', options: [0, 1], accessor: (row) => row.score },
      };

      expect(matchesNeuTableFilter({ score: 0 } as FilterUser, column, 0)).toBe(true);
      expect(matchesNeuTableFilter({ score: 0 } as FilterUser, column, '0')).toBe(false);
    });

    it('matches select values with Neural option identity semantics', () => {
      const selected = { id: 1, label: 'One' };
      const column: NeuTableColumn<OptionFilterRow, string> = {
        key: 'option',
        header: 'Option',
        filterConfig: { kind: 'select' },
      };

      expect(matchesNeuTableFilter({ option: selected }, column, selected)).toBe(true);
      expect(matchesNeuTableFilter({ option: selected }, column, { ...selected })).toBe(false);
    });

    it('matches multiSelect membership with Neural option identity semantics', () => {
      const selected = { id: 1, label: 'One' };
      const other = { id: 2, label: 'Two' };
      const column: NeuTableColumn<OptionFilterRow, string> = {
        key: 'option',
        header: 'Option',
        filterConfig: { kind: 'multiSelect' },
      };

      expect(matchesNeuTableFilter({ option: selected }, column, [other, selected])).toBe(true);
      expect(matchesNeuTableFilter({ option: selected }, column, [{ ...selected }])).toBe(false);
      expect(matchesNeuTableFilter({ option: selected }, column, selected)).toBe(false);
    });
  });
});
