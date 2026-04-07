import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuTextareaComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-textarea-demo',
  imports: [
    TranslocoPipe,
    NeuTextareaComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './textarea-demo.component.html',
  styleUrl: './textarea-demo.component.scss',
})
export class TextareaDemoComponent {
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

  previewVal = '';
  autoVal = '';

  cfg = {
    label: 'Descripción',
    rows: 4,
    hint: '',
    error: '',
    disabled: false,
    required: false,
    autoResize: false,
    readonly: false,
  };
  cfgVal = '';

  get configCode(): string {
    const lines: string[] = [`<neu-textarea`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.rows !== 4) lines.push(`  [rows]="${this.cfg.rows}"`);
    if (this.cfg.autoResize) lines.push(`  [autoResize]="true"`);
    if (this.cfg.hint) lines.push(`  hint="${this.cfg.hint}"`);
    if (this.cfg.error) lines.push(`  errorMessage="${this.cfg.error}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    if (this.cfg.required) lines.push(`  [required]="true"`);
    if (this.cfg.readonly) lines.push(`  [readonly]="true"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuTextareaComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuTextareaComponent, FormsModule],
  template: \`
    <neu-textarea label="Descripción" [(ngModel)]="bio" [rows]="4" />
    <neu-textarea label="Notas" [autoResize]="true" [maxlength]="300" />
    <neu-textarea label="Campo requerido" [required]="true"
                  errorMessage="Este campo es obligatorio" />
  \`
})
export class MyComponent { bio = ''; }`;
}
