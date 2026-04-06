import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
  NeuToggleButtonGroupComponent,
  NeuToggleOption,
} from '@neural-ui/core';

@Component({
  selector: 'app-toggle-button-demo',
  imports: [
    NeuToggleButtonGroupComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle-button-demo.component.html',
  styleUrl: './toggle-button-demo.component.scss',
})
export class ToggleButtonDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  // ---- Preview ----
  alignment = 'left';
  views: string[] = ['grid'];
  priority: string | null = null;
  days: string[] = ['mon', 'wed', 'fri'];

  readonly alignOpts: NeuToggleOption[] = [
    { label: 'Izquierda', value: 'left', icon: 'lucideAlignLeft' },
    { label: 'Centro', value: 'center', icon: 'lucideAlignCenter' },
    { label: 'Derecha', value: 'right', icon: 'lucideAlignRight' },
  ];

  readonly viewOpts: NeuToggleOption[] = [
    { label: 'Lista', value: 'list', icon: 'lucideList' },
    { label: 'Cuadrícula', value: 'grid', icon: 'lucideLayoutGrid' },
    { label: 'Tabla', value: 'table', icon: 'lucideTable2' },
  ];

  readonly priorityOpts: NeuToggleOption[] = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
  ];

  readonly dayOpts: NeuToggleOption[] = [
    { label: 'L', value: 'mon' },
    { label: 'M', value: 'tue' },
    { label: 'X', value: 'wed' },
    { label: 'J', value: 'thu' },
    { label: 'V', value: 'fri' },
    { label: 'S', value: 'sat' },
    { label: 'D', value: 'sun' },
  ];

  // ---- Configurador ----
  cfg = {
    multiple: false,
    size: 'md' as 'sm' | 'md' | 'lg',
    disabled: false,
  };

  cfgValue: string | string[] | null = 'b';

  readonly cfgOpts: NeuToggleOption[] = [
    { label: 'Opción A', value: 'a' },
    { label: 'Opción B', value: 'b' },
    { label: 'Opción C', value: 'c' },
  ];

  get configCode(): string {
    const lines: string[] = [`<neu-toggle-button-group`];
    lines.push(`  [options]="options"`);
    if (this.cfg.multiple) lines.push(`  [multiple]="true"`);
    if (this.cfg.size !== 'md') lines.push(`  size="${this.cfg.size}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    lines.push(`  [(ngModel)]="value"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuToggleButtonGroupComponent, NeuToggleOption } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [NeuToggleButtonGroupComponent, FormsModule],
  template: \`
    <!-- Selección única -->
    <neu-toggle-button-group [options]="alignOpts" [(ngModel)]="alignment" />

    <!-- Selección múltiple -->
    <neu-toggle-button-group
      [options]="viewOpts"
      [multiple]="true"
      [(ngModel)]="selectedViews"
    />

    <!-- Con iconos -->
    <neu-toggle-button-group
      [options]="alignOpts"
      size="sm"
      [(ngModel)]="alignment"
    />

    <!-- Reactive Forms -->
    <neu-toggle-button-group [options]="opts" [formControl]="ctrl" />
  \`
})
export class MyComponent {
  alignment = 'left';
  selectedViews = ['grid'];

  alignOpts: NeuToggleOption[] = [
    { label: 'Izquierda', value: 'left', icon: 'lucideAlignLeft' },
    { label: 'Centro',    value: 'center', icon: 'lucideAlignCenter' },
    { label: 'Derecha',   value: 'right', icon: 'lucideAlignRight' },
  ];
}`;

  onCfgMultipleChange(checked: boolean): void {
    this.cfg.multiple = checked;
    this.cfgValue = checked ? [] : 'b';
  }
}
