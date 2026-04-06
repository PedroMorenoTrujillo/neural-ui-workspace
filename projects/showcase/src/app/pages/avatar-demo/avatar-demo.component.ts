import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuAvatarColor,
  NeuAvatarComponent,
  NeuAvatarShape,
  NeuAvatarSize,
  NeuAvatarStatus,
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-avatar-demo',
  imports: [
    NeuAvatarComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar-demo.component.html',
  styleUrl: './avatar-demo.component.scss',
})
export class AvatarDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  cfg: {
    name: string;
    src: string;
    size: NeuAvatarSize;
    shape: NeuAvatarShape;
    color: NeuAvatarColor;
    status: NeuAvatarStatus;
  } = {
    name: 'Pedro Moreno',
    src: '',
    size: 'md',
    shape: 'circle',
    color: 'blue',
    status: '',
  };

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.src) {
      attrs.push(`src="${this.cfg.src}"`);
    } else {
      attrs.push(`name="${this.cfg.name}"`);
      if (this.cfg.color !== 'blue') attrs.push(`color="${this.cfg.color}"`);
    }
    if (this.cfg.size !== 'md') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.shape !== 'circle') attrs.push(`shape="${this.cfg.shape}"`);
    if (this.cfg.status) attrs.push(`status="${this.cfg.status}"`);
    return `<neu-avatar ${attrs.join(' ')} />`;
  }

  readonly usageCode = `import { NeuAvatarComponent } from '@neural-ui/core';

@Component({
  imports: [NeuAvatarComponent],
  template: \`
    <!-- Iniciales -->
    <neu-avatar name="Pedro Moreno" color="blue" size="lg" />

    <!-- Con imagen -->
    <neu-avatar src="/avatar.jpg" alt="Pedro" size="lg" status="online" />

    <!-- Cuadrado -->
    <neu-avatar name="NeuralUI" shape="square" color="violet" />
  \`
})
export class MyComponent {}`;
}
