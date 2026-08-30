import {
  InternalNeuOptionLazyRequestSequencer,
  createNeuOptionLazyRequest,
  createNeuOptionLoadingRows,
  deriveNeuOptionRowId,
  filterNeuOptionRows,
  filterNeuOptions,
  findNeuOptionBoundaryRow,
  findNeuOptionTypeaheadRow,
  getNeuOptionEligibleRowIndexes,
  isNeuOptionRowEligible,
  moveNeuOptionActiveRow,
  neuOptionFilterValueMatches,
  normalizeNeuLegacyOptionGroups,
  normalizeNeuOptionGroups,
  normalizeNeuOptionLazyWindow,
  normalizeNeuOptionRows,
  pageNeuOptionActiveRow,
  reconcileNeuOptionActiveRow,
} from './neu-option-foundation';

interface Person {
  id: number;
  profile: {
    name: string;
    city: string;
  };
  disabled?: boolean;
  group?: string;
}

interface PersonGroup {
  meta: {
    label: string;
    disabled: boolean;
  };
  data: {
    people: readonly Person[];
  };
}

const ADA: Person = {
  id: 1,
  profile: { name: 'Ada Lovelace', city: 'Londres' },
  group: 'Pioneers',
};
const ALAN: Person = {
  id: 2,
  profile: { name: 'Alan Turing', city: 'Manchester' },
  disabled: true,
  group: 'Pioneers',
};
const GRACE: Person = {
  id: 3,
  profile: { name: 'Grace Hopper', city: 'Nueva York' },
  group: 'Admirals',
};

describe('internal option foundation', () => {
  it('normalizes options into fresh rows without cloning or mutating options', () => {
    const options = Object.freeze([ADA, ALAN]);
    const rows = normalizeNeuOptionRows(options, 'disabled', 20);

    expect(rows).not.toBe(options);
    expect(rows.map((row) => row.option)).toEqual(options);
    expect(rows[0]?.option).toBe(ADA);
    expect(rows.map((row) => row.logicalIndex)).toEqual([20, 21]);
    expect(rows.map((row) => row.disabled)).toEqual([false, true]);
    expect(options).toEqual([ADA, ALAN]);
  });

  it('normalizes typed groups and propagates group disability to option eligibility', () => {
    const groups: readonly PersonGroup[] = Object.freeze([
      {
        meta: { label: 'Available', disabled: false },
        data: { people: Object.freeze([ADA, ALAN]) },
      },
      {
        meta: { label: 'Locked', disabled: true },
        data: { people: Object.freeze([GRACE]) },
      },
      {
        meta: { label: 'Empty', disabled: false },
        data: { people: Object.freeze([]) },
      },
    ]);
    const rows = normalizeNeuOptionGroups(
      groups,
      {
        labelAccessor: 'meta.label',
        childrenAccessor: 'data.people',
        disabledAccessor: (group) => group.meta.disabled,
      },
      { optionDisabledAccessor: 'disabled', includeEmptyGroups: false, logicalOffset: 10 },
    );

    expect(rows.map((row) => row.kind)).toEqual(['group', 'option', 'option', 'group', 'option']);
    expect(rows[0]).toMatchObject({ kind: 'group', group: groups[0], label: 'Available' });
    expect(rows[1]).toMatchObject({ kind: 'option', option: ADA, logicalIndex: 10 });
    expect(rows[2]).toMatchObject({ kind: 'option', option: ALAN, disabled: true });
    expect(rows[4]).toMatchObject({ kind: 'option', option: GRACE, disabled: true });
    expect(groups[0]?.data.people).toEqual([ADA, ALAN]);
  });

  it('retains legacy flat grouping without reinterpreting raw options', () => {
    const rows = normalizeNeuLegacyOptionGroups([ADA, ALAN, GRACE], 'disabled');

    expect(rows.map((row) => row.kind)).toEqual(['group', 'option', 'option', 'group', 'option']);
    expect(rows[0]).toMatchObject({ kind: 'group', group: 'Pioneers' });
    expect(rows[1]).toMatchObject({ kind: 'option', option: ADA });

    const segmented = normalizeNeuLegacyOptionGroups([
      ADA,
      { ...GRACE, group: undefined },
      { ...ALAN, disabled: false },
    ]);
    expect(segmented.filter((row) => row.kind === 'group')).toHaveLength(2);
  });

  it.each([
    ['startsWith', 'Ada', 'ad', true],
    ['contains', 'Ada Lovelace', 'love', true],
    ['notContains', 'Ada Lovelace', 'turing', true],
    ['endsWith', 'Ada Lovelace', 'lace', true],
    ['equals', 'Ada', 'ADA', true],
    ['notEquals', 'Ada', 'Alan', true],
  ] as const)('classifies %s text matching', (mode, value, filter, expected) => {
    expect(neuOptionFilterValueMatches(value, filter, mode)).toBe(expected);
  });

  it('matches accents and locale-aware casing deterministically', () => {
    expect(neuOptionFilterValueMatches('Ávila', 'avila', 'equals', 'es')).toBe(true);
    expect(neuOptionFilterValueMatches('IĞDIR', 'ığ', 'startsWith', 'tr')).toBe(true);
    expect(neuOptionFilterValueMatches(undefined, 'x', 'notEquals')).toBe(true);
    expect(neuOptionFilterValueMatches(undefined, 'x', 'contains')).toBe(false);
  });

  it('filters direct, nested, and computed semantic fields without reading DOM text', () => {
    const options = Object.freeze([ADA, ALAN, GRACE]);

    expect(filterNeuOptions(options, '3', { fields: ['id'], matchMode: 'equals' })).toEqual([
      GRACE,
    ]);
    expect(filterNeuOptions(options, 'manchester', { fields: ['profile.city'] })).toEqual([ALAN]);
    expect(
      filterNeuOptions(options, 'hopper', {
        fields: [(person) => `${person.profile.name} ${person.profile.city}`],
      }),
    ).toEqual([GRACE]);
    expect(filterNeuOptions(options, 'ada', {}, 'profile.name')).toEqual([ADA]);
    expect(filterNeuOptions(options, 'ada', { strategy: 'server' }, 'profile.name')).toEqual(
      options,
    );
    expect(options).toEqual([ADA, ALAN, GRACE]);
  });

  it('filters grouped rows and leaves empty-group display policy to the adapter', () => {
    const rows = normalizeNeuLegacyOptionGroups([ADA, ALAN, GRACE], 'disabled');
    const matching = filterNeuOptionRows(rows, 'Grace', {}, 'profile.name');
    const preserving = filterNeuOptionRows(rows, 'Nobody', {}, 'profile.name', {
      preserveEmptyGroups: true,
    });

    expect(matching.map((row) => row.kind)).toEqual(['group', 'option']);
    expect(matching[0]).toMatchObject({ kind: 'group', label: 'Admirals' });
    expect(preserving.filter((row) => row.kind === 'group')).toHaveLength(2);
    expect(
      filterNeuOptionRows(
        [...rows, ...createNeuOptionLoadingRows(3, 4)],
        'Nobody',
        {},
        'profile.name',
        { includeLoadingRows: true },
      ).at(-1),
    ).toMatchObject({ kind: 'loading', logicalIndex: 3 });
    expect(filterNeuOptionRows(rows, '', {}, 'profile.name')).not.toBe(rows);
    expect(rows).toHaveLength(5);
  });

  it('keeps group, disabled option, and loading rows ineligible', () => {
    const rows = [
      ...normalizeNeuLegacyOptionGroups([ADA, ALAN, GRACE], 'disabled'),
      ...createNeuOptionLoadingRows(3, 5),
    ];

    expect(getNeuOptionEligibleRowIndexes(rows)).toEqual([1, 4]);
    expect(rows.map((row) => isNeuOptionRowEligible(row))).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
      false,
    ]);
  });

  it('navigates normalized row indexes and skips every ineligible row', () => {
    const rows = normalizeNeuLegacyOptionGroups([ADA, ALAN, GRACE], 'disabled');

    expect(findNeuOptionBoundaryRow(rows, 'first')).toBe(1);
    expect(findNeuOptionBoundaryRow(rows, 'last')).toBe(4);
    expect(moveNeuOptionActiveRow(rows, 1, 1)).toBe(4);
    expect(moveNeuOptionActiveRow(rows, 4, 1)).toBe(4);
    expect(moveNeuOptionActiveRow(rows, 4, 1, true)).toBe(1);
    expect(moveNeuOptionActiveRow(rows, 0, -1)).toBe(4);
    expect(pageNeuOptionActiveRow(rows, 1, 1, 10)).toBe(4);
    expect(pageNeuOptionActiveRow(rows, 4, -1, 0)).toBe(1);
    expect(reconcileNeuOptionActiveRow(rows, 2)).toBe(4);
    expect(reconcileNeuOptionActiveRow(rows, 3)).toBe(1);
    expect(reconcileNeuOptionActiveRow(rows, null)).toBe(1);
    expect(findNeuOptionTypeaheadRow(rows, 'ada', 4, 'profile.name')).toBe(1);
    expect(findNeuOptionTypeaheadRow(rows, 'alan', 0, 'profile.name')).toBe(-1);
    expect(findNeuOptionTypeaheadRow(rows, 'missing', 1, 'profile.name')).toBe(-1);
  });

  it('returns explicit empty navigation state when no row is eligible', () => {
    const rows = normalizeNeuOptionRows([{ disabled: true }], 'disabled');

    expect(findNeuOptionBoundaryRow(rows, 'first')).toBe(-1);
    expect(findNeuOptionBoundaryRow(rows, 'last')).toBe(-1);
    expect(moveNeuOptionActiveRow(rows, -1, 1)).toBe(-1);
    expect(pageNeuOptionActiveRow(rows, -1, 1, 5)).toBe(-1);
    expect(findNeuOptionTypeaheadRow(rows, '', -1)).toBe(-1);
  });

  it('derives deterministic collision-free row IDs from the owning instance ID', () => {
    const optionRow = normalizeNeuOptionRows([ADA], null, 42)[0]!;
    const groupRow = normalizeNeuLegacyOptionGroups([ADA])[0]!;
    const loadingRow = createNeuOptionLoadingRows(42, 43)[0]!;

    expect(deriveNeuOptionRowId('people-a', optionRow)).toBe('people-a-option-42');
    expect(deriveNeuOptionRowId('people-a', groupRow)).toBe('people-a-group-0');
    expect(deriveNeuOptionRowId('people-a', loadingRow)).toBe('people-a-loading-42');
    expect(deriveNeuOptionRowId('people-b', optionRow)).not.toBe(
      deriveNeuOptionRowId('people-a', optionRow),
    );
  });

  it('normalizes half-open bounded windows without allocating total-sized arrays', () => {
    expect(normalizeNeuOptionLazyWindow(10.8, 20.9)).toEqual({ first: 10, end: 20, count: 10 });
    expect(normalizeNeuOptionLazyWindow(-5, 2)).toEqual({ first: 0, end: 2, count: 2 });
    expect(normalizeNeuOptionLazyWindow(8, 4)).toEqual({ first: 8, end: 8, count: 0 });
    expect(normalizeNeuOptionLazyWindow(Number.NaN, Number.POSITIVE_INFINITY)).toEqual({
      first: 0,
      end: 0,
      count: 0,
    });
    expect(createNeuOptionLoadingRows(10_000_000, 10_000_003)).toHaveLength(3);
  });

  it('builds truthful lazy metadata and never serializes computed accessors', () => {
    const window = normalizeNeuOptionLazyWindow(20, 30);
    const serializable = createNeuOptionLazyRequest(
      window,
      'ada',
      { fields: ['profile.name'], matchMode: 'startsWith', locale: 'en' },
      'filter',
      9,
    );
    const computed = createNeuOptionLazyRequest(
      window,
      'ada',
      { fields: [(person: Person) => person.profile.name] },
      'scroll',
      10,
    );

    expect(serializable).toEqual({
      first: 20,
      end: 30,
      count: 10,
      filterValue: 'ada',
      filterFields: ['profile.name'],
      filterFieldsSerializable: true,
      filterMatchMode: 'startsWith',
      filterLocale: 'en',
      reason: 'filter',
      requestId: 9,
    });
    expect(computed.filterFields).toBeUndefined();
    expect(computed.filterFieldsSerializable).toBe(false);
    expect(JSON.stringify(computed)).not.toContain('person.profile.name');

    const fallbackField = createNeuOptionLazyRequest(
      window,
      '',
      {},
      'initial',
      Number.NaN,
      'profile.name',
    );
    const unknownFallback = createNeuOptionLazyRequest<Person>(window, '', {}, 'reset', 11);
    expect(fallbackField).toMatchObject({
      filterFields: ['profile.name'],
      filterFieldsSerializable: true,
      requestId: 0,
    });
    expect(unknownFallback.filterFields).toBeUndefined();
    expect(unknownFallback.filterFieldsSerializable).toBe(false);
  });

  it('sequences request IDs monotonically without owning network work', () => {
    const sequencer = new InternalNeuOptionLazyRequestSequencer(40);
    expect([sequencer.next(), sequencer.next(), sequencer.next()]).toEqual([41, 42, 43]);
    expect(new InternalNeuOptionLazyRequestSequencer(Number.NaN).next()).toBe(1);
  });
});
