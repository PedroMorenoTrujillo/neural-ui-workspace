import { Component, afterNextRender, signal } from '@angular/core';
import {
  NeuAccordionBodyDirective,
  NeuAccordionComponent,
  NeuAccordionItem,
} from './ui-core/accordion/neu-accordion.component';

interface Item extends NeuAccordionItem<string> {
  readonly summary: string;
}

@Component({
  selector: 'n2-accordion-hydration',
  imports: [NeuAccordionComponent, NeuAccordionBodyDirective],
  template: `
    <span id="n2-accordion-ready">{{ ready() }}</span>
    <output id="n2-accordion-events">{{ events() }}</output>
    <output id="n2-accordion-body-events">{{ bodyEvents() }}</output>
    <neu-accordion
      id="n2-accordion"
      [items]="items"
      [expandedKeys]="expandedKeys()"
      (expandedKeysChange)="accept($event)"
    >
      <ng-template neuAccordionBody let-item let-expanded="expanded">
        <button class="hydrated-body" type="button" (click)="bodyEvents.update(increment)">
          {{ item.title }} body {{ expanded }}
        </button>
      </ng-template>
    </neu-accordion>
    <neu-accordion id="n2-accordion-outer" [items]="outerItems" [initialExpandedKeys]="outerExpandedKeys">
      <ng-template neuAccordionBody>
        <neu-accordion id="n2-accordion-inner" [items]="innerItems" />
      </ng-template>
    </neu-accordion>
  `,
})
export class N2AccordionHydrationComponent {
  readonly items: readonly Item[] = [
    { id: 'billing', title: 'Billing', summary: 'Invoices' },
    { id: 'security', title: 'Security', summary: 'Keys' },
  ];
  readonly outerItems = [{ id: 'nested', title: 'Outer accordion' }];
  readonly outerExpandedKeys = ['nested'];
  readonly innerItems = [{ id: 'nested', title: 'Inner accordion', content: '<p>Inner content</p>' }];
  readonly expandedKeys = signal<readonly string[]>(['billing']);
  readonly ready = signal(false);
  readonly events = signal(0);
  readonly bodyEvents = signal(0);
  readonly increment = (value: number) => value + 1;

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  accept(keys: readonly string[]): void {
    this.expandedKeys.set(keys);
    this.events.update(this.increment);
  }
}
