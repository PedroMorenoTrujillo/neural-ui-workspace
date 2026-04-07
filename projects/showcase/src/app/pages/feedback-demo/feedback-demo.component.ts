import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuTooltipDirective,
} from '@neural-ui/core';

@Component({
  selector: 'app-feedback-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuButtonComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuTooltipDirective,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-demo.component.html',
  styleUrl: './feedback-demo.component.scss',
})
export class FeedbackDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());

  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly usageCode = `import { NeuTooltipDirective } from '@neural-ui/core';

@Component({
  imports: [NeuTooltipDirective],
  template: \`
    <button
      neu-button
      [neuTooltip]="'Texto del tooltip'"
      neuTooltipPosition="top"
    >
      Hover me
    </button>

    <!-- Posiciones disponibles: top | bottom | left | right -->
    <span [neuTooltip]="'Tooltip deshabilitado'" [neuTooltipDisabled]="true">
      Sin tooltip
    </span>
  \`
})
export class MyComponent {}`;
}
