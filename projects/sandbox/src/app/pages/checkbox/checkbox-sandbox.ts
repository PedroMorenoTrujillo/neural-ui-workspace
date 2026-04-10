import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuCheckboxComponent } from '@neural-ui/core';

@Component({
  selector: 'app-checkbox-sandbox',
  imports: [NeuCheckboxComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Checkbox</h1>
        <p class="sb-page__desc">NeuCheckboxComponent — estados, grupos, accesibilidad.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-checkbox label="Acepto los términos y condiciones" [(ngModel)]="accepted" />
          <span class="sb-value">aceptado: {{ accepted() }}</span>
        </div>
      </section>

      <!-- Grupo de opciones -->
      <section class="sb-section">
        <h2 class="sb-section__title">Grupo de opciones</h2>
        <div class="sb-demo--column sb-demo">
          <neu-checkbox label="Angular" [(ngModel)]="options.angular" />
          <neu-checkbox label="React" [(ngModel)]="options.react" />
          <neu-checkbox label="Vue" [(ngModel)]="options.vue" />
          <span class="sb-value">seleccionados: {{ selectedOptions() }}</span>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <neu-checkbox label="Preseleccionado" [(ngModel)]="preChecked" />
          <neu-checkbox label="Deshabilitado (sin marcar)" [disabled]="true" />
          <neu-checkbox
            label="Deshabilitado (marcado)"
            [disabled]="true"
            [(ngModel)]="disabledChecked"
          />
          <neu-checkbox name="custom-name" label="Con name personalizado" />
        </div>
      </section>
    </div>
  `,
})
export class CheckboxSandboxComponent {
  readonly accepted = signal(false);
  readonly preChecked = signal(true);
  readonly disabledChecked = signal(true);

  readonly options = {
    angular: signal(false),
    react: signal(false),
    vue: signal(false),
  };

  selectedOptions(): string {
    const list: string[] = [];
    if (this.options.angular()) list.push('angular');
    if (this.options.react()) list.push('react');
    if (this.options.vue()) list.push('vue');
    return list.length ? list.join(', ') : 'ninguno';
  }
}
