import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuRadioGroupComponent, NeuRadioComponent } from '@neural-ui/core';

@Component({
  selector: 'app-radio-sandbox',
  imports: [NeuRadioGroupComponent, NeuRadioComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Radio</h1>
        <p class="sb-page__desc">
          NeuRadioGroupComponent + NeuRadioComponent — selección exclusiva.
        </p>
      </div>

      <!-- Básico: columna -->
      <section class="sb-section">
        <h2 class="sb-section__title">Dirección column (por defecto)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-radio-group [(ngModel)]="plan" direction="column">
            <neu-radio value="basic" label="Básico — gratis" />
            <neu-radio value="pro" label="Pro — 9€/mes" />
            <neu-radio value="enterprise" label="Enterprise — contactar" />
          </neu-radio-group>
          <span class="sb-value">plan: {{ plan() }}</span>
        </div>
      </section>

      <!-- Dirección row -->
      <section class="sb-section">
        <h2 class="sb-section__title">Dirección row</h2>
        <div class="sb-demo--column sb-demo">
          <neu-radio-group [(ngModel)]="gender" direction="row">
            <neu-radio value="m" label="Masculino" />
            <neu-radio value="f" label="Femenino" />
            <neu-radio value="nb" label="No binario" />
            <neu-radio value="skip" label="Prefiero no decirlo" />
          </neu-radio-group>
          <span class="sb-value">género: {{ gender() ?? 'no seleccionado' }}</span>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <p class="sb-label">Preseleccionado</p>
          <neu-radio-group [(ngModel)]="presel">
            <neu-radio value="a" label="Opción A" />
            <neu-radio value="b" label="Opción B (preseleccionada)" />
            <neu-radio value="c" label="Opción C" />
          </neu-radio-group>

          <p class="sb-label" style="margin-top: 1rem">Deshabilitado (grupo)</p>
          <neu-radio-group ariaLabel="Grupo deshabilitado" [(ngModel)]="disVal">
            <neu-radio value="x" label="Opción X" [disabled]="true" />
            <neu-radio value="y" label="Opción Y" [disabled]="true" />
          </neu-radio-group>

          <p class="sb-label" style="margin-top: 1rem">Una opción deshabilitada</p>
          <neu-radio-group ariaLabel="Una opción dis">
            <neu-radio value="ok" label="Habilitada" />
            <neu-radio value="dis" label="Deshabilitada" [disabled]="true" />
            <neu-radio value="ok2" label="Habilitada también" />
          </neu-radio-group>
        </div>
      </section>
    </div>
  `,
})
export class RadioSandboxComponent {
  readonly plan = signal<string | null>(null);
  readonly gender = signal<string | null>(null);
  readonly presel = signal<string>('b');
  readonly disVal = signal<string | null>(null);
}
