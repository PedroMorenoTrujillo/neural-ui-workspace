import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  type TemplateRef,
} from '@angular/core';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import type { NeuFilterConstraint, NeuFilterExpression, NeuFilterGroup } from '@neural-ui/core/table';

export interface NeuFilterBuilderField<F extends string> {
  readonly field: F;
  readonly label: string;
  readonly rules?: readonly NeuFilterConstraint<F>['rule'][];
  readonly type?: 'text' | 'number';
}

export interface NeuFilterBuilderEditorContext<F extends string> {
  readonly $implicit: NeuFilterConstraint<F>;
  readonly field: NeuFilterBuilderField<F> | undefined;
  readonly readonly: boolean;
  readonly setValue: (value: unknown) => void;
}

export interface NeuFilterBuilderLabels {
  readonly root: string;
  readonly group: string;
  readonly operator: string;
  readonly all: string;
  readonly any: string;
  readonly field: string;
  readonly rule: string;
  readonly value: string;
  readonly addCondition: string;
  readonly addGroup: string;
  readonly remove: string;
  readonly reset: string;
  readonly apply: string;
  readonly rules: Record<NeuFilterConstraint<string>['rule'], string>;
}

const en: NeuFilterBuilderLabels = {
  root: 'Filters', group: 'Filter group', operator: 'Match conditions',
  all: 'All conditions', any: 'Any condition', field: 'Field', rule: 'Comparison',
  value: 'Value', addCondition: 'Add condition', addGroup: 'Add group',
  remove: 'Remove', reset: 'Reset draft', apply: 'Apply filters',
  rules: {
    equals: 'Equals', notEquals: 'Does not equal', contains: 'Contains',
    notContains: 'Does not contain', startsWith: 'Starts with', endsWith: 'Ends with',
    lessThan: 'Less than', lessThanOrEqual: 'Less than or equal',
    greaterThan: 'Greater than', greaterThanOrEqual: 'Greater than or equal',
    between: 'Between', in: 'In list', notIn: 'Not in list',
    isNull: 'Is null', isNotNull: 'Is not null', isEmpty: 'Is empty', isNotEmpty: 'Is not empty',
  },
};

const es: NeuFilterBuilderLabels = {
  root: 'Filtros', group: 'Grupo de filtros', operator: 'Combinar condiciones',
  all: 'Todas las condiciones', any: 'Cualquier condición', field: 'Campo', rule: 'Comparación',
  value: 'Valor', addCondition: 'Añadir condición', addGroup: 'Añadir grupo',
  remove: 'Quitar', reset: 'Restablecer borrador', apply: 'Aplicar filtros',
  rules: {
    equals: 'Igual a', notEquals: 'Distinto de', contains: 'Contiene',
    notContains: 'No contiene', startsWith: 'Empieza por', endsWith: 'Termina en',
    lessThan: 'Menor que', lessThanOrEqual: 'Menor o igual que',
    greaterThan: 'Mayor que', greaterThanOrEqual: 'Mayor o igual que',
    between: 'Entre', in: 'Está en la lista', notIn: 'No está en la lista',
    isNull: 'Es nulo', isNotNull: 'No es nulo', isEmpty: 'Está vacío', isNotEmpty: 'No está vacío',
  },
};

const valueless = new Set<NeuFilterConstraint<string>['rule']>([
  'isNull', 'isNotNull', 'isEmpty', 'isNotEmpty',
]);

type FilterPath = readonly number[];

function asGroup<F extends string>(value: NeuFilterExpression<F> | null): NeuFilterGroup<F> {
  return value?.kind === 'group'
    ? value
    : { kind: 'group', operator: 'and', children: value ? [value] : [] };
}

function editGroup<F extends string>(
  group: NeuFilterGroup<F>,
  path: FilterPath,
  edit: (target: NeuFilterGroup<F>) => NeuFilterGroup<F>,
): NeuFilterGroup<F> {
  if (!path.length) return edit(group);
  const [target, ...rest] = path;
  const child = group.children[target!];
  if (child?.kind !== 'group') return group;
  return {
    ...group,
    children: group.children.map((node, index) => index === target ? editGroup(child, rest, edit) : node),
  };
}

function prune<F extends string>(group: NeuFilterGroup<F>): NeuFilterGroup<F> {
  return {
    ...group,
    children: group.children.flatMap((child) => {
      if (child.kind === 'condition') return [child] as NeuFilterExpression<F>[];
      const nested = prune(child);
      return nested.children.length ? [nested] : [];
    }),
  };
}

@Component({
  selector: 'neu-filter-builder',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [ngTemplateOutlet]="groupView"
      [ngTemplateOutletContext]="{ $implicit: draft(), path: rootPath }" />
    @if (!readonly()) {
      <div class="neu-filter-builder__actions">
        <button type="button" (click)="reset()">{{ text().reset }}</button>
        <button type="button" (click)="apply()">{{ text().apply }}</button>
      </div>
    }

    <ng-template #groupView let-group let-path="path">
      <fieldset>
        <legend>{{ path.length ? text().group : text().root }}</legend>
        <label>
          {{ text().operator }}
          <select [disabled]="readonly()" [value]="group.operator"
            (change)="setOperator(path, $event)">
            <option value="and">{{ text().all }}</option>
            <option value="or">{{ text().any }}</option>
          </select>
        </label>
        @for (entry of group.children; track $index; let i = $index) {
          @if (entry.kind === 'group') {
            <ng-container [ngTemplateOutlet]="groupView"
              [ngTemplateOutletContext]="{ $implicit: entry, path: childPath(path, i) }" />
          } @else {
            <div class="neu-filter-builder__condition">
              <label>
                {{ text().field }}
                <select [disabled]="readonly()" [value]="entry.field"
                  (change)="setField(path, i, $event)">
                  @if (!fieldFor(entry.field)) {
                    <option [value]="entry.field">{{ entry.field }}</option>
                  }
                  @for (field of fields(); track field.field) {
                    <option [value]="field.field">{{ field.label }}</option>
                  }
                </select>
              </label>
              <label>
                {{ text().rule }}
                <select [disabled]="readonly()" [value]="entry.rule"
                  (change)="setRule(path, i, entry, $event)">
                  @for (rule of rulesFor(entry); track rule) {
                    <option [value]="rule">{{ ruleLabel(rule) }}</option>
                  }
                </select>
              </label>
              @if (needsValue(entry.rule)) {
                @if (editor(); as customEditor) {
                  <ng-container [ngTemplateOutlet]="customEditor"
                    [ngTemplateOutletContext]="editorContext(path, i, entry)" />
                } @else {
                  <label>
                    {{ text().value }}
                    <input [value]="displayValue(entry.value)" [disabled]="readonly()"
                      [type]="inputType(entry)" [attr.step]="inputType(entry) === 'number' ? 'any' : null"
                      (change)="setInputValue(path, i, entry, $event)" />
                  </label>
                }
              }
            </div>
          }
          @if (!readonly()) {
            <button type="button"
              [attr.aria-label]="text().remove + ' ' + (entry.kind === 'group' ? text().group : text().field) + ' ' + (i + 1)"
              (click)="remove(path, i)">{{ text().remove }}</button>
          }
        }
        @if (!readonly()) {
          <div class="neu-filter-builder__actions">
            <button type="button" [disabled]="!fields().length" (click)="addCondition(path)">
              {{ text().addCondition }}
            </button>
            <button type="button" (click)="addGroup(path)">{{ text().addGroup }}</button>
          </div>
        }
      </fieldset>
    </ng-template>
  `,
  styles: `
    :host { display: block; }
    fieldset { display: grid; min-inline-size: 0; gap: .75rem; padding: .75rem; }
    fieldset, select, input, button { border: 1px solid var(--neu-border, #9a9a9a); border-radius: .375rem; }
    select, input, button { margin: 0; padding: .35rem .5rem; color: inherit; background: transparent; font: inherit; }
    label { display: grid; gap: .25rem; }
    .neu-filter-builder__actions, .neu-filter-builder__condition { display: flex; flex-wrap: wrap; gap: .5rem; }
    :host > .neu-filter-builder__actions { margin-block-start: .75rem; }
    button { justify-self: start; }
  `,
})
export class NeuFilterBuilderComponent<F extends string> {
  readonly fields = input.required<readonly NeuFilterBuilderField<F>[]>();
  readonly value = input<NeuFilterExpression<F> | null>(null);
  readonly readonly = input(false);
  readonly labels = input<Partial<NeuFilterBuilderLabels>>({});
  readonly editor = input<TemplateRef<NeuFilterBuilderEditorContext<F>> | null>(null);
  readonly valueChange = output<NeuFilterExpression<F> | null>();

  private readonly locale = inject(NEURAL_LOCALE);
  protected readonly rootPath: FilterPath = [];
  protected readonly draft = linkedSignal(() => asGroup(this.value()));
  protected readonly text = computed(() => {
    const defaults = /^es(?:-|$)/i.test(this.locale) ? es : en;
    return { ...defaults, ...this.labels() };
  });

  protected childPath(path: FilterPath, i: number): FilterPath {
    return [...path, i];
  }

  protected fieldFor(key: F): NeuFilterBuilderField<F> | undefined {
    return this.fields().find((field) => field.field === key);
  }

  protected rulesFor(condition: NeuFilterConstraint<F>): readonly NeuFilterConstraint<F>['rule'][] {
    const configured = this.fieldFor(condition.field)?.rules ?? ['equals'];
    return configured.includes(condition.rule) ? configured : [...configured, condition.rule];
  }

  protected ruleLabel(rule: NeuFilterConstraint<F>['rule']): string {
    return this.text().rules[rule];
  }

  protected needsValue(rule: NeuFilterConstraint<F>['rule']): boolean {
    return !valueless.has(rule);
  }

  protected structured(rule: NeuFilterConstraint<F>['rule']): boolean {
    return rule === 'between' || rule === 'in' || rule === 'notIn';
  }

  protected inputType(condition: NeuFilterConstraint<F>): string {
    return !this.structured(condition.rule) && this.fieldFor(condition.field)?.type === 'number'
      ? 'number' : 'text';
  }

  protected displayValue(value: unknown): string {
    if (Array.isArray(value)) return value.map(String).join(', ');
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value) : '';
  }

  protected editorContext(path: FilterPath, index: number, condition: NeuFilterConstraint<F>): NeuFilterBuilderEditorContext<F> {
    return {
      $implicit: condition, field: this.fieldFor(condition.field), readonly: this.readonly(),
      setValue: (value) => this.replace(path, index, (current) => ({ ...current, value })),
    };
  }

  protected addCondition(path: FilterPath): void {
    const field = this.fields()[0];
    if (!field) return;
    this.edit(path, (group) => ({
      ...group, children: [...group.children, this.defaultCondition(field)],
    }));
  }

  protected addGroup(path: FilterPath): void {
    this.edit(path, (group) => ({
      ...group, children: [...group.children, { kind: 'group', operator: 'and', children: [] }],
    }));
  }

  protected remove(path: FilterPath, index: number): void {
    this.edit(path, (group) => ({
      ...group, children: group.children.filter((_, i) => i !== index),
    }));
  }

  protected setOperator(path: FilterPath, event: Event): void {
    const operator = (event.target as HTMLSelectElement).value;
    if (operator === 'and' || operator === 'or') this.edit(path, (group) => ({ ...group, operator }));
  }

  protected setField(path: FilterPath, index: number, event: Event): void {
    const field = this.fields().find(({ field }) => field === (event.target as HTMLSelectElement).value);
    if (field) this.replace(path, index, () => this.defaultCondition(field));
  }

  protected setRule(path: FilterPath, index: number, condition: NeuFilterConstraint<F>, event: Event): void {
    const chosen = (event.target as HTMLSelectElement).value;
    const rule = this.rulesFor(condition).find((candidate) => candidate === chosen);
    if (rule) this.replace(path, index, (current) => ({ ...current, rule, value: this.initialValue(rule) }));
  }

  protected setInputValue(path: FilterPath, index: number, condition: NeuFilterConstraint<F>, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let value: unknown = inputElement.value;
    if (this.structured(condition.rule)) {
      const values = inputElement.value.split(',').map((entry) => entry.trim());
      const numeric = this.fieldFor(condition.field)?.type === 'number';
      value = values.filter(Boolean).map((entry) => numeric ? Number(entry) : entry);
    } else if (inputElement.type === 'number') {
      value = Number.isFinite(inputElement.valueAsNumber) ? inputElement.valueAsNumber : null;
    }
    this.replace(path, index, (current) => ({ ...current, value }));
  }

  protected reset(): void {
    if (!this.readonly()) this.draft.set(asGroup(this.value()));
  }

  protected apply(): void {
    if (this.readonly()) return;
    const value = prune(this.draft());
    this.valueChange.emit(value.children.length ? value : null);
  }

  private defaultCondition(field: NeuFilterBuilderField<F>): NeuFilterConstraint<F> {
    const rule = field.rules?.[0] ?? 'equals';
    return { kind: 'condition', field: field.field, rule, value: this.initialValue(rule) };
  }

  private initialValue(rule: NeuFilterConstraint<F>['rule']): unknown {
    return this.structured(rule) ? [] : null;
  }

  private edit(path: FilterPath, edit: (group: NeuFilterGroup<F>) => NeuFilterGroup<F>): void {
    if (!this.readonly()) this.draft.update((group) => editGroup(group, path, edit));
  }

  private replace(path: FilterPath, index: number, edit: (value: NeuFilterConstraint<F>) => NeuFilterConstraint<F>): void {
    this.edit(path, (group) => ({
      ...group, children: group.children.map((child, i) => i === index && child.kind === 'condition' ? edit(child) : child),
    }));
  }
}
