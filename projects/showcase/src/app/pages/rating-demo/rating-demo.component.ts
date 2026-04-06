import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuRatingComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-rating-demo',
  imports: [
    NeuBadgeComponent,
    NeuRatingComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-demo.component.html',
  styleUrl: './rating-demo.component.scss',
})
export class RatingDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  readonly rating = signal(3);

  cfg: {
    value: number;
    stars: number;
    readonly: boolean;
  } = {
    value: 3,
    stars: 5,
    readonly: false,
  };

  get configCode(): string {
    const attrs: string[] = [`[value]="${this.cfg.value}"`];
    if (this.cfg.stars !== 5) attrs.push(`[stars]="${this.cfg.stars}"`);
    if (this.cfg.readonly) attrs.push(`[readonly]="true"`);
    else attrs.push(`(valueChange)="value = $event"`);
    return `<neu-rating ${attrs.join(' ')} />`;
  }

  readonly usageCode = `import { NeuRatingComponent } from '@neural-ui/core';
import { signal } from '@angular/core';

@Component({
  imports: [NeuRatingComponent],
  template: \`
    <!-- Interactivo -->
    <neu-rating [value]="rating()" (valueChange)="rating.set($event)" />

    <!-- Solo lectura con media estrella -->
    <neu-rating [value]="4.5" [readonly]="true" />
  \`
})
export class MyComponent {
  rating = signal(4);
}`;
}
