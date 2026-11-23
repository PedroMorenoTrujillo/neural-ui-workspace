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
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';
import { NeuSelectComponent, type NeuSelectOption } from '@neural-ui/core/select';
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
  readonly invalidValue: string;
  readonly rules: Record<NeuFilterConstraint<string>['rule'], string>;
}

const en: NeuFilterBuilderLabels = {
  root: 'Filters', group: 'Filter group', operator: 'Match conditions',
  all: 'All conditions', any: 'Any condition', field: 'Field', rule: 'Comparison',
  value: 'Value', addCondition: 'Add condition', addGroup: 'Add group',
  remove: 'Remove', reset: 'Reset draft', apply: 'Apply filters',
  invalidValue: 'Complete the comparison values before applying the filters.',
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
  invalidValue: 'Completa los valores de comparación antes de aplicar los filtros.',
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
  imports: [NgTemplateOutlet, NeuButtonComponent, NeuInputComponent, NeuNumberInputComponent, NeuSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [ngTemplateOutlet]="groupView"
      [ngTemplateOutletContext]="{ $implicit: draft(), path: rootPath }" />
    @if (!readonly() && (commit() === 'explicit' || invalidDraft())) {
      <div class="neu-filter-builder__actions neu-filter-builder__footer">
        <button neu-button type="button" size="sm" tone="neutral" variant="outline" (click)="reset()">
          {{ text().reset }}
        </button>
        @if (commit() === 'explicit') {
          <button neu-button type="button" size="sm" [attr.aria-disabled]="invalidDraft() || null"
            (click)="apply()">{{ text().apply }}</button>
        }
      </div>
    }
    @if (!readonly() && invalidDraft()) {
      <p class="neu-filter-builder__status" role="status">{{ text().invalidValue }}</p>
    }

    <ng-template #groupView let-group let-path="path">
      <fieldset [class.neu-filter-builder__nested]="path.length">
        <legend>{{ path.length ? text().group : text().root }}</legend>
        <div [class.neu-filter-builder__group-header]="path.length">
          @if (path.length) {
            <span class="neu-filter-builder__group-title" aria-hidden="true">{{ text().group }}</span>
          }
          <neu-select class="neu-filter-builder__operator" size="sm" [fluid]="true" [disabled]="readonly()"
            [label]="path.length ? '' : text().operator" [ariaLabel]="path.length ? text().operator : null"
            [options]="operators()" [value]="group.operator" (valueChange)="setOperator(path, $event)" />
          @if (path.length && !readonly()) {
            <button neu-button type="button" size="sm" tone="neutral" variant="ghost"
              [ariaLabel]="text().remove + ' ' + text().group + ' ' + (path[path.length - 1] + 1)"
              (click)="removeGroup(path, $event)">{{ text().remove }}</button>
          }
        </div>
        @for (entry of group.children; track $index; let i = $index) {
          <div class="neu-filter-builder__entry" [class.neu-filter-builder__entry--group]="entry.kind === 'group'">
            @if (entry.kind === 'group') {
              <ng-container [ngTemplateOutlet]="groupView"
                [ngTemplateOutletContext]="{ $implicit: entry, path: childPath(path, i) }" />
            } @else {
              <div class="neu-filter-builder__condition">
                <neu-select size="sm" [fluid]="true" [disabled]="readonly()" [label]="text().field"
                  [options]="fieldOptions(entry.field)" [value]="entry.field"
                  (valueChange)="setField(path, i, $event)" />
                <neu-select size="sm" [fluid]="true" [disabled]="readonly()" [label]="text().rule"
                  [options]="ruleOptions(entry)" [value]="entry.rule"
                  (valueChange)="setRule(path, i, entry, $event)" />
                @if (needsValue(entry.rule)) {
                  @if (editor(); as customEditor) {
                    <ng-container [ngTemplateOutlet]="customEditor"
                      [ngTemplateOutletContext]="editorContext(path, i, entry)" />
                  } @else if (usesNumberEditor(entry)) {
                    <neu-number-input size="sm" [label]="text().value" [value]="numericValue(entry.value)"
                      [disabled]="readonly()" (valueChange)="setInputValue(path, i, $event)" />
                  } @else {
                    <neu-input size="sm" [floatingLabel]="false" [label]="text().value"
                      [value]="displayValue(entry.value)" [disabled]="readonly()"
                      [hint]="valueHint(entry)"
                      (valueChange)="setInputValue(path, i, $event)" />
                  }
                }
              </div>
            }
            @if (!readonly() && entry.kind === 'condition') {
              <button neu-button type="button" size="sm" tone="neutral" variant="ghost"
                [ariaLabel]="text().remove + ' ' + text().field + ' ' + (i + 1)"
                (click)="remove(path, i, $event)">{{ text().remove }}</button>
            }
          </div>
        }
        @if (!readonly()) {
          <div class="neu-filter-builder__actions">
            <button neu-button type="button" size="sm" tone="neutral" variant="outline"
              [disabled]="!fields().length" (click)="addCondition(path)">{{ text().addCondition }}</button>
            <button neu-button type="button" size="sm" tone="neutral" variant="ghost"
              (click)="addGroup(path)">{{ text().addGroup }}</button>
          </div>
        }
      </fieldset>
    </ng-template>
  `,
  styles: `
    :host { display: block; min-inline-size: 0; container-type: inline-size; }
    fieldset {
      display: grid; gap: .85rem; margin: 0; min-inline-size: 0; padding: .8rem 1rem 1rem;
      border: 1px solid var(--neu-border-subtle, var(--neu-border));
      border-radius: var(--neu-radius-lg, .5rem); background: var(--neu-surface);
    }
    legend { padding-inline: .4rem; font-weight: 600; }
    .neu-filter-builder__nested {
      gap: .7rem; border: 0; border-inline-start: 2px solid var(--neu-border, var(--neu-border-subtle));
      padding: .65rem clamp(.5rem, 1.4cqi, .875rem) .75rem;
      background: var(--neu-surface-2, var(--neu-surface));
    }
    .neu-filter-builder__nested > legend {
      position: absolute; inline-size: 1px; block-size: 1px; padding: 0;
      overflow: hidden; clip-path: inset(50%); white-space: nowrap;
    }
    .neu-filter-builder__operator { display: block; max-inline-size: 19rem; }
    .neu-filter-builder__group-header {
      display: grid; align-items: center; gap: .45rem .65rem;
      grid-template-columns: minmax(0, 1fr) minmax(0, 17rem) auto;
      grid-template-areas: "title operator remove";
    }
    .neu-filter-builder__group-title { grid-area: title; font-weight: 650; font-size: .875rem; }
    .neu-filter-builder__group-header > .neu-filter-builder__operator { grid-area: operator; }
    .neu-filter-builder__group-header > button { grid-area: remove; justify-self: end; }
    .neu-filter-builder__entry.neu-filter-builder__entry--group { display: block; border: 0; padding: 0; }
    @container (max-width: 37rem) {
      .neu-filter-builder__group-header {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas: "title remove" "operator operator";
      }
    }
    .neu-filter-builder__condition {
      min-inline-size: 0; display: grid; align-items: start; gap: .65rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .neu-filter-builder__entry {
      display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start;
      gap: .4rem .65rem; padding: .75rem 0 .15rem; border-block-start: 1px solid var(--neu-border-subtle);
    }
    .neu-filter-builder__entry > button { margin-block-start: 1.25rem; }
    .neu-filter-builder__actions { display: flex; flex-wrap: wrap; gap: .4rem; }
    .neu-filter-builder__footer { margin-block-start: .55rem; justify-content: flex-end; }
    .neu-filter-builder__status { margin-block: .5rem 0; color: var(--neu-text-muted); font-size: .875rem; }
    @container (max-width: 37rem) {
      .neu-filter-builder__entry { grid-template-columns: minmax(0, 1fr); }
      .neu-filter-builder__entry > button { margin-block-start: 0; justify-self: end; }
      .neu-filter-builder__condition { grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr)); }
    }
  `,
})
export class NeuFilterBuilderComponent<F extends string> {
  readonly fields = input.required<readonly NeuFilterBuilderField<F>[]>();
  readonly value = input<NeuFilterExpression<F> | null>(null);
  readonly readonly = input(false);
  /** Emit valid edits as they are made, or wait for the Apply action. */
  readonly commit = input<'explicit' | 'immediate'>('explicit');
  readonly labels = input<Partial<NeuFilterBuilderLabels>>({});
  readonly editor = input<TemplateRef<NeuFilterBuilderEditorContext<F>> | null>(null);
  readonly valueChange = output<NeuFilterExpression<F> | null>();

  private readonly locale = inject(NEURAL_LOCALE);
  protected readonly rootPath: FilterPath = [];
  private immediateProposal: NeuFilterExpression<F> | null | undefined;
  protected readonly draft = linkedSignal<NeuFilterExpression<F> | null, NeuFilterGroup<F>>({
    source: this.value,
    computation: (value, previous) => {
      // A controlled consumer can echo our normalized proposal without rewriting the live text editor.
      const echoed = value === this.immediateProposal;
      this.immediateProposal = undefined;
      return echoed && previous ? previous.value : asGroup(value);
    },
  });
  protected readonly invalidDraft = computed(() => this.hasInvalidCondition(this.draft()));
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

  protected fieldOptions(key: F): readonly NeuSelectOption<string>[] {
    const options = this.fields().map(({ field, label }) => ({ value: field, label }));
    return this.fieldFor(key) ? options : [{ value: key, label: key }, ...options];
  }

  protected ruleOptions(condition: NeuFilterConstraint<F>): readonly NeuSelectOption<string>[] {
    return this.rulesFor(condition).map((rule) => ({ value: rule, label: this.text().rules[rule] }));
  }

  protected readonly operators = computed<readonly NeuSelectOption<string>[]>(() => [
    { value: 'and', label: this.text().all }, { value: 'or', label: this.text().any },
  ]);

  protected valueHint(condition: NeuFilterConstraint<F>): string {
    if (!this.structured(condition.rule)) return '';
    const spanish = /^es(?:-|$)/i.test(this.locale);
    return condition.rule === 'between'
      ? spanish ? 'Dos límites separados por coma. Ej. 2, 5' : 'Two bounds separated by a comma. E.g. 2, 5'
      : spanish ? 'Valores separados por coma' : 'Comma-separated values';
  }

  protected needsValue(rule: NeuFilterConstraint<F>['rule']): boolean {
    return !valueless.has(rule);
  }

  protected structured(rule: NeuFilterConstraint<F>['rule']): boolean {
    return rule === 'between' || rule === 'in' || rule === 'notIn';
  }

  protected usesNumberEditor(condition: NeuFilterConstraint<F>): boolean {
    return !this.structured(condition.rule) && this.fieldFor(condition.field)?.type === 'number';
  }

  protected numericValue(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
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

  protected remove(path: FilterPath, index: number, event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;
    this.removeEntry(path, index, button.closest('fieldset'));
  }

  protected removeGroup(path: FilterPath, event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;
    const parent = button.closest('fieldset')?.parentElement?.closest('fieldset') ?? null;
    this.removeEntry(path.slice(0, -1), path[path.length - 1]!, parent);
  }

  private removeEntry(path: FilterPath, index: number, parent: HTMLElement | null): void {
    const actions = parent?.querySelector(':scope > .neu-filter-builder__actions');
    actions?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    this.edit(path, (group) => ({
      ...group, children: group.children.filter((_, i) => i !== index),
    }));
  }

  protected setOperator(path: FilterPath, operator: string | null): void {
    if (operator === 'and' || operator === 'or') this.edit(path, (group) => ({ ...group, operator }));
  }

  protected setField(path: FilterPath, index: number, value: string | null): void {
    const field = this.fields().find(({ field }) => field === value);
    if (field) this.replace(path, index, () => this.defaultCondition(field));
  }

  protected setRule(path: FilterPath, index: number, condition: NeuFilterConstraint<F>, value: string | null): void {
    const rule = this.rulesFor(condition).find((candidate) => candidate === value);
    if (rule) this.replace(path, index, (current) => ({ ...current, rule, value: this.initialValue(rule) }));
  }

  protected setInputValue(path: FilterPath, index: number, value: string | number | null): void {
    this.replace(path, index, (current) => ({ ...current, value }));
  }

  protected reset(): void {
    if (!this.readonly()) this.draft.set(asGroup(this.value()));
  }

  protected apply(): void {
    if (this.readonly() || this.invalidDraft()) return;
    const value = prune(this.normalized(this.draft()));
    const proposal = value.children.length ? value : null;
    if (this.commit() === 'immediate') this.immediateProposal = proposal;
    this.valueChange.emit(proposal);
  }

  private defaultCondition(field: NeuFilterBuilderField<F>): NeuFilterConstraint<F> {
    const rule = field.rules?.[0] ?? 'equals';
    return { kind: 'condition', field: field.field, rule, value: this.initialValue(rule) };
  }

  private initialValue(rule: NeuFilterConstraint<F>['rule']): unknown {
    return this.structured(rule) ? [] : null;
  }

  private normalized(group: NeuFilterGroup<F>): NeuFilterGroup<F> {
    return {
      ...group,
      children: group.children.map((node) => {
        if (node.kind === 'group') return this.normalized(node);
        return { ...node, value: this.normalizedValue(node) };
      }),
    };
  }

  private normalizedValue(condition: NeuFilterConstraint<F>): unknown {
    if (!this.structured(condition.rule) || typeof condition.value !== 'string' || this.editor()) {
      return condition.value;
    }
    const values = condition.value.split(',').map((entry) => entry.trim()).filter(Boolean);
    return this.fieldFor(condition.field)?.type === 'number' ? values.map(Number) : values;
  }

  private hasInvalidCondition(group: NeuFilterGroup<F>): boolean {
    return group.children.some((node) => {
      if (node.kind === 'group') return this.hasInvalidCondition(node);
      if (!this.structured(node.rule)) {
        return this.commit() === 'immediate' && this.needsValue(node.rule) &&
          (node.value == null || (typeof node.value === 'string' && node.value.trim() === ''));
      }
      const value = this.normalizedValue(node);
      const numeric = this.fieldFor(node.field)?.type === 'number';
      return !Array.isArray(value) ||
        (node.rule === 'between' ? value.length !== 2 : !value.length) ||
        (numeric && value.some((entry) => typeof entry !== 'number' || !Number.isFinite(entry)));
    });
  }

  private edit(path: FilterPath, edit: (group: NeuFilterGroup<F>) => NeuFilterGroup<F>): void {
    if (this.readonly()) return;
    this.draft.update((group) => editGroup(group, path, edit));
    if (this.commit() === 'immediate') this.apply();
  }

  private replace(path: FilterPath, index: number, edit: (value: NeuFilterConstraint<F>) => NeuFilterConstraint<F>): void {
    this.edit(path, (group) => ({
      ...group, children: group.children.map((child, i) => i === index && child.kind === 'condition' ? edit(child) : child),
    }));
  }
}
