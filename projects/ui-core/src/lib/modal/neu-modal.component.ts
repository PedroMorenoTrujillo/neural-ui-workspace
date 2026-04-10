import {
  ChangeDetectionStrategy,
  Component,
  Type,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { NeuIconComponent } from '../icon/neu-icon.component';

export type NeuDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Datos que se inyectan en el componente del diálogo / Data injected into the dialog component */
export interface NeuDialogData<T = unknown> {
  title?: string;
  data?: T;
}

/**
 * NeuDialogService — Servicio para abrir diálogos programáticamente. / Service to open dialogs programmatically.
 *
 * Uso:
 *   const dialog = inject(NeuDialogService);
 *   const ref = dialog.open(MyContentComponent, { title: 'Editar', data: item });
 *   ref.closed.subscribe(result => console.log(result));
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NeuDialogService {
  private readonly dialog = inject(Dialog);

  open<T = unknown, R = unknown>(
    component: Type<unknown>,
    config?: {
      title?: string;
      data?: T;
      size?: NeuDialogSize;
      disableClose?: boolean;
    },
  ): DialogRef<R> {
    return this.dialog.open<R>(component, {
      data: { title: config?.title, data: config?.data } satisfies NeuDialogData<T>,
      panelClass: ['neu-dialog-panel', `neu-dialog-panel--${config?.size ?? 'md'}`],
      backdropClass: 'neu-dialog-backdrop',
      disableClose: config?.disableClose ?? false,
    } satisfies DialogConfig);
  }
}

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
  imports: [NeuIconComponent, A11yModule],
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
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        class="neu-dialog__panel neu-dialog__panel--{{ size() }}"
        role="dialog"
        [id]="'neu-dialog-' + _uid"
        [attr.aria-labelledby]="'neu-dialog-title-' + _uid"
        [attr.aria-modal]="true"
        (keydown.escape)="!disableClose() && closed.emit()"
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

  /** @internal — ID único para aria-labelledby / Unique ID for aria-labelledby */
  readonly _uid = Math.random().toString(36).slice(2, 7);
}
