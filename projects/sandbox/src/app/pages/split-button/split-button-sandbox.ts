import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuSplitButtonComponent } from '@neural-ui/core';
import type { NeuSplitButtonAction } from '@neural-ui/core';

@Component({
  selector: 'app-split-button-sandbox',
  imports: [NeuSplitButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Split Button</h1>
        <p class="sb-page__desc">
          NeuSplitButtonComponent — acción principal + dropdown de acciones.
        </p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo">
          <neu-split-button
            label="Guardar"
            [actions]="saveActions"
            (primaryClick)="lastAction.set('primaryClick: Guardar')"
            (actionClick)="lastAction.set('actionClick: ' + $event.label)"
          />
          <span class="sb-value">{{ lastAction() }}</span>
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo">
          <neu-split-button label="Primary" variant="primary" [actions]="saveActions" />
          <neu-split-button label="Secondary" variant="secondary" [actions]="saveActions" />
          <neu-split-button label="Ghost" variant="ghost" [actions]="saveActions" />
          <neu-split-button label="Danger" variant="danger" [actions]="deleteActions" />
          <neu-split-button label="Outline" variant="outline" [actions]="saveActions" />
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-split-button label="Small" size="sm" [actions]="saveActions" />
          <neu-split-button label="Medium" size="md" [actions]="saveActions" />
          <neu-split-button label="Large" size="lg" [actions]="saveActions" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo">
          <neu-split-button label="Loading" [loading]="true" [actions]="saveActions" />
          <neu-split-button label="Disabled" [disabled]="true" [actions]="saveActions" />
          <neu-split-button label="Una acción" [actions]="[saveActions[0]]" />
          <neu-split-button label="Sin acciones" [actions]="[]" />
        </div>
      </section>
    </div>
  `,
})
export class SplitButtonSandboxComponent {
  readonly lastAction = signal('—');

  readonly saveActions: NeuSplitButtonAction[] = [
    { id: 'save-draft', label: 'Guardar borrador' },
    { id: 'save-publish', label: 'Guardar y publicar' },
    { id: 'save-copy', label: 'Guardar copia' },
  ];

  readonly deleteActions: NeuSplitButtonAction[] = [
    { id: 'delete-soft', label: 'Mover a papelera' },
    { id: 'delete-hard', label: 'Eliminar permanentemente' },
  ];
}
