import { Directive, TemplateRef, inject } from '@angular/core';
import { NeuSelectOption } from '@neural-ui/core/select';

/**
 * Directiva para personalizar el template de cada ítem del dropdown de Multiselect. / Directive to customize the template of each Multiselect dropdown item.
 *
 * Uso:
 * ```html
 * <neu-multiselect [options]="opts" [formControl]="valuesCtrl">
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

export interface NeuMultiselectSelectedContext { $implicit: NeuSelectOption; remove: () => void; }
@Directive({ selector: '[neuMultiselectSelected]', standalone: true })
export class NeuMultiselectSelectedDirective { readonly templateRef = inject<TemplateRef<NeuMultiselectSelectedContext>>(TemplateRef); }
@Directive({ selector: '[neuMultiselectHeader]', standalone: true })
export class NeuMultiselectHeaderDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuMultiselectFooter]', standalone: true })
export class NeuMultiselectFooterDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuMultiselectEmpty]', standalone: true })
export class NeuMultiselectEmptyDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
