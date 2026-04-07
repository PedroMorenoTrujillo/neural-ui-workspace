import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuToastService,
  NeuToastPosition,
} from '@neural-ui/core';

@Component({
  selector: 'app-toast-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuButtonComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-demo.component.html',
  styleUrl: './toast-demo.component.scss',
})
export class ToastDemoComponent implements OnDestroy {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly toast = inject(NeuToastService);

  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  // Configurador
  cfg: {
    position: NeuToastPosition;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration: number;
  } = {
    position: 'top-right',
    type: 'success',
    title: 'Título del toast',
    message: 'Este es el mensaje del toast.',
    duration: 4000,
  };

  get configCode(): string {
    return `// Inyectar el servicio
private toast = inject(NeuToastService);

// Cambiar posición
this.toast.setPosition('${this.cfg.position}');

// Mostrar toast
this.toast.${this.cfg.type}('${this.cfg.message}'${this.cfg.title ? `, { title: '${this.cfg.title}' }` : ''});`;
  }

  showSuccess(): void {
    this.toast.success('Cambios guardados correctamente.', { title: 'Éxito' });
  }

  showError(): void {
    this.toast.error('No se pudo completar la operación.', { title: 'Error' });
  }

  showWarning(): void {
    this.toast.warning('Tu sesión está a punto de expirar.', { title: 'Advertencia' });
  }

  showInfo(): void {
    this.toast.info('Hay una nueva versión disponible.');
  }

  showPersistent(): void {
    this.toast.show({
      type: 'info',
      title: 'Toast Persistente',
      message: 'Este toast no se cierra automáticamente.',
      duration: 0,
    });
  }

  applyPosition(pos: NeuToastPosition): void {
    this.cfg.position = pos;
    this.toast.setPosition(pos);
  }

  showCfgToast(): void {
    this.toast.setPosition(this.cfg.position);
    this.toast[this.cfg.type](this.cfg.message, {
      title: this.cfg.title || undefined,
      duration: this.cfg.duration,
    });
  }

  ngOnDestroy(): void {
    // Restaurar posición por defecto al salir
    this.toast.setPosition('top-right');
  }

  readonly usageCode = `import { NeuToastService, NeuToastContainerComponent } from '@neural-ui/core';

// 1. Añadir el contenedor en app.html (una sola vez)
// <neu-toast-container />

// 2. Inyectar y usar en cualquier componente
@Component({ ... })
export class MyComponent {
  private toast = inject(NeuToastService);

  // Cambiar posición (global, afecta a todos los toasts)
  this.toast.setPosition('bottom-right');

  save(): void {
    this.toast.success('Guardado correctamente', { title: 'Éxito' });
  }

  handleError(): void {
    this.toast.error('Ha ocurrido un error', { title: 'Error', duration: 8000 });
  }
}`;
}
