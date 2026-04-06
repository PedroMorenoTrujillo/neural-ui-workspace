import { TranslocoPipe } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  signal,
  viewChild,
} from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
