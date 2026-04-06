import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type NeuChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type NeuChipSize = 'sm' | 'md';

/**
 * NeuralUI Chip Component
 *
 * Etiqueta compacta seleccionable y/o eliminable. Ideal para filtros,
 * listas de tags y multiselección visual.
 *
 * Uso:
 *   <neu-chip>Angular</neu-chip>
 *   <neu-chip [removable]="true" (removed)="onRemove()">CSS</neu-chip>
 *   <neu-chip [selected]="true" (selectedChange)="toggle()">TypeScript</neu-chip>
 */
@Component({
  selector: 'neu-chip',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    role: 'option',
    '[attr.aria-selected]': 'selected()',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '(keydown.space)': 'onToggle()',
    '(keydown.enter)': 'onToggle()',
  },
  template: `
    <ng-content />
    @if (removable()) {
      <button
        class="neu-chip__remove"
        type="button"
        [disabled]="disabled()"
        (click)="$event.stopPropagation(); onRemove()"
        aria-label="Eliminar"
      >
        <svg
          width="10"
          height="10"
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
  `,
  styleUrl: './neu-chip.component.scss',
})
export class NeuChipComponent {
  /** Variante de color */
  variant = input<NeuChipVariant>('default');

  /** Tamaño */
  size = input<NeuChipSize>('md');

  /** Estado seleccionado */
  selected = input<boolean>(false);

  /** Muestra botón de cierre */
  removable = input<boolean>(false);

  /** Deshabilitado */
  disabled = input<boolean>(false);

  /** Emite al hacer clic o pulsar espacio/enter */
  selectedChange = output<boolean>();

  /** Emite al pulsar el botón de cierre */
  removed = output<void>();

  readonly hostClasses = computed(() => ({
    'neu-chip': true,
    [`neu-chip--${this.variant()}`]: true,
    [`neu-chip--${this.size()}`]: true,
    'neu-chip--selected': this.selected(),
    'neu-chip--removable': this.removable(),
    'neu-chip--disabled': this.disabled(),
  }));

  onToggle(): void {
    if (!this.disabled()) {
      this.selectedChange.emit(!this.selected());
    }
  }

  onRemove(): void {
    if (!this.disabled()) {
      this.removed.emit();
    }
  }
}
