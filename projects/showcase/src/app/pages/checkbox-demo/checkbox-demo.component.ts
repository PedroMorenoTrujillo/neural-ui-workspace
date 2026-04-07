import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCheckboxComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-checkbox-demo',
  imports: [
    TranslocoPipe,
    NeuCheckboxComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox-demo.component.html',
  styleUrl: './checkbox-demo.component.scss',
})
export class CheckboxDemoComponent {
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

  terms = false;
  privacy = true;

  cfg = { label: 'Acepto los términos y condiciones', disabled: false };
  cfgVal = false;

  get configCode(): string {
    const lines: string[] = [`<neu-checkbox`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    lines.push(`  [(ngModel)]="accepted"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuCheckboxComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuCheckboxComponent, FormsModule],
  template: \`
    <neu-checkbox label="Acepto los términos" [(ngModel)]="terms" />
    <neu-checkbox label="Opción deshabilitada" [disabled]="true" />

    <!-- Reactive Forms -->
    <neu-checkbox label="Newsletter" [formControl]="newsletterCtrl" />
  \`
})
export class MyComponent { terms = false; }`;
}
