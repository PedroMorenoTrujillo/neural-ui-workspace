import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NeuIconComponent } from '@neural-ui/core/icon';

export type NeuDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * NeuDialogComponent — Diálogo accesible con header, body y footer. / Accessible dialog with header, body and footer.
 * Úsalo directamente como componente declarativo pasando `open` como signal. / Use it directly as a declarative component passing `open` as a signal.
 *
 * Para uso programático, utiliza NeuDialogService.open().
 *
 * Uso declarativo:
 *   <neu-dialog [open]="isOpen()" title="Editar usuario" (closed)="isOpen.set(false)">
 *     <p>Contenido del diálogo</p>
 *     <div neu-dialog-footer>
 *       <neu-button (click)="save()">Guardar</neu-button>
 *     </div>
 *   </neu-dialog>
 */
@Component({
  selector: 'neu-dialog',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.neu-dialog--open]': 'open()',
    '[attr.aria-hidden]': '!open()',
  },
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="neu-dialog__backdrop"
        (click)="!disableClose() && closed.emit()"
        aria-hidden="true"
      ></div>

      <!-- Panel -->
      <div
        #panel
        class="neu-dialog__panel neu-dialog__panel--{{ size() }}"
        role="dialog"
        tabindex="-1"
        [id]="'neu-dialog-' + _uid"
        [attr.aria-labelledby]="'neu-dialog-title-' + _uid"
        [attr.aria-modal]="true"
        (keydown)="onPanelKeydown($event)"
      >
        <!-- Header -->
        <div class="neu-dialog__header">
          <h2 class="neu-dialog__title" [id]="'neu-dialog-title-' + _uid">{{ title() }}</h2>
          @if (!disableClose()) {
            <button
              class="neu-dialog__close"
              type="button"
              aria-label="Close dialog"
              (click)="closed.emit()"
            >
              <neu-icon name="lucideX" size="1.125rem" />
            </button>
          }
        </div>

        <!-- Body -->
        <div class="neu-dialog__body">
          <ng-content />
        </div>

        <!-- Footer (opcional via slot) -->
        <ng-content select="[neu-dialog-footer]" />
      </div>
    }
  `,
  styleUrl: './neu-modal.component.scss',
})
export class NeuDialogComponent {
  /** Controla la visibilidad del diálogo. / Controls dialog visibility. */
  open = input<boolean>(false);
  /** Título que aparece en el header. / Title shown in the header. */
  title = input<string>('');
  /** Tamaño del panel: sm | md | lg | xl | full. / Panel size: sm | md | lg | xl | full. */
  size = input<NeuDialogSize>('md');
  /** Si es true, el backdrop y el botón cerrar no funcionan. / If true, the backdrop and close button do not work. */
  disableClose = input<boolean>(false);

  /** Emite cuando el usuario cierra el diálogo. / Emits when the user closes the dialog. */
  closed = output<void>();

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** @internal — ID único para aria-labelledby / Unique ID for aria-labelledby */
  readonly _uid = Math.random().toString(36).slice(2, 7);

  constructor() {
    effect(() => {
      if (!this.open()) return;

      queueMicrotask(() => this.focusInitialElement());
    });
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.disableClose()) {
        this.closed.emit();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    const focusable = this.getFocusableElements(panel);
    if (!focusable.length) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (activeElement === first || activeElement === panel) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusInitialElement(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    const [firstFocusable] = this.getFocusableElements(panel);
    (firstFocusable ?? panel).focus();
  }

  private getFocusableElements(panel: HTMLElement): HTMLElement[] {
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('aria-hidden'));
  }
}
