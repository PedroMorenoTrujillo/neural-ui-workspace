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
} from '@angular/core';
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
  imports: [],
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
  },
  template: `
    @if (!floatingLabel() && label()) {
      <label class="neu-autocomplete__label" [for]="_id">{{ label() }}</label>
    }
    <div
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
        [attr.aria-expanded]="_isOpen()"
        [attr.aria-controls]="_listId"
        [attr.aria-activedescendant]="_activeId()"
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
    @if (_isOpen() && _filtered().length) {
      <ul
        class="neu-autocomplete__list"
        role="listbox"
        [id]="_listId"
        [attr.aria-label]="label() || placeholder()"
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
    @if (_isOpen() && !_filtered().length) {
      <div class="neu-autocomplete__empty" role="status">{{ emptyLabel() }}</div>
    }
  `,
  styleUrl: './neu-autocomplete.component.scss',
})
export class NeuAutocompleteComponent implements ControlValueAccessor {
  // ── Inputs / Outputs ────────────────────────────────────────────
  readonly options = input<NeuAutocompleteOption[]>([]);
  readonly placeholder = input<string>('');
  readonly label = input<string>('');
  readonly emptyLabel = input<string>('Sin resultados');
  readonly minLength = input<number>(0);
  /** Muestra el label como flotante (true) o estático encima del campo (false) / Shows the label as floating (true) or static above the field (false) */
  readonly floatingLabel = input<boolean>(false);
  /** Tamaño del campo: 'sm' = 36px | 'md' = 48px | 'lg' = 56px / Field size */
  readonly size = input<'sm' | 'md' | 'lg'>('md');

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

  _optionId(i: number): string {
    return `${this._listId}-opt-${i}`;
  }

  // ── HostListener close on outside click ─────────────────────────
  private readonly _el = inject(ElementRef<HTMLElement>);

  @HostListener('document:mousedown', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this._el.nativeElement.contains(e.target as Node)) {
      this._isOpen.set(false);
    }
  }

  // ── Event handlers ───────────────────────────────────────────────
  onQueryChange(q: string): void {
    this._query.set(q);
    this._activeIndex.set(-1);
    // Sólo abrimos si hay texto suficiente; si no, cerramos.
    // Only open when there is enough text; otherwise close.
    const minLen = Math.max(1, this.minLength());
    this._isOpen.set(q.trim().length >= minLen);
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
      this._isOpen.set(true);
    }
  }

  _onBlur(): void {
    this._focused.set(false);
    this._onTouched();
    // Small delay to allow mousedown on option to fire first
    setTimeout(() => this._isOpen.set(false), 150);
  }

  onKeyDown(e: KeyboardEvent): void {
    const total = this._filtered().length;
    if (!total && e.key !== 'Escape') return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this._activeIndex.update((i) => Math.min(i + 1, total - 1));
        this._isOpen.set(true);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this._activeIndex.update((i) => Math.max(i - 1, 0));
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
    this.queryChange.emit('');
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
