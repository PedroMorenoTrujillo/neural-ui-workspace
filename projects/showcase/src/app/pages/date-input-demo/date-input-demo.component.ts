import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuDateInputComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-date-input-demo',
  imports: [
    TranslocoPipe,
    NeuDateInputComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-input-demo.component.html',
  styleUrl: './date-input-demo.component.scss',
})
export class DateInputDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  previewDate = '';
  previewTime = '';
  previewDatetime = '';

  cfg: {
    label: string;
    type: 'date' | 'time' | 'datetime-local';
    hint: string;
    error: string;
    disabled: boolean;
    required: boolean;
    min: string;
    max: string;
  } = {
    label: 'Fecha de nacimiento',
    type: 'date',
    hint: '',
    error: '',
    disabled: false,
    required: false,
    min: '',
    max: '',
  };
  cfgValue = '';

  get configCode(): string {
    const lines: string[] = [`<neu-date-input`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.type !== 'date') lines.push(`  type="${this.cfg.type}"`);
    if (this.cfg.min) lines.push(`  min="${this.cfg.min}"`);
    if (this.cfg.max) lines.push(`  max="${this.cfg.max}"`);
    if (this.cfg.hint) lines.push(`  hint="${this.cfg.hint}"`);
    if (this.cfg.error) lines.push(`  errorMessage="${this.cfg.error}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    if (this.cfg.required) lines.push(`  [required]="true"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuDateInputComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuDateInputComponent, FormsModule],
  template: \`
    <!-- Fecha -->
    <neu-date-input label="Fecha de nacimiento" [(ngModel)]="date" />

    <!-- Hora -->
    <neu-date-input label="Hora de inicio" type="time" [(ngModel)]="time" />

    <!-- Fecha y hora -->
    <neu-date-input label="Evento" type="datetime-local"
                    min="2026-01-01T00:00" [(ngModel)]="dt" />

    <!-- Con Reactive Forms -->
    <neu-date-input label="Fecha límite" [formControl]="dateCtrl"
                    [errorMessage]="dateCtrl.invalid ? 'Requerido' : ''" />
  \`
})
export class MyComponent {
  date = '';
  time = '';
  dt = '';
}`;
}
