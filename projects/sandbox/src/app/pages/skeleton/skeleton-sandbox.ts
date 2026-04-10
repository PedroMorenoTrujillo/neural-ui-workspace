import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuSkeletonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-skeleton-sandbox',
  imports: [NeuSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Skeleton</h1>
        <p class="sb-page__desc">
          NeuSkeletonComponent — variante text/rect/circle, dimensiones personalizadas.
        </p>
      </div>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 400px">
          <div style="display:flex; flex-direction:column; gap:4px">
            <span class="sb-label">text (default)</span>
            <neu-skeleton variant="text" />
            <neu-skeleton variant="text" width="75%" />
            <neu-skeleton variant="text" width="50%" />
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; margin-top:12px">
            <span class="sb-label">rect</span>
            <neu-skeleton variant="rect" width="100%" height="120px" />
          </div>
          <div style="display:flex; flex-direction:column; gap:4px; margin-top:12px">
            <span class="sb-label">circle</span>
            <neu-skeleton variant="circle" width="48px" height="48px" />
          </div>
        </div>
      </section>

      <!-- Simulación de card -->
      <section class="sb-section">
        <h2 class="sb-section__title">Simulación de tarjeta</h2>
        <div class="sb-demo" style="flex-wrap: wrap; gap: 16px">
          <div
            style="
            display: flex; gap: 12px; padding: 16px;
            border: 1px solid var(--neu-border); border-radius: 8px;
            width: 320px;
          "
          >
            <neu-skeleton variant="circle" width="48px" height="48px" />
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px">
              <neu-skeleton variant="text" width="60%" />
              <neu-skeleton variant="text" width="40%" />
              <neu-skeleton variant="rect" width="100%" height="80px" style="margin-top: 8px" />
              <div style="display: flex; gap: 8px; margin-top: 4px">
                <neu-skeleton variant="text" width="30%" />
                <neu-skeleton variant="text" width="30%" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Simulación de tabla -->
      <section class="sb-section">
        <h2 class="sb-section__title">Simulación de tabla</h2>
        <div class="sb-demo--column sb-demo" style="max-width: 600px">
          <div style="display: flex; flex-direction: column; gap: 10px">
            @for (row of [1, 2, 3, 4, 5]; track row) {
              <div style="display: flex; gap: 12px; align-items: center">
                <neu-skeleton variant="circle" width="32px" height="32px" />
                <neu-skeleton variant="text" width="25%" />
                <neu-skeleton variant="text" width="35%" />
                <neu-skeleton variant="text" width="20%" />
              </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SkeletonSandboxComponent {}
