import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuSwitchComponent } from '@neural-ui/core';

@Component({
  selector: 'app-switch-sandbox',
  imports: [NeuSwitchComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Switch</h1>
        <p class="sb-page__desc">NeuSwitchComponent — toggle binario, etiqueta, estados.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-switch label="Activar notificaciones" [(ngModel)]="notifications" />
          <span class="sb-value">notifications: {{ notifications() }}</span>
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--column sb-demo">
          <neu-switch label="Modo oscuro" [(ngModel)]="dark" />
          <neu-switch label="Sincronización automática" [(ngModel)]="sync" />
          <neu-switch label="Recibir emails" [(ngModel)]="emails" />
          <neu-switch label="Acceso de invitados" [(ngModel)]="guest" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <neu-switch label="Preactivado" [(ngModel)]="preOn" />
          <neu-switch label="Deshabilitado (off)" [disabled]="true" />
          <neu-switch label="Deshabilitado (on)" [disabled]="true" [(ngModel)]="disOn" />
          <neu-switch label="Sin etiqueta" [(ngModel)]="noLabel" />
        </div>
      </section>
    </div>
  `,
})
export class SwitchSandboxComponent {
  readonly notifications = signal(false);
  readonly dark = signal(false);
  readonly sync = signal(true);
  readonly emails = signal(false);
  readonly guest = signal(false);
  readonly preOn = signal(true);
  readonly disOn = signal(true);
  readonly noLabel = signal(false);
}
