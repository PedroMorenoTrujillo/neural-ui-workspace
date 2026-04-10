import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuSliderComponent } from '@neural-ui/core';

@Component({
  selector: 'app-slider-sandbox',
  imports: [NeuSliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Slider</h1>
        <p class="sb-page__desc">NeuSliderComponent — range, ticks, unidades, disabled.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-slider
            label="Volumen"
            [value]="volume()"
            [min]="0"
            [max]="100"
            unit="%"
            (valueChange)="volume.set($event)"
          />
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--column sb-demo">
          <neu-slider
            label="Temperatura"
            [value]="temp()"
            [min]="15"
            [max]="30"
            [step]="0.5"
            unit="°C"
            (valueChange)="temp.set($event)"
          />
          <neu-slider
            label="Con ticks"
            [value]="tickVal()"
            [min]="0"
            [max]="5"
            [step]="1"
            [showTicks]="true"
            (valueChange)="tickVal.set($event)"
          />
          <neu-slider
            label="Sin etiqueta de valor"
            [value]="noLabel()"
            [showValue]="false"
            (valueChange)="noLabel.set($event)"
          />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <neu-slider label="Deshabilitado" [value]="50" [disabled]="true" />
          <neu-slider label="Valor mínimo (0)" [value]="0" [min]="0" [max]="100" />
          <neu-slider label="Valor máximo (100)" [value]="100" [min]="0" [max]="100" />
          <neu-slider
            label="Step 10"
            [value]="stepVal()"
            [min]="0"
            [max]="100"
            [step]="10"
            (valueChange)="stepVal.set($event)"
          />
        </div>
      </section>
    </div>
  `,
})
export class SliderSandboxComponent {
  readonly volume = signal(70);
  readonly temp = signal(22);
  readonly tickVal = signal(3);
  readonly noLabel = signal(40);
  readonly stepVal = signal(50);
}
