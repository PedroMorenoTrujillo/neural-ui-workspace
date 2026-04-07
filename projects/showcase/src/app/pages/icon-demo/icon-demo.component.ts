import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuIconComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-icon-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuIconComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-demo.component.html',
  styleUrl: './icon-demo.component.scss',
})
export class IconDemoComponent {
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
    name: string;
    size: string;
    strokeWidth: string;
  } = {
    name: 'lucideSearch',
    size: '2rem',
    strokeWidth: '2',
  };

  get configCode(): string {
    const attrs: string[] = [`name="${this.cfg.name}"`];
    if (this.cfg.size) attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.strokeWidth !== '2') attrs.push(`strokeWidth="${this.cfg.strokeWidth}"`);
    return `<neu-icon ${attrs.join(' ')} />`;
  }

  readonly iconOptions = [
    'lucideSearch',
    'lucideUser',
    'lucideSettings',
    'lucideHome',
    'lucideBell',
    'lucideStar',
    'lucideCheck',
    'lucideX',
    'lucidePlus',
    'lucideTrash2',
    'lucideInfo',
    'lucideAlertTriangle',
    'lucideMail',
    'lucideDownload',
    'lucideArrowRight',
    'lucideSend',
    'lucideMenu',
    'lucideEye',
    'lucideCalendar',
  ];

  readonly usageCode = `import { NeuIconComponent } from '@neural-ui/core';
import { provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideUser } from '@ng-icons/lucide';

@Component({
  imports: [NeuIconComponent],
  providers: [provideIcons({ lucideSearch, lucideUser })],
  template: \`
    <neu-icon name="lucideSearch" />
    <neu-icon name="lucideUser" size="2rem" />
    <neu-icon name="lucideSearch" strokeWidth="1.5" />
  \`
})
export class MyComponent {}`;
}
