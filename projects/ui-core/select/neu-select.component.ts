import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Signal,
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
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { NgTemplateOutlet } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuSelectOption } from './neu-select.types';
import { NeuSelectItemDirective, NeuSelectSelectedDirective } from './neu-select.directives';

export type { NeuSelectOption } from './neu-select.types';

let _neuSelectIdSeq = 0;

/**
 * NeuralUI Select Component
 *
 * Dropdown personalizado con soporte para ControlValueAccessor y Reactive Forms.
 * Puede usarse dentro de un FormGroup o con un FormControl standalone.
 * Cierra automáticamente al hacer clic fuera del componente.
 *
 * Uso:
 *   readonly countryCtrl = new FormControl<string | null>(null);
 *   <neu-select label="País" [options]="paises" [formControl]="countryCtrl" />
 *
 * Uso standalone fuera de un formulario completo:
 *   readonly sortCtrl = new FormControl<string | null>('name');
 *   <neu-select label="Orden" [options]="sortOptions" [formControl]="sortCtrl" />
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
    '(window:resize)': 'onWindowResize()',
    '(window:scroll)': 'onWindowScroll()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-select__static-label" [for]="_triggerId" (click)="focusTrigger()">{{
        label()
      }}</label>
    }
    <div
      class="neu-select"
      [class.neu-select--open]="isOpen()"
      [class.neu-select--disabled]="isDisabledFinal()"
      [class.neu-select--error]="hasError()"
      [class.neu-select--has-value]="!!_value()"
      [class.neu-select--has-placeholder]="!!placeholder() && !_value()"
      [class.neu-select--no-float]="!floatingLabel()"
      [class.neu-select--sm]="size() === 'sm'"
      [class.neu-select--lg]="size() === 'lg'"
    >
      <!-- Trigger ------>
      <div
        class="neu-select__trigger"
        [id]="_triggerId"
        [attr.tabindex]="isDisabledFinal() ? '-1' : '0'"
        [attr.role]="'combobox'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="_panelId"
        [attr.aria-disabled]="isDisabledFinal() ? 'true' : null"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-activedescendant]="isOpen() && _value() ? 'neu-select-opt-' + _value() : null"
        [attr.aria-label]="label() || placeholder() || null"
        (click)="toggle()"
        (keydown.arrowDown)="onTriggerKey($any($event))"
        (keydown.arrowUp)="onTriggerKey($any($event))"
        (keydown.enter)="onTriggerActionKey($any($event))"
        (keydown.space)="onTriggerActionKey($any($event))"
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
      </div>

      <!-- Panel ------>
      @if (isOpen()) {
        <div
          class="neu-select__panel"
          role="listbox"
          [id]="_panelId"
          [attr.aria-label]="label()"
          [style.position]="panelPosition().position"
          [style.top]="panelPosition().top"
          [style.left]="panelPosition().left"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight"
        >
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
      <div class="neu-select__sr-status" aria-live="polite" aria-atomic="true">
        {{ resultsAnnouncement() }}
      </div>
    </div>

    <!-- Error / hint -->
    @if (hasError()) {
      <p class="neu-select__error" [id]="_triggerId + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-select__hint" [id]="_triggerId + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-select.component.scss',
})
export class NeuSelectComponent implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _urlState = inject(NeuUrlStateService);
  private readonly _mobileViewportMax = 768;
  private readonly _viewportMargin = 16;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();

  private _getUrlParamSignal(key: string): Signal<string | null> {
    let paramSignal = this._urlParamSignals.get(key);
    if (!paramSignal) {
      paramSignal = this._urlState.getParam(key);
      this._urlParamSignals.set(key, paramSignal);
    }
    return paramSignal;
  }

  constructor() {
    effect(() => {
      const param = this.urlParam();
      if (!param) return;
      const urlVal = this._getUrlParamSignal(param)();
      if (urlVal !== untracked(() => this._value())) {
        this._value.set(urlVal);
        this._onChange(urlVal);
      }
    });
  }
  /** @internal — ID \u00fanico para asociar label con trigger */
  readonly _triggerId = `neu-select-trigger-${_neuSelectIdSeq++}`;
  readonly _panelId = `${this._triggerId}-panel`;
  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  readonly itemTpl = contentChild(NeuSelectItemDirective);

  /** Template personalizado para el valor seleccionado en el trigger / Custom template for the selected value in the trigger */
  readonly selectedItemTpl = contentChild(NeuSelectSelectedDirective);
  /** Opciones del dropdown / Dropdown options */
  options = input<NeuSelectOption[]>([]);

  /** Texto del floating label / Floating label text */
  label = input<string>('');

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Texto de ayuda bajo el campo / Helper text below the field */
  hint = input<string>('');

  /** Deshabilita el select / Disables the select */
  disabled = input<boolean>(false);

  /** Muestra el label como flotante (true) o como label estático encima (false, por defecto) / Shows the label as floating (true) or static above (false, default) */
  floatingLabel = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<'sm' | 'md' | 'lg'>('md');
  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  /** Muestra un botón para limpiar la selección / Shows a button to clear the selection */
  clearable = input<boolean>(false);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');

  /** Aria-label del botón de limpiar / Aria-label for the clear button */
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
   * El valor del formControl sigue siendo string.
   */
  readonly selectionChange = output<NeuSelectOption | null>();

  // Estado interno
  protected readonly _value = signal<string | null>(null);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly panelPosition = signal<{
    position: string | null;
    top: string | null;
    left: string | null;
    width: string | null;
    maxHeight: string | null;
  }>({
    position: null,
    top: null,
    left: null,
    width: null,
    maxHeight: null,
  });

  readonly hasError = computed(() => !!this.errorMessage());

  readonly describedBy = computed(() => {
    if (this.hasError()) {
      return `${this._triggerId}-error`;
    }
    if (this.hint()) {
      return `${this._triggerId}-hint`;
    }
    return null;
  });

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

  readonly resultsAnnouncement = computed(() => {
    if (!this.isOpen()) {
      return '';
    }

    const total = this.filteredOptions().length;
    if (!total) {
      return this.noResultsMessage();
    }

    return total === 1 ? '1 opción disponible' : `${total} opciones disponibles`;
  });

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
      this.syncPanelPosition();
      // Foco al primer item cuando abre con teclado
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-select__option:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    } else {
      this.resetPanelPosition();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.resetPanelPosition();
    this._onTouched();
  }

  /** Abre el panel y navega con flechas desde el trigger / Opens the panel and navigates with arrows from the trigger */
  onTriggerKey(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    if (!this.isOpen()) {
      this.isOpen.set(true);
      this.syncPanelPosition();
      requestAnimationFrame(() => {
        const first = this.elementRef.nativeElement.querySelector<HTMLElement>(
          '.neu-select__option:not([aria-disabled="true"])',
        );
        first?.focus();
      });
    }
  }

  onTriggerActionKey(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    event.preventDefault();
    this.toggle();
  }

  focusTrigger(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select__trigger')?.focus();
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
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
      this.close();
    }
  }

  onWindowResize(): void {
    if (this.isOpen()) {
      this.syncPanelPosition();
    }
  }

  onWindowScroll(): void {
    if (this.isOpen()) {
      this.syncPanelPosition();
    }
  }

  private syncPanelPosition(): void {
    requestAnimationFrame(() => {
      const trigger =
        this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select__trigger');
      if (!trigger) return;
      if (window.innerWidth > this._mobileViewportMax) {
        this.resetPanelPosition();
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.min(triggerRect.width, viewportWidth - this._viewportMargin * 2);
      const left = Math.min(
        Math.max(triggerRect.left, this._viewportMargin),
        viewportWidth - this._viewportMargin - width,
      );
      const top = triggerRect.bottom + 6;
      const maxHeight = Math.max(140, viewportHeight - top - this._viewportMargin);

      this.panelPosition.set({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        maxHeight: `${maxHeight}px`,
      });
    });
  }

  private resetPanelPosition(): void {
    this.panelPosition.set({
      position: null,
      top: null,
      left: null,
      width: null,
      maxHeight: null,
    });
  }
}
