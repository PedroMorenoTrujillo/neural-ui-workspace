import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  effect,
  afterRenderEffect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { NeuFocusTrapDirective } from '@neural-ui/core/focus-trap';
import { NeuIconComponent } from '@neural-ui/core/icon';
import { NeuIdGenerator } from '@neural-ui/core/internal';

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
  imports: [NeuFocusTrapDirective, NeuIconComponent],
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

      <div class="neu-dialog__viewport">
        <!-- Panel -->
        <div
          #panel
          class="neu-dialog__panel neu-dialog__panel--{{ size() }}"
          [class.neu-dialog__panel--responsive]="responsive()"
          [class.neu-dialog__panel--layout-auto]="layout() === 'auto'"
          [class.neu-dialog__panel--layout-viewport]="layout() === 'viewport'"
          role="dialog"
          tabindex="-1"
          neuFocusTrap
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

  /* v8 ignore start -- Angular signal-query factories; modal focus behavior is covered. */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly focusTrapRef = viewChild(NeuFocusTrapDirective);
  /* v8 ignore stop */
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollStrategy = inject(Overlay).scrollStrategies.block();
  private previousActiveElement: HTMLElement | null = null;
  private focusEpoch = 0;

  /** @internal — ID único para aria-labelledby / Unique ID for aria-labelledby */
  protected readonly _uid = inject(NeuIdGenerator).getId('dialog-');

  private eventPanelVisible = false;
  /** Panel mounted in the browser, independently of the trigger source. */
  readonly opened = output<void>();
  /** Panel unmounted after render; closed remains a request. Silent on destroy. */
  readonly hidden = output<void>();

  constructor() {
    afterRenderEffect(() => {
      const visible = !!this.panelRef();
      if (visible === this.eventPanelVisible) return;
      this.eventPanelVisible = visible;
      if (visible) this.opened.emit();
      else this.hidden.emit();
    });
    effect((onCleanup) => {
      if (!this.open()) return;
      this.scrollStrategy.enable();
      onCleanup(() => this.scrollStrategy.disable());
    });

    effect(() => {
      const epoch = ++this.focusEpoch;
      if (!this.open()) {
        this.restorePreviousFocus(epoch);
        return;
      }

      this.previousActiveElement ??= this.document.activeElement as HTMLElement | null;
      queueMicrotask(() => {
        if (epoch === this.focusEpoch && this.open() && !this.destroyRef.destroyed) {
          this.focusInitialElement();
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      this.focusEpoch += 1;
      const target = this.previousActiveElement;
      this.previousActiveElement = null;
      if (this.restoreFocus() && this.isValidFocusTarget(target)) {
        target.focus({ preventScroll: true });
      }
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
  }

  private focusInitialElement(): void {
    const panel = this.panelRef()?.nativeElement;
    if (!panel) return;

    if (!this.focusTrapRef()?.focusFirst()) {
      panel.focus();
    }
  }

  private restorePreviousFocus(epoch: number): void {
    const target = this.previousActiveElement;
    if (!this.restoreFocus() || !target?.focus) {
      this.previousActiveElement = null;
      return;
    }

    queueMicrotask(() => {
      if (
        epoch === this.focusEpoch &&
        !this.open() &&
        !this.destroyRef.destroyed &&
        this.isValidFocusTarget(target)
      ) {
        target.focus({ preventScroll: true });
        if (this.previousActiveElement === target) this.previousActiveElement = null;
      }
    });
  }

  private isValidFocusTarget(target: HTMLElement | null): target is HTMLElement {
    return !!target?.isConnected && target.ownerDocument === this.document;
  }
}
