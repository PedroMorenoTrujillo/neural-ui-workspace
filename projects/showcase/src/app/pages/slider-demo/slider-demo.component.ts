import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuSliderComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-slider-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuSliderComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider-demo.component.html',
  styleUrl: './slider-demo.component.scss',
})
export class SliderDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  readonly volume = signal(70);
  readonly brightness = signal(50);

  cfg: {
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    showValue: boolean;
    showTicks: boolean;
    unit: string;
    disabled: boolean;
  } = {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    label: 'Volumen',
    showValue: true,
    showTicks: false,
    unit: '%',
    disabled: false,
  };

  get configCode(): string {
    const attrs: string[] = [`[value]="${this.cfg.value}"`];
    if (this.cfg.min !== 0) attrs.push(`[min]="${this.cfg.min}"`);
    if (this.cfg.max !== 100) attrs.push(`[max]="${this.cfg.max}"`);
    if (this.cfg.step !== 1) attrs.push(`[step]="${this.cfg.step}"`);
    if (this.cfg.label) attrs.push(`label="${this.cfg.label}"`);
    if (!this.cfg.showValue) attrs.push(`[showValue]="false"`);
    if (this.cfg.showTicks) attrs.push(`[showTicks]="true"`);
    if (this.cfg.unit) attrs.push(`unit="${this.cfg.unit}"`);
    if (this.cfg.disabled) attrs.push(`[disabled]="true"`);
    attrs.push(`(valueChange)="value = $event"`);
    return `<neu-slider\n  ${attrs.join('\n  ')}\n/>`;
  }

  readonly usageCode = `import { NeuSliderComponent } from '@neural-ui/core';
import { signal } from '@angular/core';

@Component({
  imports: [NeuSliderComponent],
  template: \`
    <neu-slider
      [value]="volume()"
      [min]="0" [max]="100" [step]="5"
      label="Volumen" unit="%"
      [showValue]="true"
      (valueChange)="volume.set($event)"
    />
  \`
})
export class MyComponent {
  volume = signal(70);
}`;
}
