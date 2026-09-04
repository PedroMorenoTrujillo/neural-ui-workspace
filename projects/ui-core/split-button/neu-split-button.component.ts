import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewEncapsulation,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CdkConnectedOverlay,
  ConnectedPosition,
  Overlay,
  OverlayModule,
} from '@angular/cdk/overlay';
import { NeuButtonVariant, NeuButtonSize } from '@neural-ui/core/button';
import { NeuRovingMenuController } from '@neural-ui/core/internal';

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
@Directive({ selector: 'ng-template[neuSplitButtonItem]' })
export class NeuSplitButtonItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuSplitButtonAction }>) {}
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
  imports: [OverlayModule, NgTemplateOutlet],
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
        cdkOverlayOrigin
        #splitButtonOrigin="cdkOverlayOrigin"
        #menuTrigger
        class="neu-split-button__chevron"
        [class]="chevronClasses()"
        type="button"
        [disabled]="isDisabled() || null"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="moreActionsAriaLabel()"
        (click)="toggleDropdown($event)"
        (keydown)="onTriggerKeydown($event)"
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
      <ng-template
        cdkConnectedOverlay
        [cdkConnectedOverlayOrigin]="splitButtonOrigin"
        [cdkConnectedOverlayOpen]="isOpen()"
        [cdkConnectedOverlayPositions]="overlayPositions"
        [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
        [cdkConnectedOverlayHasBackdrop]="true"
        [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
        [cdkConnectedOverlayPush]="true"
        [cdkConnectedOverlayViewportMargin]="_viewportMargin"
        (backdropClick)="closeDropdown()"
        (detach)="onPanelDetached()"
        (attach)="onOverlayAttach(); onPanelAttached()"
        (overlayKeydown)="onOverlayKeydown($event)"
      >
        <div
          class="neu-split-button__dropdown"
          role="menu"
          [attr.aria-label]="actionsAriaLabel()"
          (click)="$event.stopPropagation()"
        >
          @for (action of actions(); track action.id; let index = $index) {
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
              [tabIndex]="tabIndexFor(index)"
              [attr.data-neu-split-menu-index]="index"
              (focus)="setActiveIndex(index)"
              (keydown)="onActionKeydown(action, index, $event)"
              (click)="onActionClick(action)"
            >
              @if (itemTpl()) {
                <ng-container
                  [ngTemplateOutlet]="itemTpl()!.templateRef"
                  [ngTemplateOutletContext]="{ $implicit: action }"
                />
              } @else {
                {{ action.label }}
              }
            </button>
          }
        </div>
      </ng-template>
    </div>
  `,
  styleUrl: './neu-split-button.component.scss',
})
export class NeuSplitButtonComponent {
  /* v8 ignore start -- Angular signal-query factory; projected-item behavior is covered. */
  readonly itemTpl = contentChild(NeuSplitButtonItemDirective);
  /* v8 ignore stop */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlay = inject(Overlay);
  /* v8 ignore start -- Angular signal-query factories; trigger/overlay behavior is covered. */
  private readonly trigger = viewChild('menuTrigger', { read: ElementRef<HTMLButtonElement> });
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  /* v8 ignore stop */
  private readonly menuController = new NeuRovingMenuController({ orientation: 'vertical' });
  private focusLastOnAttach = false;
  protected readonly _viewportMargin = 16;
  readonly overlayPositions: ConnectedPosition[] = [
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
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 6,
    },
  ];
  readonly overlayScrollStrategy = this.overlay.scrollStrategies.reposition();

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
  /** Browser panel attached, regardless of opening source. */
  readonly opened = output<void>();
  /** Browser panel detached, regardless of closing source; silent during destroy. */
  readonly closed = output<void>();
  private readonly eventDestroyRef = inject(DestroyRef);
  private panelAttached = false;

  protected onPanelAttached(): void {
    if (this.eventDestroyRef.destroyed || this.panelAttached) return;
    this.panelAttached = true;
    this.opened.emit();
  }

  protected onPanelDetached(): void {
    const wasAttached = this.panelAttached;
    this.panelAttached = false;
    if (this.eventDestroyRef.destroyed) return;
    this.closeDropdown();
    if (wasAttached) this.closed.emit();
  }

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
    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown(false);
    }
  }

  closeDropdown(): void {
    if (!this.isOpen()) return;
    this.isOpen.set(false);
    queueMicrotask(() => {
      if (!this.eventDestroyRef.destroyed) this.trigger()?.nativeElement.focus({ preventScroll: true });
    });
  }

  onTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    this.openDropdown(event.key === 'ArrowUp');
  }

  onOverlayAttach(): void {
    queueMicrotask(() => {
      if (this.eventDestroyRef.destroyed) return;
      this.reconcileActions();
      if (this.focusLastOnAttach) this.menuController.setActiveIndex(this.lastEligibleIndex());
      this.focusActiveAction();
      this.focusLastOnAttach = false;
    });
  }

  onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDropdown();
    }
  }

  tabIndexFor(index: number): 0 | -1 {
    this.reconcileActions();
    return this.menuController.tabIndexFor(index);
  }

  setActiveIndex(index: number): void {
    this.reconcileActions();
    this.menuController.setActiveIndex(index);
  }

  onActionKeydown(action: NeuSplitButtonAction, index: number, event: KeyboardEvent): void {
    this.reconcileActions();
    this.menuController.setActiveIndex(index);
    const result = this.menuController.handleKey(event);
    if (!result.handled) return;
    if (result.activate) {
      this.onActionClick(action);
      return;
    }
    this.focusActiveAction();
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    const isInsidePanel = !!target?.closest('.neu-split-button__dropdown');
    if (!this.el.nativeElement.contains(event.target as Node) && !isInsidePanel) {
      this.closeDropdown();
    }
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

  private openDropdown(focusLast: boolean): void {
    if (this.isDisabled() || this.isOpen()) return;
    this.focusLastOnAttach = focusLast;
    this.isOpen.set(true);
  }

  private reconcileActions(): void {
    this.menuController.setItems(
      this.actions().map((action) => ({
        key: action.id,
        label: action.label,
        disabled: action.disabled,
      })),
    );
  }

  private lastEligibleIndex(): number {
    for (let index = this.actions().length - 1; index >= 0; index -= 1) {
      if (!this.actions()[index]?.disabled) return index;
    }
    return -1;
  }

  private focusActiveAction(): void {
    this.connectedOverlay()
      ?.overlayRef.overlayElement.querySelector<HTMLElement>(
        `[data-neu-split-menu-index="${this.menuController.index}"]`,
      )
      ?.focus({ preventScroll: true });
  }
}
