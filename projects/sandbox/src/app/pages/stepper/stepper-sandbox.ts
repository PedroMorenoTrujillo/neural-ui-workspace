import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuStepperComponent } from '@neural-ui/core';
import type { NeuStepperStep } from '@neural-ui/core';

@Component({
  selector: 'app-stepper-sandbox',
  imports: [NeuStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Stepper</h1>
        <p class="sb-page__desc">NeuStepperComponent — pasos, linear, completed, error.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico (interactivo)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-stepper
            [steps]="steps"
            [activeStep]="activeStep()"
            (stepChange)="activeStep.set($event)"
          />
          <div style="display: flex; gap: 8px; margin-top: 8px">
            <button
              type="button"
              [disabled]="activeStep() === 0"
              style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--neu-border); background: var(--neu-surface); color: var(--neu-text); cursor: pointer"
              (click)="activeStep.update(s => s - 1)"
            >
              Anterior
            </button>
            <button
              type="button"
              [disabled]="activeStep() === steps.length - 1"
              style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--neu-primary); background: var(--neu-primary); color: white; cursor: pointer"
              (click)="activeStep.update(s => s + 1)"
            >
              Siguiente
            </button>
          </div>
          <span class="sb-value">paso activo: {{ activeStep() }}</span>
        </div>
      </section>

      <!-- Linear -->
      <section class="sb-section">
        <h2 class="sb-section__title">Linear (solo avance secuencial)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-stepper
            [steps]="linearSteps"
            [activeStep]="linearActive()"
            [linear]="true"
            (stepChange)="linearActive.set($event)"
          />
          <div style="display: flex; gap: 8px; margin-top: 8px">
            <button
              type="button"
              [disabled]="linearActive() === 0"
              style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--neu-border); background: var(--neu-surface); color: var(--neu-text); cursor: pointer"
              (click)="linearActive.update(s => s - 1)"
            >
              Anterior
            </button>
            <button
              type="button"
              [disabled]="linearActive() === linearSteps.length - 1"
              style="padding: 6px 16px; border-radius: 6px; border: 1px solid var(--neu-primary); background: var(--neu-primary); color: white; cursor: pointer"
              (click)="linearActive.update(s => s + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>

      <!-- Con error -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con estado error</h2>
        <div class="sb-demo--column sb-demo">
          <neu-stepper [steps]="stepsWithError" [activeStep]="2" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">2 pasos</span>
            <neu-stepper [steps]="twoSteps" [activeStep]="0" />
          </div>
          <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Todos completados</span>
            <neu-stepper [steps]="allComplete" [activeStep]="allComplete.length" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class StepperSandboxComponent {
  readonly activeStep = signal(1);
  readonly linearActive = signal(0);

  readonly steps: NeuStepperStep[] = [
    { label: 'Información personal', description: 'Nombre y contacto' },
    { label: 'Dirección', description: 'Dónde enviar' },
    { label: 'Pago', description: 'Método de pago' },
    { label: 'Confirmación', description: 'Revisar y confirmar' },
  ];

  readonly linearSteps: NeuStepperStep[] = [
    { label: 'Crear cuenta', description: 'Email y contraseña' },
    { label: 'Verificar email', description: 'Código enviado' },
    { label: 'Completar perfil', description: 'Datos opcionales' },
  ];

  readonly stepsWithError: NeuStepperStep[] = [
    { label: 'Datos correctos', completed: true },
    { label: 'Error de validación', description: 'Email ya registrado' },
    { label: 'Pendiente' },
    { label: 'Último paso' },
  ];

  readonly twoSteps: NeuStepperStep[] = [{ label: 'Paso 1' }, { label: 'Paso 2' }];

  readonly allComplete: NeuStepperStep[] = [
    { label: 'Completado', completed: true },
    { label: 'Completado', completed: true },
    { label: 'Completado', completed: true },
  ];
}
