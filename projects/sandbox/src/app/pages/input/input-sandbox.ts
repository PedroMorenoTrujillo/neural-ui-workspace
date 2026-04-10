import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuInputComponent } from '@neural-ui/core';

@Component({
  selector: 'app-input-sandbox',
  imports: [NeuInputComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Input</h1>
        <p class="sb-page__desc">NeuInputComponent — tipos, estados, iconos, validación.</p>
      </div>

      <!-- Básico con floating label -->
      <section class="sb-section">
        <h2 class="sb-section__title">Floating label (por defecto)</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-input label="Nombre" [(ngModel)]="name" />
            <span class="sb-value">valor: "{{ name() }}"</span>
          </div>
          <div class="sb-field">
            <neu-input label="Email" type="email" placeholder="tu@email.com" [(ngModel)]="email" />
          </div>
          <div class="sb-field">
            <neu-input label="Contraseña" type="password" [(ngModel)]="pass" />
          </div>
        </div>
      </section>

      <!-- Tipos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tipos de input</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-input label="Texto" type="text" />
          <neu-input label="Número" type="number" />
          <neu-input label="Búsqueda" type="search" />
          <neu-input label="URL" type="url" />
          <neu-input label="Teléfono" type="tel" />
        </div>
      </section>

      <!-- Hint y error -->
      <section class="sb-section">
        <h2 class="sb-section__title">Hint y errorMessage</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-input label="Con hint" hint="Mínimo 8 caracteres" />
          <neu-input label="Con error" errorMessage="Este campo es requerido" />
          <neu-input
            label="Hint + error"
            hint="Formato: usuario@dominio.com"
            errorMessage="Email no válido"
          />
        </div>
      </section>

      <!-- Con iconos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con iconos</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-input label="Buscar" icon="lucideSearch" [startIcon]="true" />
          <neu-input
            label="Email"
            type="email"
            icon="lucideSmile"
            iconPosition="right"
            [endIcon]="true"
          />
          <neu-input
            label="Con hint + icono"
            icon="lucideUser"
            [startIcon]="true"
            hint="Nombre de usuario"
          />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-input label="Deshabilitado" [disabled]="true" placeholder="No editable" />
          <neu-input label="Solo lectura" [readonly]="true" [(ngModel)]="readonlyVal" />
          <neu-input label="Requerido" [required]="true" />
          <neu-input
            label="Sin floating label"
            [floatingLabel]="false"
            placeholder="Placeholder estático"
          />
          <neu-input label="Maxlength 10" [maxlength]="10" hint="Máx. 10 caracteres" />
        </div>
      </section>
    </div>
  `,
})
export class InputSandboxComponent {
  readonly name = signal('');
  readonly email = signal('');
  readonly pass = signal('');
  readonly readonlyVal = signal('Valor de solo lectura');
}
