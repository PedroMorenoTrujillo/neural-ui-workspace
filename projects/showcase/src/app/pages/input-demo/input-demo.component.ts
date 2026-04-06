import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuInputComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

@Component({
  selector: 'app-input-demo',
  imports: [
    TranslocoPipe,
    NeuInputComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    CodeBlockComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './input-demo.component.html',
  styleUrl: './input-demo.component.scss',
})
export class InputDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  // Valores reactivos de ejemplo
  nameVal = '';
  surnameVal = '';
  emailVal = '';
  phoneVal = '';

  // Configurador live
  cfg: {
    label: string;
    type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    hint: string;
    error: string;
    disabled: boolean;
    required: boolean;
    readonly: boolean;
    floatingLabel: boolean;
    placeholder: string;
  } = {
    label: 'Nombre',
    type: 'text',
    hint: '',
    error: '',
    disabled: false,
    required: false,
    readonly: false,
    floatingLabel: true,
    placeholder: '',
  };

  readonly apiCode = `import { NeuInputComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuInputComponent, FormsModule],
  template: \`
    <!-- Standalone con ngModel -->
    <neu-input label="Email" type="email" [(ngModel)]="email" />

    <!-- Con Reactive Forms -->
    <neu-input label="Password" type="password" [formControl]="passwordCtrl"
               [errorMessage]="passwordCtrl.hasError('required') ? 'Obligatorio' : ''" />

    <!-- Con atributos nativos -->
    <neu-input label="URL" type="url" [required]="true" [maxlength]="200"
               hint="Incluye https://" />
  \`
})
export class MyFormComponent {
  email = '';
  passwordCtrl = new FormControl('', Validators.required);
}`;

  get configCode(): string {
    const lines: string[] = [`<neu-input`];
    lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.type !== 'text') lines.push(`  type="${this.cfg.type}"`);
    if (!this.cfg.floatingLabel) lines.push(`  [floatingLabel]="false"`);
    if (!this.cfg.floatingLabel && this.cfg.placeholder)
      lines.push(`  placeholder="${this.cfg.placeholder}"`);
    if (this.cfg.hint) lines.push(`  hint="${this.cfg.hint}"`);
    if (this.cfg.error) lines.push(`  errorMessage="${this.cfg.error}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    if (this.cfg.required) lines.push(`  [required]="true"`);
    if (this.cfg.readonly) lines.push(`  [readonly]="true"`);
    lines.push(`/>`);
    return lines.join('\n');
  }
}
