import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export interface NeuStepperStep {
  /** Etiqueta del paso */
  label: string;
  /** Descripción corta opcional */
  description?: string;
  /** Marca el paso como completado externamente */
  completed?: boolean;
  /** Desactiva el paso */
  disabled?: boolean;
}

/**
 * NeuralUI Stepper Component
 *
 * Wizard paso a paso con estado de completado, lineal u opcional.
 * Expone métodos next() / prev() y emite stepChange.
 *
 * Uso:
 *   <neu-stepper [steps]="steps" [activeStep]="step" (stepChange)="step = $event">
 *     <ng-template neuStepContent>Contenido paso 1</ng-template>
 *     <ng-template neuStepContent>Contenido paso 2</ng-template>
 *   </neu-stepper>
 */
@Component({
  selector: 'neu-stepper',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Cabecera de pasos -->
    <div class="neu-stepper">
      <div class="neu-stepper__header">
        @for (step of steps(); track step.label; let i = $index; let last = $last) {
          <div
            class="neu-stepper__step"
            [class.neu-stepper__step--active]="i === activeStep()"
            [class.neu-stepper__step--completed]="isCompleted(i)"
            [class.neu-stepper__step--disabled]="step.disabled"
          >
            <button
              class="neu-stepper__step-btn"
              type="button"
              [disabled]="step.disabled"
              (click)="goTo(i)"
            >
              <span class="neu-stepper__indicator">
                @if (isCompleted(i)) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                } @else {
                  {{ i + 1 }}
                }
              </span>
              <span class="neu-stepper__step-info">
                <span class="neu-stepper__step-label">{{ step.label }}</span>
                @if (step.description) {
                  <span class="neu-stepper__step-desc">{{ step.description }}</span>
                }
              </span>
            </button>
            @if (!last) {
              <div
                class="neu-stepper__connector"
                [class.neu-stepper__connector--done]="isCompleted(i) || i < activeStep()"
              ></div>
            }
          </div>
        }
      </div>

      <!-- Panel de contenido -->
      <div class="neu-stepper__content">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './neu-stepper.component.scss',
})
export class NeuStepperComponent {
  /** Pasos del wizard */
  steps = input<NeuStepperStep[]>([]);

  /** Índice del paso activo (0-based) */
  activeStep = input<number>(0);

  /** Si true, solo permite ir hacia adelante secuencialmente */
  linear = input<boolean>(false);

  /** Emite el nuevo índice al cambiar */
  stepChange = output<number>();

  /** Set de pasos completados */
  private readonly _completed = signal<Set<number>>(new Set());

  readonly isCompleted = (i: number) =>
    this._completed().has(i) || (this.steps()[i]?.completed ?? false) || i < this.activeStep();

  goTo(i: number): void {
    const step = this.steps()[i];
    if (step?.disabled) return;
    if (this.linear() && i > this.activeStep() + 1 && !this.isCompleted(this.activeStep())) return;
    this.stepChange.emit(i);
  }

  /** Marca el paso actual como completado y avanza al siguiente */
  next(): void {
    const current = this.activeStep();
    const updated = new Set(this._completed());
    updated.add(current);
    this._completed.set(updated);
    if (current < this.steps().length - 1) {
      this.stepChange.emit(current + 1);
    }
  }

  prev(): void {
    const current = this.activeStep();
    if (current > 0) {
      this.stepChange.emit(current - 1);
    }
  }
}
