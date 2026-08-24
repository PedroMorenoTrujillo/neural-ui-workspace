import { computed, signal, type WritableSignal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import type { NeuDateRange } from '@neural-ui/core/date-input';
import {
  buildNeuTableFilterState,
  isNeuTableFilterValueEmpty,
  normalizeNeuTableDatePoint,
  resolveNeuTableFilterMatchMode,
} from './neu-table-filter.engine';
import type {
  NeuTableColumn,
  NeuTableFilterMatchMode,
  NeuTableNumberRangeValue,
} from './neu-table.types';

export type InternalAdvancedFilterKind = 'text' | 'number' | 'date' | 'boolean';
export type InternalAdvancedFilterControlKind =
  | InternalAdvancedFilterKind
  | 'select'
  | 'multiSelect'
  | 'none';
export type InternalAdvancedFilterOperator = 'and' | 'or';

type InternalAdvancedFilterMatchMode = Exclude<NeuTableFilterMatchMode, 'in'>;

export interface InternalAdvancedFilterConstraint {
  mode?: NeuTableFilterMatchMode;
  value: unknown;
}

export interface InternalAdvancedFilterAppliedValue {
  operator?: InternalAdvancedFilterOperator;
  constraints: readonly InternalAdvancedFilterConstraint[];
}

export interface InternalAdvancedFilterApplyResult {
  key: string;
  filter: {
    operator: InternalAdvancedFilterOperator;
    constraints: readonly InternalAdvancedFilterConstraint[];
  };
}

export interface InternalAdvancedFilterCapabilities {
  allowMultipleRules?: boolean;
}

export interface InternalAdvancedFilterDraftRule {
  readonly id: string;
  readonly mode: WritableSignal<NeuTableFilterMatchMode | null>;
  readonly value: WritableSignal<unknown>;
  readonly valid: WritableSignal<boolean>;
  readonly modeControl: FormControl<unknown>;
  readonly textControl: FormControl<string>;
  readonly numberControl: FormControl<number | null>;
  readonly numberFromControl: FormControl<number | null>;
  readonly numberToControl: FormControl<number | null>;
  readonly instantFromControl: FormControl<string>;
  readonly instantToControl: FormControl<string>;
  readonly booleanControl: FormControl<unknown>;
  readonly dateControl: FormControl<unknown>;
}

interface OwnedAdvancedFilterDraftRule extends InternalAdvancedFilterDraftRule {
  readonly subscriptions: Subscription;
}

export function neuTableAdvancedFilterControlKind<T>(
  column: NeuTableColumn<T>,
): InternalAdvancedFilterControlKind {
  const kind = column.filterConfig?.kind;
  if (
    kind === 'text' ||
    kind === 'number' ||
    kind === 'date' ||
    kind === 'boolean' ||
    kind === 'select' ||
    kind === 'multiSelect'
  ) {
    return kind;
  }
  if (!column.filterConfig && column.filterType === 'select') return 'select';
  if (!column.filterConfig && column.filterType === 'date') return 'date';
  return !column.filterConfig && column.filterable ? 'text' : 'none';
}

export function neuTableAdvancedFilterDatePrecision<T>(
  column: NeuTableColumn<T>,
): 'date-only' | 'instant' {
  return column.filterConfig?.kind === 'date'
    ? (column.filterConfig.precision ?? 'date-only')
    : 'date-only';
}

export function neuTableAdvancedFilterModes<T>(
  column: NeuTableColumn<T>,
): readonly InternalAdvancedFilterMatchMode[] {
  const kind = neuTableAdvancedFilterControlKind(column);
  return kind === 'number'
    ? ['equals', 'notEquals', 'lt', 'lte', 'gt', 'gte', 'between']
    : kind === 'date'
      ? ['is', 'isNot', 'before', 'after', 'between']
      : ['contains', 'startsWith', 'endsWith', 'equals', 'notEquals', 'notContains'];
}

export function neuTableNumberRangeValue(value: unknown): NeuTableNumberRangeValue {
  if (!isRecord(value)) return { from: null, to: null };
  return {
    from: typeof value['from'] === 'number' ? value['from'] : null,
    to: typeof value['to'] === 'number' ? value['to'] : null,
  };
}

export function neuTableDateRangeControlValue(value: unknown): NeuDateRange {
  if (!isRecord(value)) return { start: null, end: null };
  return {
    start: dateOnlyControlDate(value['from']),
    end: dateOnlyControlDate(value['to']),
  };
}

export function neuTableDateRangeFilterValue(value: unknown): {
  from: unknown;
  to: unknown;
} {
  if (!isRecord(value)) return { from: null, to: null };
  return { from: value['from'] ?? null, to: value['to'] ?? null };
}

export function neuTableInstantRangeControlValue(value: unknown, boundary: 'from' | 'to'): string {
  return neuTableDateInputControlValue(neuTableDateRangeFilterValue(value)[boundary], 'instant');
}

export function neuTableDateInputControlValue(
  value: unknown,
  precision: 'date-only' | 'instant',
): string {
  if (precision === 'date-only') {
    return normalizeNeuTableDatePoint(value, 'date-only')?.value ?? '';
  }
  const date = dateControlDate(value);
  return date ? formatLocalDateTime(date) : '';
}

export function neuTableDateFilterValue(
  date: Date | null,
  precision: 'date-only' | 'instant',
): string | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return precision === 'date-only' ? formatLocalDate(date) : date.toISOString();
}

export function neuTableInstantFilterValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function isNeuTableDateRange(value: unknown): value is NeuDateRange {
  return isRecord(value) && ('start' in value || 'end' in value);
}

export class NeuTableAdvancedFilterController<T extends object> {
  readonly kind = signal<InternalAdvancedFilterKind | null>(null);
  readonly operator = signal<InternalAdvancedFilterOperator>('and');
  readonly rules = signal<readonly InternalAdvancedFilterDraftRule[]>([]);
  readonly mode = computed(() => this.rules()[0]?.mode() ?? null);
  readonly value = computed(() => this.rules()[0]?.value() ?? null);
  readonly valid = computed(() => this.rules().every((rule) => rule.valid()));
  readonly hasMultipleRules = computed(() => this.rules().length > 1);
  readonly multipleRulesEnabled = signal(true);
  readonly readOnly = computed(
    () => !this.multipleRulesEnabled() && this.hasMultipleRules(),
  );
  readonly canAddRule = computed(
    () =>
      this.multipleRulesEnabled() && this.kind() !== null && this.kind() !== 'boolean',
  );
  readonly operatorControl = new FormControl<InternalAdvancedFilterOperator>('and', {
    nonNullable: true,
  });

  // Deferred E2 controls stay instance-local but outside the production E4 rule model.
  readonly selectControl = new FormControl<unknown>(null);
  readonly multiSelectControl = new FormControl<unknown[]>([], { nonNullable: true });

  private readonly _idleRule = createEmptyRule('idle');
  private readonly _subscriptions = new Subscription();
  private _ownedRules: OwnedAdvancedFilterDraftRule[] = [];
  private _column: NeuTableColumn<T> | null = null;
  private _nextRuleId = 0;
  private _destroyed = false;

  constructor(
    private readonly _onDateControlCommitted: () => void = () => undefined,
    private readonly _resolveColumn?: (key: string) => NeuTableColumn<T> | null,
  ) {
    this._subscriptions.add(
      this.operatorControl.valueChanges.subscribe((operator) => this.setOperator(operator)),
    );
  }

  get modeControl(): FormControl<unknown> {
    return this._ownedRules[0]?.modeControl ?? this._idleRule.modeControl;
  }

  get textControl(): FormControl<string> {
    return this._ownedRules[0]?.textControl ?? this._idleRule.textControl;
  }

  get numberControl(): FormControl<number | null> {
    return this._ownedRules[0]?.numberControl ?? this._idleRule.numberControl;
  }

  get numberFromControl(): FormControl<number | null> {
    return this._ownedRules[0]?.numberFromControl ?? this._idleRule.numberFromControl;
  }

  get numberToControl(): FormControl<number | null> {
    return this._ownedRules[0]?.numberToControl ?? this._idleRule.numberToControl;
  }

  get instantFromControl(): FormControl<string> {
    return this._ownedRules[0]?.instantFromControl ?? this._idleRule.instantFromControl;
  }

  get instantToControl(): FormControl<string> {
    return this._ownedRules[0]?.instantToControl ?? this._idleRule.instantToControl;
  }

  get booleanControl(): FormControl<unknown> {
    return this._ownedRules[0]?.booleanControl ?? this._idleRule.booleanControl;
  }

  get dateControl(): FormControl<unknown> {
    return this._ownedRules[0]?.dateControl ?? this._idleRule.dateControl;
  }

  initialize(
    column: NeuTableColumn<T>,
    applied: InternalAdvancedFilterAppliedValue | undefined,
    capabilities: InternalAdvancedFilterCapabilities = {},
  ): void {
    this._disposeRules();
    this._resetDeferredControls();
    this._column = column;
    this.multipleRulesEnabled.set(capabilities.allowMultipleRules !== false);
    const controlKind = neuTableAdvancedFilterControlKind(column);
    const productionKind =
      controlKind === 'text' ||
      controlKind === 'number' ||
      controlKind === 'date' ||
      controlKind === 'boolean'
        ? controlKind
        : null;
    this.kind.set(productionKind);
    this.operator.set(applied?.operator === 'or' ? 'or' : 'and');
    this.operatorControl.setValue(this.operator(), { emitEvent: false });

    if (!productionKind) {
      this.rules.set([]);
      return;
    }

    const constraints =
      productionKind === 'boolean' && this.multipleRulesEnabled()
        ? (applied?.constraints.slice(0, 1) ?? [])
        : (applied?.constraints ?? []);
    const sources = constraints.length > 0 ? constraints : [null];
    this._ownedRules = sources.map((constraint) => this._createRule(column, constraint));
    this.rules.set(this._ownedRules);
  }

  setOperator(operator: unknown): void {
    if (this.readOnly()) {
      this.operatorControl.setValue(this.operator(), { emitEvent: false });
      return;
    }
    if (operator !== 'and' && operator !== 'or') return;
    this.operator.set(operator);
    if (this.operatorControl.value !== operator) {
      this.operatorControl.setValue(operator, { emitEvent: false });
    }
  }

  addRule(): string | null {
    const column = this._currentColumn();
    if (!column || !this.canAddRule()) return null;
    const rule = this._createRule(column, null);
    this._ownedRules = [...this._ownedRules, rule];
    this.rules.set(this._ownedRules);
    return rule.id;
  }

  removeRule(id: string): boolean {
    if (this.readOnly()) return false;
    const index = this._ownedRules.findIndex((rule) => rule.id === id);
    const column = this._currentColumn();
    if (index < 0 || !column) return false;

    this._ownedRules[index].subscriptions.unsubscribe();
    if (this._ownedRules.length === 1) {
      this._ownedRules = [this._createRule(column, null)];
    } else {
      this._ownedRules = this._ownedRules.filter((_, ruleIndex) => ruleIndex !== index);
    }
    this.rules.set(this._ownedRules);
    return true;
  }

  clear(): void {
    if (this.readOnly()) return;
    const column = this._currentColumn();
    if (!column || !this.kind()) return;
    this._disposeRules();
    this._ownedRules = [this._createRule(column, null)];
    this.rules.set(this._ownedRules);
    this.operator.set('and');
    this.operatorControl.setValue('and', { emitEvent: false });
    this._resetDeferredControls();
  }

  discard(): void {
    this._disposeRules();
    this._column = null;
    this.kind.set(null);
    this.multipleRulesEnabled.set(true);
    this.operator.set('and');
    this.operatorControl.setValue('and', { emitEvent: false });
    this.rules.set([]);
    this._resetDeferredControls();
    resetRuleControls(this._idleRule);
  }

  buildApplyResult(): InternalAdvancedFilterApplyResult | null {
    if (this.readOnly()) return null;
    const column = this._currentColumn();
    if (!column || !this.valid()) return null;
    const constraints: InternalAdvancedFilterConstraint[] = [];
    for (const rule of this._ownedRules) {
      const value = rule.value();
      if (isNeuTableFilterValueEmpty(value)) continue;
      const mode = this.kind() === 'boolean' ? undefined : (rule.mode() ?? undefined);
      constraints.push({ ...(mode ? { mode } : {}), value });
    }
    return {
      key: column.key,
      filter: {
        operator: constraints.length > 1 ? this.operator() : 'and',
        constraints,
      },
    };
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._subscriptions.unsubscribe();
    this.discard();
  }

  private _createRule(
    column: NeuTableColumn<T>,
    constraint: InternalAdvancedFilterConstraint | null,
  ): OwnedAdvancedFilterDraftRule {
    const kind = this.kind();
    const mode =
      kind && kind !== 'boolean'
        ? (resolveNeuTableFilterMatchMode(column as NeuTableColumn<T, string>, constraint?.mode) ??
          null)
        : null;
    const value = snapshotDraftValue(constraint?.value ?? null);
    const rule: OwnedAdvancedFilterDraftRule = {
      ...createEmptyRule(`rule-${this._nextRuleId++}`),
      subscriptions: new Subscription(),
    };
    rule.mode.set(mode);
    rule.value.set(value);
    rule.modeControl.setValue(mode, { emitEvent: false });
    this._writeRuleControls(rule, kind, mode, value, column);
    this._subscribeRule(rule);
    this._validateRule(rule, column);
    return rule;
  }

  private _writeRuleControls(
    rule: OwnedAdvancedFilterDraftRule,
    kind: InternalAdvancedFilterKind | null,
    mode: NeuTableFilterMatchMode | null,
    value: unknown,
    column: NeuTableColumn<T>,
  ): void {
    if (kind === 'text') {
      rule.textControl.setValue(typeof value === 'string' ? value : '', { emitEvent: false });
    } else if (kind === 'number') {
      if (mode === 'between') {
        const range = neuTableNumberRangeValue(value);
        rule.numberFromControl.setValue(range.from, { emitEvent: false });
        rule.numberToControl.setValue(range.to, { emitEvent: false });
      } else {
        rule.numberControl.setValue(typeof value === 'number' ? value : null, {
          emitEvent: false,
        });
      }
    } else if (kind === 'date') {
      const precision = neuTableAdvancedFilterDatePrecision(column);
      if (mode === 'between' && precision === 'instant') {
        rule.instantFromControl.setValue(neuTableInstantRangeControlValue(value, 'from'), {
          emitEvent: false,
        });
        rule.instantToControl.setValue(neuTableInstantRangeControlValue(value, 'to'), {
          emitEvent: false,
        });
      } else {
        rule.dateControl.setValue(
          mode === 'between'
            ? neuTableDateRangeControlValue(value)
            : neuTableDateInputControlValue(value, precision),
          { emitEvent: false },
        );
      }
    } else if (kind === 'boolean') {
      rule.booleanControl.setValue(value === true || value === false ? value : null, {
        emitEvent: false,
      });
    }
  }

  private _subscribeRule(rule: OwnedAdvancedFilterDraftRule): void {
    rule.subscriptions.add(
      rule.modeControl.valueChanges.subscribe((value) => this._onModeChange(rule, value)),
    );
    rule.subscriptions.add(
      rule.textControl.valueChanges.subscribe((value) => this._setRuleValue(rule, value, true)),
    );
    rule.subscriptions.add(
      rule.numberControl.valueChanges.subscribe((value) =>
        this._setRuleValue(
          rule,
          value,
          value === null || (typeof value === 'number' && Number.isFinite(value)),
        ),
      ),
    );
    rule.subscriptions.add(
      rule.numberFromControl.valueChanges.subscribe(() => this._updateNumberRangeDraft(rule)),
    );
    rule.subscriptions.add(
      rule.numberToControl.valueChanges.subscribe(() => this._updateNumberRangeDraft(rule)),
    );
    rule.subscriptions.add(
      rule.instantFromControl.valueChanges.subscribe(() => this._updateInstantRangeDraft(rule)),
    );
    rule.subscriptions.add(
      rule.instantToControl.valueChanges.subscribe(() => this._updateInstantRangeDraft(rule)),
    );
    rule.subscriptions.add(
      rule.booleanControl.valueChanges.subscribe((value) =>
        this._setRuleValue(rule, value === true || value === false ? value : null, true),
      ),
    );
    rule.subscriptions.add(
      rule.dateControl.valueChanges.subscribe((value) => {
        this._updateDateDraft(rule, value);
        this._onDateControlCommitted();
      }),
    );
  }

  private _onModeChange(rule: OwnedAdvancedFilterDraftRule, value: unknown): void {
    const column = this._currentColumn();
    if (!column || typeof value !== 'string') return;
    if (!neuTableAdvancedFilterModes(column).includes(value as InternalAdvancedFilterMatchMode)) {
      return;
    }
    const previous = rule.mode();
    rule.mode.set(value as NeuTableFilterMatchMode);
    if ((previous === 'between') !== (value === 'between')) {
      resetRuleValueControls(rule);
      this._setRuleValue(rule, value === 'between' ? { from: null, to: null } : null, true);
    } else {
      this._validateRule(rule, column);
    }
  }

  private _updateNumberRangeDraft(rule: OwnedAdvancedFilterDraftRule): void {
    const from = rule.numberFromControl.value;
    const to = rule.numberToControl.value;
    const finite =
      (from === null || (typeof from === 'number' && Number.isFinite(from))) &&
      (to === null || (typeof to === 'number' && Number.isFinite(to)));
    this._setRuleValue(rule, { from, to }, finite && (from === null || to === null || from <= to));
  }

  private _updateDateDraft(rule: OwnedAdvancedFilterDraftRule, value: unknown): void {
    const column = this._currentColumn();
    if (!column || this.kind() !== 'date') return;
    const precision = neuTableAdvancedFilterDatePrecision(column);
    if (rule.mode() === 'between') {
      if (precision === 'instant' || !isNeuTableDateRange(value)) return;
      const range = {
        from: neuTableDateFilterValue(value.start, 'date-only'),
        to: neuTableDateFilterValue(value.end, 'date-only'),
      };
      this._setRuleValue(rule, range, isOrderedDateRange(range));
      return;
    }
    const raw = typeof value === 'string' ? value : '';
    const canonical =
      precision === 'instant'
        ? neuTableInstantFilterValue(raw)
        : (normalizeNeuTableDatePoint(raw, 'date-only')?.value ?? null);
    this._setRuleValue(rule, canonical, !raw || canonical !== null);
  }

  private _updateInstantRangeDraft(rule: OwnedAdvancedFilterDraftRule): void {
    const rawFrom = rule.instantFromControl.value;
    const rawTo = rule.instantToControl.value;
    const from = neuTableInstantFilterValue(rawFrom);
    const to = neuTableInstantFilterValue(rawTo);
    this._setRuleValue(
      rule,
      { from, to },
      (!rawFrom || from !== null) && (!rawTo || to !== null) && isOrderedDateRange({ from, to }),
    );
  }

  private _setRuleValue(rule: OwnedAdvancedFilterDraftRule, value: unknown, valid: boolean): void {
    rule.value.set(value);
    rule.valid.set(valid);
  }

  private _validateRule(rule: OwnedAdvancedFilterDraftRule, column: NeuTableColumn<T>): void {
    const value = rule.value();
    if (isNeuTableFilterValueEmpty(value)) {
      rule.valid.set(true);
      return;
    }
    if (this.kind() === 'text' && !column.filterConfig) {
      rule.valid.set(typeof value === 'string');
      return;
    }
    rule.valid.set(
      buildNeuTableFilterState(
        column as NeuTableColumn<T, string>,
        value,
        rule.mode() ?? undefined,
      ) !== null,
    );
  }

  private _disposeRules(): void {
    for (const rule of this._ownedRules) rule.subscriptions.unsubscribe();
    this._ownedRules = [];
    this.rules.set([]);
  }

  private _resetDeferredControls(): void {
    this.selectControl.setValue(null, { emitEvent: false });
    this.multiSelectControl.setValue([], { emitEvent: false });
  }

  private _currentColumn(): NeuTableColumn<T> | null {
    const column = this._column;
    return column && this._resolveColumn ? this._resolveColumn(column.key) : column;
  }
}

function createEmptyRule(id: string): InternalAdvancedFilterDraftRule {
  return {
    id,
    mode: signal<NeuTableFilterMatchMode | null>(null),
    value: signal<unknown>(null),
    valid: signal(true),
    modeControl: new FormControl<unknown>(null),
    textControl: new FormControl('', { nonNullable: true }),
    numberControl: new FormControl<number | null>(null),
    numberFromControl: new FormControl<number | null>(null),
    numberToControl: new FormControl<number | null>(null),
    instantFromControl: new FormControl('', { nonNullable: true }),
    instantToControl: new FormControl('', { nonNullable: true }),
    booleanControl: new FormControl<unknown>(null),
    dateControl: new FormControl<unknown>(null),
  };
}

function resetRuleControls(rule: InternalAdvancedFilterDraftRule): void {
  rule.mode.set(null);
  rule.value.set(null);
  rule.valid.set(true);
  rule.modeControl.setValue(null, { emitEvent: false });
  resetRuleValueControls(rule);
}

function resetRuleValueControls(rule: InternalAdvancedFilterDraftRule): void {
  rule.textControl.setValue('', { emitEvent: false });
  rule.numberControl.setValue(null, { emitEvent: false });
  rule.numberFromControl.setValue(null, { emitEvent: false });
  rule.numberToControl.setValue(null, { emitEvent: false });
  rule.dateControl.setValue(null, { emitEvent: false });
  rule.instantFromControl.setValue('', { emitEvent: false });
  rule.instantToControl.setValue('', { emitEvent: false });
  rule.booleanControl.setValue(null, { emitEvent: false });
}

function snapshotDraftValue(value: unknown): unknown {
  if (Array.isArray(value)) return [...value];
  if (isRecord(value) && ('from' in value || 'to' in value)) {
    return { from: value['from'] ?? null, to: value['to'] ?? null };
  }
  if (value instanceof Date) return new Date(value.getTime());
  return value;
}

function isOrderedDateRange(range: { from: unknown; to: unknown }): boolean {
  if (!range.from || !range.to) return true;
  const from = Date.parse(String(range.from));
  const to = Date.parse(String(range.to));
  return !Number.isNaN(from) && !Number.isNaN(to) && from <= to;
}

function dateOnlyControlDate(value: unknown): Date | null {
  const canonicalDate = normalizeNeuTableDatePoint(value, 'date-only')?.value;
  if (!canonicalDate) return null;
  const [year, month, day] = canonicalDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function dateControlDate(value: unknown): Date | null {
  const source = isRecord(value) && typeof value['value'] === 'string' ? value['value'] : value;
  if (source instanceof Date) {
    return Number.isNaN(source.getTime()) ? null : new Date(source.getTime());
  }
  if (typeof source !== 'string' || !source) return null;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatLocalDateTime(date: Date): string {
  return `${formatLocalDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
