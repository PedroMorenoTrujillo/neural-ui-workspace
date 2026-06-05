import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface NeuAutocompleteOption {
  /** Valor / Value */
  value: unknown;
  /** Texto visible / Display text */
  label: string;
  /** Desactiva la opción / Disables the option */
  disabled?: boolean;
}

let _seq = 0;

/**
 * NeuralUI Autocomplete
 *
 * Input con lista de sugerencias filtradas y navegación por teclado.
 * Implementa CVA para uso en formularios reactivos.
 *
 * Uso:
 *   <neu-autocomplete
 *     [options]="opts"
 *     placeholder="Buscar…"
 *     [formControl]="selectedCtrl"
 *     (optionSelected)="onSelect($event)"
 *   />
 */
@Component({
  selector: 'neu-autocomplete',
  imports: [OverlayModule, ScrollingModule],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuAutocompleteComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-autocomplete',
    '[class.neu-autocomplete--open]': '_isOpen()',
    '[class.neu-autocomplete--disabled]': '_cvaDisabled()',
    '[class.neu-autocomplete--floating]': 'floatingLabel()',
    '[class.neu-autocomplete--focused]': '_focused()',
    '[class.neu-autocomplete--has-value]': '!!_query()',
    '[class.neu-autocomplete--sm]': 'size() === "sm"',
    '[class.neu-autocomplete--lg]': 'size() === "lg"',
    '[style.--neu-autocomplete-option-height]': 'virtualScrollItemSize() + "px"',
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-autocomplete__label" [for]="_id">{{ label() }}</label>
    }
    <div
      cdkOverlayOrigin
      #autocompleteOrigin="cdkOverlayOrigin"
      class="neu-autocomplete__input-wrap"
      [class.neu-autocomplete__input-wrap--focused]="_focused()"
      [class.neu-autocomplete__input-wrap--has-value]="!!_query()"
    >
      <input
        #inputEl
        class="neu-autocomplete__input"
        type="text"
        autocomplete="off"
        role="combobox"
        [id]="_id"
        [attr.placeholder]="floatingLabel() ? ' ' : placeholder() || null"
        [attr.aria-label]="label() || placeholder()"
        [attr.aria-autocomplete]="'list'"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-expanded]="_isOpen() ? 'true' : 'false'"
        [attr.aria-controls]="_listId"
        [attr.aria-activedescendant]="_activeId()"
        [attr.aria-invalid]="hasError() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        [disabled]="_cvaDisabled()"
        [value]="_query()"
        (input)="onQueryChange($any($event.target).value)"
        (focus)="_onFocus()"
        (blur)="_onBlur()"
        (keydown)="onKeyDown($event)"
      />
      @if (floatingLabel() && label()) {
        <label class="neu-autocomplete__floating-label" [for]="_id">{{ label() }}</label>
      }
      @if (_query() && !_cvaDisabled()) {
        <button
          type="button"
          class="neu-autocomplete__clear"
          aria-label="Limpiar"
          tabindex="-1"
          (click)="clear()"
        >
          ×
        </button>
      }
    </div>
    <div class="neu-autocomplete__sr-status" aria-live="polite" aria-atomic="true">
      {{ resultsAnnouncement() }}
    </div>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="autocompleteOrigin"
      [cdkConnectedOverlayOpen]="_isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="_viewportMargin"
      (detach)="_closePanel()"
    >
      @if (_filtered().length) {
        @if (virtualScroll()) {
          <cdk-virtual-scroll-viewport
            class="neu-autocomplete__list neu-autocomplete__list--virtual"
            role="listbox"
            [id]="_listId"
            [attr.aria-label]="label() || placeholder()"
            [itemSize]="virtualScrollItemSize()"
            [style.height]="virtualViewportHeight()"
            [style.width.px]="overlayWidth()"
          >
            <div
              *cdkVirtualFor="let opt of _filtered(); trackBy: trackByOption; let i = index"
              class="neu-autocomplete__option"
              role="option"
              [id]="_optionId(i)"
              [class.neu-autocomplete__option--active]="_activeIndex() === i"
              [class.neu-autocomplete__option--disabled]="opt.disabled"
              [attr.aria-selected]="_activeIndex() === i"
              [attr.aria-disabled]="opt.disabled ?? false"
              (mousedown)="selectOption(opt)"
            >
              {{ opt.label }}
            </div>
          </cdk-virtual-scroll-viewport>
        } @else {
          <ul
            class="neu-autocomplete__list"
            role="listbox"
            [id]="_listId"
            [attr.aria-label]="label() || placeholder()"
            [style.width.px]="overlayWidth()"
          >
            @for (opt of _filtered(); track opt.label; let i = $index) {
              <li
                class="neu-autocomplete__option"
                role="option"
                [id]="_optionId(i)"
                [class.neu-autocomplete__option--active]="_activeIndex() === i"
                [class.neu-autocomplete__option--disabled]="opt.disabled"
                [attr.aria-selected]="_activeIndex() === i"
                [attr.aria-disabled]="opt.disabled ?? false"
                (mousedown)="selectOption(opt)"
              >
                {{ opt.label }}
              </li>
            }
          </ul>
        }
      } @else {
        <div class="neu-autocomplete__empty" role="status" [style.width.px]="overlayWidth()">
          {{ emptyLabel() }}
        </div>
      }
    </ng-template>
    @if (hasError()) {
      <p class="neu-autocomplete__error" [id]="_id + '-error'" role="alert">
        {{ errorMessage() }}
      </p>
    } @else if (hint()) {
      <p class="neu-autocomplete__hint" [id]="_id + '-hint'">{{ hint() }}</p>
    }
  `,
  styleUrl: './neu-autocomplete.component.scss',
})
export class NeuAutocompleteComponent implements ControlValueAccessor {
  // ── Inputs / Outputs ────────────────────────────────────────────
  readonly options = input<NeuAutocompleteOption[]>([]);
  readonly placeholder = input<string>('');
  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly errorMessage = input<string>('');
  readonly emptyLabel = input<string>('Sin resultados');
  readonly minLength = input<number>(0);
  /** Muestra el label como flotante (true) o estático encima del campo (false) / Shows the label as floating (true) or static above the field (false) */
  readonly floatingLabel = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  /** Habilita scroll virtual para listas largas / Enables virtual scrolling for large result lists */
  readonly virtualScroll = input<boolean>(false);

  /** Número de resultados visibles en el viewport virtual / Number of visible results in the virtual viewport */
  readonly virtualScrollVisibleItems = input<number>(8);

  /** Emitido al seleccionar una opción / Emitted when an option is selected */
  readonly optionSelected = output<NeuAutocompleteOption>();

  /** Emitido al cambiar el texto del input / Emitted on query change */
  readonly queryChange = output<string>();

  // ── Internal state ───────────────────────────────────────────────
  readonly _id = `neu-autocomplete-${++_seq}`;
  readonly _listId = `${this._id}-list`;

  readonly _query = signal('');
  readonly _isOpen = signal(false);
  readonly _activeIndex = signal(-1);
  readonly _cvaDisabled = signal(false);
  readonly _focused = signal(false);
  private readonly _viewport = viewChild(CdkVirtualScrollViewport);
  readonly overlayWidth = signal<number | null>(null);
  readonly _viewportMargin = 16;
  readonly overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -4,
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 4,
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -4,
    },
  ];
  private readonly _document = inject(DOCUMENT);
  private readonly _overlay = inject(Overlay);
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.reposition();

  private _onChange: (v: unknown) => void = () => {};
  private _onTouched: () => void = () => {};

  // ── Computed ─────────────────────────────────────────────────────
  readonly _filtered = computed(() => {
    const q = this._query().toLowerCase().trim();
    // Con query vacía nunca mostramos opciones (no queremos comportarnos como un select).
    // Empty query → never show options (autocomplete ≠ select).
    if (!q) return [];
    if (q.length < this.minLength()) return [];
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  readonly _activeId = computed(() => {
    const i = this._activeIndex();
    return i >= 0 ? this._optionId(i) : null;
  });

  readonly hasError = computed(() => !!this.errorMessage());

  readonly describedBy = computed(() => {
    if (this.hasError()) {
      return `${this._id}-error`;
    }
    if (this.hint()) {
      return `${this._id}-hint`;
    }
    return null;
  });

  readonly resultsAnnouncement = computed(() => {
    const query = this._query().trim();
    if (!query || !this._isOpen()) {
      return '';
    }

    const total = this._filtered().length;
    if (!total) {
      return this.emptyLabel();
    }

    return total === 1 ? '1 resultado disponible' : `${total} resultados disponibles`;
  });

  readonly virtualScrollItemSize = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 36;
      case 'lg':
        return 52;
      default:
        return 40;
    }
  });

  readonly virtualViewportHeight = computed(
    () => `${this.virtualScrollVisibleItems() * this.virtualScrollItemSize()}px`,
  );

  readonly trackByOption = (index: number, option: NeuAutocompleteOption) =>
    option.value ?? option.label ?? index;

  _optionId(i: number): string {
    return `${this._listId}-opt-${i}`;
  }

  // ── HostListener close on outside click ─────────────────────────
  private readonly _el = inject(ElementRef<HTMLElement>);

  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as Element | null;
    const isInsideOverlay = !!target?.closest('.neu-autocomplete__list, .neu-autocomplete__empty');
    if (!this._el.nativeElement.contains(e.target as Node) && !isInsideOverlay) {
      this._closePanel();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this._isOpen()) {
      this._syncOverlayWidth();
    }
  }

  // ── Event handlers ───────────────────────────────────────────────
  onQueryChange(q: string): void {
    this._query.set(q);
    this._activeIndex.set(-1);
    // Sólo abrimos si hay texto suficiente; si no, cerramos.
    // Only open when there is enough text; otherwise close.
    const minLen = Math.max(1, this.minLength());
    const shouldOpen = q.trim().length >= minLen;
    if (shouldOpen) {
      this._syncOverlayWidth();
    }
    this._isOpen.set(shouldOpen);
    this.queryChange.emit(q);
    // CVA — emit null when query is cleared
    if (!q) {
      this._onChange(null);
    }
  }

  _onFocus(): void {
    this._focused.set(true);
    // Abre el dropdown solo si ya hay texto escrito / Only open when there is already a query.
    if (this._query().trim().length >= Math.max(1, this.minLength())) {
      this._syncOverlayWidth();
      this._isOpen.set(true);
    }
  }

  _onBlur(): void {
    this._focused.set(false);
    this._onTouched();
    // Small delay to allow mousedown on option to fire first
    setTimeout(() => this._closePanel(), 150);
  }

  onKeyDown(e: KeyboardEvent): void {
    const total = this._filtered().length;
    if (!total && e.key !== 'Escape') return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._syncOverlayWidth();
        this._moveActiveIndex(1);
        this._isOpen.set(true);
        this._scrollActiveOptionIntoView();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._moveActiveIndex(-1);
        this._scrollActiveOptionIntoView();
        break;
      case 'Enter': {
        const idx = this._activeIndex();
        const opt = this._filtered()[idx];
        if (opt && !opt.disabled) this.selectOption(opt);
        break;
      }
      case 'Escape':
        this._isOpen.set(false);
        this._activeIndex.set(-1);
        break;
    }
  }

  private _moveActiveIndex(step: 1 | -1): void {
    const filtered = this._filtered();
    if (!filtered.length) {
      this._activeIndex.set(-1);
      return;
    }

    const currentIndex = this._activeIndex();
    let nextIndex = currentIndex;

    for (let count = 0; count < filtered.length; count += 1) {
      nextIndex =
        step === 1 ? Math.min(nextIndex + 1, filtered.length - 1) : Math.max(nextIndex - 1, 0);

      if (!filtered[nextIndex]?.disabled) {
        this._activeIndex.set(nextIndex);
        return;
      }

      if ((step === 1 && nextIndex === filtered.length - 1) || (step === -1 && nextIndex === 0)) {
        break;
      }
    }

    if (currentIndex === -1) {
      this._activeIndex.set(filtered.findIndex((option) => !option.disabled));
    }
  }

  selectOption(opt: NeuAutocompleteOption): void {
    if (opt.disabled) return;
    this._query.set(opt.label);
    this._isOpen.set(false);
    this._activeIndex.set(-1);
    this._onChange(opt.value);
    this.optionSelected.emit(opt);
  }

  clear(): void {
    this._query.set('');
    this._onChange(null);
    this._isOpen.set(false);
    this._activeIndex.set(-1);
    this.queryChange.emit('');
  }

  _closePanel(): void {
    this._isOpen.set(false);
    this._activeIndex.set(-1);
  }

  private _scrollActiveOptionIntoView(): void {
    const activeIndex = this._activeIndex();
    if (activeIndex < 0) {
      return;
    }

    if (this.virtualScroll()) {
      requestAnimationFrame(() => {
        this._viewport()?.scrollToIndex(activeIndex, 'auto');
        this._viewport()?.checkViewportSize();
      });
      return;
    }

    requestAnimationFrame(() => {
      const activeOption = this._el.nativeElement.querySelector(
        `#${this._optionId(activeIndex)}`,
      ) as HTMLElement | null;
      const overlayOption =
        activeOption ?? this._document.getElementById(this._optionId(activeIndex));
      if (typeof overlayOption?.scrollIntoView === 'function') {
        overlayOption.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  private _syncOverlayWidth(): void {
    const trigger = this._el.nativeElement.querySelector(
      '.neu-autocomplete__input-wrap',
    ) as HTMLElement | null;
    if (!trigger) {
      return;
    }
    const width =
      typeof trigger.getBoundingClientRect === 'function'
        ? trigger.getBoundingClientRect().width
        : 0;
    this.overlayWidth.set(Math.min(width, window.innerWidth - 32));
    if (this.virtualScroll()) {
      requestAnimationFrame(() => this._viewport()?.checkViewportSize());
    }
  }

  // ── CVA ──────────────────────────────────────────────────────────
  writeValue(val: unknown): void {
    if (val === null || val === undefined) {
      this._query.set('');
      return;
    }
    const match = this.options().find((o) => o.value === val);
    this._query.set(match ? match.label : String(val));
  }

  registerOnChange(fn: (v: unknown) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this._cvaDisabled.set(d);
  }
}
