import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export interface NeuFilterChip {
  /** Identificador único del filtro / Unique filter identifier */
  key: string;
  /** Etiqueta visible / Visible label */
  label: string;
  /** Si el chip está activo / Whether the chip is active */
  active?: boolean;
}

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
  /** Applied filter chips owned by the consumer. */
  readonly filters = input<readonly NeuFilterChip[]>([]);

  /** Muestra el botón "Limpiar todo" cuando hay activos / Shows "Clear all" when any active */
  readonly clearable = input<boolean>(true);

  /** Texto del botón de limpiar / Clear button text */
  readonly clearLabel = input<string>('Clear all');

  /** Permite selección múltiple / Allows multi-selection */
  readonly multi = input<boolean>(true);

  /** Aria-label de la barra / Aria-label for the bar */
  readonly ariaLabel = input<string>('Filters');

  /** Emitido con los chips activos al cambiar / Emitted with active chips on change */
  readonly filterChange = output<NeuFilterChip[]>();

  protected readonly _chips = computed(() => this.filters());

  protected readonly _hasActive = computed(() => this._chips().some((c) => c.active));

  readonly hostClasses = computed(() => ({
    'neu-filter-bar': true,
    'neu-filter-bar--multi': this.multi(),
  }));

  toggle(chip: NeuFilterChip): void {
    if (!this.filters().some((current) => current.key === chip.key)) return;
    const next = this.filters().map((current) => this.multi()
      ? (current.key === chip.key ? { ...current, active: !current.active } : current)
      : { ...current, active: current.key === chip.key ? !current.active : false });
    this.filterChange.emit(next.filter((current) => current.active));
  }

  clearAll(): void {
    if (!this._hasActive()) return;
    this.filterChange.emit([]);
  }

  /** Propose activating chips by key; the consumer applies the result via `filters`. */
  setActive(keys: readonly string[]): void {
    const wanted = new Set(keys);
    const next = this.filters().filter((current) => wanted.has(current.key))
      .map((current) => ({ ...current, active: true }));
    this.filterChange.emit(next);
  }
}
