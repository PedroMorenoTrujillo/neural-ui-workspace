import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuStepperComponent,
  NeuStepperStep,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-stepper-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuStepperComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper-demo.component.html',
  styleUrl: './stepper-demo.component.scss',
})
export class StepperDemoComponent {
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

  // Demo interactivo
  readonly activeStep = signal(0);
  readonly stepper = viewChild(NeuStepperComponent);

  readonly checkoutSteps: NeuStepperStep[] = [
    { label: 'Carrito', description: 'Revisa tus productos' },
    { label: 'Envío', description: 'Dirección de entrega' },
    { label: 'Pago', description: 'Método de pago' },
    { label: 'Confirmar', description: '¡Listo para pedir!' },
  ];

  next(): void {
    this.stepper()?.next();
  }

  prev(): void {
    this.stepper()?.prev();
  }

  cfg: {
    linear: boolean;
    activeStep: number;
  } = {
    linear: false,
    activeStep: 1,
  };

  get configCode(): string {
    const attrs: string[] = [`[steps]="steps"`, `[activeStep]="${this.cfg.activeStep}"`];
    if (this.cfg.linear) attrs.push(`[linear]="true"`);
    attrs.push(`(stepChange)="activeStep = $event"`);
    return `<neu-stepper\n  ${attrs.join('\n  ')}\n/>`;
  }

  readonly usageCode = `import { NeuStepperComponent, NeuStepperStep, viewChild } from '@angular/core';
import { signal } from '@angular/core';

@Component({
  imports: [NeuStepperComponent],
  template: \`
    <neu-stepper #stepper
      [steps]="steps"
      [activeStep]="step()"
      (stepChange)="step.set($event)"
    />
    <button (click)="stepper.next()">Siguiente</button>
    <button (click)="stepper.prev()">Anterior</button>
  \`
})
export class MyComponent {
  step = signal(0);
  stepper = viewChild(NeuStepperComponent);

  steps: NeuStepperStep[] = [
    { label: 'Datos personales' },
    { label: 'Método de pago'  },
    { label: 'Confirmar'       },
  ];
}`;
}
