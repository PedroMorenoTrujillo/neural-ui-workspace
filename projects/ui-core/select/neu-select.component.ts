import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
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
  viewChild,
} from '@angular/core';
import { NeuUrlStateService } from '@neural-ui/core/url-state';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  NeuOptionDisabledAccessor,
  NeuOptionLabelAccessor,
  NeuOptionValue,
  NeuOptionValueAccessor,
  deserializeNeuOptionValue,
  neuOptionValuesEqual,
  resolveNeuOptionDisabled,
  resolveNeuOptionGroup,
  resolveNeuOptionLabel,
  resolveNeuOptionValue,
  serializeNeuOptionValue,
} from '@neural-ui/core/option-api';
import { NeuSelectOption } from './neu-select.types';
import { NeuSelectEmptyDirective, NeuSelectFooterDirective, NeuSelectGroupDirective, NeuSelectHeaderDirective, NeuSelectItemDirective, NeuSelectSelectedDirective } from './neu-select.directives';

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
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule],
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
    '(keydown.escape)': 'close()',
    '(window:resize)': 'onWindowResize()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-select__static-label" [for]="_triggerId" (click)="focusTrigger()">{{
        label()
      }}</label>
    }
    <div
      cdkOverlayOrigin
      #selectOrigin="cdkOverlayOrigin"
      class="neu-select"
      [class.neu-select--open]="isOpen()"
      [class.neu-select--open-above]="isPanelAbove()"
      [class.neu-select--disabled]="isDisabledFinal()"
      [class.neu-select--error]="hasError()"
      [class.neu-select--has-value]="hasValue()"
      [class.neu-select--has-placeholder]="!!placeholder() && !hasValue()"
      [class.neu-select--no-float]="!floatingLabel()"
      [class.neu-select--sm]="size() === 'sm'"
      [class.neu-select--lg]="size() === 'lg'"
      [style.--neu-select-option-height]="virtualScrollItemSize() + 'px'"
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
        [attr.aria-activedescendant]="isOpen() ? selectedOptionId() : null"
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
        @if (clearable() && hasValue() && !isDisabledFinal()) {
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
          @if (headerTpl()) { <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" /> }
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <!-- Panel ------>
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="selectOrigin"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayWidth]="panelPosition().width ?? ''"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayViewportMargin]="_viewportMargin"
        (backdropClick)="close()"
        (detach)="close()"
        (positionChange)="onOverlayPositionChange($event)"
      >
        <div
          class="neu-select__panel"
          [class.neu-select__panel--above]="isPanelAbove()"
          [class.neu-select__panel--virtual]="virtualScroll()"
          role="listbox"
          [id]="_panelId"
          [attr.aria-label]="label()"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight"
        >
          <ng-template #selectOptionTpl let-option>
            <div
              class="neu-select__option"
              [class.neu-select__option--selected]="isOptionSelected(option)"
              [class.neu-select__option--disabled]="isOptionDisabled(option)"
              role="option"
              [id]="optionDomId(option)"
              [attr.aria-selected]="isOptionSelected(option)"
              [attr.aria-disabled]="isOptionDisabled(option)"
              [attr.tabindex]="isOptionDisabled(option) ? null : '-1'"
              (click)="selectOption(option)"
              (keydown.enter)="selectOption(option)"
              (keydown.space)="selectOption(option)"
              (keydown.arrowDown)="focusOptionByIndex($any($event), option, 1)"
              (keydown.arrowUp)="focusOptionByIndex($any($event), option, -1)"
            >
              <!-- Checkmark en la seleccionada (siempre reserva el espacio) -->
              <svg
                class="neu-select__check"
                [style.visibility]="isOptionSelected(option) ? 'visible' : 'hidden'"
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
                {{ optionLabelOf(option) }}
              }
            </div>
          </ng-template>

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
          @if (loading()) {
            <div class="neu-select__empty" role="status">{{ loadingLabel() }}</div>
          } @else if (virtualScroll()) {
            <cdk-virtual-scroll-viewport
              class="neu-select__viewport"
              [itemSize]="virtualScrollItemSize()"
              [style.height]="virtualViewportHeight()"
            >
              <ng-container *cdkVirtualFor="let option of filteredOptions(); trackBy: trackByOptionValue">
                <ng-container
                  [ngTemplateOutlet]="selectOptionTpl"
                  [ngTemplateOutletContext]="{ $implicit: option }"
                />
              </ng-container>
            </cdk-virtual-scroll-viewport>
          } @else {
            @for (option of filteredOptions(); track trackByOptionValue($index, option)) {
              @if (optionGroup(option); as group) {
                @if (group !== previousGroup(option)) {
                  @if (groupTpl()) { <ng-container [ngTemplateOutlet]="groupTpl()!.templateRef" [ngTemplateOutletContext]="{ $implicit: group }" /> }
                  @else { <div class="neu-select__group">{{ group }}</div> }
                }
              }
              <ng-container
                [ngTemplateOutlet]="selectOptionTpl"
                [ngTemplateOutletContext]="{ $implicit: option }"
              />
            }
          }
          @if (!loading() && filteredOptions().length === 0) {
            @if (emptyTpl()) { <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" /> }
            @else { <div class="neu-select__empty">{{ noResultsMessage() }}</div> }
          }
          @if (footerTpl()) { <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" /> }
        </div>
      </ng-template>
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
export class NeuSelectComponent<T = NeuSelectOption, V = NeuOptionValue<T>>
  implements ControlValueAccessor
{
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  readonly _viewportMargin = 0;
  private readonly _panelMaxHeight = 240;
  private readonly _urlParamSignals = new Map<string, Signal<string | null>>();
  private readonly _viewport = viewChild(CdkVirtualScrollViewport);

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
      const nextValue = urlVal === null ? null : this.valueFromUrl(urlVal);
      if (!neuOptionValuesEqual(nextValue, untracked(() => this._value()))) {
        untracked(() => {
          this._value.set(nextValue);
          this._onChange(nextValue);
        });
      }
    });
  }
  /** @internal — ID \u00fanico para asociar label con trigger */
  readonly _triggerId = `neu-select-trigger-${_neuSelectIdSeq++}`;
  readonly _panelId = `${this._triggerId}-panel`;
  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  readonly itemTpl = contentChild(NeuSelectItemDirective<T>);

  /** Template personalizado para el valor seleccionado en el trigger / Custom template for the selected value in the trigger */
  readonly selectedItemTpl = contentChild(NeuSelectSelectedDirective<T>);
  readonly headerTpl = contentChild(NeuSelectHeaderDirective);
  readonly footerTpl = contentChild(NeuSelectFooterDirective);
  readonly emptyTpl = contentChild(NeuSelectEmptyDirective);
  readonly groupTpl = contentChild(NeuSelectGroupDirective);
  /** Opciones del dropdown / Dropdown options */
  options = input<readonly T[]>([]);

  /** Property or function used to obtain the visible option label. */
  optionLabel = input<NeuOptionLabelAccessor<T> | null>(null);

  /** Property or function used to obtain the form value. Defaults to the complete domain model. */
  optionValue = input<NeuOptionValueAccessor<T, V> | null>(null);

  /** Property or function used to determine whether an option is disabled. */
  optionDisabled = input<NeuOptionDisabledAccessor<T> | null>(null);

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

  /** Muestra estado de carga dentro del panel / Shows a loading state inside the panel */
  loading = input<boolean>(false);

  /** Texto del estado de carga / Loading state text */
  loadingLabel = input<string>('Loading...');

  /** Muestra un botón para limpiar la selección / Shows a button to clear the selection */
  clearable = input<boolean>(false);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');

  /** Aria-label del botón de limpiar / Aria-label for the clear button */
  clearAriaLabel = input<string>('Limpiar selección');

  /**
   * Sincroniza el valor seleccionado con este query param de la URL.
   * Al seleccionar una opción se añade `?{urlParam}=value` a la URL.
   * Los valores que no puedan serializarse a string URL (objetos) no sincronizan en URL.
   * Esto es intencional para evitar serializaciones ambiguas o engañosas.
   * Usa `optionValue` para persistir valores completos en URL.
   * Pasar `null` (default) deshabilita la sincronización.
   */
  urlParam = input<string | null>(null);

  /**
   * Emite el modelo original al seleccionar una opción y null al limpiar.
   * Con NeuSelectOption mantiene el contrato legacy, incluido el campo data.
   */
  readonly selectionChange = output<T | null>();

  // Estado interno
  protected readonly _value = signal<V | null>(null);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -6,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 6,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -6,
    },
  ];
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.reposition();
  readonly panelPosition = signal<{
    position: string | null;
    top: string | null;
    bottom: string | null;
    left: string | null;
    width: string | null;
    maxHeight: string | null;
  }>({
    position: null,
    top: null,
    bottom: null,
    left: null,
    width: null,
    maxHeight: null,
  });
  readonly isPanelAbove = signal(false);

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

  readonly hasValue = computed(() => this._value() !== null);

  readonly filteredOptions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((option) => this.optionLabelOf(option).toLowerCase().includes(q));
  });

  previousGroup(option: T): string | undefined {
    const index = this.filteredOptions().indexOf(option);
    const previous = index > 0 ? this.filteredOptions()[index - 1] : undefined;
    return previous === undefined ? undefined : this.optionGroup(previous);
  }

  readonly selectedLabel = computed(
    () => {
      const selected = this._selectedOption();
      return selected === null ? null : this.optionLabelOf(selected);
    },
  );

  readonly _selectedOption = computed(
    () => this.options().find((option) => this.isOptionSelected(option)) ?? null,
  );

  readonly selectedOptionId = computed(() => {
    const selected = this._selectedOption();
    return selected === null ? null : this.optionDomId(selected);
  });

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

  readonly virtualScrollItemSize = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      default:
        return 44;
    }
  });

  readonly virtualViewportHeight = computed(() => {
    const desiredHeight = this.virtualScrollVisibleItems() * this.virtualScrollItemSize();
    const panelMaxHeight = this.panelPosition().maxHeight;
    const searchOffset = this.searchable() ? 52 : 0;

    const parsedMaxHeight = panelMaxHeight
      ? Number.parseFloat(panelMaxHeight)
      : this._panelMaxHeight;
    if (Number.isNaN(parsedMaxHeight)) {
      return `${Math.min(desiredHeight, this._panelMaxHeight - searchOffset)}px`;
    }

    const effectivePanelMaxHeight = Math.min(this._panelMaxHeight, parsedMaxHeight);
    const availableHeight = Math.max(
      this.virtualScrollItemSize(),
      effectivePanelMaxHeight - searchOffset,
    );
    return `${Math.min(desiredHeight, availableHeight)}px`;
  });

  readonly trackByOptionValue = (_index: number, option: T) => this.optionValueOf(option);

  // CVA
  private _onChange: (v: V | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(val: V | null): void {
    this._value.set(val ?? null);
  }

  registerOnChange(fn: (v: V | null) => void): void {
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
    if (this.isDisabledFinal()) return;
    if (!this.isOpen()) {
      this.syncPanelPosition();
      this.isOpen.set(true);
      this.focusFirstOption();
    } else {
      this.isOpen.set(false);
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
      this.syncPanelPosition();
      this.isOpen.set(true);
      this.focusFirstOption();
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
  focusOptionByIndex(event: Event, current: T, dir: 1 | -1): void {
    event.preventDefault();
    const opts = this.filteredOptions().filter((option) => !this.isOptionDisabled(option));
    const idx = opts.indexOf(current);
    const next = opts[(idx + dir + opts.length) % opts.length];
    if (next) {
      this.focusOption(next);
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

  selectOption(option: T): void {
    if (this.isOptionDisabled(option)) return;
    const value = this.optionValueOf(option);
    this._value.set(value);
    this._onChange(value);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, serializeNeuOptionValue(value));
    this.selectionChange.emit(option);
    this.close();
  }

  optionLabelOf(option: T): string {
    return resolveNeuOptionLabel(option, this.optionLabel());
  }

  optionValueOf(option: T): V {
    return resolveNeuOptionValue<T, V>(option, this.optionValue());
  }

  isOptionDisabled(option: T): boolean {
    return resolveNeuOptionDisabled(option, this.optionDisabled());
  }

  optionGroup(option: T): string | undefined {
    return resolveNeuOptionGroup(option);
  }

  isOptionSelected(option: T): boolean {
    const current = this._value();
    return current !== null && neuOptionValuesEqual(this.optionValueOf(option), current);
  }

  optionDomId(option: T): string {
    const index = this.options().indexOf(option);
    return `${this._panelId}-option-${Math.max(index, 0)}`;
  }

  private valueFromUrl(serialized: string): V | null {
    const matchingOption = this.options().find(
      (option) => serializeNeuOptionValue(this.optionValueOf(option)) === serialized,
    );

    if (matchingOption !== undefined) {
      return this.optionValueOf(matchingOption);
    }

    const canSerializeAny = this.options().some(
      (option) => serializeNeuOptionValue(this.optionValueOf(option)) !== null,
    );
    if (!canSerializeAny) {
      return null;
    }

    const parsed = deserializeNeuOptionValue(serialized);
    return parsed as V;
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-select__panel');
    if (!isInsideHost && !isInsidePanel) {
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
    const origin =
      this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-select');
    if (!origin) return;

    const triggerRect = origin.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const width = Math.min(triggerRect.width, viewportWidth - this._viewportMargin * 2);
    const availableBelow = Math.max(
      0,
      viewportHeight - this._viewportMargin - triggerRect.bottom - gap,
    );
    const availableAbove = Math.max(0, triggerRect.top - this._viewportMargin - gap);
    const openAbove = availableAbove > availableBelow && availableAbove >= 140;
    const maxHeight = Math.max(140, openAbove ? availableAbove : availableBelow);

    this.panelPosition.set({
      position: 'fixed',
      top: openAbove ? 'auto' : `${triggerRect.bottom + gap}px`,
      bottom: openAbove ? `${viewportHeight - triggerRect.top + gap}px` : 'auto',
      left: `${Math.min(Math.max(triggerRect.left, this._viewportMargin), viewportWidth - width - this._viewportMargin)}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
    });
    this.isPanelAbove.set(openAbove);

    if (this.virtualScroll()) {
      this._requestFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  onOverlayPositionChange(event: ConnectedOverlayPositionChange): void {
    this.isPanelAbove.set(event.connectionPair.overlayY === 'bottom');
  }

  private focusFirstOption(): void {
    const firstEnabled = this.filteredOptions().find((option) => !this.isOptionDisabled(option));
    if (!firstEnabled) {
      return;
    }

    this.focusOption(firstEnabled);
  }

  private focusOption(optionOrValue: T | V): void {
    const option = this.options().find(
      (candidate) =>
        candidate === optionOrValue ||
        neuOptionValuesEqual(this.optionValueOf(candidate), optionOrValue as V),
    );
    const optionId = option ? this.optionDomId(option) : `${this._panelId}-option-missing`;
    if (this.virtualScroll()) {
      const optionIndex = option === undefined ? -1 : this.filteredOptions().indexOf(option);
      if (optionIndex >= 0) {
        this._viewport()?.scrollToIndex(optionIndex, 'auto');
        this._viewport()?.checkViewportSize();
      }
      this._requestFrame(() => {
        const optionElement =
          this.elementRef.nativeElement.querySelector<HTMLElement>(`#${optionId}`) ??
          this._document.getElementById(optionId);
        optionElement?.focus();
      });
      return;
    }

    const optionElement =
      this.elementRef.nativeElement.querySelector<HTMLElement>(`#${optionId}`) ??
      this._document.getElementById(optionId);
    optionElement?.focus();
  }

  private resetPanelPosition(): void {
    this.panelPosition.set({
      position: null,
      top: null,
      bottom: null,
      left: null,
      width: null,
      maxHeight: null,
    });
    this.isPanelAbove.set(false);
  }

  private _requestFrame(callback: FrameRequestCallback): void {
    if (isPlatformBrowser(this._platformId)) {
      requestAnimationFrame(callback);
    }
  }
}
