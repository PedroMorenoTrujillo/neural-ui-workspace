import {
  NeuTableAdvancedFilterController,
  isNeuTableDateRange,
  neuTableAdvancedFilterControlKind,
  neuTableAdvancedFilterDatePrecision,
  neuTableAdvancedFilterModes,
  neuTableDateInputControlValue,
  neuTableDateRangeControlValue,
  neuTableDateRangeFilterValue,
  neuTableDateFilterValue,
  neuTableInstantRangeControlValue,
  neuTableInstantFilterValue,
  neuTableNumberRangeValue,
} from './neu-table-advanced-filter.controller';
import type { NeuTableColumn } from './neu-table.types';

interface FilterRow {
  name: string;
  score: number;
  createdAt: string;
  instant: string;
  active: boolean;
  role: unknown;
  status: string;
  custom: unknown;
}

const textColumn: NeuTableColumn<FilterRow> = {
  key: 'name',
  header: 'Name',
  filterConfig: { kind: 'text' },
};
const numberColumn: NeuTableColumn<FilterRow> = {
  key: 'score',
  header: 'Score',
  filterConfig: { kind: 'number' },
};
const dateColumn: NeuTableColumn<FilterRow> = {
  key: 'createdAt',
  header: 'Created',
  filterConfig: { kind: 'date', precision: 'date-only' },
};
const instantColumn: NeuTableColumn<FilterRow> = {
  key: 'instant',
  header: 'Instant',
  filterConfig: { kind: 'date', precision: 'instant' },
};
const booleanColumn: NeuTableColumn<FilterRow> = {
  key: 'active',
  header: 'Active',
  filterConfig: { kind: 'boolean' },
};
const selectColumn: NeuTableColumn<FilterRow> = {
  key: 'role',
  header: 'Role',
  filterConfig: { kind: 'select', options: [0, 'admin'] },
};
const multiSelectColumn: NeuTableColumn<FilterRow> = {
  key: 'status',
  header: 'Status',
  filterConfig: { kind: 'multiSelect', options: ['active', 'pending'] },
};
const customColumn: NeuTableColumn<FilterRow> = {
  key: 'custom',
  header: 'Custom',
  filterConfig: { kind: 'custom', predicate: () => true },
};

describe('NeuTableAdvancedFilterController', () => {
  it('normalizes every legacy and typed control boundary without locale-dependent values', () => {
    const legacySelect: NeuTableColumn<FilterRow> = {
      key: 'role',
      header: 'Role',
      filterType: 'select',
    };
    const legacyDate: NeuTableColumn<FilterRow> = {
      key: 'createdAt',
      header: 'Created',
      filterType: 'date',
    };
    const legacyText: NeuTableColumn<FilterRow> = {
      key: 'name',
      header: 'Name',
      filterable: true,
    };
    const inert: NeuTableColumn<FilterRow> = { key: 'name', header: 'Name' };

    expect(neuTableAdvancedFilterControlKind(legacySelect)).toBe('select');
    expect(neuTableAdvancedFilterControlKind(legacyDate)).toBe('date');
    expect(neuTableAdvancedFilterControlKind(legacyText)).toBe('text');
    expect(neuTableAdvancedFilterControlKind(customColumn)).toBe('none');
    expect(neuTableAdvancedFilterControlKind(inert)).toBe('none');
    expect(neuTableAdvancedFilterDatePrecision(dateColumn)).toBe('date-only');
    expect(neuTableAdvancedFilterDatePrecision(instantColumn)).toBe('instant');
    expect(neuTableAdvancedFilterDatePrecision(legacyDate)).toBe('date-only');
    expect(neuTableAdvancedFilterModes(numberColumn)).toContain('between');
    expect(neuTableAdvancedFilterModes(dateColumn)).toContain('after');
    expect(neuTableAdvancedFilterModes(textColumn)).toContain('notContains');

    expect(neuTableNumberRangeValue(null)).toEqual({ from: null, to: null });
    expect(neuTableNumberRangeValue({ from: 0, to: '10' })).toEqual({
      from: 0,
      to: null,
    });
    expect(neuTableDateRangeFilterValue(null)).toEqual({ from: null, to: null });
    expect(neuTableDateRangeFilterValue({ from: 0, to: '' })).toEqual({
      from: 0,
      to: '',
    });
    expect(neuTableDateRangeControlValue(null)).toEqual({ start: null, end: null });
    expect(neuTableDateRangeControlValue({ from: '2026-02-03', to: 'invalid' })).toEqual({
      start: new Date(2026, 1, 3),
      end: null,
    });
    expect(neuTableDateInputControlValue('2026-02-03', 'date-only')).toBe('2026-02-03');
    expect(neuTableDateInputControlValue(null, 'date-only')).toBe('');
    expect(neuTableDateInputControlValue(new Date('invalid'), 'instant')).toBe('');
    expect(neuTableDateInputControlValue({ value: '' }, 'instant')).toBe('');
    expect(neuTableInstantRangeControlValue({ from: 'invalid' }, 'from')).toBe('');
    expect(neuTableDateFilterValue(null, 'date-only')).toBeNull();
    expect(neuTableDateFilterValue(new Date('invalid'), 'date-only')).toBeNull();
  });

  it('starts empty with reusable controls and no apply result', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();

    expect(controller.kind()).toBeNull();
    expect(controller.mode()).toBeNull();
    expect(controller.value()).toBeNull();
    expect(controller.valid()).toBe(true);
    expect(controller.hasMultipleRules()).toBe(false);
    expect(controller.modeControl.value).toBeNull();
    expect(controller.textControl.value).toBe('');
    expect(controller.numberControl.value).toBeNull();
    expect(controller.numberFromControl.value).toBeNull();
    expect(controller.numberToControl.value).toBeNull();
    expect(controller.instantFromControl.value).toBe('');
    expect(controller.instantToControl.value).toBe('');
    expect(controller.booleanControl.value).toBeNull();
    expect(controller.dateControl.value).toBeNull();
    expect(controller.selectControl.value).toBeNull();
    expect(controller.multiSelectControl.value).toEqual([]);
    expect(controller.buildApplyResult()).toBeNull();

    controller.destroy();
  });

  it('initializes text and produces an apply intent without owning applied state', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    const applied = {
      constraints: [{ mode: 'startsWith' as const, value: 'Al' }],
    };

    controller.initialize(textColumn, applied);
    expect(controller.kind()).toBe('text');
    expect(controller.mode()).toBe('startsWith');
    expect(controller.value()).toBe('Al');
    expect(controller.textControl.value).toBe('Al');

    controller.textControl.setValue('Be');
    expect(controller.buildApplyResult()).toEqual({
      key: 'name',
      filter: {
        operator: 'and',
        constraints: [{ mode: 'startsWith', value: 'Be' }],
      },
    });
    expect(applied).toEqual({ constraints: [{ mode: 'startsWith', value: 'Al' }] });

    controller.destroy();
  });

  it('initializes single numbers and inclusive number ranges', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();

    controller.initialize(numberColumn, {
      constraints: [{ mode: 'gte', value: 10 }],
    });
    expect(controller.numberControl.value).toBe(10);
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'gte',
      value: 10,
    });

    controller.initialize(numberColumn, {
      constraints: [{ mode: 'between', value: { from: 5, to: 15 } }],
    });
    expect(controller.numberFromControl.value).toBe(5);
    expect(controller.numberToControl.value).toBe(15);
    controller.numberFromControl.setValue(20);
    expect(controller.valid()).toBe(false);
    expect(controller.buildApplyResult()).toBeNull();
    controller.numberToControl.setValue(25);
    expect(controller.valid()).toBe(true);
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'between',
      value: { from: 20, to: 25 },
    });

    controller.destroy();
  });

  it('adapts date-only values and ranges without display-string matching', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();

    controller.initialize(dateColumn, {
      constraints: [{ mode: 'is', value: '2026-08-20' }],
    });
    expect(controller.dateControl.value).toBe('2026-08-20');
    controller.dateControl.setValue('2026-08-21');
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'is',
      value: '2026-08-21',
    });

    controller.initialize(dateColumn, {
      constraints: [{ mode: 'between', value: { from: '2026-08-20', to: '2026-08-22' } }],
    });
    expect(controller.dateControl.value).toMatchObject({
      start: expect.any(Date),
      end: expect.any(Date),
    });
    controller.dateControl.setValue({
      start: new Date(2026, 7, 21),
      end: new Date(2026, 7, 23),
    });
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'between',
      value: { from: '2026-08-21', to: '2026-08-23' },
    });

    controller.destroy();
  });

  it('adapts instant values and rejects reversed instant ranges', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();

    controller.initialize(instantColumn, { constraints: [] });
    controller.dateControl.setValue('2026-08-20T23:30');
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'is',
      value: new Date('2026-08-20T23:30').toISOString(),
    });

    controller.modeControl.setValue('between');
    controller.instantFromControl.setValue('2026-08-22T12:00');
    controller.instantToControl.setValue('2026-08-21T12:00');
    expect(controller.valid()).toBe(false);
    expect(controller.buildApplyResult()).toBeNull();
    controller.instantFromControl.setValue('');
    expect(controller.valid()).toBe(true);
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'between',
      value: { from: null, to: new Date('2026-08-21T12:00').toISOString() },
    });

    controller.destroy();
  });

  it('covers invalid temporal adapters and both structural date-range boundaries', () => {
    const instant = new Date('2026-08-20T10:30:00.000Z');
    expect(neuTableDateFilterValue(instant, 'instant')).toBe(instant.toISOString());
    expect(neuTableInstantFilterValue('not-a-date')).toBeNull();
    expect(isNeuTableDateRange({ end: null })).toBe(true);
    expect(isNeuTableDateRange({ other: null })).toBe(false);

    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(instantColumn, {
      constraints: [
        {
          mode: 'is',
          value: { precision: 'instant', value: '2026-08-20T10:30:00.000Z' },
        },
      ],
    });
    expect(controller.dateControl.value).toMatch(/^2026-08-20T\d{2}:30$/);
    controller.dateControl.setValue(new Date('invalid'));
    expect(controller.value()).toBeNull();
    controller.destroy();
  });

  it('adapts boolean values without adding a match mode', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();

    controller.initialize(booleanColumn, {
      constraints: [{ value: false }],
    });
    expect(controller.kind()).toBe('boolean');
    expect(controller.mode()).toBeNull();
    expect(controller.booleanControl.value).toBe(false);
    expect(controller.buildApplyResult()).toEqual({
      key: 'active',
      filter: { operator: 'and', constraints: [{ value: false }] },
    });

    controller.destroy();
  });

  it('preserves values across compatible mode changes and clears across range shape changes', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, { constraints: [] });
    controller.textControl.setValue('ta');

    controller.modeControl.setValue('endsWith');
    expect(controller.mode()).toBe('endsWith');
    expect(controller.value()).toBe('ta');
    controller.modeControl.setValue('in');
    expect(controller.mode()).toBe('endsWith');
    controller.modeControl.setValue(42);
    expect(controller.mode()).toBe('endsWith');

    controller.initialize(numberColumn, {
      constraints: [{ mode: 'equals', value: 10 }],
    });
    controller.modeControl.setValue('between');
    expect(controller.mode()).toBe('between');
    expect(controller.value()).toEqual({ from: null, to: null });

    controller.destroy();
  });

  it('keeps Clear draft-only and returns a clear intent only on Apply', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, {
      constraints: [{ mode: 'contains', value: 'Alpha' }],
    });

    controller.clear();
    expect(controller.value()).toBeNull();
    expect(controller.textControl.value).toBe('');
    expect(controller.buildApplyResult()).toEqual({
      key: 'name',
      filter: { operator: 'and', constraints: [] },
    });

    controller.destroy();
  });

  it('discards draft state and releases the active column', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, {
      constraints: [{ mode: 'contains', value: 'Alpha' }],
    });

    controller.discard();
    expect(controller.kind()).toBeNull();
    expect(controller.mode()).toBeNull();
    expect(controller.value()).toBeNull();
    expect(controller.textControl.value).toBe('');
    expect(controller.buildApplyResult()).toBeNull();

    controller.destroy();
  });

  it('initializes and edits multiple applied rules with their operator intact', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, {
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    });

    expect(controller.hasMultipleRules()).toBe(true);
    expect(controller.operator()).toBe('or');
    expect(controller.rules().map((rule) => rule.value())).toEqual(['Al', 'ta']);
    expect(controller.buildApplyResult()?.filter).toEqual({
      operator: 'or',
      constraints: [
        { mode: 'startsWith', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    });

    controller.destroy();
  });

  it('creates one empty rule for zero constraints and appends independent rules with stable ids', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, { constraints: [] });
    const first = controller.rules()[0];
    expect(controller.rules()).toHaveLength(1);
    expect(first.mode()).toBe('contains');
    expect(first.value()).toBeNull();

    const secondId = controller.addRule();
    const second = controller.rules()[1];
    expect(secondId).toBe(second.id);
    expect(second.id).not.toBe(first.id);
    first.textControl.setValue('Al');
    second.modeControl.setValue('endsWith');
    second.textControl.setValue('ta');
    controller.operatorControl.setValue('or');

    expect(controller.buildApplyResult()?.filter).toEqual({
      operator: 'or',
      constraints: [
        { mode: 'contains', value: 'Al' },
        { mode: 'endsWith', value: 'ta' },
      ],
    });
    expect(controller.rules().map((rule) => rule.id)).toEqual([first.id, second.id]);
    controller.destroy();
  });

  it('removes first, middle, and last rules without re-keying survivors', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, {
      operator: 'and',
      constraints: [
        { mode: 'contains', value: 'one' },
        { mode: 'contains', value: 'two' },
        { mode: 'contains', value: 'three' },
        { mode: 'contains', value: 'four' },
      ],
    });
    const [first, second, third, fourth] = controller.rules();

    expect(controller.removeRule(second.id)).toBe(true);
    expect(controller.rules().map((rule) => rule.id)).toEqual([first.id, third.id, fourth.id]);
    expect(controller.removeRule(first.id)).toBe(true);
    expect(controller.rules().map((rule) => rule.id)).toEqual([third.id, fourth.id]);
    expect(controller.removeRule(fourth.id)).toBe(true);
    expect(controller.rules().map((rule) => rule.id)).toEqual([third.id]);
    expect(controller.removeRule(third.id)).toBe(true);
    expect(controller.rules()).toHaveLength(1);
    expect(controller.rules()[0].id).not.toBe(third.id);
    expect(controller.rules()[0].value()).toBeNull();
    controller.destroy();
  });

  it('omits empty rules, normalizes a single constraint to AND, and blocks all on one invalid rule', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(numberColumn, { operator: 'or', constraints: [] });
    controller.numberControl.setValue(10);
    controller.addRule();
    controller.operatorControl.setValue('or');
    expect(controller.buildApplyResult()?.filter).toEqual({
      operator: 'and',
      constraints: [{ mode: 'equals', value: 10 }],
    });

    const invalidRule = controller.rules()[1];
    invalidRule.modeControl.setValue('between');
    invalidRule.numberFromControl.setValue(20);
    invalidRule.numberToControl.setValue(5);
    expect(invalidRule.valid()).toBe(false);
    expect(controller.valid()).toBe(false);
    expect(controller.buildApplyResult()).toBeNull();
    controller.destroy();
  });

  it('keeps boolean truthfully single-rule and rejects Add rule', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(booleanColumn, { constraints: [{ value: true }] });
    expect(controller.canAddRule()).toBe(false);
    expect(controller.addRule()).toBeNull();
    expect(controller.rules()).toHaveLength(1);
    controller.booleanControl.setValue('invalid');
    expect(controller.value()).toBeNull();
    controller.destroy();
  });

  it('owns independent Select controls per rule and defaults new combinations to OR', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    const objectValue = { id: 1 };
    controller.initialize(selectColumn, { constraints: [] });

    expect(controller.kind()).toBe('select');
    expect(controller.operator()).toBe('or');
    expect(controller.rules()[0].mode()).toBe('equals');
    controller.rules()[0].selectControl.setValue(0);
    controller.addRule();
    controller.rules()[1].selectControl.setValue(objectValue);

    expect(controller.rules()[0].selectControl).not.toBe(controller.rules()[1].selectControl);
    expect(controller.buildApplyResult()?.filter).toEqual({
      operator: 'or',
      constraints: [
        { mode: 'equals', value: 0 },
        { mode: 'equals', value: objectValue },
      ],
    });
    expect(controller.rules()[1].value()).toBe(objectValue);
    controller.destroy();
  });

  it('keeps MultiSelect single-rule and snapshots the draft selection array', () => {
    const selected = ['active'];
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(multiSelectColumn, { constraints: [{ mode: 'in', value: selected }] });

    expect(controller.kind()).toBe('multiSelect');
    expect(controller.canAddRule()).toBe(false);
    expect(controller.addRule()).toBeNull();
    expect(controller.multiSelectControl.value).toEqual(['active']);
    expect(controller.multiSelectControl.value).not.toBe(selected);
    selected[0] = 'pending';
    expect(controller.buildApplyResult()?.filter.constraints[0]).toEqual({
      mode: 'in',
      value: ['active'],
    });

    const next = ['active', 'pending'];
    controller.multiSelectControl.setValue(next);
    next[0] = 'changed';
    expect(controller.value()).toEqual(['active', 'pending']);
    controller.destroy();
  });

  it('keeps custom template values draft-only with bounded snapshot semantics', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    const applied = ['active'];
    controller.initialize(customColumn, { constraints: [{ value: applied }] });

    expect(controller.kind()).toBe('custom');
    expect(controller.canAddRule()).toBe(false);
    expect(controller.value()).toEqual(['active']);
    expect(controller.value()).not.toBe(applied);
    expect(controller.setValue(new Date('2026-08-20T00:00:00.000Z'))).toBe(true);
    expect(controller.value()).toEqual(new Date('2026-08-20T00:00:00.000Z'));
    controller.clear();
    expect(controller.buildApplyResult()).toEqual({
      key: 'custom',
      filter: { operator: 'and', constraints: [] },
    });
    controller.destroy();
  });

  it('shows unsupported existing MultiSelect and custom multi-rules read-only', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(multiSelectColumn, {
      operator: 'or',
      constraints: [
        { mode: 'in', value: ['active'] },
        { mode: 'in', value: ['pending'] },
      ],
    });
    expect(controller.readOnly()).toBe(true);
    expect(controller.rules()).toHaveLength(2);
    expect(controller.buildApplyResult()).toBeNull();

    controller.initialize(customColumn, {
      operator: 'and',
      constraints: [{ value: 'one' }, { value: 'two' }],
    });
    expect(controller.readOnly()).toBe(true);
    expect(controller.rules().map((rule) => rule.value())).toEqual(['one', 'two']);
    controller.destroy();
  });

  it('keeps server-side single-rule drafts editable without enabling Add rule', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(
      textColumn,
      { constraints: [{ mode: 'contains', value: 'Alpha' }] },
      { allowMultipleRules: false },
    );

    expect(controller.multipleRulesEnabled()).toBe(false);
    expect(controller.readOnly()).toBe(false);
    expect(controller.canAddRule()).toBe(false);
    expect(controller.addRule()).toBeNull();
    controller.textControl.setValue('Beta');
    expect(controller.buildApplyResult()?.filter).toEqual({
      operator: 'and',
      constraints: [{ mode: 'contains', value: 'Beta' }],
    });

    controller.destroy();
  });

  it('protects existing server-side multiple rules from destructive draft operations', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    const applied = {
      operator: 'or' as const,
      constraints: [
        { mode: 'startsWith' as const, value: 'Al' },
        { mode: 'endsWith' as const, value: 'ta' },
      ],
    };
    controller.initialize(textColumn, applied, { allowMultipleRules: false });
    const firstId = controller.rules()[0].id;

    expect(controller.readOnly()).toBe(true);
    expect(controller.rules().map((rule) => rule.value())).toEqual(['Al', 'ta']);
    expect(controller.addRule()).toBeNull();
    expect(controller.removeRule(firstId)).toBe(false);
    controller.clear();
    controller.operatorControl.setValue('and');
    expect(controller.operator()).toBe('or');
    expect(controller.rules().map((rule) => rule.value())).toEqual(['Al', 'ta']);
    expect(controller.buildApplyResult()).toBeNull();
    expect(applied.constraints).toEqual([
      { mode: 'startsWith', value: 'Al' },
      { mode: 'endsWith', value: 'ta' },
    ]);

    controller.destroy();
  });

  it('tears down removed and cleared rule subscriptions across repeated cycles', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(textColumn, { constraints: [] });

    for (let index = 0; index < 5; index++) {
      const id = controller.addRule()!;
      const removed = controller.rules().find((rule) => rule.id === id)!;
      expect(controller.removeRule(id)).toBe(true);
      removed.textControl.setValue(`stale-${index}`);
      expect(controller.rules().some((rule) => rule.value() === `stale-${index}`)).toBe(false);
    }

    const beforeClear = controller.rules()[0];
    controller.clear();
    beforeClear.textControl.setValue('stale-clear');
    expect(controller.rules()[0].value()).toBeNull();
    controller.destroy();
  });

  it('tears down control subscriptions deterministically', () => {
    const onDateControlCommitted = vi.fn();
    const controller = new NeuTableAdvancedFilterController<FilterRow>(onDateControlCommitted);
    controller.initialize(dateColumn, { constraints: [] });
    controller.dateControl.setValue('2026-08-20');
    expect(controller.value()).toBe('2026-08-20');
    expect(onDateControlCommitted).toHaveBeenCalledTimes(1);

    controller.destroy();
    controller.dateControl.setValue('2026-08-21');
    controller.textControl.setValue('stale');
    expect(controller.value()).toBeNull();
    expect(onDateControlCommitted).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('keeps controller state and controls isolated per Table instance', () => {
    const first = new NeuTableAdvancedFilterController<FilterRow>();
    const second = new NeuTableAdvancedFilterController<FilterRow>();
    first.initialize(textColumn, { constraints: [] });
    second.initialize(textColumn, { constraints: [] });

    first.textControl.setValue('Alpha');
    expect(first.value()).toBe('Alpha');
    expect(second.value()).toBeNull();
    expect(second.textControl.value).toBe('');

    first.destroy();
    second.destroy();
  });

  it('resolves the current column definition for changes while a draft is open', () => {
    let currentColumn: NeuTableColumn<FilterRow> | null = textColumn;
    const controller = new NeuTableAdvancedFilterController<FilterRow>(
      () => undefined,
      () => currentColumn,
    );
    controller.initialize(textColumn, { constraints: [] });

    currentColumn = numberColumn;
    controller.modeControl.setValue('gte');
    expect(controller.mode()).toBe('gte');
    controller.textControl.setValue('not-a-number');
    controller.modeControl.setValue('gt');
    expect(controller.valid()).toBe(false);

    currentColumn = null;
    controller.modeControl.setValue('equals');
    expect(controller.mode()).toBe('gt');

    controller.destroy();
  });

  it('rejects unavailable, stale, non-finite, and malformed draft mutations', () => {
    let currentColumn: NeuTableColumn<FilterRow> | null = null;
    const controller = new NeuTableAdvancedFilterController<FilterRow>(
      () => undefined,
      () => currentColumn,
    );

    controller.initialize({ key: 'name', header: 'Name' }, undefined);
    expect(controller.kind()).toBeNull();
    expect(controller.rules()).toEqual([]);
    expect(controller.addRule()).toBeNull();
    expect(controller.removeRule('missing')).toBe(false);
    controller.clear();
    expect(controller.setValue('ignored')).toBe(false);
    expect(controller.buildApplyResult()).toBeNull();

    currentColumn = numberColumn;
    controller.initialize(numberColumn, { constraints: [] });
    expect(controller.removeRule('missing')).toBe(false);
    controller.numberControl.setValue(Number.POSITIVE_INFINITY);
    expect(controller.valid()).toBe(false);
    controller.modeControl.setValue('between');
    controller.numberFromControl.setValue(Number.NaN);
    controller.numberToControl.setValue(10);
    expect(controller.valid()).toBe(false);

    currentColumn = instantColumn;
    controller.initialize(instantColumn, { constraints: [] });
    controller.modeControl.setValue('between');
    controller.instantFromControl.setValue('invalid');
    controller.instantToControl.setValue('2026-08-21T12:00');
    expect(controller.valid()).toBe(false);

    currentColumn = dateColumn;
    controller.initialize(dateColumn, { constraints: [] });
    controller.modeControl.setValue('between');
    controller.dateControl.setValue('not-a-range');
    expect(controller.value()).toEqual({ from: null, to: null });
    controller.dateControl.setValue({
      start: new Date(2026, 7, 22),
      end: new Date(2026, 7, 21),
    });
    expect(controller.valid()).toBe(false);

    currentColumn = textColumn;
    controller.initialize(textColumn, { constraints: [] });
    currentColumn = null;
    expect(controller.addRule()).toBeNull();
    expect(controller.removeRule(controller.rules()[0].id)).toBe(false);
    expect(controller.buildApplyResult()).toBeNull();

    controller.destroy();
    controller.destroy();
  });

  it('keeps operator, clear, legacy validation, and stale-control guards deterministic', () => {
    const controller = new NeuTableAdvancedFilterController<FilterRow>();
    controller.initialize(selectColumn, { operator: 'and', constraints: [{ value: 'admin' }] });
    controller.setOperator('unsupported');
    expect(controller.operator()).toBe('and');
    controller.setOperator('and');
    expect(controller.operatorControl.value).toBe('and');
    controller.clear();
    expect(controller.operator()).toBe('or');
    expect(controller.buildApplyResult()?.filter.constraints).toEqual([]);

    const legacyText: NeuTableColumn<FilterRow> = {
      key: 'name',
      header: 'Name',
      filterable: true,
    };
    controller.initialize(legacyText, { constraints: [] });
    controller.textControl.setValue('valid');
    expect(controller.valid()).toBe(true);
    controller.textControl.setValue(42 as never);
    controller.modeControl.setValue('endsWith');
    expect(controller.valid()).toBe(false);

    let current: NeuTableColumn<FilterRow> | null = customColumn;
    const resolvingController = new NeuTableAdvancedFilterController<FilterRow>(
      () => undefined,
      () => current,
    );
    resolvingController.initialize(customColumn, { constraints: [] });
    current = null;
    expect(resolvingController.setValue('stale')).toBe(false);

    current = dateColumn;
    resolvingController.initialize(dateColumn, { constraints: [] });
    current = null;
    resolvingController.dateControl.setValue('2026-08-20');
    expect(resolvingController.value()).toBeNull();

    expect(neuTableDateInputControlValue(new Date('2026-08-20T10:11:00Z'), 'instant')).not.toBe('');
    controller.destroy();
    resolvingController.destroy();
  });
});
