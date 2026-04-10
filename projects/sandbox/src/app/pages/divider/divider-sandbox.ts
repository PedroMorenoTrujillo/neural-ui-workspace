import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuDividerComponent } from '@neural-ui/core';

@Component({
  selector: 'app-divider-sandbox',
  imports: [NeuDividerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Divider</h1>
        <p class="sb-page__desc">NeuDividerComponent — horizontal, vertical, con etiqueta.</p>
      </div>

      <!-- Básico horizontal -->
      <section class="sb-section">
        <h2 class="sb-section__title">Horizontal</h2>
        <div class="sb-demo--column sb-demo">
          <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
            Contenido arriba del divider
          </p>
          <neu-divider />
          <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
            Contenido debajo del divider
          </p>
        </div>
      </section>

      <!-- Con etiqueta -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con etiqueta</h2>
        <div class="sb-demo--column sb-demo">
          <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
            Sección anterior
          </p>
          <neu-divider label="O continúa con" />
          <p style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
            Siguiente sección
          </p>

          <neu-divider label="2024" />
          <neu-divider label="NUEVA SECCIÓN" />
        </div>
      </section>

      <!-- Vertical -->
      <section class="sb-section">
        <h2 class="sb-section__title">Vertical</h2>
        <div class="sb-demo" style="align-items: center; height: 80px">
          <span style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">Izquierda</span>
          <neu-divider orientation="vertical" style="height: 40px" />
          <span style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">Centro</span>
          <neu-divider orientation="vertical" style="height: 40px" />
          <span style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">Derecha</span>
        </div>
      </section>

      <!-- Uso en formulario -->
      <section class="sb-section">
        <h2 class="sb-section__title">Uso típico: separar secciones de formulario</h2>
        <div class="sb-demo--column sb-demo">
          <p style="font-weight: 600">Datos personales</p>
          <neu-divider />
          <p style="font-weight: 600">Dirección</p>
          <neu-divider />
          <p style="font-weight: 600">Pago</p>
        </div>
      </section>
    </div>
  `,
})
export class DividerSandboxComponent {}
