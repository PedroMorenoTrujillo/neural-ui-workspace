import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
