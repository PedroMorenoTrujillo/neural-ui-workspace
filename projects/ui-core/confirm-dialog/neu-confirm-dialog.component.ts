import {
  Component,
  Injectable,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export interface NeuConfirmDialogData {
  /** Título del diálogo / Dialog title */
  title?: string;
  /** Mensaje principal / Main message */
  message: string;
  /** Etiqueta botón aceptar / Accept button label */
  acceptLabel?: string;
  /** Etiqueta botón cancelar / Cancel button label */
  rejectLabel?: string;
  /** Variante del botón cancelar / Reject button variant */
  rejectVariant?: 'secondary' | 'danger';
  /** Variante del botón aceptar / Accept button variant */
  acceptVariant?: 'primary' | 'danger';
}

/**
 * NeuralUI ConfirmDialog Component (internal — usado por NeuConfirmDialogService)
 */
@Component({
  selector: 'neu-confirm-dialog',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-confirm-dialog',
    role: 'alertdialog',
    'aria-modal': 'true',
    '[attr.aria-labelledby]': 'data.title ? titleId : null',
    '[attr.aria-label]': 'data.title ? null : data.message',
    '[attr.aria-describedby]': 'messageId',
  },
  template: `
    @if (data.title) {
      <h2 class="neu-confirm-dialog__title" [id]="titleId">{{ data.title }}</h2>
    }
    <p class="neu-confirm-dialog__message" [id]="messageId">{{ data.message }}</p>
    <div class="neu-confirm-dialog__actions">
      <button
        type="button"
        class="neu-confirm-dialog__btn neu-confirm-dialog__btn--reject"
        [class.neu-confirm-dialog__btn--danger]="data.rejectVariant === 'danger'"
        (click)="reject()"
      >
        {{ data.rejectLabel ?? 'Cancel' }}
      </button>
      <button
        type="button"
        class="neu-confirm-dialog__btn"
        [class.neu-confirm-dialog__btn--primary]="(data.acceptVariant ?? 'primary') === 'primary'"
        [class.neu-confirm-dialog__btn--danger]="data.acceptVariant === 'danger'"
        (click)="accept()"
      >
        {{ data.acceptLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
  styleUrl: './neu-confirm-dialog.component.scss',
})
export class NeuConfirmDialogComponent {
  readonly data: NeuConfirmDialogData = inject(DIALOG_DATA);
  private readonly _dialogRef = inject(DialogRef<boolean>);
  protected readonly titleId = inject(NeuIdGenerator).getId('neu-confirm-title-');
  protected readonly messageId = inject(NeuIdGenerator).getId('neu-confirm-message-');

  accept(): void {
    this._dialogRef.close(true);
  }

  reject(): void {
    this._dialogRef.close(false);
  }
}

/**
 * NeuralUI ConfirmDialog Service
 *
 * Abre un diálogo de confirmación y retorna una promesa con el resultado.
 *
 * Uso:
 *   inject(NeuConfirmDialogService)
 *     .confirm({ message: 'Delete this record?', acceptVariant: 'danger' })
 *     .then(ok => ok && doDelete());
 */
@Injectable({ providedIn: 'root' })
export class NeuConfirmDialogService {
  private readonly _dialog = inject(Dialog);

  /**
   * Abre el diálogo y resuelve con `true` si el usuario acepta,
   * `false` si cancela o cierra el diálogo.
   */
  confirm(data: NeuConfirmDialogData): Promise<boolean> {
    const ref = this._dialog.open<boolean, NeuConfirmDialogData>(NeuConfirmDialogComponent, {
      data,
      panelClass: 'neu-confirm-dialog-panel',
      backdropClass: 'neu-confirm-dialog-backdrop',
      disableClose: false,
    });
    return new Promise<boolean>((resolve) => {
      ref.closed.subscribe((result) => resolve(result ?? false));
    });
  }
}
