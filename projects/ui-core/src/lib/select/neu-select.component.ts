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
import { NeuSelectOption } from './neu-select.types';

export type { NeuSelectOption } from './neu-select.types';

/**
 * NeuralUI Select Component
 *
 * Dropdown personalizado con soporte para Angular Forms.
 * Cierra automáticamente al hacer clic fuera del componente.
 *
 * Uso:
 *   <neu-select label="País" [options]="paises" [(ngModel)]="country" />
 *
 * Con Reactive Forms:
 *   <neu-select label="País" [options]="paises" [formControl]="countryCtrl" />
 */
@Component({
  selector: 'neu-select',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-select__static-label">{{ label() }}</label>
    }
    <div
      class="neu-select"
      [class.neu-select--open]="isOpen()"
      [class.neu-select--disabled]="disabled()"
      [class.neu-select--error]="hasError()"
      [class.neu-select--has-value]="!!_value()"
      [class.neu-select--has-placeholder]="!!placeholder() && !_value()"
      [class.neu-select--no-float]="!floatingLabel()"
    >
      <!-- Trigger ------>
      <button
        class="neu-select__trigger"
        type="button"
        [disabled]="disabled()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        (click)="toggle()"
      >
        <!-- Floating label -->
        @if (floatingLabel() && label()) {
          <span class="neu-select__label">{{ label() }}</span>
        }

        <span class="neu-select__value">
          @if (selectedLabel()) {
            {{ selectedLabel() }}
          } @else {
            <span class="neu-select__placeholder">{{ placeholder() }}</span>
          }
        </span>

        <!-- Chevron -->
        <svg
          class="neu-select__chevron"
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

      <!-- Panel ------>
      @if (isOpen()) {
        <div class="neu-select__panel" role="listbox" [attr.aria-label]="label()">
          @if (searchable()) {
            <div class="neu-select__search">
              <input
                class="neu-select__search-input"
                type="text"
                [placeholder]="searchPlaceholder()"
                [value]="searchQuery()"
                (input)="searchQuery.set($any($event.target).value)"
                (click)="$event.stopPropagation()"
              />
            </div>
          }
          @for (option of filteredOptions(); track option.value) {
            <div
              class="neu-select__option"
              [class.neu-select__option--selected]="option.value === _value()"
              [class.neu-select__option--disabled]="option.disabled"
              role="option"
              [attr.aria-selected]="option.value === _value()"
              [attr.aria-disabled]="option.disabled"
              (click)="selectOption(option)"
            >
              <!-- Checkmark en la seleccionada -->
              @if (option.value === _value()) {
                <svg
                  class="neu-select__check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
              {{ option.label }}
            </div>
          }
          @if (filteredOptions().length === 0) {
            <div class="neu-select__empty">Sin resultados</div>
          }
        </div>
      }
    </div>

    <!-- Error / hint -->
    @if (hasError()) {
      <p class="neu-select__error" role="alert">{{ errorMessage() }}</p>
    }
  `,
  styleUrl: './neu-select.component.scss',
})
export class NeuSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Opciones del dropdown */
  options = input<NeuSelectOption[]>([]);

  /** Texto del floating label */
  label = input<string>('');

  /** Placeholder cuando no hay selección */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error */
  errorMessage = input<string>('');

  /** Deshabilita el select */
  disabled = input<boolean>(false);

  /** Muestra el label como flotante (true) o como label estático encima (false, por defecto) */
  floatingLabel = input<boolean>(false);

  /** Activa input de búsqueda/filtro en el panel */
  searchable = input<boolean>(false);

  /** Placeholder del input de búsqueda */
  searchPlaceholder = input<string>('Buscar...');

  // Estado interno
  protected readonly _value = signal<string | null>(null);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');

  readonly hasError = computed(() => !!this.errorMessage());

  readonly filteredOptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  readonly selectedLabel = computed(
    () => this.options().find((o) => o.value === this._value())?.label ?? null,
  );

  // CVA
  private _onChange: (v: string | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this._value.set(val ?? null);
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  toggle(): void {
    if (!this.disabled()) this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this._onTouched();
  }

  selectOption(option: NeuSelectOption): void {
    if (option.disabled) return;
    this._value.set(option.value);
    this._onChange(option.value);
    this.close();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
