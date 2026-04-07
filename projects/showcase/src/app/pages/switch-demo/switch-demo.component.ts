import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuSwitchComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-switch-demo',
  imports: [
    TranslocoPipe,
    NeuSwitchComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './switch-demo.component.html',
  styleUrl: './switch-demo.component.scss',
})
export class SwitchDemoComponent {
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

  notifications = true;
  newsletter = false;

  cfg = { label: 'Activar notificaciones', disabled: false };
  cfgVal = false;

  get configCode(): string {
    const lines: string[] = [`<neu-switch`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    lines.push(`  [(ngModel)]="active"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuSwitchComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuSwitchComponent, FormsModule],
  template: \`
    <neu-switch label="Notificaciones" [(ngModel)]="notif" />
    <neu-switch label="Modo oscuro" [disabled]="true" />

    <!-- Reactive Forms -->
    <neu-switch label="Newsletter" [formControl]="newsletterCtrl" />
  \`
})
export class MyComponent { notif = false; }`;
}
