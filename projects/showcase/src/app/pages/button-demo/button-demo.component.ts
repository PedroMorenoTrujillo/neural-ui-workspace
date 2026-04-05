import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [NeuButtonComponent, NeuBadgeComponent, NeuTabsComponent, NeuTabPanelComponent, NeuCodeBlockComponent],
  templateUrl: './button-demo.component.html',
  styleUrl: './button-demo.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  readonly isLoading = signal(false);

  cfg: {
    variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    label: string;
  } = {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Confirmar',
  };

  simulateLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2500);
  }

  readonly usageCode = `import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  imports: [NeuButtonComponent],
  template: \`
    <button neu-button>Default</button>
    <button neu-button variant="primary">Primary</button>
    <button neu-button variant="ghost" size="sm">Ghost sm</button>
    <button neu-button [loading]="isLoading()" (click)="save()">
      Guardar
    </button>
  \`
})
export class MyComponent {
  isLoading = signal(false);
  save() { /* ... */ }
}\``;
}
