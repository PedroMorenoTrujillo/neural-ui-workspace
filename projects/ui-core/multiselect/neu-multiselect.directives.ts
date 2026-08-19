import { Directive, TemplateRef, inject } from '@angular/core';
import { NeuSelectOption } from '@neural-ui/core/select';

export interface NeuMultiselectItemContext<T> {
  $implicit: T;
}

export interface NeuMultiselectSelectedContext<T> {
  $implicit: T;
  remove: () => void;
}

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
@Directive({ selector: 'ng-template[neuMultiselectItem]', standalone: true })
export class NeuMultiselectItemDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuMultiselectItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: NeuMultiselectItemDirective<T>,
    context: unknown,
  ): context is NeuMultiselectItemContext<T> {
    return true;
  }
}

@Directive({ selector: 'ng-template[neuMultiselectSelected]', standalone: true })
export class NeuMultiselectSelectedDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuMultiselectSelectedContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: NeuMultiselectSelectedDirective<T>,
    context: unknown,
  ): context is NeuMultiselectSelectedContext<T> {
    return true;
  }
}
@Directive({ selector: '[neuMultiselectHeader]', standalone: true })
export class NeuMultiselectHeaderDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuMultiselectFooter]', standalone: true })
export class NeuMultiselectFooterDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuMultiselectEmpty]', standalone: true })
export class NeuMultiselectEmptyDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
