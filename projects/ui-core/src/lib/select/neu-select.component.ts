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
import { NeuSelectOption } from './neu-select.types';
import { NeuSelectItemDirective, NeuSelectSelectedDirective } from './neu-select.directives';

export type { NeuSelectOption } from './neu-select.types';

let _neuSelectIdSeq = 0;

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
  imports: [NgTemplateOutlet],
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
      <label class="neu-select__static-label" [for]="_triggerId">{{ label() }}</label>
    }
    <div
      class="neu-select"
      [class.neu-select--open]="isOpen()"
      [class.neu-select--disabled]="isDisabledFinal()"
      [class.neu-select--error]="hasError()"
      [class.neu-select--has-value]="!!_value()"
      [class.neu-select--has-placeholder]="!!placeholder() && !_value()"
      [class.neu-select--no-float]="!floatingLabel()"
    >
      <!-- Trigger ------>
      <button
        class="neu-select__trigger"
        type="button"
        [id]="_triggerId"
        [disabled]="isDisabledFinal()"
        [attr.role]="'combobox'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-activedescendant]="isOpen() && _value() ? 'neu-select-opt-' + _value() : null"
        (click)="toggle()"
        (keydown.arrowDown)="onTriggerKey($any($event))"
        (keydown.arrowUp)="onTriggerKey($any($event))"
      >
        <!-- Floating label -->
        @if (floatingLabel() && label()) {
          <span class="neu-select__label">{{ label() }}</span>
        }

        <span class="neu-select__value">
          @if (selectedLabel()) {
            @if (selectedItemTpl()) {
              <ng-container
                [ngTemplateOutlet]="selectedItemTpl()!.templateRef"
                [ngTemplateOutletContext]="{ $implicit: _selectedOption() }"
              />
            } @else {
              {{ selectedLabel() }}
            }
          } @else {
            <span class="neu-select__placeholder">{{ placeholder() }}</span>
          }
        </span>

        <!-- Clear button -->
        @if (clearable() && !!_value() && !isDisabledFinal()) {
          <button
            class="neu-select__clear"
            type="button"
            aria-label="Limpiar selección"
            [attr.aria-label]="clearAriaLabel()"
            (click)="clearValue($event)"
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
                [attr.aria-label]="'Search ' + label()"
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
              [id]="'neu-select-opt-' + option.value"
              [attr.aria-selected]="option.value === _value()"
              [attr.aria-disabled]="option.disabled"
              [attr.tabindex]="option.disabled ? null : '-1'"
              (click)="selectOption(option)"
              (keydown.enter)="selectOption(option)"
              (keydown.space)="selectOption(option)"
              (keydown.arrowDown)="focusOptionByIndex($any($event), option, 1)"
              (keydown.arrowUp)="focusOptionByIndex($any($event), option, -1)"
            >
              <!-- Checkmark en la seleccionada (siempre reserva el espacio) -->
              <svg
                class="neu-select__check"
                [style.visibility]="option.value === _value() ? 'visible' : 'hidden'"
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
            <div class="neu-select__empty">{{ noResultsMessage() }}</div>
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
  private readonly _urlState = inject(NeuUrlStateService);

  constructor() {
    effect(() => {
      const param = this.urlParam();
      if (!param) return;
      const urlVal = this._urlState.getParam(param)();
      if (urlVal !== untracked(() => this._value())) {
        this._value.set(urlVal);
        this._onChange(urlVal);
      }
    });
  }
  /** @internal — ID \u00fanico para asociar label con trigger */
  readonly _triggerId = `neu-select-trigger-${_neuSelectIdSeq++}`;
  /** Template personalizado para cada opción del dropdown */
  readonly itemTpl = contentChild(NeuSelectItemDirective);

  /** Template personalizado para el valor seleccionado en el trigger */
  readonly selectedItemTpl = contentChild(NeuSelectSelectedDirective);
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

  /** Muestra un botón para limpiar la selección */
  clearable = input<boolean>(false);

  /** Texto cuando no hay opciones tras filtrar */
  noResultsMessage = input<string>('Sin resultados');

  /** Aria-label del botón de limpiar */
  clearAriaLabel = input<string>('Limpiar selección');

  /**
   * Sincroniza el valor seleccionado con este query param de la URL.
   * Al seleccionar una opción se añade `?{urlParam}=value` a la URL.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /**
   * Emite el objeto NeuSelectOption completo (incluyendo data) al seleccionar una opción.
   * Emite null al limpiar la selección.
   * El valor de ngModel / formControl sigue siendo string.
   */
  readonly selectionChange = output<NeuSelectOption | null>();

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

  readonly _selectedOption = computed(
    () => this.options().find((o) => o.value === this._value()) ?? null,
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

  private readonly _cvaDisabled = signal(false);
  setDisabledState(isDisabled: boolean): void {
    this._cvaDisabled.set(isDisabled);
  }

  readonly isDisabledFinal = computed(() => this.disabled() || this._cvaDisabled());

  toggle(): void {
    if (!this.isDisabledFinal()) this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      // Foco al primer item cuando abre con teclado
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-select__option:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this._onTouched();
  }

  /** Abre el panel y navega con flechas desde el trigger */
  onTriggerKey(event: Event): void {
    event.preventDefault();
    if (!this.isOpen()) {
      this.isOpen.set(true);
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-select__option:not([aria-disabled="true"])',
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
        `#neu-select-opt-${next.value}`,
      );
      el?.focus();
    }
  }

  clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this._value.set(null);
    this._onChange(null);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, null);
    this._onTouched();
    this.selectionChange.emit(null);
    this.close();
  }

  selectOption(option: NeuSelectOption): void {
    if (option.disabled) return;
    this._value.set(option.value);
    this._onChange(option.value);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, option.value);
    this.selectionChange.emit(option);
    this.close();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }
}
