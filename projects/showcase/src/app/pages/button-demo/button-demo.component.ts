import { TranslocoPipe } from '@jsverse/transloco';
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
  imports: [
    TranslocoPipe,
    NeuButtonComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
  ],
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
    icon: string;
    iconPosition: 'left' | 'right';
    iconOnly: boolean;
  } = {
    variant: 'primary',
    size: 'md',
    disabled: false,
    label: 'Confirmar',
    icon: '',
    iconPosition: 'left',
    iconOnly: false,
  };

  simulateLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2500);
  }

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.variant !== 'primary') attrs.push(` variant="${this.cfg.variant}"`);
    if (this.cfg.size !== 'md') attrs.push(` size="${this.cfg.size}"`);
    if (this.cfg.disabled) attrs.push(` [disabled]="true"`);
    if (this.cfg.icon) attrs.push(` icon="${this.cfg.icon}"`);
    if (this.cfg.icon && this.cfg.iconPosition !== 'left')
      attrs.push(` iconPosition="${this.cfg.iconPosition}"`);
    if (this.cfg.iconOnly) attrs.push(` [iconOnly]="true"`);
    const attrsStr = attrs.join('');
    const content = this.cfg.iconOnly ? '' : this.cfg.label;
    return `<button neu-button${attrsStr}>${content}</button>`;
  }

  readonly usageCode = `import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  imports: [NeuButtonComponent],
  template: \`
    <!-- Solo texto -->
    <button neu-button>Default</button>
    <button neu-button variant="primary">Primary</button>

    <!-- Icono a la izquierda (por defecto) -->
    <button neu-button icon="lucidePlus">Nuevo</button>

    <!-- Icono a la derecha -->
    <button neu-button icon="lucideArrowRight" iconPosition="right">Siguiente</button>

    <!-- Solo icono (cuadrado) -->
    <button neu-button variant="ghost" icon="lucideTrash2" [iconOnly]="true" />

    <!-- Loading -->
    <button neu-button [loading]="isLoading()" (click)="save()">Guardar</button>
  \`
})
export class MyComponent {
  isLoading = signal(false);
  save() { /* ... */ }
}\``;
}
