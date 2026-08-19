import { Directive, TemplateRef, inject } from '@angular/core';
import { NeuSelectOption } from './neu-select.types';

export interface NeuSelectItemContext<T> {
  $implicit: T;
}

export interface NeuSelectSelectedContext<T> {
  $implicit: T | null;
}

/**
 * Directiva para personalizar el template de cada ítem del dropdown.
 *
 * Uso:
 * ```html
 * <neu-select [options]="opts" [formControl]="valueCtrl">
 *   <ng-template neuSelectItem let-item>
 *     <span class="flag flag-{{ item.value }}"></span>
 *     {{ item.label }}
 *   </ng-template>
 * </neu-select>
 * ```
 */
@Directive({ selector: 'ng-template[neuSelectItem]', standalone: true })
export class NeuSelectItemDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuSelectItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: NeuSelectItemDirective<T>,
    context: unknown,
  ): context is NeuSelectItemContext<T> {
    return true;
  }
}

/**
 * Directiva para personalizar el template del ítem seleccionado (trigger).
 *
 * Uso:
 * ```html
 * <neu-select [options]="opts" [formControl]="valueCtrl">
 *   <ng-template neuSelectSelected let-item>
 *     <strong>{{ item?.label }}</strong>
 *   </ng-template>
 * </neu-select>
 * ```
 */
@Directive({ selector: 'ng-template[neuSelectSelected]', standalone: true })
export class NeuSelectSelectedDirective<T> {
  readonly templateRef = inject<TemplateRef<NeuSelectSelectedContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: NeuSelectSelectedDirective<T>,
    context: unknown,
  ): context is NeuSelectSelectedContext<T> {
    return true;
  }
}

/** Optional content slots for the select panel. */
@Directive({ selector: '[neuSelectHeader]', standalone: true })
export class NeuSelectHeaderDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuSelectFooter]', standalone: true })
export class NeuSelectFooterDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuSelectEmpty]', standalone: true })
export class NeuSelectEmptyDirective { readonly templateRef = inject<TemplateRef<void>>(TemplateRef); }
@Directive({ selector: '[neuSelectGroup]', standalone: true })
export class NeuSelectGroupDirective { readonly templateRef = inject<TemplateRef<{ $implicit: string }>>(TemplateRef); }
