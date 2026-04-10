import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  contentChild,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuSelectOption } from '../select/neu-select.types';
import { NeuMultiselectItemDirective } from './neu-multiselect.directives';

export type { NeuSelectOption } from '../select/neu-select.types';

let _neuMultiselectIdSeq = 0;

/**
 * NeuralUI Multiselect Component
 *
 * Dropdown de selección múltiple con chips, búsqueda integrada y soporte / Multiple selection dropdown with chips, integrated search and support
 * completo para Angular Forms (ngModel y Reactive Forms). / for Angular Forms (ngModel and Reactive Forms).
 *
 * Uso:
 *   <neu-multiselect label="Tecnologías" [options]="opts" [(ngModel)]="selected" />
 */
@Component({
  selector: 'neu-multiselect',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuMultiselectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-multiselect__static-label" [for]="_triggerId">{{ label() }}</label>
    }
    <div
      class="neu-multiselect"
      [class.neu-multiselect--open]="isOpen()"
      [class.neu-multiselect--disabled]="isDisabledFinal()"
      [class.neu-multiselect--error]="hasError()"
      [class.neu-multiselect--has-value]="_values().length > 0"
      [class.neu-multiselect--no-float]="!floatingLabel()"
    >
      <!-- Trigger -->
      <button
        class="neu-multiselect__trigger"
        type="button"
        [id]="_triggerId"
        [disabled]="isDisabledFinal()"
        [attr.role]="'combobox'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-label]="label() || null"
        (click)="toggle()"
        (keydown.arrowDown)="onTriggerKey($any($event))"
        (keydown.arrowUp)="onTriggerKey($any($event))"
      >
        <!-- Floating label -->
        @if (floatingLabel() && label()) {
          <span class="neu-multiselect__label">{{ label() }}</span>
        }
        <span class="neu-multiselect__chips">
          @if (_values().length === 0) {
            <span class="neu-multiselect__placeholder">{{ placeholder() }}</span>
          } @else if (_chipMode() === 'count') {
            <span class="neu-multiselect__count-badge">{{ _values().length }} seleccionados</span>
          } @else {
            @for (val of _visibleChips(); track val) {
              <span class="neu-multiselect__chip">
                {{ labelFor(val) }}
                <button
                  class="neu-multiselect__chip-remove"
                  type="button"
                  [attr.aria-label]="'Eliminar ' + labelFor(val)"
                  (click)="removeValue(val, $event)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            }
            @if (_values().length > 3) {
              <span class="neu-multiselect__chip neu-multiselect__chip--overflow"
                >+{{ _values().length - 3 }}</span
              >
            }
          }
        </span>

        <!-- Clear button -->
        @if (clearable() && _values().length > 0 && !isDisabledFinal()) {
          <button
            class="neu-multiselect__clear"
            type="button"
            [attr.aria-label]="clearAriaLabel()"
            (click)="clearAll($event)"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        }

        <!-- Chevron -->
        <svg
          class="neu-multiselect__chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Panel -->
      @if (isOpen()) {
        <div
          class="neu-multiselect__panel"
          role="listbox"
          [attr.aria-multiselectable]="true"
          [attr.aria-label]="label() || null"
        >
          <!-- Search -->
          @if (searchable()) {
            <div class="neu-multiselect__search">
              <input
                class="neu-multiselect__search-input"
                type="text"
                [attr.aria-label]="'Search ' + label()"
                [placeholder]="searchPlaceholder()"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (click)="$event.stopPropagation()"
              />
            </div>
          }

          <!-- Opciones -->
          <div class="neu-multiselect__options">
            @for (option of filteredOptions(); track option.value) {
              <div
                class="neu-multiselect__option"
                [class.neu-multiselect__option--selected]="isSelected(option.value)"
                [class.neu-multiselect__option--disabled]="option.disabled"
                role="option"
                [id]="'neu-ms-opt-' + option.value"
                [attr.aria-selected]="isSelected(option.value)"
                [attr.aria-disabled]="option.disabled"
                [attr.tabindex]="option.disabled ? null : '-1'"
                (click)="toggleOption(option)"
                (keydown.enter)="toggleOption(option)"
                (keydown.space)="toggleOption(option)"
                (keydown.arrowDown)="focusOptionByIndex($any($event), option, 1)"
                (keydown.arrowUp)="focusOptionByIndex($any($event), option, -1)"
              >
                <!-- Checkbox visual -->
                <span
                  class="neu-multiselect__checkbox"
                  [class.neu-multiselect__checkbox--checked]="isSelected(option.value)"
                >
                  <svg
                    class="neu-multiselect__checkbox-check"
                    viewBox="0 0 12 10"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="1 5 4.5 9 11 1" />
                  </svg>
                </span>
                @if (itemTpl()) {
                  <ng-container
                    [ngTemplateOutlet]="itemTpl()!.templateRef"
                    [ngTemplateOutletContext]="{ $implicit: option }"
                  />
                } @else {
                  {{ option.label }}
                }
              </div>
            }

            @if (filteredOptions().length === 0) {
              <div class="neu-multiselect__empty">{{ noResultsMessage() }}</div>
            }
          </div>

          <!-- Footer: resumen + limpiar + toggle modo -->
          @if (_values().length > 0) {
            <div class="neu-multiselect__footer">
              <span class="neu-multiselect__footer-count"
                >{{ _values().length }} seleccionados</span
              >
              <div class="neu-multiselect__footer-actions">
                <button
                  class="neu-multiselect__footer-mode"
                  type="button"
                  [attr.aria-label]="_chipMode() === 'chips' ? 'Mostrar contador' : 'Mostrar chips'"
                  (click)="toggleChipMode($event)"
                >
                  {{ _chipMode() === 'chips' ? '#' : '☰' }}
                </button>
                <button
                  class="neu-multiselect__footer-clear"
                  type="button"
                  (click)="clearAll($event)"
                >
                  {{ clearAllLabel() }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (hasError()) {
      <p class="neu-multiselect__error" role="alert">{{ errorMessage() }}</p>
    }
  `,
  styleUrl: './neu-multiselect.component.scss',
})
export class NeuMultiselectComponent implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _urlState = inject(NeuUrlStateService);

  constructor() {
    effect(() => {
      const param = this.urlParam();
      if (!param) return;
      const urlRaw = this._urlState.getParam(param)();
      const urlVals = urlRaw ? urlRaw.split(',').filter(Boolean) : [];
      const current = untracked(() => this._values());
      if (JSON.stringify(urlVals) !== JSON.stringify(current)) {
        this._values.set(urlVals);
        this._onChange(urlVals);
      }
    });
  }

  /** @internal */
  readonly _triggerId = `neu-multiselect-trigger-${_neuMultiselectIdSeq++}`;

  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  readonly itemTpl = contentChild(NeuMultiselectItemDirective);

  /** Opciones del dropdown / Dropdown options */
  options = input<NeuSelectOption[]>([]);

  /** Etiqueta del componente / Component label */
  label = input<string>('');

  /** Muestra el label como flotante dentro del campo (true) o estático encima (false) / Shows the label as floating inside the field (true) or static above (false) */
  floatingLabel = input<boolean>(false);

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Deshabilita el componente / Disables the component */
  disabled = input<boolean>(false);

  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');

  /** Texto del botón de limpiar todas las selecciones / Button text to clear all selections */
  clearAllLabel = input<string>('Limpiar todo');

  /** Muestra un botón × en el trigger para limpiar la selección de una vez / Shows a × button in the trigger to clear the selection at once */
  clearable = input<boolean>(false);

  /** Aria-label del botón clear que aparece en el trigger / Aria-label for the clear button shown in the trigger */
  clearAriaLabel = input<string>('Limpiar selección');

  /**
   * Sincroniza los valores seleccionados con este query param de la URL.
   * Los valores se codifican como lista separada por comas: `?{urlParam}=a,b,c`.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /**
   * Emite el array de NeuSelectOption completo (incluyendo data) al cambiar la selección.
   * Emite [] al limpiar toda la selección.
   * Los valores de ngModel / formControl siguen siendo string[].
   */
  readonly selectionChange = output<NeuSelectOption[]>();

  // --- Estado interno ---
  protected readonly _values = signal<string[]>([]);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly _chipMode = signal<'chips' | 'count'>('count');

  readonly _visibleChips = computed(() => this._values().slice(0, 3));

  readonly hasError = computed(() => !!this.errorMessage());

  readonly filteredOptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  // --- CVA ---
  private _onChange: (v: string[]) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this._values.set(Array.isArray(value) ? value : []);
  }

  registerOnChange(fn: (v: string[]) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  private readonly _cvaDisabled = signal(false);
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }
  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());

  // --- Helpers ---
  protected labelFor(value: string): string {
    return this.options().find((o) => o.value === value)?.label ?? value;
  }

  protected isSelected(value: string): boolean {
    return this._values().includes(value);
  }

  protected toggle(): void {
    if (this.isDisabledFinal()) return;
    this.isOpen.update((v) => !v);
    if (!this.isOpen()) {
      this.searchQuery.set('');
      this._onTouched();
    } else {
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-multiselect__option:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    }
  }

  /** Abre el panel y mueve el foco al primer item / Opens the panel and moves focus to the first item */
  onTriggerKey(event: Event): void {
    event.preventDefault();
    if (!this.isOpen()) {
      this.isOpen.set(true);
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-multiselect__option:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    }
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
  focusOptionByIndex(event: Event, current: NeuSelectOption, dir: 1 | -1): void {
    event.preventDefault();
    const opts = this.filteredOptions().filter((o) => !o.disabled);
    const idx = opts.findIndex((o) => o.value === current.value);
    const next = opts[(idx + dir + opts.length) % opts.length];
    if (next) {
      const el = this.elementRef.nativeElement.querySelector<HTMLElement>(
        `#neu-ms-opt-${next.value}`,
      );
      el?.focus();
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this._onTouched();
  }

  protected toggleOption(option: NeuSelectOption): void {
    if (option.disabled) return;
    const current = this._values();
    const next = current.includes(option.value)
      ? current.filter((v) => v !== option.value)
      : [...current, option.value];
    this._values.set(next);
    this._onChange(next);
    this.selectionChange.emit(this.options().filter((o) => next.includes(o.value)));
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, next.length ? next.join(',') : null);
  }

  protected removeValue(value: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this._values().filter((v) => v !== value);
    this._values.set(next);
    this._onChange(next);
    this._onTouched();
    this.selectionChange.emit(this.options().filter((o) => next.includes(o.value)));
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, next.length ? next.join(',') : null);
  }

  protected clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this._values.set([]);
    this._onChange([]);
    this._onTouched();
    this.selectionChange.emit([]);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, null);
  }

  protected toggleChipMode(event: MouseEvent): void {
    event.stopPropagation();
    this._chipMode.set(this._chipMode() === 'chips' ? 'count' : 'chips');
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
