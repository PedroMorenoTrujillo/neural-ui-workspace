import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuCodeBlockComponent } from '@neural-ui/core';

@Component({
  selector: 'app-code-block-sandbox',
  imports: [NeuCodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Code Block</h1>
        <p class="sb-page__desc">NeuCodeBlockComponent — code, lang, copy labels.</p>
      </div>

      <!-- TypeScript -->
      <section class="sb-section">
        <h2 class="sb-section__title">TypeScript</h2>
        <div class="sb-demo--column sb-demo">
          <neu-code-block [code]="tsSnippet" lang="TypeScript" />
        </div>
      </section>

      <!-- HTML -->
      <section class="sb-section">
        <h2 class="sb-section__title">HTML</h2>
        <div class="sb-demo--column sb-demo">
          <neu-code-block [code]="htmlSnippet" lang="HTML" />
        </div>
      </section>

      <!-- SCSS -->
      <section class="sb-section">
        <h2 class="sb-section__title">SCSS</h2>
        <div class="sb-demo--column sb-demo">
          <neu-code-block [code]="scssSnippet" lang="SCSS" />
        </div>
      </section>

      <!-- JSON -->
      <section class="sb-section">
        <h2 class="sb-section__title">JSON</h2>
        <div class="sb-demo--column sb-demo">
          <neu-code-block [code]="jsonSnippet" lang="JSON" />
        </div>
      </section>

      <!-- Labels personalizados -->
      <section class="sb-section">
        <h2 class="sb-section__title">Labels de copia personalizados</h2>
        <div class="sb-demo--column sb-demo">
          <neu-code-block
            [code]="tsSnippet"
            lang="TypeScript"
            copyLabel="Copiar código"
            copiedLabel="¡Copiado!"
            copyAriaLabel="Copiar este fragmento de código"
            copiedAriaLabel="Fragmento copiado al portapapeles"
          />
        </div>
      </section>

      <!-- Código vacío -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <span class="sb-label" style="margin-bottom: 8px">Código vacío</span>
          <neu-code-block code="" lang="TypeScript" />

          <span class="sb-label" style="margin-top: 1rem; margin-bottom: 8px">Una sola línea</span>
          <neu-code-block code="const greeting = 'Hello, NeuralUI!';" lang="TypeScript" />
        </div>
      </section>
    </div>
  `,
})
export class CodeBlockSandboxComponent {
  readonly tsSnippet = `import { Component, signal } from '@angular/core';
import { NeuButtonComponent, NeuToastService } from '@neural-ui/core';

@Component({
  selector: 'app-demo',
  imports: [NeuButtonComponent],
  template: \`
    <neu-button variant="primary" (neuClick)="save()">
      Guardar
    </neu-button>
  \`,
})
export class DemoComponent {
  private readonly toast = inject(NeuToastService);
  protected readonly count = signal(0);

  save(): void {
    this.count.update(c => c + 1);
    this.toast.success('Guardado correctamente');
  }
}`;

  readonly htmlSnippet = `<neu-button
  variant="primary"
  size="md"
  leadingIcon="lucidePlus"
  [loading]="isSaving()"
  [disabled]="!form.valid"
  (neuClick)="onSubmit()"
>
  Guardar cambios
</neu-button>`;

  readonly scssSnippet = `@use '@neural-ui/core/styles' as *;

.my-card {
  padding: var(--neu-space-4);
  border-radius: var(--neu-radius-md);
  border: 1px solid var(--neu-border);
  background: var(--neu-surface);
  box-shadow: var(--neu-shadow-sm);

  &:hover {
    box-shadow: var(--neu-shadow-md);
  }

  &__title {
    font-size: var(--neu-text-lg);
    font-weight: 600;
    color: var(--neu-text);
  }
}`;

  readonly jsonSnippet = `{
  "name": "@neural-ui/core",
  "version": "1.2.0",
  "peerDependencies": {
    "@angular/core": ">=21.0.0",
    "@ng-icons/core": ">=31.0.0",
    "@ng-icons/lucide": ">=31.0.0"
  },
  "exports": {
    ".": {
      "default": "./index.js"
    },
    "./styles": {
      "default": "./styles/index.css"
    }
  }
}`;
}
