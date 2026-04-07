import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCodeBlockComponent,
  NeuDialogComponent,
  NeuDialogSize,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-dialog-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuButtonComponent,
    NeuCodeBlockComponent,
    NeuDialogComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog-demo.component.html',
  styleUrl: './dialog-demo.component.scss',
})
export class DialogDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  // Signals para cada dialog en el preview
  showPreview = signal(false);

  // Señales del configurador
  cfgOpen = signal(false);
  cfgTitle = signal('Editar perfil');
  cfgSize = signal<NeuDialogSize>('md');
  cfgDisableClose = signal(false);

  readonly sizeOptions: NeuDialogSize[] = ['sm', 'md', 'lg', 'xl', 'full'];

  get configCode(): string {
    return `<neu-dialog
  [open]="isOpen()"
  title="${this.cfgTitle()}"
  size="${this.cfgSize()}"
  [disableClose]="${this.cfgDisableClose()}"
  (closed)="isOpen.set(false)"
>
  <p>Contenido del diálogo.</p>
  <div neu-dialog-footer>
    <button neu-button variant="ghost" (click)="isOpen.set(false)">Cancelar</button>
    <button neu-button (click)="isOpen.set(false)">Confirmar</button>
  </div>
</neu-dialog>`;
  }

  readonly usageCode = `import { NeuDialogComponent } from '@neural-ui/core';

@Component({
  imports: [NeuDialogComponent, NeuButtonComponent],
  template: \`
    <button neu-button (click)="open.set(true)">Abrir diálogo</button>

    <neu-dialog
      [open]="open()"
      title="Confirmar acción"
      size="sm"
      (closed)="open.set(false)"
    >
      <p>¿Estás seguro de que quieres continuar?</p>
      <div neu-dialog-footer>
        <button neu-button variant="ghost" (click)="open.set(false)">Cancelar</button>
        <button neu-button (click)="open.set(false)">Confirmar</button>
      </div>
    </neu-dialog>
  \`,
})
export class MyComponent {
  open = signal(false);
}`;
}
