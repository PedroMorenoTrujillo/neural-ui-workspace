import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuProgressBarComponent } from '@neural-ui/core';

@Component({
  selector: 'app-progress-bar-sandbox',
  imports: [NeuProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Progress Bar</h1>
        <p class="sb-page__desc">NeuProgressBarComponent — variantes, tamaños, indeterminate.</p>
      </div>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes (valor 65%)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-progress-bar [value]="65" variant="primary" label="Primary" />
          <neu-progress-bar [value]="65" variant="success" label="Success" />
          <neu-progress-bar [value]="65" variant="warning" label="Warning" />
          <neu-progress-bar [value]="65" variant="danger" label="Danger" />
          <neu-progress-bar [value]="65" variant="primary" label="Info" />
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo--column sb-demo">
          <neu-progress-bar [value]="40" size="sm" label="Small" />
          <neu-progress-bar [value]="60" size="md" label="Medium" />
          <neu-progress-bar [value]="80" size="lg" label="Large" />
        </div>
      </section>

      <!-- Con valor visible -->
      <section class="sb-section">
        <h2 class="sb-section__title">Mostrar valor</h2>
        <div class="sb-demo--column sb-demo">
          <neu-progress-bar [value]="progress()" [showValue]="true" label="Con porcentaje" />
          <neu-progress-bar
            [value]="progress()"
            [showValue]="true"
            variant="success"
            label="Success visible"
          />
          <div style="display: flex; gap: 8px; margin-top: 8px">
            <button
              type="button"
              style="padding: 4px 12px; border-radius: 6px; border: 1px solid var(--neu-border); background: var(--neu-surface); color: var(--neu-text); cursor: pointer"
              (click)="progress.update(v => Math.max(0, v - 10))"
            >
              −10
            </button>
            <button
              type="button"
              style="padding: 4px 12px; border-radius: 6px; border: 1px solid var(--neu-border); background: var(--neu-surface); color: var(--neu-text); cursor: pointer"
              (click)="progress.update(v => Math.min(100, v + 10))"
            >
              +10
            </button>
            <span class="sb-value">valor: {{ progress() }}%</span>
          </div>
        </div>
      </section>

      <!-- Indeterminate -->
      <section class="sb-section">
        <h2 class="sb-section__title">Indeterminate</h2>
        <div class="sb-demo--column sb-demo">
          <neu-progress-bar [indeterminate]="true" label="Cargando..." />
          <neu-progress-bar [indeterminate]="true" variant="success" size="sm" label="Success sm" />
          <neu-progress-bar [indeterminate]="true" variant="danger" size="lg" label="Danger lg" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <neu-progress-bar [value]="0" label="0%" [showValue]="true" />
          <neu-progress-bar
            [value]="100"
            variant="success"
            label="100% completo"
            [showValue]="true"
          />
          <neu-progress-bar [value]="33" />
        </div>
      </section>
    </div>
  `,
})
export class ProgressBarSandboxComponent {
  readonly progress = signal(45);
  protected readonly Math = Math;
}
