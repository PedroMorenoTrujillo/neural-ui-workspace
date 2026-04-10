import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NeuTextareaComponent } from '@neural-ui/core';

@Component({
  selector: 'app-textarea-sandbox',
  imports: [NeuTextareaComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Textarea</h1>
        <p class="sb-page__desc">NeuTextareaComponent — redimensionable, autoResize, validación.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <div class="sb-field">
            <neu-textarea label="Descripción" [(ngModel)]="text" />
            <span class="sb-value">chars: {{ text().length }}</span>
          </div>
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-textarea label="Con hint" hint="Máx. 500 caracteres" [rows]="3" />
          <neu-textarea label="Auto resize" [autoResize]="true" hint="Se expande al escribir" />
          <neu-textarea label="No resizable" [resizable]="false" [rows]="4" />
          <neu-textarea label="5 filas" [rows]="5" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-textarea label="Con error" errorMessage="El campo es requerido" />
          <neu-textarea label="Deshabilitado" [disabled]="true" />
          <neu-textarea label="Solo lectura" [readonly]="true" [(ngModel)]="readonlyText" />
          <neu-textarea label="Maxlength 100" [maxlength]="100" hint="Máx. 100 caracteres" />
        </div>
      </section>
    </div>
  `,
})
export class TextareaSandboxComponent {
  readonly text = signal('');
  readonly readonlyText = signal('Contenido de solo lectura. No se puede editar.');
}
