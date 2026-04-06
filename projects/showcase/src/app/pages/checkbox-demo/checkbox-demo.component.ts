import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
