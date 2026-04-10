import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuTooltipDirective, NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-tooltip-sandbox',
  imports: [NeuTooltipDirective, NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Tooltip</h1>
        <p class="sb-page__desc">
          NeuTooltipDirective — <code>[neuTooltip]</code>, posición, deshabilitado.
        </p>
      </div>

      <!-- Posiciones -->
      <section class="sb-section">
        <h2 class="sb-section__title">Posiciones</h2>
        <div class="sb-demo" style="justify-content: center; padding: 32px">
          <button
            neu-button
            variant="outline"
            [neuTooltip]="'Tooltip arriba (top)'"
            neuTooltipPosition="top"
          >
            Top
          </button>
          <button
            neu-button
            variant="outline"
            [neuTooltip]="'Tooltip abajo (bottom)'"
            neuTooltipPosition="bottom"
          >
            Bottom
          </button>
          <button
            neu-button
            variant="outline"
            [neuTooltip]="'Tooltip izquierda (left)'"
            neuTooltipPosition="left"
          >
            Left
          </button>
          <button
            neu-button
            variant="outline"
            [neuTooltip]="'Tooltip derecha (right)'"
            neuTooltipPosition="right"
          >
            Right
          </button>
        </div>
      </section>

      <!-- Sobre distintos elementos -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sobre distintos elementos HTML</h2>
        <div class="sb-demo" style="align-items: center">
          <span
            [neuTooltip]="'Soy un span con tooltip'"
            style="cursor: default; padding: 4px 8px; border: 1px solid var(--neu-border); border-radius: 4px; font-size: var(--neu-text-sm)"
            >Hover aquí (span)</span
          >

          <span
            [neuTooltip]="'Icono de información'"
            neuTooltipPosition="right"
            style="cursor: help; display: inline-flex; align-items: center; gap: 4px; font-size: var(--neu-text-sm); color: var(--neu-text-muted)"
            >ℹ Más info</span
          >
        </div>
      </section>

      <!-- Deshabilitado -->
      <section class="sb-section">
        <h2 class="sb-section__title">Deshabilitado</h2>
        <div class="sb-demo">
          <button
            neu-button
            variant="ghost"
            [neuTooltip]="'Este tooltip NO aparece'"
            [neuTooltipDisabled]="true"
          >
            Tooltip deshabilitado
          </button>
          <button
            neu-button
            variant="primary"
            [neuTooltip]="'Este tooltip SÍ aparece'"
            [neuTooltipDisabled]="false"
          >
            Tooltip habilitado
          </button>
        </div>
      </section>

      <!-- Texto largo -->
      <section class="sb-section">
        <h2 class="sb-section__title">Texto largo</h2>
        <div class="sb-demo">
          <button
            neu-button
            variant="outline"
            [neuTooltip]="'Este es un tooltip con un mensaje más largo de lo habitual para comprobar el ajuste de texto y el ancho máximo del component.'"
          >
            Texto largo
          </button>
        </div>
      </section>
    </div>
  `,
})
export class TooltipSandboxComponent {}
