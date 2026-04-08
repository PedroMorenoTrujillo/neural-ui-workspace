import { Directive, TemplateRef, inject } from '@angular/core';
import { NeuSelectOption } from './neu-select.types';

/**
 * Directiva para personalizar el template de cada ítem del dropdown.
 *
 * Uso:
 * ```html
 * <neu-select [options]="opts" [(ngModel)]="value">
 *   <ng-template neuSelectItem let-item>
 *     <span class="flag flag-{{ item.value }}"></span>
 *     {{ item.label }}
 *   </ng-template>
 * </neu-select>
 * ```
 */
@Directive({ selector: '[neuSelectItem]', standalone: true })
export class NeuSelectItemDirective {
  readonly templateRef = inject<TemplateRef<{ $implicit: NeuSelectOption }>>(TemplateRef);
}

/**
 * Directiva para personalizar el template del ítem seleccionado (trigger).
 *
 * Uso:
 * ```html
 * <neu-select [options]="opts" [(ngModel)]="value">
 *   <ng-template neuSelectSelected let-item>
 *     <strong>{{ item?.label }}</strong>
 *   </ng-template>
 * </neu-select>
 * ```
 */
@Directive({ selector: '[neuSelectSelected]', standalone: true })
export class NeuSelectSelectedDirective {
  readonly templateRef = inject<TemplateRef<{ $implicit: NeuSelectOption | null }>>(TemplateRef);
}
