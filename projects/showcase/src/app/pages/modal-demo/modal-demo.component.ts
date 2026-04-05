import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuModalComponent } from '@neural-ui/core';
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-modal-demo',
  template: `
    <h1>Modal</h1>
    <p>Overlay accesible usando Angular CDK Dialog.</p>
    <div style="padding:2rem 0;display:flex;gap:1rem;flex-wrap:wrap">
      <button neu-button (click)="showSm.set(true)">Modal pequeño</button>
      <button neu-button (click)="showMd.set(true)">Modal mediano</button>
      <button neu-button (click)="showLg.set(true)">Modal grande</button>
    </div>

    <neu-modal [open]="showSm()" (closed)="showSm.set(false)" title="Confirmación" size="sm">
      <p>¿Estás seguro de que quieres continuar?</p>
      <div neu-modal-footer style="display:flex;gap:.5rem;justify-content:flex-end;padding:1rem 1.25rem">
        <button neu-button variant="ghost" (click)="showSm.set(false)">Cancelar</button>
        <button neu-button (click)="showSm.set(false)">Confirmar</button>
      </div>
    </neu-modal>

    <neu-modal [open]="showMd()" (closed)="showMd.set(false)" title="Editar perfil" size="md">
      <p>Contenido del modal mediano.</p>
    </neu-modal>

    <neu-modal [open]="showLg()" (closed)="showLg.set(false)" title="Vista previa" size="lg">
      <p>Contenido del modal grande con más espacio disponible.</p>
    </neu-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuModalComponent, NeuButtonComponent],
})
export class ModalDemoComponent {
  showSm = signal(false);
  showMd = signal(false);
  showLg = signal(false);
}
