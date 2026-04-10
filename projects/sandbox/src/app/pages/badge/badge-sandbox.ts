import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuBadgeComponent } from '@neural-ui/core';

@Component({
  selector: 'app-badge-sandbox',
  imports: [NeuBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Badge</h1>
        <p class="sb-page__desc">NeuBadgeComponent — variantes, tamaños, dot, outline, pill.</p>
      </div>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo">
          <neu-badge variant="default">Default</neu-badge>
          <neu-badge variant="success">Success</neu-badge>
          <neu-badge variant="warning">Warning</neu-badge>
          <neu-badge variant="danger">Danger</neu-badge>
          <neu-badge variant="info">Info</neu-badge>
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-badge variant="success" size="sm">Small</neu-badge>
          <neu-badge variant="success" size="md">Medium</neu-badge>
        </div>
      </section>

      <!-- Dot -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con punto (dot)</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-badge variant="default" [dot]="true">Default</neu-badge>
          <neu-badge variant="success" [dot]="true">Activo</neu-badge>
          <neu-badge variant="warning" [dot]="true">En revisión</neu-badge>
          <neu-badge variant="danger" [dot]="true">Error</neu-badge>
          <neu-badge variant="info" [dot]="true">Info</neu-badge>
        </div>
      </section>

      <!-- Outline -->
      <section class="sb-section">
        <h2 class="sb-section__title">Outline</h2>
        <div class="sb-demo">
          <neu-badge variant="default" [outline]="true">Default</neu-badge>
          <neu-badge variant="success" [outline]="true">Success</neu-badge>
          <neu-badge variant="warning" [outline]="true">Warning</neu-badge>
          <neu-badge variant="danger" [outline]="true">Danger</neu-badge>
          <neu-badge variant="info" [outline]="true">Info</neu-badge>
        </div>
      </section>

      <!-- Sin pill (cuadrado) -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sin pill (esquinas rectas)</h2>
        <div class="sb-demo">
          <neu-badge variant="info" [pill]="false">Info</neu-badge>
          <neu-badge variant="success" [pill]="false">Success</neu-badge>
          <neu-badge variant="danger" [pill]="false" [outline]="true">Danger</neu-badge>
        </div>
      </section>
    </div>
  `,
})
export class BadgeSandboxComponent {}
