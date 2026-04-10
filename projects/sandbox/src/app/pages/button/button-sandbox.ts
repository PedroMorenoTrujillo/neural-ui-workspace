import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-button-sandbox',
  imports: [NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Button</h1>
        <p class="sb-page__desc">NeuButtonComponent — variantes, tamaños, iconos, estados.</p>
      </div>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo">
          <button neu-button variant="primary">Primary</button>
          <button neu-button variant="secondary">Secondary</button>
          <button neu-button variant="ghost">Ghost</button>
          <button neu-button variant="danger">Danger</button>
          <button neu-button variant="outline">Outline</button>
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <button neu-button variant="primary" size="sm">Small</button>
          <button neu-button variant="primary" size="md">Medium</button>
          <button neu-button variant="primary" size="lg">Large</button>
        </div>
      </section>

      <!-- Con iconos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con iconos</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" icon="lucidePlus" iconPosition="left">Nuevo</button>
          <button neu-button variant="secondary" icon="lucideDownload" iconPosition="right">
            Descargar
          </button>
          <button neu-button variant="ghost" icon="lucideArrowRight" iconPosition="right">
            Siguiente
          </button>
          <button neu-button variant="danger" icon="lucideTrash2" iconPosition="left">
            Eliminar
          </button>
          <button neu-button variant="outline" icon="lucideSend" iconPosition="left">Enviar</button>
        </div>
      </section>

      <!-- Solo icono -->
      <section class="sb-section">
        <h2 class="sb-section__title">Solo icono (iconOnly)</h2>
        <div class="sb-demo" style="align-items: center">
          <button
            neu-button
            variant="primary"
            icon="lucidePlus"
            [iconOnly]="true"
            ariaLabel="Nuevo"
            size="sm"
          ></button>
          <button
            neu-button
            variant="primary"
            icon="lucidePlus"
            [iconOnly]="true"
            ariaLabel="Nuevo"
            size="md"
          ></button>
          <button
            neu-button
            variant="primary"
            icon="lucidePlus"
            [iconOnly]="true"
            ariaLabel="Nuevo"
            size="lg"
          ></button>
          <button
            neu-button
            variant="ghost"
            icon="lucideSettings"
            [iconOnly]="true"
            ariaLabel="Ajustes"
          ></button>
          <button
            neu-button
            variant="danger"
            icon="lucideTrash2"
            [iconOnly]="true"
            ariaLabel="Eliminar"
          ></button>
          <button
            neu-button
            variant="outline"
            icon="lucideEdit"
            [iconOnly]="true"
            ariaLabel="Editar"
          ></button>
        </div>
      </section>

      <!-- Loading -->
      <section class="sb-section">
        <h2 class="sb-section__title">Estado loading</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" [loading]="isLoading()" (neuClick)="triggerLoad()">
            {{ isLoading() ? 'Guardando...' : 'Guardar' }}
          </button>
          <button neu-button variant="secondary" [loading]="true">Cargando</button>
          <button neu-button variant="ghost" [loading]="true" icon="lucideDownload">
            Descargando
          </button>
        </div>
      </section>

      <!-- Disabled -->
      <section class="sb-section">
        <h2 class="sb-section__title">Estado disabled</h2>
        <div class="sb-demo">
          <button neu-button variant="primary" [disabled]="true">Disabled primary</button>
          <button neu-button variant="secondary" [disabled]="true">Disabled secondary</button>
          <button neu-button variant="ghost" [disabled]="true">Disabled ghost</button>
          <button neu-button variant="danger" [disabled]="true">Disabled danger</button>
          <button neu-button variant="outline" [disabled]="true">Disabled outline</button>
        </div>
      </section>

      <!-- Full width -->
      <section class="sb-section">
        <h2 class="sb-section__title">Full width</h2>
        <div class="sb-demo--column sb-demo">
          <button neu-button variant="primary" [fullWidth]="true">Botón full width</button>
          <button neu-button variant="secondary" [fullWidth]="true" icon="lucideDownload">
            Descargar full width
          </button>
        </div>
      </section>

      <!-- Conteo de clicks -->
      <section class="sb-section">
        <h2 class="sb-section__title">Output (neuClick)</h2>
        <div class="sb-demo" style="align-items: center">
          <button neu-button variant="primary" (neuClick)="count.update(c => c + 1)">
            Click me
          </button>
          <span class="sb-value">clicks: {{ count() }}</span>
        </div>
      </section>
    </div>
  `,
})
export class ButtonSandboxComponent {
  readonly count = signal(0);
  readonly isLoading = signal(false);

  triggerLoad(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }
}
