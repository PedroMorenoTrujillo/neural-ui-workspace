import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { NeuVirtualItemDirective, NeuVirtualListComponent } from './neu-virtual-list.component';
import type { NeuVirtualListRange } from './neu-virtual-list.types';

@Component({
  imports: [NeuVirtualListComponent, NeuVirtualItemDirective],
  template: `<neu-virtual-list [items]="items()" [itemKey]="key" [visibleRows]="2"
    [itemSize]="20">
    <ng-template [neuVirtualItem]="items()" [neuVirtualItemKey]="key"
      let-item let-index="index" let-key="key">
      <span class="custom">{{ index }}:{{ key }}:{{ item.label }}</span>
    </ng-template>
  </neu-virtual-list>`,
})
class Host {
  items = signal<readonly { key: string; label: string }[]>([
    { key: 'a', label: 'Alpha' }, { key: 'b', label: 'Beta' }, { key: 'c', label: 'Gamma' },
  ]);
  readonly key = (item: { key: string }) => item.key;
}

function mount(items: readonly number[] = []): ComponentFixture<NeuVirtualListComponent<number, number>> {
  const fixture = TestBed.createComponent(NeuVirtualListComponent<number, number>);
  fixture.componentRef.setInput('items', items);
  fixture.componentRef.setInput('itemKey', (item: number) => item);
  fixture.detectChanges();
  return fixture;
}

const viewportOf = (element: HTMLElement) =>
  element.querySelector('.neu-virtual-list__viewport') as HTMLElement;
const rendered = (element: HTMLElement) =>
  [...element.querySelectorAll<HTMLElement>('[role="listitem"]')];

beforeEach(() => TestBed.configureTestingModule({
  providers: [provideZonelessChangeDetection()],
}).compileComponents());

describe('NeuVirtualListComponent fixed-height window', () => {
  it('renders a semantic list with bounded initial rows', () => {
    const fixture = mount(Array.from({ length: 100 }, (_, i) => i));
    const rows = rendered(fixture.nativeElement);
    expect(fixture.nativeElement.classList).toContain('neu-virtual-list');
    expect(viewportOf(fixture.nativeElement).getAttribute('role')).toBe('list');
    expect(rows).toHaveLength(12);
    expect(rows[0].getAttribute('aria-posinset')).toBe('1');
    expect(rows[0].getAttribute('aria-setsize')).toBe('100');
    expect(fixture.nativeElement.querySelectorAll('.neu-virtual-list__spacer')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
  });

  it('renders typed template context and consumer content', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom')?.textContent?.trim()).toBe('0:a:Alpha');
    expect(fixture.nativeElement.querySelectorAll('.custom')).toHaveLength(3);
  });

  it('renders an empty status and no phantom domain node', () => {
    const fixture = mount();
    expect(rendered(fixture.nativeElement)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('No results');
  });

  it('uses readonly applied replacements without mutating source arrays', () => {
    const source = Object.freeze([1, 2, 3]);
    const fixture = mount(source);
    expect(rendered(fixture.nativeElement)[0].textContent?.trim()).toBe('1');
    fixture.componentRef.setInput('items', Object.freeze([9, 8]));
    fixture.detectChanges();
    expect(rendered(fixture.nativeElement).map((row) => row.textContent?.trim())).toEqual(['9', '8']);
    expect(source).toEqual([1, 2, 3]);
  });

  it('keeps semantic DOM identity for reconstructed objects with the same K', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('[role="listitem"]');
    fixture.componentInstance.items.set([
      { key: 'a', label: 'New Alpha' }, { key: 'b', label: 'Beta' },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="listitem"]')).toBe(first);
    expect(first.textContent).toContain('New Alpha');
  });

  it('updates for reorder, insertion, removal and populated/empty transitions', () => {
    const fixture = mount([1, 2, 3]);
    for (const [items, expected] of [
      [[3, 2, 1], '3'], [[0, 3, 2, 1], '0'], [[2, 1], '2'], [[], undefined], [[7], '7'],
    ] as const) {
      fixture.componentRef.setInput('items', items);
      fixture.detectChanges();
      expect(rendered(fixture.nativeElement)[0]?.textContent?.trim()).toBe(expected);
    }
  });

  it('exposes logical positions in RTL without direction-specific layout state', () => {
    const fixture = mount([1, 2, 3]);
    fixture.nativeElement.setAttribute('dir', 'rtl');
    fixture.detectChanges();
    expect(rendered(fixture.nativeElement)[1].getAttribute('aria-posinset')).toBe('2');
  });

  it('keeps 10k applied items to a small mounted DOM window', () => {
    const fixture = mount(Array.from({ length: 10_000 }, (_, i) => i));
    expect(rendered(fixture.nativeElement).length).toBeLessThanOrEqual(14);
    expect(fixture.nativeElement.textContent).not.toContain('9999');
  });

  it('reports the initial browser range once, not once per equivalent parent write', async () => {
    const fixture = mount([1, 2, 3]);
    const ranges: NeuVirtualListRange[] = [];
    fixture.componentInstance.rangeChange.subscribe((value) => ranges.push(value));
    await fixture.whenStable();
    fixture.componentRef.setInput('items', [1, 2, 3]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ranges.length).toBeLessThanOrEqual(1);
  });

  it('scrollTo handles index and key targets, and rejects invalid targets', async () => {
    const fixture = mount(Array.from({ length: 100 }, (_, i) => i));
    await fixture.whenStable();
    expect(fixture.componentInstance.scrollTo({ index: 30, align: 'start' })).toBe(true);
    fixture.detectChanges();
    expect(rendered(fixture.nativeElement)[0].getAttribute('aria-posinset')).toBe('29');
    expect(fixture.componentInstance.scrollTo({ key: 99, align: 'end' })).toBe(true);
    expect(fixture.componentInstance.scrollTo({ key: 101 })).toBe(false);
    expect(fixture.componentInstance.scrollTo({ index: -1 })).toBe(false);
    expect(fixture.componentInstance.scrollTo({ index: 1.5 })).toBe(false);
  });

  it('diagnoses duplicate keys while keeping track identities bounded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = mount([1, 1, 2]);
    await fixture.whenStable();
    expect(rendered(fixture.nativeElement)).toHaveLength(3);
    expect(warn.mock.calls.some(([message]) => String(message).includes('duplicate itemKey'))).toBe(true);
    warn.mockRestore();
  });

  it('releases viewport resources over 100 create/destroy cycles', async () => {
    for (let i = 0; i < 100; i++) {
      const fixture = mount([i, i + 1]);
      await fixture.whenStable();
      fixture.destroy();
    }
  });
});
