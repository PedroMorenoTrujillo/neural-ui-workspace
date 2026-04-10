import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuCardComponent } from '@neural-ui/core';

@Component({
  selector: 'app-card-sandbox',
  imports: [NeuCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Card</h1>
        <p class="sb-page__desc">NeuCardComponent — padding, hoverable, bordered, flat.</p>
      </div>

      <!-- Padding -->
      <section class="sb-section">
        <h2 class="sb-section__title">Padding</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-card padding="none">
            <p style="background: var(--neu-surface-2); padding: 8px; font-size:var(--neu-text-sm)">
              padding: none
            </p>
          </neu-card>
          <neu-card padding="sm">
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">padding: sm</p>
          </neu-card>
          <neu-card padding="md">
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">
              padding: md (default)
            </p>
          </neu-card>
          <neu-card padding="lg">
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">padding: lg</p>
          </neu-card>
          <neu-card padding="lg">
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">padding: xl</p>
          </neu-card>
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-card>
            <h3 style="font-weight: 600; margin-bottom: 4px">Default</h3>
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">
              Card con sombra por defecto
            </p>
          </neu-card>
          <neu-card [hoverable]="true">
            <h3 style="font-weight: 600; margin-bottom: 4px">Hoverable</h3>
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">
              Eleva al hacer hover
            </p>
          </neu-card>
          <neu-card [bordered]="true">
            <h3 style="font-weight: 600; margin-bottom: 4px">Bordered</h3>
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">
              Con borde visible, sin sombra
            </p>
          </neu-card>
          <neu-card [flat]="true">
            <h3 style="font-weight: 600; margin-bottom: 4px">Flat</h3>
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">
              Sin sombra y sin borde
            </p>
          </neu-card>
          <neu-card [bordered]="true" [hoverable]="true">
            <h3 style="font-weight: 600; margin-bottom: 4px">Bordered + Hoverable</h3>
            <p style="font-size:var(--neu-text-sm); color:var(--neu-text-muted)">Combinación</p>
          </neu-card>
        </div>
      </section>

      <!-- Contenido rico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Contenido rico (proyección con ng-content)</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-card [hoverable]="true" padding="lg">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <h3 style="font-weight: 700; font-size: var(--neu-text-lg)">Plan Pro</h3>
              <p
                style="font-size: var(--neu-text-2xl); font-weight: 700; color: var(--neu-primary)"
              >
                €9/mes
              </p>
              <ul
                style="list-style: none; font-size: var(--neu-text-sm); color: var(--neu-text-muted); display: flex; flex-direction: column; gap: 4px"
              >
                <li>✓ 10 proyectos</li>
                <li>✓ 50 GB almacenamiento</li>
                <li>✓ Soporte prioritario</li>
              </ul>
            </div>
          </neu-card>
          <neu-card [bordered]="true" padding="lg">
            <div style="display: flex; flex-direction: column; gap: 8px">
              <h3 style="font-weight: 700; font-size: var(--neu-text-lg)">Plan Enterprise</h3>
              <p style="font-size: var(--neu-text-2xl); font-weight: 700">Contactar</p>
              <ul
                style="list-style: none; font-size: var(--neu-text-sm); color: var(--neu-text-muted); display: flex; flex-direction: column; gap: 4px"
              >
                <li>✓ Proyectos ilimitados</li>
                <li>✓ SLA garantizado</li>
                <li>✓ Soporte 24/7</li>
              </ul>
            </div>
          </neu-card>
        </div>
      </section>
    </div>
  `,
})
export class CardSandboxComponent {}
