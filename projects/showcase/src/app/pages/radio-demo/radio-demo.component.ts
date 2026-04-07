import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuRadioComponent,
  NeuRadioGroupComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-radio-demo',
  imports: [
    TranslocoPipe,
    NeuRadioGroupComponent,
    NeuRadioComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-demo.component.html',
  styleUrl: './radio-demo.component.scss',
})
export class RadioDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  theme = 'system';
  size = 'md';

  cfg = { disabled: false };
  cfgTheme = 'light';

  get configCode(): string {
    const lines: string[] = [`<neu-radio-group [(ngModel)]="theme">`];
    if (this.cfg.disabled) {
      lines.push(`  <neu-radio value="light" label="Claro" [disabled]="true" />`);
      lines.push(`  <neu-radio value="dark" label="Oscuro" [disabled]="true" />`);
      lines.push(`  <neu-radio value="system" label="Sistema" [disabled]="true" />`);
    } else {
      lines.push(`  <neu-radio value="light" label="Claro" />`);
      lines.push(`  <neu-radio value="dark" label="Oscuro" />`);
      lines.push(`  <neu-radio value="system" label="Sistema" />`);
    }
    lines.push(`</neu-radio-group>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuRadioGroupComponent, NeuRadioComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuRadioGroupComponent, NeuRadioComponent, FormsModule],
  template: \`
    <neu-radio-group [(ngModel)]="theme">
      <neu-radio value="light" label="Claro" />
      <neu-radio value="dark" label="Oscuro" />
      <neu-radio value="system" label="Sistema" />
    </neu-radio-group>

    <!-- Reactive Forms -->
    <neu-radio-group [formControl]="themeCtrl">
      <neu-radio value="light" label="Claro" />
      <neu-radio value="dark" label="Oscuro" />
    </neu-radio-group>
  \`
})
export class MyComponent { theme = 'system'; }`;
}
