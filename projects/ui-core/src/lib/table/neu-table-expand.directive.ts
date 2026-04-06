import { Directive, TemplateRef } from '@angular/core';

/**
 * Directiva para definir el template de expansión de fila en NeuTable.
 *
 * Uso:
 * ```html
 * <neu-table [expandable]="true" [columns]="cols" [data]="rows">
 *   <ng-template neuTableExpand let-row>
 *     <div>{{ row.details }}</div>
 *   </ng-template>
 * </neu-table>
 * ```
 */
@Directive({
  selector: 'ng-template[neuTableExpand]',
  standalone: true,
})
export class NeuTableExpandDirective {
  constructor(
    public readonly templateRef: TemplateRef<{ $implicit: Record<string, unknown> }>,
  ) {}
}
