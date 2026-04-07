import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuSelectOption } from '../select/neu-select.types';

export type { NeuSelectOption } from '../select/neu-select.types';

let _neuMultiselectIdSeq = 0;

/**
 * NeuralUI Multiselect Component
 *
 * Dropdown de selección múltiple con chips, búsqueda integrada y soporte
 * completo para Angular Forms (ngModel y Reactive Forms).
 *
 * Uso:
 *   <neu-multiselect label="Tecnologías" [options]="opts" [(ngModel)]="selected" />
 */
@Component({
  selector: 'neu-multiselect',
  imports: [],
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
    @if (label()) {
      <label class="neu-multiselect__static-label" [for]="_triggerId">{{ label() }}</label>
    }
    <div
      class="neu-multiselect"
      [class.neu-multiselect--open]="isOpen()"
      [class.neu-multiselect--disabled]="isDisabledFinal()"
      [class.neu-multiselect--error]="hasError()"
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
                {{ option.label }}
              </div>
            }

            @if (filteredOptions().length === 0) {
              <div class="neu-multiselect__empty">Sin resultados</div>
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
                  Limpiar todo
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

  /** @internal */
  readonly _triggerId = `neu-multiselect-trigger-${_neuMultiselectIdSeq++}`;

  /** Opciones del dropdown */
  options = input<NeuSelectOption[]>([]);

  /** Etiqueta del componente */
  label = input<string>('');

  /** Placeholder cuando no hay selección */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error */
  errorMessage = input<string>('');

  /** Deshabilita el componente */
  disabled = input<boolean>(false);

  /** Activa input de búsqueda/filtro en el panel */
  searchable = input<boolean>(false);

  /** Placeholder del input de búsqueda */
  searchPlaceholder = input<string>('Buscar...');

  // --- Estado interno ---
  protected readonly _values = signal<string[]>([]);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly _chipMode = signal<'chips' | 'count'>('chips');

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

  /** Abre el panel y mueve el foco al primer item */
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

  /** Navega entre opciones con flechas */
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
  }

  protected removeValue(value: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this._values().filter((v) => v !== value);
    this._values.set(next);
    this._onChange(next);
    this._onTouched();
  }

  protected clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this._values.set([]);
    this._onChange([]);
    this._onTouched();
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
