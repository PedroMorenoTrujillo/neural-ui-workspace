import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuBreadcrumbComponent,
  NeuBreadcrumbItem,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-breadcrumb-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuBreadcrumbComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './breadcrumb-demo.component.html',
  styleUrl: './breadcrumb-demo.component.scss',
})
export class BreadcrumbDemoComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

  readonly simpleItems: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Componentes', route: '/components' },
    { label: 'Breadcrumb' },
  ];

  readonly deepItems: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Productos', route: '/products' },
    { label: 'Electrónica', route: '/products/electronics' },
    { label: 'Portátiles', route: '/products/electronics/laptops' },
    { label: 'MacBook Pro 16"' },
  ];

  cfg: {
    separator: string;
    items: NeuBreadcrumbItem[];
  } = {
    separator: '/',
    items: this.simpleItems,
  };

  get configCode(): string {
    const items = this.cfg.items
      .map((i) => `  { label: '${i.label}'${i.route ? `, route: '${i.route}'` : ''} }`)
      .join(',\n');
    const sep = this.cfg.separator !== '/' ? ` separator="${this.cfg.separator}"` : '';
    return `<neu-breadcrumb${sep} [items]="items" />

// items:
[\n${items}\n]`;
  }

  readonly usageCode = `import { NeuBreadcrumbComponent, NeuBreadcrumbItem } from '@neural-ui/core';

@Component({
  imports: [NeuBreadcrumbComponent],
  template: \`<neu-breadcrumb [items]="crumbs" />\`
})
export class MyComponent {
  crumbs: NeuBreadcrumbItem[] = [
    { label: 'Inicio', route: '/' },
    { label: 'Productos', route: '/products' },
    { label: 'Portátiles' },  // último sin route = página actual
  ];
}`;
}
