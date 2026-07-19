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
export type NeuDialogLayout = 'auto' | 'viewport';

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
    '[class.neu-dialog--responsive]': 'responsive()',
    '[class.neu-dialog--layout-auto]': 'layout() === "auto"',
    '[class.neu-dialog--layout-viewport]': 'layout() === "viewport"',
    '[attr.aria-hidden]': '!open()',
  },
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="neu-dialog__backdrop"
        (click)="!disableClose() && close()"
        aria-hidden="true"
      ></div>

      <!-- Panel -->
      <div
        #panel
        class="neu-dialog__panel neu-dialog__panel--{{ size() }}"
        [class.neu-dialog__panel--responsive]="responsive()"
        [class.neu-dialog__panel--layout-auto]="layout() === 'auto'"
        [class.neu-dialog__panel--layout-viewport]="layout() === 'viewport'"
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
              (click)="close()"
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
  /** Ajusta la altura al contenido o al viewport disponible. / Fits height to content or to the available viewport. */
  layout = input<NeuDialogLayout>('auto');
  /** Si es true, el backdrop y el botón cerrar no funcionan. / If true, the backdrop and close button do not work. */
  disableClose = input<boolean>(false);
  /** Adapta el panel a mobile/full-width cuando el viewport es estrecho. */
  responsive = input<boolean>(true);
  /** Devuelve el foco al elemento activo antes de abrir. */
  restoreFocus = input<boolean>(true);

  /** Emite cuando el usuario cierra el diálogo. / Emits when the user closes the dialog. */
  closed = output<unknown>();

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private previousActiveElement: HTMLElement | null = null;

  /** @internal — ID único para aria-labelledby / Unique ID for aria-labelledby */
  readonly _uid = Math.random().toString(36).slice(2, 7);

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.restorePreviousFocus();
        return;
      }

      this.previousActiveElement = document.activeElement as HTMLElement | null;
      queueMicrotask(() => this.focusInitialElement());
    });
  }

  close(result?: unknown): void {
    this.closed.emit(result);
  }

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.disableClose()) {
        this.close();
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

  private restorePreviousFocus(): void {
    if (!this.restoreFocus() || !this.previousActiveElement?.focus) {
      this.previousActiveElement = null;
      return;
    }

    queueMicrotask(() => {
      this.previousActiveElement?.focus();
      this.previousActiveElement = null;
    });
  }

  private getFocusableElements(panel: HTMLElement): HTMLElement[] {
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute('aria-hidden'));
  }
}
