import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuAccordionComponent,
  NeuAccordionItem,
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-accordion-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuAccordionComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accordion-demo.component.html',
  styleUrl: './accordion-demo.component.scss',
})
export class AccordionDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly faqItems: NeuAccordionItem[] = [
    {
      id: 'faq-1',
      title: '¿Qué es NeuralUI?',
      content:
        'NeuralUI es una librería de componentes Angular construida con Signals, OnPush y estado sincronizado en la URL. Sin dependencias externas.',
      expanded: true,
    },
    {
      id: 'faq-2',
      title: '¿Requiere Zone.js?',
      content:
        'No. NeuralUI está optimizada para funcionar con <code>provideExperimentalZonelessChangeDetection()</code> o con Zone.js estándar.',
    },
    {
      id: 'faq-3',
      title: '¿Es accesible?',
      content:
        'Sí. Todos los paneles implementan los roles ARIA requeridos: <code>aria-expanded</code>, <code>aria-controls</code> y <code>role="region"</code>.',
    },
    {
      id: 'faq-4',
      title: '¿Puedo desactivar un panel?',
      content:
        'Sí, añade <code>disabled: true</code> al objeto <code>NeuAccordionItem</code>. El panel no responderá a clics ni al teclado.',
      disabled: true,
    },
  ];

  cfg: {
    multiple: boolean;
    bordered: boolean;
  } = {
    multiple: false,
    bordered: true,
  };

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.multiple) attrs.push(`[multiple]="true"`);
    if (!this.cfg.bordered) attrs.push(`[bordered]="false"`);
    const attrsStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `<neu-accordion${attrsStr} [items]="items" />`;
  }

  readonly usageCode = `import { NeuAccordionComponent, NeuAccordionItem } from '@neural-ui/core';

@Component({
  imports: [NeuAccordionComponent],
  template: \`<neu-accordion [items]="items" [multiple]="true" />\`
})
export class MyComponent {
  items: NeuAccordionItem[] = [
    { id: '1', title: 'Sección 1', content: 'Contenido de la sección 1', expanded: true },
    { id: '2', title: 'Sección 2', content: 'Contenido de la sección 2' },
    { id: '3', title: 'Inactivo',  content: '...', disabled: true },
  ];
}`;
}
