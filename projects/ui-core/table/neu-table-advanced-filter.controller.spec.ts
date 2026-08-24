import {
  NeuTableAdvancedFilterController,
  isNeuTableDateRange,
  neuTableDateFilterValue,
  neuTableInstantFilterValue,
} from './neu-table-advanced-filter.controller';
import type { NeuTableColumn } from './neu-table.types';

interface FilterRow {
  name: string;
  score: number;
  createdAt: string;
  instant: string;
  active: boolean;
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

describe('NeuTableAdvancedFilterController', () => {
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
});
