import { Injectable, Type, inject } from '@angular/core';
import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { NeuDialogSize } from './neu-modal.component';

/** Datos que se inyectan en el componente del diálogo / Data injected into the dialog component */
export interface NeuDialogData<T = unknown> {
  title?: string;
  data?: T;
}

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
      restoreFocus?: boolean;
    },
  ): DialogRef<R> {
    return this.dialog.open<R>(component, {
      data: { title: config?.title, data: config?.data } satisfies NeuDialogData<T>,
      panelClass: ['neu-dialog-panel', `neu-dialog-panel--${config?.size ?? 'md'}`],
      backdropClass: 'neu-dialog-backdrop',
      disableClose: config?.disableClose ?? false,
      restoreFocus: config?.restoreFocus ?? true,
    } satisfies DialogConfig);
  }
}
