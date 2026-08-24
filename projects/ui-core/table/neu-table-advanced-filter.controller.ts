import { signal } from '@angular/core';
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

type InternalAdvancedFilterMatchMode = Exclude<NeuTableFilterMatchMode, 'in'>;

export interface InternalAdvancedFilterConstraint {
  mode?: NeuTableFilterMatchMode;
  value: unknown;
}

export interface InternalAdvancedFilterAppliedValue {
  constraints: readonly InternalAdvancedFilterConstraint[];
}

export interface InternalAdvancedFilterApplyResult {
  key: string;
  constraint: InternalAdvancedFilterConstraint | null;
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
  readonly mode = signal<NeuTableFilterMatchMode | null>(null);
  readonly value = signal<unknown>(null);
  readonly valid = signal(true);
  readonly hasMultipleRules = signal(false);

  readonly modeControl = new FormControl<unknown>(null);
  readonly textControl = new FormControl('', { nonNullable: true });
  readonly numberControl = new FormControl<number | null>(null);
  readonly numberFromControl = new FormControl<number | null>(null);
  readonly numberToControl = new FormControl<number | null>(null);
  readonly instantFromControl = new FormControl('', { nonNullable: true });
  readonly instantToControl = new FormControl('', { nonNullable: true });
  readonly booleanControl = new FormControl<unknown>(null);
  readonly selectControl = new FormControl<unknown>(null);
  readonly multiSelectControl = new FormControl<unknown[]>([], { nonNullable: true });
  readonly dateControl = new FormControl<unknown>(null);

  private readonly _subscriptions = new Subscription();
  private _column: NeuTableColumn<T> | null = null;
  private _destroyed = false;

  constructor(
    private readonly _onDateControlCommitted: () => void = () => undefined,
    private readonly _resolveColumn?: (key: string) => NeuTableColumn<T> | null,
  ) {
    this._subscriptions.add(
      this.dateControl.valueChanges.subscribe((value) => {
        this._updateDateDraft(value);
        this._onDateControlCommitted();
      }),
    );
    this._subscriptions.add(
      this.modeControl.valueChanges.subscribe((value) => this._onModeChange(value)),
    );
    this._subscriptions.add(
      this.textControl.valueChanges.subscribe((value) => this._setValue(value, true)),
    );
    this._subscriptions.add(
      this.numberControl.valueChanges.subscribe((value) => this._setValue(value, true)),
    );
    this._subscriptions.add(
      this.numberFromControl.valueChanges.subscribe(() => this._updateNumberRangeDraft()),
    );
    this._subscriptions.add(
      this.numberToControl.valueChanges.subscribe(() => this._updateNumberRangeDraft()),
    );
    this._subscriptions.add(
      this.instantFromControl.valueChanges.subscribe(() => this._updateInstantRangeDraft()),
    );
    this._subscriptions.add(
      this.instantToControl.valueChanges.subscribe(() => this._updateInstantRangeDraft()),
    );
    this._subscriptions.add(
      this.booleanControl.valueChanges.subscribe((value) =>
        this._setValue(value === true || value === false ? value : null, true),
      ),
    );
  }

  initialize(
    column: NeuTableColumn<T>,
    applied: InternalAdvancedFilterAppliedValue | undefined,
  ): void {
    this._resetControls();
    this._column = column;
    const controlKind = neuTableAdvancedFilterControlKind(column);
    const productionKind =
      controlKind === 'text' ||
      controlKind === 'number' ||
      controlKind === 'date' ||
      controlKind === 'boolean'
        ? controlKind
        : null;
    const multiple = (applied?.constraints.length ?? 0) > 1;
    const constraint = applied?.constraints.length === 1 ? applied.constraints[0] : null;
    const mode =
      productionKind && productionKind !== 'boolean'
        ? (resolveNeuTableFilterMatchMode(column as NeuTableColumn<T, string>, constraint?.mode) ??
          null)
        : null;
    const value = constraint?.value ?? null;

    this.kind.set(productionKind);
    this.mode.set(mode);
    this.value.set(value);
    this.valid.set(true);
    this.hasMultipleRules.set(multiple);
    this.modeControl.setValue(mode, { emitEvent: false });

    if (productionKind === 'text') {
      this.textControl.setValue(typeof value === 'string' ? value : '', { emitEvent: false });
    } else if (productionKind === 'number') {
      if (mode === 'between') {
        const range = neuTableNumberRangeValue(value);
        this.numberFromControl.setValue(range.from, { emitEvent: false });
        this.numberToControl.setValue(range.to, { emitEvent: false });
      } else {
        this.numberControl.setValue(typeof value === 'number' ? value : null, {
          emitEvent: false,
        });
      }
    } else if (productionKind === 'date') {
      const precision = neuTableAdvancedFilterDatePrecision(column);
      if (mode === 'between' && precision === 'instant') {
        this.instantFromControl.setValue(neuTableInstantRangeControlValue(value, 'from'), {
          emitEvent: false,
        });
        this.instantToControl.setValue(neuTableInstantRangeControlValue(value, 'to'), {
          emitEvent: false,
        });
      } else {
        this.dateControl.setValue(
          mode === 'between'
            ? neuTableDateRangeControlValue(value)
            : neuTableDateInputControlValue(value, precision),
          { emitEvent: false },
        );
      }
    } else if (productionKind === 'boolean') {
      this.booleanControl.setValue(value === true || value === false ? value : null, {
        emitEvent: false,
      });
    }
  }

  clear(): void {
    const between = this.mode() === 'between';
    this.textControl.setValue('', { emitEvent: false });
    this.numberControl.setValue(null, { emitEvent: false });
    this.numberFromControl.setValue(null, { emitEvent: false });
    this.numberToControl.setValue(null, { emitEvent: false });
    this.dateControl.setValue(null, { emitEvent: false });
    this.instantFromControl.setValue('', { emitEvent: false });
    this.instantToControl.setValue('', { emitEvent: false });
    this.booleanControl.setValue(null, { emitEvent: false });
    this._setValue(between ? { from: null, to: null } : null, true);
  }

  discard(): void {
    this._column = null;
    this.kind.set(null);
    this.mode.set(null);
    this.value.set(null);
    this.valid.set(true);
    this.hasMultipleRules.set(false);
    this._resetControls();
  }

  buildApplyResult(): InternalAdvancedFilterApplyResult | null {
    const column = this._column;
    if (!column || this.hasMultipleRules() || !this.valid()) return null;
    const value = this.value();
    if (isNeuTableFilterValueEmpty(value)) {
      return { key: column.key, constraint: null };
    }
    const mode = this.kind() === 'boolean' ? undefined : (this.mode() ?? undefined);
    return {
      key: column.key,
      constraint: { ...(mode ? { mode } : {}), value },
    };
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._subscriptions.unsubscribe();
    this.discard();
  }

  private _onModeChange(value: unknown): void {
    const column = this._currentColumn();
    if (!column || typeof value !== 'string') return;
    if (!neuTableAdvancedFilterModes(column).includes(value as InternalAdvancedFilterMatchMode)) {
      return;
    }
    const previous = this.mode();
    this.mode.set(value as NeuTableFilterMatchMode);
    if ((previous === 'between') !== (value === 'between')) {
      this.clear();
    } else {
      this._validate(column);
    }
  }

  private _updateNumberRangeDraft(): void {
    const from = this.numberFromControl.value;
    const to = this.numberToControl.value;
    this._setValue({ from, to }, from === null || to === null || from <= to);
  }

  private _updateDateDraft(value: unknown): void {
    const column = this._currentColumn();
    if (!column || this.kind() !== 'date') return;
    const precision = neuTableAdvancedFilterDatePrecision(column);
    if (this.mode() === 'between') {
      if (precision === 'instant' || !isNeuTableDateRange(value)) return;
      const range = {
        from: neuTableDateFilterValue(value.start, 'date-only'),
        to: neuTableDateFilterValue(value.end, 'date-only'),
      };
      this._setValue(range, isOrderedDateRange(range));
      return;
    }
    const raw = typeof value === 'string' ? value : '';
    const canonical =
      precision === 'instant'
        ? neuTableInstantFilterValue(raw)
        : (normalizeNeuTableDatePoint(raw, 'date-only')?.value ?? null);
    this._setValue(canonical, !raw || canonical !== null);
  }

  private _updateInstantRangeDraft(): void {
    const rawFrom = this.instantFromControl.value;
    const rawTo = this.instantToControl.value;
    const from = neuTableInstantFilterValue(rawFrom);
    const to = neuTableInstantFilterValue(rawTo);
    this._setValue(
      { from, to },
      (!rawFrom || from !== null) && (!rawTo || to !== null) && isOrderedDateRange({ from, to }),
    );
  }

  private _setValue(value: unknown, valid: boolean): void {
    this.value.set(value);
    this.valid.set(valid);
  }

  private _validate(column: NeuTableColumn<T>): void {
    const value = this.value();
    if (isNeuTableFilterValueEmpty(value)) {
      this.valid.set(true);
      return;
    }
    if (this.kind() === 'text' && !column.filterConfig) {
      this.valid.set(typeof value === 'string');
      return;
    }
    this.valid.set(
      buildNeuTableFilterState(
        column as NeuTableColumn<T, string>,
        value,
        this.mode() ?? undefined,
      ) !== null,
    );
  }

  private _resetControls(): void {
    this.modeControl.setValue(null, { emitEvent: false });
    this.textControl.setValue('', { emitEvent: false });
    this.numberControl.setValue(null, { emitEvent: false });
    this.numberFromControl.setValue(null, { emitEvent: false });
    this.numberToControl.setValue(null, { emitEvent: false });
    this.dateControl.setValue(null, { emitEvent: false });
    this.instantFromControl.setValue('', { emitEvent: false });
    this.instantToControl.setValue('', { emitEvent: false });
    this.booleanControl.setValue(null, { emitEvent: false });
    this.selectControl.setValue(null, { emitEvent: false });
    this.multiSelectControl.setValue([], { emitEvent: false });
  }

  private _currentColumn(): NeuTableColumn<T> | null {
    const column = this._column;
    return column && this._resolveColumn ? this._resolveColumn(column.key) : column;
  }
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
