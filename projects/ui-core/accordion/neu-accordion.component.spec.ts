import { Component, provideZonelessChangeDetection, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import {
  NeuAccordionBodyDirective,
  NeuAccordionComponent,
  NeuAccordionHeaderDirective,
  NeuAccordionItem,
} from './neu-accordion.component';

interface Item extends NeuAccordionItem {
  readonly accountId?: string;
}

const ITEMS: readonly Item[] = [
  { id: 'billing', title: 'Billing', content: '<p>Invoice</p>', accountId: 'a-1' },
  { id: 'security', title: 'Security', content: '<p>Keys</p>' },
  { id: 'disabled', title: 'Disabled', content: 'Unavailable', disabled: true },
];

function createAccordion(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuAccordionComponent<string, Item>);
  fixture.componentRef.setInput('items', ITEMS);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

@Component({
  selector: 'test-billing-form',
  imports: [ReactiveFormsModule],
  template: `<input aria-label="Draft" [formControl]="draft" />`,
})
class BillingForm {
  readonly draft = new FormControl('initial', { nonNullable: true });
}

@Component({
  imports: [
    NeuAccordionComponent,
    NeuAccordionBodyDirective,
    NeuAccordionHeaderDirective,
    BillingForm,
  ],
  template: `
    <neu-accordion
      [items]="items()"
      [expandedKeys]="expandedKeys()"
      (expandedKeysChange)="proposals.push($event)"
    >
      <ng-template neuAccordionHeader let-item let-expanded="expanded">
        <span class="custom-header">{{ item.title }}:{{ expanded }}</span>
      </ng-template>
      <ng-template neuAccordionBody let-item let-expanded="expanded">
        <span class="body-state">{{ item.title }}:{{ expanded }}</span>
        @if (item.id === 'billing') {
          <test-billing-form />
        }
      </ng-template>
    </neu-accordion>
  `,
})
class TemplateHost {
  readonly items = signal(ITEMS);
  readonly expandedKeys = signal<readonly string[]>(['billing']);
  readonly proposals: (readonly string[])[] = [];
  readonly accordion = viewChild.required(NeuAccordionComponent<string, Item>);
  readonly form = viewChild.required(BillingForm);
}

@Component({
  imports: [NeuAccordionComponent],
  template: `
    <neu-accordion [items]="items" />
    <neu-accordion [items]="items" />
  `,
})
class MultipleInstanceHost {
  readonly items = ITEMS;
}

describe('NeuAccordionComponent N2-020', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders native labelled headers with collapsed inert panels by default', () => {
    const { fixture } = createAccordion();
    const headers = fixture.nativeElement.querySelectorAll('.neu-accordion__header');
    const panels = fixture.nativeElement.querySelectorAll('.neu-accordion__panel');
    expect([...headers].map((header: HTMLElement) => header.textContent)).toEqual([
      expect.stringContaining('Billing'),
      expect.stringContaining('Security'),
      expect.stringContaining('Disabled'),
    ]);
    expect(panels[0].getAttribute('aria-hidden')).toBe('true');
    expect(panels[0].hasAttribute('inert')).toBe(true);
  });

  it('reads initialExpandedKeys once in uncontrolled mode', () => {
    const { fixture, component } = createAccordion({ initialExpandedKeys: ['billing'] });
    expect(component.isExpanded('billing')).toBe(true);
    fixture.componentRef.setInput('initialExpandedKeys', ['security']);
    fixture.detectChanges();
    expect(component.isExpanded('billing')).toBe(true);
    expect(component.isExpanded('security')).toBe(false);
  });

  it('applies uncontrolled toggles and emits immutable aggregate/detail once', () => {
    const { component } = createAccordion();
    const changes = vi.fn();
    const details = vi.fn();
    component.expandedKeysChange.subscribe(changes);
    component.panelToggle.subscribe(details);
    component.toggle('billing');
    expect(component.isExpanded('billing')).toBe(true);
    expect(changes).toHaveBeenCalledExactlyOnceWith(['billing']);
    expect(Object.isFrozen(changes.mock.calls[0][0])).toBe(true);
    expect(details).toHaveBeenCalledExactlyOnceWith({ id: 'billing', expanded: true });
  });

  it('keeps exclusive and multiple policies separate from applied state', () => {
    const exclusive = createAccordion({ initialExpandedKeys: ['billing'] });
    exclusive.component.toggle('security');
    expect(exclusive.component.isExpanded('billing')).toBe(false);
    expect(exclusive.component.isExpanded('security')).toBe(true);
    exclusive.fixture.destroy();

    const multiple = createAccordion({ initialExpandedKeys: ['billing'], multiple: true });
    multiple.component.toggle('security');
    expect(multiple.component.isExpanded('billing')).toBe(true);
    expect(multiple.component.isExpanded('security')).toBe(true);
  });

  it('proposes controlled changes without mutating applied expansion when rejected', () => {
    const applied = Object.freeze(['billing']);
    const { component } = createAccordion({ expandedKeys: applied });
    const changes = vi.fn();
    component.expandedKeysChange.subscribe(changes);
    component.toggle('security');
    expect(changes).toHaveBeenCalledExactlyOnceWith(['security']);
    expect(component.isExpanded('billing')).toBe(true);
    expect(component.isExpanded('security')).toBe(false);
    expect(applied).toEqual(['billing']);
  });

  it('applies reconstructed parent arrays silently', () => {
    const { fixture, component } = createAccordion({ expandedKeys: ['billing'] });
    const changes = vi.fn();
    component.expandedKeysChange.subscribe(changes);
    fixture.componentRef.setInput('expandedKeys', [...['security']]);
    fixture.detectChanges();
    expect(component.isExpanded('billing')).toBe(false);
    expect(component.isExpanded('security')).toBe(true);
    expect(changes).not.toHaveBeenCalled();
  });

  it('retains unknown controlled keys until their async item arrives', () => {
    const fixture = TestBed.createComponent(NeuAccordionComponent);
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('expandedKeys', ['async']);
    fixture.detectChanges();
    fixture.componentRef.setInput('items', [{ id: 'async', title: 'Async', content: 'Ready' }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.isExpanded('async')).toBe(true);
    expect(fixture.nativeElement.querySelector('.neu-accordion__panel').getAttribute('aria-hidden')).toBe(
      'false',
    );
  });

  it('renders typed templates and keeps child form state while collapsed', () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('.custom-header').textContent).toContain(
      'Billing:true',
    );
    expect(fixture.nativeElement.querySelector('.body-state').textContent).toContain('Billing:true');
    host.form().draft.setValue('preserved');
    host.expandedKeys.set([]);
    fixture.detectChanges();
    expect(host.form().draft.value).toBe('preserved');
    expect(fixture.nativeElement.querySelector('.neu-accordion__panel').hasAttribute('inert')).toBe(
      true,
    );
  });

  it('reuses keyed template views when item objects are reconstructed', () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const original = fixture.componentInstance.form();
    fixture.componentInstance.items.set(ITEMS.map((item) => ({ ...item })));
    fixture.detectChanges();
    expect(fixture.componentInstance.form()).toBe(original);
  });

  it('sanitizes optional HTML fallback without bypass APIs', () => {
    const { fixture } = createAccordion({ initialExpandedKeys: ['billing'] });
    const html = fixture.nativeElement.querySelector('.neu-accordion__html') as HTMLElement;
    expect(html.innerHTML).toContain('<p>Invoice</p>');
  });

  it('returns an empty fallback when the sanitizer rejects content', () => {
    const { component } = createAccordion();
    vi.spyOn((component as unknown as { _sanitizer: { sanitize: () => null } })._sanitizer, 'sanitize')
      .mockReturnValue(null);
    expect(component.sanitize('<script>bad()</script>')).toBe('');
  });

  it('blocks disabled and unknown toggles', () => {
    const { component } = createAccordion();
    const changes = vi.fn();
    component.expandedKeysChange.subscribe(changes);
    component.toggle('disabled');
    component.toggle('missing');
    expect(changes).not.toHaveBeenCalled();
  });

  it('supports Arrow/Home/End navigation and skips disabled headers', () => {
    const { fixture } = createAccordion();
    const headers = [...fixture.nativeElement.querySelectorAll('.neu-accordion__header')] as HTMLButtonElement[];
    headers[0].focus();
    headers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(headers[1]);
    headers[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(document.activeElement).toBe(headers[0]);
    headers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(headers[1]);
  });

  it('moves downward across enabled headers and ignores modified navigation', () => {
    const { fixture } = createAccordion();
    const headers = [...fixture.nativeElement.querySelectorAll('.neu-accordion__header')] as HTMLButtonElement[];
    headers[0].focus();
    headers[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(headers[1]);
    const modified = new KeyboardEvent('keydown', { key: 'ArrowUp', ctrlKey: true, bubbles: true, cancelable: true });
    headers[1].dispatchEvent(modified);
    expect(modified.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(headers[1]);
  });

  it('does not consume navigation when no accordion header is enabled', () => {
    const { fixture, component } = createAccordion({ items: [{ id: 'only', title: 'Only', disabled: true }] });
    const event = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    (component as unknown as { onHeaderKeydown(index: number, event: KeyboardEvent): void })
      .onHeaderKeydown(0, event);
    expect(event.defaultPrevented).toBe(false);
    fixture.destroy();
  });

  it('creates unique namespaced relationships across instances', () => {
    const fixture = TestBed.createComponent(MultipleInstanceHost);
    fixture.detectChanges();
    const headers = [...fixture.nativeElement.querySelectorAll('.neu-accordion__header')];
    const ids = headers.map((header: Element) => header.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const header of headers) {
      const panel = fixture.nativeElement.querySelector(`#${header.getAttribute('aria-controls')}`);
      expect(panel?.getAttribute('aria-labelledby')).toBe(header.id);
    }
  });

  it('supports numeric semantic keys without converting applied state', () => {
    const fixture = TestBed.createComponent(
      NeuAccordionComponent<number, NeuAccordionItem<number>>,
    );
    fixture.componentRef.setInput('items', [
      { id: 0, title: 'Zero', content: '0' },
      { id: -0, title: 'Negative zero', content: '-0' },
    ]);
    fixture.componentRef.setInput('expandedKeys', [-0]);
    fixture.detectChanges();
    expect(fixture.componentInstance.isExpanded(-0)).toBe(true);
    expect(fixture.componentInstance.isExpanded(0)).toBe(false);
    const ids = [...fixture.nativeElement.querySelectorAll('.neu-accordion__header')].map(
      (header: HTMLElement) => header.id,
    );
    expect(new Set(ids).size).toBe(2);
  });

  it('keeps lifetime mode stable and warns once on an invalid mode switch', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, component } = createAccordion({ initialExpandedKeys: ['billing'] });
    fixture.componentRef.setInput('expandedKeys', ['security']);
    fixture.detectChanges();
    expect(component.isExpanded('billing')).toBe(true);
    expect(component.isExpanded('security')).toBe(false);
    expect(warning).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('expandedKeys', ['billing']);
    fixture.detectChanges();
    expect(warning).toHaveBeenCalledOnce();
  });
});
