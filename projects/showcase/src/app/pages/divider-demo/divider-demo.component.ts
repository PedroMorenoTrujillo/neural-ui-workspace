import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

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
