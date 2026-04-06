import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuDividerComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-divider-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuDividerComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divider-demo.component.html',
  styleUrl: './divider-demo.component.scss',
})
export class DividerDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  cfg: {
    label: string;
    orientation: 'horizontal' | 'vertical';
  } = {
    label: '',
    orientation: 'horizontal',
  };

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.label) attrs.push(`label="${this.cfg.label}"`);
    if (this.cfg.orientation === 'vertical') attrs.push(`orientation="vertical"`);
    return `<neu-divider${attrs.length ? ' ' + attrs.join(' ') : ''} />`;
  }

  readonly usageCode = `import { NeuDividerComponent } from '@neural-ui/core';

@Component({
  imports: [NeuDividerComponent],
  template: \`
    <!-- Separador simple -->
    <neu-divider />

    <!-- Con etiqueta centrada -->
    <neu-divider label="O continúa con" />

    <!-- Vertical (necesita un contenedor con altura) -->
    <div style="display: flex; height: 40px; align-items: center; gap: 16px;">
      <span>Opción A</span>
      <neu-divider orientation="vertical" />
      <span>Opción B</span>
    </div>
  \`
})
export class MyComponent {}`;
}
