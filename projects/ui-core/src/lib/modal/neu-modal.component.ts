import {
  ChangeDetectionStrategy,
  Component,
  Type,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { A11yModule } from '@angular/cdk/a11y';
import { NeuIconComponent } from '../icon/neu-icon.component';

export type NeuDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
/** @deprecated Use NeuDialogSize */
export type NeuModalSize = NeuDialogSize;

/** Datos que se inyectan en el componente del diálogo */
export interface NeuDialogData<T = unknown> {
  title?: string;
  data?: T;
}
/** @deprecated Use NeuDialogData */
export type NeuModalData<T = unknown> = NeuDialogData<T>;

/**
 * NeuDialogService — Servicio para abrir diálogos programáticamente.
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

/** @deprecated Use NeuDialogService */
export { NeuDialogService as NeuModalService };

/**
 * NeuDialogComponent — Diálogo accesible con header, body y footer.
 * Úsalo directamente como componente declarativo pasando `open` como signal.
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
  /** Controla la visibilidad del diálogo. */
  open = input<boolean>(false);
  /** Título que aparece en el header. */
  title = input<string>('');
  /** Tamaño del panel: sm | md | lg | xl | full. */
  size = input<NeuDialogSize>('md');
  /** Si es true, el backdrop y el botón cerrar no funcionan. */
  disableClose = input<boolean>(false);

  /** Emite cuando el usuario cierra el diálogo. */
  closed = output<void>();

  /** @internal — ID único para aria-labelledby */
  readonly _uid = Math.random().toString(36).slice(2, 7);
}

/** @deprecated Use NeuDialogComponent */
export { NeuDialogComponent as NeuModalComponent };
