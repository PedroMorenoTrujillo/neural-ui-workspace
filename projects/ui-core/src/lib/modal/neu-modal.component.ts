import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  EnvironmentInjector,
  Injector,
  Type,
  ViewEncapsulation,
  inject,
  input,
  output,
} from '@angular/core';
import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { NeuIconComponent } from '../icon/neu-icon.component';

export type NeuModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Datos que se inyectan en el componente del modal */
export interface NeuModalData<T = unknown> {
  title?: string;
  data?: T;
}

/**
 * NeuModalService — Servicio para abrir modales programáticamente.
 *
 * Uso:
 *   const modal = inject(NeuModalService);
 *   const ref = modal.open(MyContentComponent, { title: 'Editar', data: item });
 *   ref.closed.subscribe(result => console.log(result));
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NeuModalService {
  private readonly dialog = inject(Dialog);

  open<T = unknown, R = unknown>(
    component: Type<unknown>,
    config?: {
      title?: string;
      data?: T;
      size?: NeuModalSize;
      disableClose?: boolean;
    },
  ): DialogRef<R> {
    return this.dialog.open<R>(component, {
      data: { title: config?.title, data: config?.data } satisfies NeuModalData<T>,
      panelClass: ['neu-modal-panel', `neu-modal-panel--${config?.size ?? 'md'}`],
      backdropClass: 'neu-modal-backdrop',
      disableClose: config?.disableClose ?? false,
    } satisfies DialogConfig);
  }
}

/**
 * NeuModalShellComponent — Shell del dialogo con header, body y footer.
 * Úsalo directamente como componente declarativo en la plantilla pasando
 * `open` como signal.
 *
 * Para uso programático, utiliza NeuModalService.open().
 *
 * Uso declarativo:
 *   <neu-modal [open]="isOpen()" title="Editar usuario" (closed)="isOpen.set(false)">
 *     <p>Contenido del modal</p>
 *     <div neu-modal-footer>
 *       <neu-button (click)="save()">Guardar</neu-button>
 *     </div>
 *   </neu-modal>
 */
@Component({
  selector: 'neu-modal',
  imports: [NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.neu-modal--open]': 'open()',
    '[attr.aria-hidden]': '!open()',
  },
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div
        class="neu-modal__backdrop"
        (click)="!disableClose() && closed.emit()"
        aria-hidden="true"
      ></div>

      <!-- Panel -->
      <div
        class="neu-modal__panel neu-modal__panel--{{ size() }}"
        role="dialog"
        [attr.aria-label]="title()"
        [attr.aria-modal]="true"
      >
        <!-- Header -->
        <div class="neu-modal__header">
          <h2 class="neu-modal__title">{{ title() }}</h2>
          @if (!disableClose()) {
            <button
              class="neu-modal__close"
              type="button"
              aria-label="Cerrar modal"
              (click)="closed.emit()"
            >
              <neu-icon name="lucideX" size="1.125rem" />
            </button>
          }
        </div>

        <!-- Body -->
        <div class="neu-modal__body">
          <ng-content />
        </div>

        <!-- Footer (opcional via slot) -->
        <ng-content select="[neu-modal-footer]" />
      </div>
    }
  `,
  styleUrl: './neu-modal.component.scss',
})
export class NeuModalComponent {
  /** Controla la visibilidad del modal. */
  open = input<boolean>(false);
  /** Título que aparece en el header. */
  title = input<string>('');
  /** Tamaño del panel: sm | md | lg | xl | full. */
  size = input<NeuModalSize>('md');
  /** Si es true, el backdrop y el botón cerrar no funcionan. */
  disableClose = input<boolean>(false);

  /** Emite cuando el usuario cierra el modal. */
  closed = output<void>();
}
