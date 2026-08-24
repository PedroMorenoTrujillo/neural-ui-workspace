import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { NeuTableColumn, NeuTableRow } from './neu-table.types';

/**
 * Context exposed to a consumer-owned advanced custom-filter template.
 *
 * The template edits only the current draft. The Table keeps ownership of the
 * Apply and Cancel actions, while the column's custom predicate keeps ownership
 * of client-side matching semantics and accessibility inside the custom control.
 */
export interface NeuTableFilterTemplateContext<
  T extends object = NeuTableRow,
  V = unknown,
> {
  /** The complete context, available through `let-context`. */
  $implicit: NeuTableFilterTemplateContext<T, V>;
  column: NeuTableColumn<T>;
  value: V | null;
  setValue(value: V | null): void;
  clear(): void;
  /** Canonical applied state; draft changes never set this flag. */
  active: boolean;
}

/**
 * Registers the consumer-owned editor for one custom-filter column.
 *
 * Duplicate keys are deterministic: the first projected template wins.
 * Matching remains defined separately by `filterConfig.predicate` and is
 * always client-side.
 *
 * @example
 * ```html
 * <ng-template neuTableFilterTemplate="status" let-context>
 *   <input
 *     [value]="context.value ?? ''"
 *     (input)="context.setValue($any($event.target).value)"
 *   />
 * </ng-template>
 * ```
 */
@Directive({
  selector: 'ng-template[neuTableFilterTemplate]',
  standalone: true,
})
export class NeuTableFilterTemplateDirective<
  T extends object = NeuTableRow,
  V = unknown,
> {
  readonly columnKey = input.required<string>({ alias: 'neuTableFilterTemplate' });
  readonly templateRef = inject<TemplateRef<NeuTableFilterTemplateContext<T, V>>>(TemplateRef);

  static ngTemplateContextGuard<T extends object, V>(
    _directive: NeuTableFilterTemplateDirective<T, V>,
    context: unknown,
  ): context is NeuTableFilterTemplateContext<T, V> {
    return true;
  }
}
