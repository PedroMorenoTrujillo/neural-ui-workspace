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
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NeuSelectOption } from '@neural-ui/core/select';
import { NeuMultiselectEmptyDirective, NeuMultiselectFooterDirective, NeuMultiselectHeaderDirective, NeuMultiselectItemDirective, NeuMultiselectSelectedDirective } from './neu-multiselect.directives';

export type { NeuSelectOption } from '@neural-ui/core/select';

let _neuMultiselectIdSeq = 0;

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/**
 * NeuralUI Multiselect Component
 *
 * Dropdown de selección múltiple con chips, búsqueda integrada y soporte / Multiple selection dropdown with chips, integrated search and support
 * para ControlValueAccessor y Reactive Forms. Puede usarse dentro de un FormGroup o con un FormControl standalone. / for ControlValueAccessor and Reactive Forms. It can be used inside a FormGroup or with a standalone FormControl.
 *
 * Uso:
 *   readonly technologiesCtrl = new FormControl<string[]>([], { nonNullable: true });
 *   <neu-multiselect label="Tecnologías" [options]="opts" [formControl]="technologiesCtrl" />
 */
@Component({
  selector: 'neu-multiselect',
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule],
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
    '(keydown.escape)': 'close()',
    '(window:resize)': 'onWindowResize()',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-multiselect__static-label" [for]="_triggerId" (click)="focusTrigger()">{{
        label()
      }}</label>
    }
    <div
      class="neu-multiselect"
      [class.neu-multiselect--open]="isOpen()"
      [class.neu-multiselect--disabled]="isDisabledFinal()"
      [class.neu-multiselect--error]="hasError()"
      [class.neu-multiselect--has-value]="_values().length > 0"
      [class.neu-multiselect--no-float]="!floatingLabel()"
      [class.neu-multiselect--sm]="size() === 'sm'"
      [class.neu-multiselect--lg]="size() === 'lg'"
      [style.--neu-multiselect-option-height]="virtualScrollItemSize() + 'px'"
    >
      <!-- Trigger -->
      <div
        cdkOverlayOrigin
        #multiselectOrigin="cdkOverlayOrigin"
        class="neu-multiselect__trigger"
        [id]="_triggerId"
        [attr.tabindex]="isDisabledFinal() ? '-1' : '0'"
        [attr.role]="'combobox'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="_panelId"
        [attr.aria-disabled]="isDisabledFinal() ? 'true' : null"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-label]="label() || null"
        (click)="toggle()"
        (keydown.arrowDown)="onTriggerKey($any($event))"
        (keydown.arrowUp)="onTriggerKey($any($event))"
        (keydown.enter)="onTriggerActionKey($any($event))"
        (keydown.space)="onTriggerActionKey($any($event))"
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
                @if (selectedItemTpl(); as selectedTpl) {
                  <ng-container [ngTemplateOutlet]="selectedTpl.templateRef" [ngTemplateOutletContext]="{ $implicit: optionFor(val), remove: removeOption.bind(this, val) }" />
                } @else { {{ labelFor(val) }} }
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
          @if (headerTpl()) { <ng-container [ngTemplateOutlet]="headerTpl()!.templateRef" /> }
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <!-- Panel -->
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="multiselectOrigin"
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
      >
        <div
          class="neu-multiselect__panel"
          [class.neu-multiselect__panel--virtual]="virtualScroll()"
          role="listbox"
          [id]="_panelId"
          [attr.aria-multiselectable]="true"
          [attr.aria-label]="label() || null"
          [style.width]="panelPosition().width"
          [style.max-height]="panelPosition().maxHeight"
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
          @if (selectAll()) {
            <button type="button" class="neu-multiselect__select-all" (click)="toggleAllFiltered($event)">
              {{ allFilteredSelected() ? unselectAllLabel() : selectAllLabel() }}
            </button>
          }

          <!-- Opciones -->
          <div class="neu-multiselect__options">
            <ng-template #multiselectOptionTpl let-option>
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
            </ng-template>

            @if (loading()) {
              <div class="neu-multiselect__empty" role="status">{{ loadingLabel() }}</div>
            } @else if (virtualScroll()) {
              <cdk-virtual-scroll-viewport
                class="neu-multiselect__viewport"
                [itemSize]="virtualScrollItemSize()"
                [style.height]="virtualViewportHeight()"
              >
                <ng-container *cdkVirtualFor="let option of filteredOptions(); trackBy: trackByOptionValue">
                  <ng-container
                    [ngTemplateOutlet]="multiselectOptionTpl"
                    [ngTemplateOutletContext]="{ $implicit: option }"
                  />
                </ng-container>
              </cdk-virtual-scroll-viewport>
            } @else {
              @for (option of filteredOptions(); track option.value) {
                <ng-container
                  [ngTemplateOutlet]="multiselectOptionTpl"
                  [ngTemplateOutletContext]="{ $implicit: option }"
                />
              }
            }

            @if (!loading() && filteredOptions().length === 0) {
              @if (emptyTpl()) { <ng-container [ngTemplateOutlet]="emptyTpl()!.templateRef" /> }
              @else { <div class="neu-multiselect__empty">{{ noResultsMessage() }}</div> }
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
          @if (footerTpl()) { <ng-container [ngTemplateOutlet]="footerTpl()!.templateRef" /> }
        </div>
      </ng-template>

      <div class="neu-multiselect__sr-status" aria-live="polite" aria-atomic="true">
        {{ resultsAnnouncement() }}
      </div>
    </div>

    @if (hasError()) {
      <p class="neu-multiselect__error" [id]="_triggerId + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-multiselect__hint" [id]="_triggerId + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-multiselect.component.scss',
})
export class NeuMultiselectComponent implements ControlValueAccessor {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID);
  private readonly _overlay = inject(Overlay);
  private readonly _urlState = inject(NeuUrlStateService);
  readonly _viewportMargin = 16;
  private readonly _panelMaxHeight = 280;
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
      const urlRaw = this._getUrlParamSignal(param)();
      const urlVals = urlRaw ? urlRaw.split(',').filter(Boolean) : [];
      const current = untracked(() => this._values());
      if (!arraysEqual(urlVals, current)) {
        untracked(() => {
          this._values.set(urlVals);
          this._onChange(urlVals);
        });
      }
    });
  }

  /** @internal */
  readonly _triggerId = `neu-multiselect-trigger-${_neuMultiselectIdSeq++}`;
  readonly _panelId = `${this._triggerId}-panel`;

  /** Template personalizado para cada opción del dropdown / Custom template for each dropdown option */
  readonly itemTpl = contentChild(NeuMultiselectItemDirective);
  readonly selectedItemTpl = contentChild(NeuMultiselectSelectedDirective);
  readonly headerTpl = contentChild(NeuMultiselectHeaderDirective);
  readonly footerTpl = contentChild(NeuMultiselectFooterDirective);
  readonly emptyTpl = contentChild(NeuMultiselectEmptyDirective);

  /** Opciones del dropdown / Dropdown options */
  options = input<NeuSelectOption[]>([]);

  /** Etiqueta del componente / Component label */
  label = input<string>('');

  /** Muestra el label como flotante dentro del campo (true) o estático encima (false) / Shows the label as floating inside the field (true) or static above (false) */
  floatingLabel = input<boolean>(false);

  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  size = input<'sm' | 'md' | 'lg'>('md');

  /** Placeholder cuando no hay selección / Placeholder when there is no selection */
  placeholder = input<string>('Seleccionar...');

  /** Mensaje de error / Error message */
  errorMessage = input<string>('');

  /** Texto de ayuda bajo el campo / Helper text below the field */
  hint = input<string>('');

  /** Deshabilita el componente / Disables the component */
  disabled = input<boolean>(false);

  /** Activa input de búsqueda/filtro en el panel / Activates the search/filter input in the panel */
  searchable = input<boolean>(false);

  /** Placeholder del input de búsqueda / Search input placeholder */
  searchPlaceholder = input<string>('Buscar...');

  loading = input<boolean>(false);
  loadingLabel = input<string>('Loading...');
  selectAll = input<boolean>(false);
  selectAllLabel = input<string>('Select all');
  unselectAllLabel = input<string>('Unselect all');

  /** Texto cuando no hay opciones tras filtrar / Text when no options remain after filtering */
  noResultsMessage = input<string>('Sin resultados');

  /** Texto del botón de limpiar todas las selecciones / Button text to clear all selections */
  clearAllLabel = input<string>('Limpiar todo');

  /** Muestra un botón × en el trigger para limpiar la selección de una vez / Shows a × button in the trigger to clear the selection at once */
  clearable = input<boolean>(false);

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large option lists */
  virtualScroll = input<boolean>(false);

  /** Número de opciones visibles en el viewport virtual / Number of visible options in the virtual viewport */
  virtualScrollVisibleItems = input<number>(8);

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
   * Los valores del formControl siguen siendo string[].
   */
  readonly selectionChange = output<NeuSelectOption[]>();

  // --- Estado interno ---
  protected readonly _values = signal<string[]>([]);
  readonly isOpen = signal(false);
  readonly searchQuery = signal('');
  readonly _chipMode = signal<'chips' | 'count'>('count');
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

  readonly _visibleChips = computed(() => this._values().slice(0, 3));

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

  readonly allFilteredSelected = computed(() => {
    const enabled = this.filteredOptions().filter((option) => !option.disabled);
    return enabled.length > 0 && enabled.every((option) => this._values().includes(option.value));
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
    const footerOffset = this._values().length > 0 ? 52 : 0;

    const parsedMaxHeight = panelMaxHeight
      ? Number.parseFloat(panelMaxHeight)
      : this._panelMaxHeight;
    if (Number.isNaN(parsedMaxHeight)) {
      return `${Math.min(desiredHeight, this._panelMaxHeight - searchOffset - footerOffset)}px`;
    }

    const effectivePanelMaxHeight = Math.min(this._panelMaxHeight, parsedMaxHeight);
    const availableHeight = Math.max(
      this.virtualScrollItemSize(),
      effectivePanelMaxHeight - searchOffset - footerOffset,
    );
    return `${Math.min(desiredHeight, availableHeight)}px`;
  });

  readonly trackByOptionValue = (_index: number, option: NeuSelectOption) => option.value;

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

  protected optionFor(value: string): NeuSelectOption {
    return this.options().find((option) => option.value === value) ?? { value, label: value };
  }

  protected removeOption(value: string): void {
    const next = this._values().filter((item) => item !== value);
    this._values.set(next);
    this._onChange(next);
    this._onTouched();
    this.selectionChange.emit(this.options().filter((option) => next.includes(option.value)));
  }

  protected isSelected(value: string): boolean {
    return this._values().includes(value);
  }

  protected toggle(): void {
    if (this.isDisabledFinal()) return;
    if (!this.isOpen()) {
      this.syncPanelPosition();
      this.isOpen.set(true);
      this.focusFirstOption();
    } else {
      this.isOpen.set(false);
      this.searchQuery.set('');
      this.resetPanelPosition();
      this._onTouched();
    }
  }

  /** Abre el panel y mueve el foco al primer item / Opens the panel and moves focus to the first item */
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
    this.elementRef.nativeElement.querySelector<HTMLElement>('.neu-multiselect__trigger')?.focus();
  }

  /** Navega entre opciones con flechas / Navigates between options with arrows */
  focusOptionByIndex(event: Event, current: NeuSelectOption, dir: 1 | -1): void {
    event.preventDefault();
    const opts = this.filteredOptions().filter((o) => !o.disabled);
    const idx = opts.findIndex((o) => o.value === current.value);
    const next = opts[(idx + dir + opts.length) % opts.length];
    if (next) {
      this.focusOption(next.value);
    }
  }

  protected close(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.resetPanelPosition();
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
    this.refreshVirtualViewport();
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
    this.refreshVirtualViewport();
  }

  protected clearAll(event: MouseEvent): void {
    event.stopPropagation();
    this._values.set([]);
    this._onChange([]);
    this._onTouched();
    this.selectionChange.emit([]);
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, null);
    this.refreshVirtualViewport();
  }

  protected toggleAllFiltered(event: MouseEvent): void {
    event.stopPropagation();
    const enabled = this.filteredOptions().filter((option) => !option.disabled);
    const current = new Set(this._values());
    if (this.allFilteredSelected()) {
      enabled.forEach((option) => current.delete(option.value));
    } else {
      enabled.forEach((option) => current.add(option.value));
    }
    const next = [...current];
    this._values.set(next);
    this._onChange(next);
    this._onTouched();
    this.selectionChange.emit(this.options().filter((option) => next.includes(option.value)));
    const param = this.urlParam();
    if (param) this._urlState.setParam(param, next.length ? next.join(',') : null);
    this.refreshVirtualViewport();
  }

  protected toggleChipMode(event: MouseEvent): void {
    event.stopPropagation();
    this._chipMode.set(this._chipMode() === 'chips' ? 'count' : 'chips');
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsideHost = this.elementRef.nativeElement.contains(target);
    const isInsidePanel = !!target?.closest('.neu-multiselect__panel');
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
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>(
      '.neu-multiselect__trigger',
    );
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 6;
    const width = Math.min(triggerRect.width, viewportWidth - this._viewportMargin * 2);
    const availableBelow = Math.max(
      0,
      viewportHeight - this._viewportMargin - triggerRect.bottom - gap,
    );
    const availableAbove = Math.max(0, triggerRect.top - this._viewportMargin - gap);
    const maxHeight = Math.max(180, Math.max(availableBelow, availableAbove));

    this.panelPosition.set({
      position: null,
      top: null,
      left: null,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
    });

    if (this.virtualScroll()) {
      this._requestFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  private focusFirstOption(): void {
    const firstEnabled = this.filteredOptions().find((option) => !option.disabled);
    if (!firstEnabled) {
      return;
    }

    this.focusOption(firstEnabled.value);
  }

  private focusOption(value: string): void {
    if (this.virtualScroll()) {
      const optionIndex = this.filteredOptions().findIndex((option) => option.value === value);
      if (optionIndex >= 0) {
        this._viewport()?.scrollToIndex(optionIndex, 'auto');
        this._viewport()?.checkViewportSize();
      }
      this._requestFrame(() => {
        const optionElement = this.elementRef.nativeElement.querySelector<HTMLElement>(
          `#neu-ms-opt-${value}`,
        ) ?? this._document.getElementById(`neu-ms-opt-${value}`);
        optionElement?.focus();
      });
      return;
    }

    const optionElement =
      this.elementRef.nativeElement.querySelector<HTMLElement>(`#neu-ms-opt-${value}`) ??
      this._document.getElementById(`neu-ms-opt-${value}`);
    optionElement?.focus();
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

  private refreshVirtualViewport(): void {
    if (!this.isOpen() || !this.virtualScroll()) {
      return;
    }

    this._requestFrame(() => {
      this._viewport()?.checkViewportSize();
    });
  }

  private _requestFrame(callback: FrameRequestCallback): void {
    if (isPlatformBrowser(this._platformId)) {
      requestAnimationFrame(callback);
    }
  }
}
