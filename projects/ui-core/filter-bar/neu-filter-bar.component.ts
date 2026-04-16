import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';

export interface NeuFilterChip {
  /** Identificador único del filtro / Unique filter identifier */
  key: string;
  /** Etiqueta visible / Visible label */
  label: string;
  /** Si el chip está activo / Whether the chip is active */
  active?: boolean;
}

let _seq = 0;

/**
 * NeuralUI FilterBar Component
 *
 * Fila de chips de filtro con selección individual y botón "Limpiar todo".
 *
 * Uso:
 *   <neu-filter-bar [filters]="chips" (filterChange)="onFilter($event)" />
 */
@Component({
  selector: 'neu-filter-bar',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()', role: 'group', '[attr.aria-label]': 'ariaLabel()' },
  template: `
    <div class="neu-filter-bar__chips">
      @for (filter of _chips(); track filter.key) {
        <button
          type="button"
          class="neu-filter-bar__chip"
          [class.neu-filter-bar__chip--active]="filter.active"
          [attr.aria-pressed]="filter.active ?? false"
          (click)="toggle(filter)"
        >
          {{ filter.label }}
        </button>
      }
    </div>
    @if (clearable() && _hasActive()) {
      <button
        type="button"
        class="neu-filter-bar__clear"
        [attr.aria-label]="clearLabel()"
        (click)="clearAll()"
      >
        {{ clearLabel() }}
      </button>
    }
  `,
  styleUrl: './neu-filter-bar.component.scss',
})
export class NeuFilterBarComponent {
  /** Lista inicial de filtros / Initial filter chips list */
  readonly filters = input<NeuFilterChip[]>([]);

  /** Muestra el botón "Limpiar todo" cuando hay activos / Shows "Clear all" when any active */
  readonly clearable = input<boolean>(true);

  /** Texto del botón de limpiar / Clear button text */
  readonly clearLabel = input<string>('Limpiar todo');

  /** Permite selección múltiple / Allows multi-selection */
  readonly multi = input<boolean>(true);

  /** Aria-label de la barra / Aria-label for the bar */
  readonly ariaLabel = input<string>('Filtros');

  /** Emitido con los chips activos al cambiar / Emitted with active chips on change */
  readonly filterChange = output<NeuFilterChip[]>();

  readonly _id = `neu-filter-bar-${++_seq}`;
  readonly _chips = signal<NeuFilterChip[]>([]);

  readonly _hasActive = computed(() => this._chips().some((c) => c.active));

  readonly hostClasses = computed(() => ({
    'neu-filter-bar': true,
    'neu-filter-bar--multi': this.multi(),
  }));

  constructor() {
    effect(() => {
      const src = this.filters();
      untracked(() => this._chips.set(src.map((f) => ({ ...f }))));
    });
  }

  toggle(chip: NeuFilterChip): void {
    this._chips.update((chips) => {
      if (this.multi()) {
        return chips.map((c) => (c.key === chip.key ? { ...c, active: !c.active } : c));
      }
      return chips.map((c) => ({ ...c, active: c.key === chip.key ? !c.active : false }));
    });
    this.filterChange.emit(this._chips().filter((c) => c.active));
  }

  clearAll(): void {
    this._chips.update((chips) => chips.map((c) => ({ ...c, active: false })));
    this.filterChange.emit([]);
  }

  /** Activa chips por sus keys programáticamente / Activate chips by keys programmatically */
  setActive(keys: string[]): void {
    this._chips.update((chips) => chips.map((c) => ({ ...c, active: keys.includes(c.key) })));
    this.filterChange.emit(this._chips().filter((c) => c.active));
  }
}
