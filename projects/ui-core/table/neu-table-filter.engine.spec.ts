import {
  buildNeuTableFilterState,
  isNeuTableFilterValueEmpty,
  matchNeuTableBoolean,
  matchNeuTableDate,
  matchNeuTableNumber,
  matchNeuTableText,
  matchesNeuTableFilter,
  normalizeNeuTableAppliedFilterValue,
  normalizeNeuTableDatePoint,
  resolveNeuTableFilterMatchMode,
  resolveNeuTableFilterAccessor,
} from './neu-table-filter.engine';
import { NeuTableFilterRegistry } from './neu-table-filter.registry';
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
      expect(matchNeuTableText(null, 'neural', 'contains')).toBe(false);
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
        matchNeuTableDate('2026-08-10', { from: 'not-a-date', to: '2026-08-20' }, 'between'),
      ).toBe(false);
      expect(
        matchNeuTableDate('2026-08-10', { from: '2026-08-01', to: 'not-a-date' }, 'between'),
      ).toBe(false);
      expect(matchNeuTableDate('2026-08-10', { from: null, to: null }, 'between')).toBe(true);
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

    expect(buildNeuTableFilterState(numberColumn, { from: 'invalid', to: 100 })).toBeNull();
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

  it('supports explicit advanced text modes for truthful legacy text columns', () => {
    const legacy: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name',
      filterable: true,
      filterType: 'text',
    };
    const legacySelect: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name select',
      filterable: true,
      filterType: 'select',
    };
    const row = { name: 'Pedro Neural' } as FilterUser;

    expect(matchesNeuTableFilter(row, legacy, 'Pedro', 'startsWith')).toBe(true);
    expect(matchesNeuTableFilter(row, legacy, 'Neural', 'startsWith')).toBe(false);
    expect(resolveNeuTableFilterMatchMode(legacy, 'endsWith')).toBe('endsWith');
    expect(resolveNeuTableFilterMatchMode(legacySelect, 'endsWith')).toBeUndefined();
    expect(
      resolveNeuTableFilterMatchMode({ key: 'name', header: 'Not filterable' }, 'endsWith'),
    ).toBeUndefined();
  });

  it('evaluates and projects a constraint mode override without mutating column config', () => {
    const textColumn: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name',
      filterConfig: { kind: 'text', mode: 'contains' },
    };
    const numberColumn: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number', mode: 'equals' },
    };
    const dateColumn: NeuTableColumn<FilterUser, string> = {
      key: 'createdAt',
      header: 'Created',
      filterConfig: { kind: 'date', mode: 'is', precision: 'date-only' },
    };
    const row = {
      name: 'Pedro Neural',
      score: 50,
      createdAt: '2026-08-20',
    } as FilterUser;

    expect(matchesNeuTableFilter(row, textColumn, 'test', 'notContains')).toBe(true);
    expect(matchesNeuTableFilter(row, numberColumn, 10, 'gte')).toBe(true);
    expect(matchesNeuTableFilter(row, dateColumn, '2026-08-01', 'after')).toBe(true);
    expect(buildNeuTableFilterState(numberColumn, 10, 'gte')).toEqual({
      kind: 'number',
      mode: 'gte',
      value: 10,
    });
    expect(textColumn.filterConfig).toEqual({ kind: 'text', mode: 'contains' });
    expect(numberColumn.filterConfig).toEqual({ kind: 'number', mode: 'equals' });
    expect(dateColumn.filterConfig).toEqual({
      kind: 'date',
      mode: 'is',
      precision: 'date-only',
    });
  });

  describe('select and multiSelect', () => {
    it('matches primitive Select values including zero without string coercion', () => {
      const column: NeuTableColumn<FilterUser, string> = {
        key: 'score',
        header: 'Score',
        filterConfig: {
          kind: 'select',
          options: [0, 1, false, Number.NaN],
          accessor: (row) => row.score,
        },
      };

      expect(matchesNeuTableFilter({ score: 0 } as FilterUser, column, 0)).toBe(true);
      expect(matchesNeuTableFilter({ score: 0 } as FilterUser, column, '0')).toBe(false);
      expect(matchesNeuTableFilter({ score: false } as unknown as FilterUser, column, false)).toBe(
        true,
      );
      expect(matchesNeuTableFilter({ score: Number.NaN } as FilterUser, column, Number.NaN)).toBe(
        true,
      );
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

  it('snapshots bounded custom values without deep-cloning opaque objects', () => {
    const column: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Custom',
      filterConfig: { kind: 'custom', predicate: () => true },
    };
    const array = [{ id: 1 }];
    const date = new Date('2026-08-20T00:00:00.000Z');
    const range = { from: date, to: null, metadata: { stable: true } };
    const opaque = { query: 'active' };

    const arraySnapshot = normalizeNeuTableAppliedFilterValue(column, array) as unknown[];
    const dateSnapshot = normalizeNeuTableAppliedFilterValue(column, date) as Date;
    const rangeSnapshot = normalizeNeuTableAppliedFilterValue(column, range) as typeof range;

    expect(arraySnapshot).not.toBe(array);
    expect(arraySnapshot[0]).toBe(array[0]);
    expect(dateSnapshot).not.toBe(date);
    expect(dateSnapshot.getTime()).toBe(date.getTime());
    expect(rangeSnapshot).not.toBe(range);
    expect(rangeSnapshot.from).not.toBe(date);
    expect(rangeSnapshot.metadata).toBe(range.metadata);
    expect(normalizeNeuTableAppliedFilterValue(column, opaque)).toBe(opaque);
  });

  it('handles malformed, open-ended, overridden, and registry-backed filter boundaries', () => {
    expect(isNeuTableFilterValueEmpty({ value: null })).toBe(false);
    expect(isNeuTableFilterValueEmpty({ from: '', to: undefined })).toBe(true);
    expect(isNeuTableFilterValueEmpty({ from: 0, to: null })).toBe(false);
    expect(matchNeuTableText('anything', '')).toBe(true);
    expect(matchNeuTableNumber(Number.POSITIVE_INFINITY, 1)).toBe(false);
    expect(matchNeuTableNumber('  ', 1)).toBe(false);
    expect(matchNeuTableNumber('12', '12')).toBe(true);
    expect(matchNeuTableNumber(12, 'invalid')).toBe(false);
    expect(matchNeuTableNumber(12, 10, 'unknown' as never)).toBe(false);
    expect(matchNeuTableNumber(12, 10, 'between')).toBe(false);
    expect(matchNeuTableNumber(12, { from: null, to: 11 }, 'between')).toBe(false);
    expect(matchNeuTableNumber(12, { from: 13, to: null }, 'between')).toBe(false);

    expect(normalizeNeuTableDatePoint(new Date('invalid'))).toBeNull();
    expect(normalizeNeuTableDatePoint(new Date('2026-08-20T10:30:00Z'), 'instant')).toEqual({
      precision: 'instant',
      value: '2026-08-20T10:30:00.000Z',
    });
    expect(normalizeNeuTableDatePoint(new Date('2026-08-20T10:30:00Z'))).toEqual({
      precision: 'date-only',
      value: '2026-08-20',
    });
    expect(normalizeNeuTableDatePoint({ precision: 'date-only', value: '2026-02-30' })).toBeNull();
    expect(normalizeNeuTableDatePoint({ precision: 'instant', value: 'invalid' })).toBeNull();
    expect(normalizeNeuTableDatePoint({ precision: 'other', value: '2026-08-20' })).toBeNull();
    expect(normalizeNeuTableDatePoint(' ')).toBeNull();
    expect(matchNeuTableDate(new Date('invalid'), '2026-08-20')).toBe(false);
    expect(matchNeuTableDate('2026-08-20', 'invalid')).toBe(false);
    expect(
      matchNeuTableDate(
        '2026-08-20T10:30:00Z',
        {
          from: { precision: 'date-only', value: '2026-08-20' },
          to: { precision: 'instant', value: '2026-08-20T10:30:00Z' },
        },
        'between',
        'instant',
      ),
    ).toBe(true);
    expect(matchNeuTableDate('2026-08-20', { from: null, to: '2026-08-19' }, 'between')).toBe(
      false,
    );
    expect(matchNeuTableBoolean(true, 'all')).toBe(true);
    expect(matchNeuTableBoolean(true, 'true')).toBe(false);

    const row = {
      name: 'Ana',
      score: 12,
      active: true,
      createdAt: '2026-08-20',
      profile: { department: 'Engineering' },
    };
    const legacy: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Name',
      filterable: true,
    };
    const numberColumn: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number', mode: 'equals' },
    };
    const booleanColumn: NeuTableColumn<FilterUser, string> = {
      key: 'active',
      header: 'Active',
      filterConfig: { kind: 'boolean' },
    };
    const customPredicate: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Predicate',
      filterConfig: { kind: 'custom', predicate: (value, expected) => value === expected },
    };
    const customRegistry: NeuTableColumn<FilterUser, string> = {
      key: 'name',
      header: 'Registry',
      filterConfig: { kind: 'custom', mode: 'prefix' },
    };
    const registry = new NeuTableFilterRegistry();
    registry.register<FilterUser>(
      'prefix',
      (value, expected, context) =>
        context.columnKey === 'name' && String(value).startsWith(String(expected)),
    );

    expect(matchesNeuTableFilter(row, legacy, '')).toBe(true);
    expect(matchesNeuTableFilter(row, legacy, 'AN', 'unsupported')).toBe(true);
    expect(matchesNeuTableFilter(row, numberColumn, 10, 'unsupported')).toBe(false);
    expect(matchesNeuTableFilter(row, booleanColumn, true)).toBe(true);
    expect(matchesNeuTableFilter(row, customPredicate, 'Ana')).toBe(true);
    expect(matchesNeuTableFilter(row, customRegistry, 'An', undefined, registry)).toBe(true);
    expect(matchesNeuTableFilter(row, customRegistry, 'An', 'missing', registry)).toBe(false);
    expect(resolveNeuTableFilterAccessor(row, numberColumn)).toBe(12);

    expect(normalizeNeuTableAppliedFilterValue(legacy, '')).toBe('');
    expect(normalizeNeuTableAppliedFilterValue(legacy, 'Ana')).toBe('Ana');
    expect(normalizeNeuTableAppliedFilterValue(numberColumn, 'invalid')).toBe('invalid');
    expect(
      normalizeNeuTableAppliedFilterValue(
        { key: 'createdAt', header: 'Date', filterConfig: { kind: 'date', mode: 'between' } },
        { from: new Date('2026-08-01T00:00:00Z') },
      ),
    ).toEqual({ from: '2026-08-01', to: null });

    expect(buildNeuTableFilterState(legacy, 'Ana')).toBeNull();
    expect(buildNeuTableFilterState(booleanColumn, 'true')).toBeNull();
    expect(buildNeuTableFilterState(booleanColumn, false)).toEqual({
      kind: 'boolean',
      mode: 'false',
      value: false,
    });
    expect(buildNeuTableFilterState(customRegistry, 'Ana', 'override')).toEqual({
      kind: 'custom',
      mode: 'override',
      value: 'Ana',
      localOnly: false,
    });
    expect(resolveNeuTableFilterMatchMode(legacy, 'unsupported')).toBe('contains');
    expect(resolveNeuTableFilterMatchMode(booleanColumn)).toBeUndefined();
    expect(resolveNeuTableFilterMatchMode(customRegistry, 'custom')).toBe('prefix');
    expect(resolveNeuTableFilterMatchMode(numberColumn, 'gte')).toBe('gte');
  });

  it('canonicalizes every supported date and persisted-range boundary', () => {
    const instantColumn: NeuTableColumn<FilterUser, string> = {
      key: 'createdAt',
      header: 'Created',
      filterConfig: { kind: 'date', precision: 'instant' },
    };
    const dateRangeColumn: NeuTableColumn<FilterUser, string> = {
      key: 'createdAt',
      header: 'Created',
      filterConfig: { kind: 'date', mode: 'between' },
    };
    const numberRangeColumn: NeuTableColumn<FilterUser, string> = {
      key: 'score',
      header: 'Score',
      filterConfig: { kind: 'number', mode: 'between' },
    };

    expect(normalizeNeuTableDatePoint({ precision: 'date-only', value: '2026-08-20' })).toEqual({
      precision: 'date-only',
      value: '2026-08-20',
    });
    expect(normalizeNeuTableDatePoint('2026-08-20T23:30:00.000Z')).toEqual({
      precision: 'date-only',
      value: '2026-08-20',
    });
    expect(normalizeNeuTableDatePoint('2026-08-20T23:30:00.000Z', 'instant')).toEqual({
      precision: 'instant',
      value: '2026-08-20T23:30:00.000Z',
    });
    expect(
      matchNeuTableDate(new Date('2026-08-20T12:00:00Z'), '2026-08-20T12:00:00Z', 'is', 'instant'),
    ).toBe(true);
    expect(matchNeuTableDate('invalid', '2026-08-20T12:00:00Z', 'is', 'instant')).toBe(false);
    expect(matchNeuTableDate(123, '2026-08-20T12:00:00Z', 'is', 'instant')).toBe(false);
    expect(matchNeuTableDate('2026-08-20', { from: '2026-08-20', to: null }, 'between')).toBe(true);
    expect(matchNeuTableDate('2026-08-20', { from: null, to: '2026-08-20' }, 'between')).toBe(true);

    expect(
      matchesNeuTableFilter(
        { createdAt: '2026-08-20T12:00:00Z' } as FilterUser,
        instantColumn,
        '2026-08-20T12:00:00Z',
      ),
    ).toBe(true);
    expect(normalizeNeuTableAppliedFilterValue(instantColumn, '2026-08-20T12:00:00Z')).toBe(
      '2026-08-20T12:00:00.000Z',
    );
    expect(normalizeNeuTableAppliedFilterValue(dateRangeColumn, 'malformed')).toBe('malformed');
    expect(normalizeNeuTableAppliedFilterValue(numberRangeColumn, { to: 10 })).toEqual({
      from: null,
      to: 10,
    });
    expect(normalizeNeuTableAppliedFilterValue(numberRangeColumn, { from: 1 })).toEqual({
      from: 1,
      to: null,
    });
    expect(normalizeNeuTableAppliedFilterValue(numberRangeColumn, { from: 1, to: 10 })).toEqual({
      from: 1,
      to: 10,
    });
    expect(
      normalizeNeuTableAppliedFilterValue(
        { key: 'name', header: 'Name', filterConfig: { kind: 'multiSelect' } },
        'not-an-array',
      ),
    ).toBe('not-an-array');
    expect(buildNeuTableFilterState(instantColumn, 'invalid')).toBeNull();
    expect(resolveNeuTableFilterMatchMode(instantColumn, 'unsupported')).toBe('is');
  });
});
