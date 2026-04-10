import { Directive, TemplateRef, inject } from '@angular/core';
import { NeuSelectOption } from '../select/neu-select.types';

/**
 * Directiva para personalizar el template de cada ítem del dropdown de Multiselect. / Directive to customize the template of each Multiselect dropdown item.
 *
 * Uso:
 * ```html
 * <neu-multiselect [options]="opts" [(ngModel)]="values">
 *   <ng-template neuMultiselectItem let-item>
 *     <span class="flag flag-{{ item.value }}"></span>
 *     {{ item.label }}
 *   </ng-template>
 * </neu-multiselect>
 * ```
 */
@Directive({ selector: '[neuMultiselectItem]', standalone: true })
export class NeuMultiselectItemDirective {
  readonly templateRef = inject<TemplateRef<{ $implicit: NeuSelectOption }>>(TemplateRef);
}
