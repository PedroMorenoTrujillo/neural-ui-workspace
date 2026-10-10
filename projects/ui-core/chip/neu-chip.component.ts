import {
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
} from '@angular/core';

export type NeuChipTone = 'neutral' | 'brand' | 'success' | 'info' | 'warning' | 'danger';
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
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': '_hostRole()',
    '[attr.aria-pressed]': '_hostAriaPressed()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': '_hostTabindex()',
    '(click)': 'onToggle()',
    '(keydown.space)': 'removable() ? null : $event.preventDefault(); onToggle()',
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
        [attr.aria-label]="removeAriaLabel()"
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
  /** Intención semántica / Semantic intent */
  tone = input<NeuChipTone>('neutral');

  /** Tamaño / Size */
  size = input<NeuChipSize>('md');

  /** Estado seleccionado / Selected state */
  selected = input<boolean>(false);

  /** Muestra botón de cierre / Shows close button */
  removable = input<boolean>(false);

  /** Deshabilitado / Disabled */
  disabled = input<boolean>(false);

  /** Aria-label del botón de eliminar / Aria-label for the delete button */
  removeAriaLabel = input<string>('Remove');

  /** Emite al hacer clic o pulsar espacio/enter / Emits on click or space/enter press */
  selectedChange = output<boolean>();

  /** Emite al pulsar el botón de cierre / Emits when the close button is pressed */
  removed = output<void>();

  readonly hostClasses = computed(() => ({
    'neu-chip': true,
    [`neu-chip--${this.tone()}`]: true,
    [`neu-chip--${this.size()}`]: true,
    'neu-chip--selected': this.selected(),
    'neu-chip--removable': this.removable(),
    'neu-chip--disabled': this.disabled(),
  }));

  /** Rol ARIA del host: 'button' cuando seleccionable, 'group' cuando también eliminable / Host ARIA role: 'button' when selectable, 'group' when removable */
  protected readonly _hostRole = computed(() => (this.removable() ? 'group' : 'button'));

  /** aria-pressed solo cuando actúa como botón toggle / aria-pressed only when acting as toggle button */
  protected readonly _hostAriaPressed = computed<boolean | null>(() =>
    this.removable() ? null : this.selected(),
  );

  /** tabindex nulo en el host grupo para no saturar el orden de foco / null tabindex on group host to not saturate focus order */
  protected readonly _hostTabindex = computed<number | null>(() => {
    if (this.removable()) return null;
    return this.disabled() ? -1 : 0;
  });

  onToggle(): void {
    if (!this.disabled() && !this.removable()) {
      this.selectedChange.emit(!this.selected());
    }
  }

  onRemove(): void {
    if (!this.disabled()) {
      this.removed.emit();
    }
  }
}
