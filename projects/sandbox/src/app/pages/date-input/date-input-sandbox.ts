import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuDateInputComponent } from '@neural-ui/core';

@Component({
  selector: 'app-date-input-sandbox',
  imports: [NeuDateInputComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Date Input</h1>
        <p class="sb-page__desc">NeuDateInputComponent — date, time, datetime-local, min/max.</p>
      </div>

      <!-- Tipos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tipos</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-date-input label="Fecha" type="date" [(ngModel)]="date" />
            <span class="sb-value">{{ date() || 'sin valor' }}</span>
          </div>
          <div class="sb-field">
            <neu-date-input label="Hora" type="time" [(ngModel)]="time" />
            <span class="sb-value">{{ time() || 'sin valor' }}</span>
          </div>
          <div class="sb-field">
            <neu-date-input label="Fecha y hora" type="datetime-local" [(ngModel)]="datetime" />
            <span class="sb-value">{{ datetime() || 'sin valor' }}</span>
          </div>
        </div>
      </section>

      <!-- Con hint y error -->
      <section class="sb-section">
        <h2 class="sb-section__title">Hint y error</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-date-input
            label="Fecha de nacimiento"
            type="date"
            hint="Debes ser mayor de 18 años"
          />
          <neu-date-input label="Con error" type="date" errorMessage="La fecha no es válida" />
        </div>
      </section>

      <!-- Min / Max -->
      <section class="sb-section">
        <h2 class="sb-section__title">Min / Max</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-date-input
            label="Solo fechas futuras"
            type="date"
            [min]="today"
            hint="No puedes elegir una fecha pasada"
          />
          <neu-date-input label="Rango 2024" type="date" min="2024-01-01" max="2024-12-31" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-date-input label="Deshabilitado" type="date" [disabled]="true" />
          <neu-date-input
            label="Solo lectura"
            type="date"
            [readonly]="true"
            [(ngModel)]="readDate"
          />
          <neu-date-input label="Requerido" type="date" [required]="true" />
        </div>
      </section>
    </div>
  `,
})
export class DateInputSandboxComponent {
  readonly date = signal('');
  readonly time = signal('');
  readonly datetime = signal('');
  readonly readDate = signal('2024-06-15');
  readonly today = new Date().toISOString().split('T')[0];
}
