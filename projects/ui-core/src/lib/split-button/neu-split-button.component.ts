import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NeuButtonVariant, NeuButtonSize } from '../button/neu-button.component';

export interface NeuSplitButtonAction {
  /** Identificador único de la acción / Unique action identifier */
  id: string;
  /** Texto visible / Visible text */
  label: string;
  /** Icono opcional (SVG string o nombre) / Optional icon (SVG string or name) */
  icon?: string;
  /** Deshabilita esta acción individualmente / Disables this action individually */
  disabled?: boolean;
  /** Separador visual encima de este item / Visual separator above this item */
  divider?: boolean;
}

/**
 * NeuralUI SplitButton Component
 *
 * Botón principal con un dropdown de acciones adicionales. / Primary button with a dropdown of additional actions.
 *
 * Uso:
 *   <neu-split-button
 *     label="Guardar"
 *     [actions]="actions"
 *     (primaryClick)="save()"
 *     (actionClick)="onAction($event)"
 *   />
 */
@Component({
  selector: 'neu-split-button',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-split-button-host',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'closeDropdown()',
  },
  template: `
    <div class="neu-split-button" [class.neu-split-button--disabled]="isDisabled()">
      <!-- Botón principal -->
      <button
        class="neu-split-button__main"
        [class]="mainClasses()"
        type="button"
        [disabled]="isDisabled() || null"
        [attr.aria-disabled]="isDisabled()"
        [attr.aria-busy]="loading()"
        (click)="onPrimaryClick($event)"
      >
        @if (loading()) {
          <span class="neu-button__spinner" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="31.416"
                stroke-dashoffset="10"
              />
            </svg>
          </span>
        }
        {{ label() }}
      </button>

      <!-- Separador -->
      <span class="neu-split-button__divider" aria-hidden="true"></span>

      <!-- Chevron trigger -->
      <button
        class="neu-split-button__chevron"
        [class]="chevronClasses()"
        type="button"
        [disabled]="isDisabled() || null"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="moreActionsAriaLabel()"
        (click)="toggleDropdown($event)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <!-- Dropdown de acciones -->
      @if (isOpen()) {
        <div
          class="neu-split-button__dropdown"
          role="menu"
          [attr.aria-label]="actionsAriaLabel()"
          (click)="$event.stopPropagation()"
        >
          @for (action of actions(); track action.id) {
            @if (action.divider) {
              <div class="neu-split-button__dropdown-sep" role="separator" aria-hidden="true"></div>
            }
            <button
              class="neu-split-button__dropdown-item"
              [class.neu-split-button__dropdown-item--disabled]="action.disabled"
              type="button"
              role="menuitem"
              [disabled]="action.disabled || null"
              [attr.aria-disabled]="action.disabled ? 'true' : null"
              (click)="onActionClick(action)"
            >
              {{ action.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './neu-split-button.component.scss',
})
export class NeuSplitButtonComponent {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Texto del botón principal / Primary button text */
  label = input<string>('');

  /** Variante visual / Visual variant */
  variant = input<NeuButtonVariant>('primary');

  /** Tamaño / Size */
  size = input<NeuButtonSize>('md');

  /** Deshabilita todo el componente / Disables the entire component */
  disabled = input<boolean>(false);

  /** Muestra spinner en el botón principal / Shows spinner on the primary button */
  loading = input<boolean>(false);

  /** Acciones del dropdown / Dropdown actions */
  actions = input<NeuSplitButtonAction[]>([]);

  /** Aria-label del botón de desplegable / Aria-label for the dropdown button */
  moreActionsAriaLabel = input<string>('Más opciones');

  /** Aria-label del menú desplegable / Aria-label for the dropdown menu */
  actionsAriaLabel = input<string>('Acciones');

  /** Emite al hacer click en el botón principal / Emits on primary button click */
  primaryClick = output<MouseEvent>();

  /** Emite al seleccionar una acción del dropdown / Emits when a dropdown action is selected */
  actionClick = output<NeuSplitButtonAction>();

  readonly isOpen = signal(false);

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  readonly mainClasses = computed(
    () =>
      `neu-button neu-button--${this.variant()} neu-button--${this.size()}${this.loading() ? ' neu-button--loading' : ''}`,
  );

  readonly chevronClasses = computed(
    () => `neu-button neu-button--${this.variant()} neu-button--${this.size()}`,
  );

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) this.closeDropdown();
  }

  onPrimaryClick(event: MouseEvent): void {
    if (this.isDisabled()) return;
    this.primaryClick.emit(event);
  }

  onActionClick(action: NeuSplitButtonAction): void {
    if (action.disabled) return;
    this.closeDropdown();
    this.actionClick.emit(action);
  }
}
