import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  type InputSignal,
} from '@angular/core';
import type {
  NeuFilterExpression,
  NeuFilterOperator,
  NeuTableColumn,
} from '../../../public/neu-table.types';
import {
  appendNeuTableFilterCondition,
  isNeuTableFilterRule,
  neuTableFilterValueFromText,
  type NeuTableFilterRule,
} from '../../query-ui/neu-table-query-transitions';

@Component({
  selector: 'neu-table-advanced-filter-builder',
  standalone: true,
  template: `
    <section
      class="neu-table2__filter-builder"
      role="dialog"
      aria-modal="false"
      aria-label="Advanced filters"
      (keydown.escape)="cancel()"
    >
      <label>
        Field
        <select [value]="field()" (change)="setField($event)">
          @for (column of filterableColumns(); track column.id) {
            <option [value]="column.filter!.field">{{ column.header }}</option>
          }
        </select>
      </label>
      <label>
        Rule
        <select [value]="activeRule()" (change)="setRule($event)">
          @for (candidate of rules(); track candidate) {
            <option [value]="candidate">{{ candidate }}</option>
          }
        </select>
      </label>
      @if (needsValue()) {
        <label>
          Value
          <input [value]="value()" (input)="setValue($event)" />
        </label>
      }
      <label>
        Join
        <select [value]="operator()" (change)="setOperator($event)">
          <option value="and">AND</option>
          <option value="or">OR</option>
        </select>
      </label>
      <div class="neu-table2__filter-actions">
        <button type="button" (click)="apply()">Apply advanced filter</button>
        <button type="button" (click)="cancel()">Cancel advanced filter</button>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      position: absolute;
      inset-inline-end: 0;
      z-index: 8;
      inline-size: min(24rem, calc(100vw - 2rem));
    }

    .neu-table2__filter-builder {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--neu-border, currentColor);
      border-radius: 0.5rem;
          background: var(--neu-surface, Canvas);
      box-shadow: 0 0.75rem 2rem color-mix(in srgb, currentColor 18%, transparent);
    }

    label {
      display: grid;
      gap: 0.25rem;
    }

    select,
    input,
    button {
      font: inherit;
    }

    .neu-table2__filter-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    :is(select, input, button):focus-visible {
          outline: 2px solid var(--neu-focus-color, currentColor);
      outline-offset: 2px;
    }
  `,
})
export class NeuTableAdvancedFilterBuilderComponent<T extends object, F extends string> {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly columns: InputSignal<readonly NeuTableColumn<T, F>[]> = input.required();
  readonly filters: InputSignal<NeuFilterExpression<F> | null> = input.required();
  readonly applyFilters: InputSignal<(filters: NeuFilterExpression<F>) => void> = input.required();
  readonly close: InputSignal<() => void> = input.required();

  protected readonly filterableColumns = computed(() =>
    this.columns().filter((column) => column.filter !== undefined),
  );
  protected readonly field = signal<F | null>(null);
  protected readonly rule = signal<NeuTableFilterRule | null>(null);
  protected readonly value = signal('');
  protected readonly operator = signal<NeuFilterOperator>('and');
  protected readonly selectedColumn = computed(() => {
    const field = this.field();
    return (
      this.filterableColumns().find((column) => column.filter?.field === field) ??
      this.filterableColumns()[0] ??
      null
    );
  });
  protected readonly rules = computed<readonly NeuTableFilterRule[]>(() => {
    const rules = this.selectedColumn()?.filter?.rules.filter(isNeuTableFilterRule) ?? [];
    return rules.length > 0 ? rules : ['equals'];
  });
  protected readonly activeRule = computed(() => {
    const rule = this.rule();
    if (rule !== null && this.rules().includes(rule)) return rule;
    const preferred = this.selectedColumn()?.filter?.defaultRule;
    return preferred !== undefined && isNeuTableFilterRule(preferred)
      ? preferred
      : this.rules()[0]!;
  });
  protected readonly needsValue = computed(
    () => !['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'].includes(this.activeRule()),
  );

  constructor() {
    afterNextRender(() =>
      this.elementRef.nativeElement.querySelector<HTMLElement>('select,input,button')?.focus(),
    );
  }

  protected readonly setField = (event: Event) => {
    const field = (event.currentTarget as HTMLSelectElement).value as F;
    this.field.set(field);
    const column = this.filterableColumns().find((candidate) => candidate.filter?.field === field);
    const rule = column?.filter?.defaultRule;
    this.rule.set(rule !== undefined && isNeuTableFilterRule(rule) ? rule : 'equals');
  };
  protected readonly setRule = (event: Event) => {
    const rule = (event.currentTarget as HTMLSelectElement).value;
    if (isNeuTableFilterRule(rule)) this.rule.set(rule);
  };
  protected readonly setValue = (event: Event) =>
    this.value.set((event.currentTarget as HTMLInputElement).value);
  protected readonly setOperator = (event: Event) => {
    const operator = (event.currentTarget as HTMLSelectElement).value;
    if (operator === 'and' || operator === 'or') this.operator.set(operator);
  };
  protected readonly cancel = () => this.close()();
  protected readonly apply = () => {
    const column = this.selectedColumn();
    if (column?.filter === undefined) return;
    const rule = this.activeRule();
    this.applyFilters()(
      appendNeuTableFilterCondition(
        this.filters(),
        {
          kind: 'condition',
          field: column.filter.field,
          rule,
          value: neuTableFilterValueFromText(rule, this.value()),
        },
        this.operator(),
      ),
    );
    this.close()();
  };
}
