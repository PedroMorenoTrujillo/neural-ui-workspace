import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
