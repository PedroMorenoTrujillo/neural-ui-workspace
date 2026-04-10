import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuSpinnerComponent } from '@neural-ui/core';

@Component({
  selector: 'app-spinner-sandbox',
  imports: [NeuSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Spinner</h1>
        <p class="sb-page__desc">NeuSpinnerComponent — tamaños, variantes de color, velocidad.</p>
      </div>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="xs" />
            <span class="sb-label">xs</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="sm" />
            <span class="sb-label">sm</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="md" />
            <span class="sb-label">md</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" />
            <span class="sb-label">lg</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="xl" />
            <span class="sb-label">xl</span>
          </div>
        </div>
      </section>

      <!-- Severidad / color -->
      <section class="sb-section">
        <h2 class="sb-section__title">Severidad</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="primary" />
            <span class="sb-label">primary</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="info" />
            <span class="sb-label">secondary</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="success" />
            <span class="sb-label">success</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="warning" />
            <span class="sb-label">warning</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="danger" />
            <span class="sb-label">danger</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner severity="info" />
            <span class="sb-label">info</span>
          </div>
        </div>
      </section>

      <!-- Stroke width -->
      <section class="sb-section">
        <h2 class="sb-section__title">Grosor de trazo (strokeWidth)</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" strokeWidth="1" />
            <span class="sb-label">1</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" strokeWidth="2" />
            <span class="sb-label">2</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" strokeWidth="4" />
            <span class="sb-label">4</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" strokeWidth="6" />
            <span class="sb-label">6</span>
          </div>
        </div>
      </section>

      <!-- Velocidad -->
      <section class="sb-section">
        <h2 class="sb-section__title">Velocidad de animación</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" animationDuration="0.5s" />
            <span class="sb-label">500ms</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" animationDuration="1s" />
            <span class="sb-label">1000ms</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-spinner size="lg" animationDuration="2s" />
            <span class="sb-label">2000ms (lento)</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SpinnerSandboxComponent {}
