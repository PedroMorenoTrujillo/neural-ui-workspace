import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import {
  NeuTreeSelectComponent,
  NeuTreeSelectEmptyDirective,
  NeuTreeSelectFooterDirective,
  NeuTreeSelectHeaderDirective,
  NeuTreeSelectNode,
  NeuTreeSelectNodeDirective,
  NeuTreeSelectSelectedDirective,
} from './neu-tree-select.component';

const NODES: readonly NeuTreeSelectNode[] = [
  {
    value: 'engineering',
    label: 'Engineering',
    children: [
      { value: 'platform', label: 'Platform' },
      {
        value: 'disabled',
        label: 'Disabled branch',
        disabled: true,
        children: [{ value: 'secret', label: 'Secret' }],
      },
    ],
  },
  { value: 'lazy', label: 'Lazy', lazy: true },
];

function createTreeSelect<M extends 'single' | 'multiple' = 'single'>(
  inputs: Record<string, unknown> = {},
): {
  fixture: ComponentFixture<NeuTreeSelectComponent<NeuTreeSelectNode, string, M>>;
  component: NeuTreeSelectComponent<NeuTreeSelectNode, string, M>;
} {
  const fixture = TestBed.createComponent(
    NeuTreeSelectComponent<NeuTreeSelectNode, string, M>,
  );
  fixture.componentRef.setInput('nodes', NODES);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

@Component({
  imports: [
    NeuTreeSelectComponent,
    NeuTreeSelectNodeDirective,
    NeuTreeSelectSelectedDirective,
    NeuTreeSelectHeaderDirective,
    NeuTreeSelectFooterDirective,
    NeuTreeSelectEmptyDirective,
  ],
  template: `
    <neu-tree-select [nodes]="nodes" [(value)]="value" [expandedKeys]="expandedKeys">
      <ng-template neuTreeSelectHeader>Header</ng-template>
      <ng-template neuTreeSelectNode let-node let-level="level" let-toggle="toggle">
        <span class="custom-node" (click)="toggle()">{{ level }}:{{ node.label }}</span>
      </ng-template>
      <ng-template neuTreeSelectSelected let-node><b>{{ node?.label }}</b></ng-template>
      <ng-template neuTreeSelectEmpty>Empty</ng-template>
      <ng-template neuTreeSelectFooter>Footer</ng-template>
    </neu-tree-select>
  `,
})
class TemplateHost {
  readonly nodes = NODES;
  value: string | null = 'engineering';
  expandedKeys: readonly string[] = ['engineering'];
}

describe('NeuTreeSelectComponent N2-019', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('renders a labelled Signal Forms control without CVA methods', () => {
    const { fixture, component } = createTreeSelect({ label: 'Department' });
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    expect(fixture.nativeElement.querySelector('label')?.textContent).toContain('Department');
    expect(trigger.textContent).toContain('Select...');
    expect('writeValue' in component).toBe(false);
    expect('registerOnChange' in component).toBe(false);
    expect('setDisabledState' in component).toBe(false);
  });

  it('accepts parent model writes silently and emits one single-value proposal', () => {
    const { fixture, component } = createTreeSelect();
    const changes = vi.fn();
    component.value.subscribe(changes);
    fixture.componentRef.setInput('value', 'engineering');
    fixture.detectChanges();
    expect(changes).not.toHaveBeenCalled();
    component.selectNode(NODES[1]);
    expect(component.value()).toBe('lazy');
    expect(changes).toHaveBeenCalledExactlyOnceWith('lazy');
  });

  it('supports independent multiple values and preserves unloaded values', () => {
    const { fixture, component } = createTreeSelect<'multiple'>({
      mode: 'multiple',
      value: ['unloaded'],
    });
    component.selectNode(NODES[1]);
    expect(component.value()).toEqual(['unloaded', 'lazy']);
    component.selectNode(NODES[1]);
    expect(component.value()).toEqual(['unloaded']);
    fixture.destroy();
  });

  it('propagates through loaded enabled descendants and stops at disabled boundaries', () => {
    const { component } = createTreeSelect<'multiple'>({
      mode: 'multiple',
      selectionStrategy: 'propagated',
      expandedKeys: ['engineering'],
    });
    component.selectNode(NODES[0]);
    expect(component.value()).toEqual(['engineering', 'platform']);
    expect(component.value()).not.toContain('disabled');
    expect(component.value()).not.toContain('secret');
    expect(component.selectionState(component.visibleNodes()[0])).toBe('checked');
    component.selectNode(NODES[0].children![0]);
    expect(component.value()).toEqual([]);
  });

  it('derives mixed state without rewriting a parent-owned value', () => {
    const { component } = createTreeSelect<'multiple'>({
      mode: 'multiple',
      selectionStrategy: 'propagated',
      value: ['platform'],
      expandedKeys: ['engineering'],
    });
    expect(component.selectionState(component.visibleNodes()[0])).toBe('mixed');
    expect(component.value()).toEqual(['platform']);
  });

  it('proposes controlled expansion and separates lazy children requests', () => {
    const { fixture, component } = createTreeSelect();
    const expansion = vi.fn();
    const expanded = vi.fn();
    const collapsed = vi.fn();
    const requests = vi.fn();
    component.expandedKeysChange.subscribe(expansion);
    component.nodeExpanded.subscribe(expanded);
    component.nodeCollapsed.subscribe(collapsed);
    component.childrenRequest.subscribe(requests);

    component.toggleExpanded(NODES[0], new Event('click'));
    expect(expansion).toHaveBeenLastCalledWith(['engineering']);
    expect(expanded).toHaveBeenCalledExactlyOnceWith(NODES[0]);
    expect(component.isExpanded('engineering')).toBe(false);

    fixture.componentRef.setInput('expandedKeys', ['engineering']);
    fixture.detectChanges();
    component.toggleExpanded(NODES[0], new Event('click'));
    expect(expansion).toHaveBeenLastCalledWith([]);
    expect(collapsed).toHaveBeenCalledExactlyOnceWith(NODES[0]);

    component.toggleExpanded(NODES[1], new Event('click'));
    expect(requests).toHaveBeenCalledExactlyOnceWith({
      requestId: 1,
      queryRevision: 0,
      parentKey: 'lazy',
    });
  });

  it('does not expand leaves or mutate applied expansion arrays', () => {
    const applied = Object.freeze(['engineering']);
    const { component } = createTreeSelect({ expandedKeys: applied });
    const proposals = vi.fn();
    component.expandedKeysChange.subscribe(proposals);
    component.toggleExpanded(NODES[0].children![0], new Event('click'));
    expect(proposals).not.toHaveBeenCalled();
    expect(applied).toEqual(['engineering']);
  });

  it('filters collapsed descendants and advances request correlation revision', () => {
    const { component } = createTreeSelect();
    const filters = vi.fn();
    const requests = vi.fn();
    component.filter.subscribe(filters);
    component.childrenRequest.subscribe(requests);
    component['onFilterInput']({ target: { value: 'platform' } } as unknown as Event);
    expect(component.visibleNodes().map((item) => item.value)).toEqual(['platform']);
    expect(filters).toHaveBeenCalledExactlyOnceWith({ query: 'platform' });
    component.toggleExpanded(NODES[1], new Event('click'));
    expect(requests.mock.calls[0][0].queryRevision).toBe(1);
  });

  it('virtualizes 10k visible nodes and emits half-open ranges', async () => {
    const nodes = Array.from({ length: 10_000 }, (_, index) => ({
      value: `node-${index}`,
      label: `Node ${index}`,
    }));
    const { fixture, component } = createTreeSelect({
      nodes,
      searchable: false,
      virtualizationOptions: { enabled: true, itemSize: 32, viewportHeight: 160, buffer: 2 },
    });
    const ranges = vi.fn();
    component.rangeChange.subscribe(ranges);
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const viewport = document.querySelector<HTMLElement>('.neu-tree-select__viewport')!;
    expect(document.querySelectorAll('.neu-tree-select__node').length).toBeLessThanOrEqual(9);
    viewport.scrollTop = 3_200;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(component.virtualStart()).toBe(100);
    expect(ranges.mock.calls.at(-1)?.[0]).toEqual({
      visible: { start: 100, end: 105 },
      render: { start: 98, end: 107 },
    });
  });

  it('renders the virtual keyboard destination before focusing it and clamps the final viewport', async () => {
    const { fixture, component } = createTreeSelect({
      nodes: Array.from({ length: 200 }, (_, index) => ({ value: `node-${index}`, label: `Node ${index}` })),
      searchable: false,
      virtualizationOptions: { enabled: true, itemSize: 40, viewportHeight: 240, buffer: 2 },
    });
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const first = document.querySelector<HTMLElement>('[data-neu-tree-select-index="0"]')!;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.virtualStart()).toBe(194);
    expect(document.activeElement?.getAttribute('data-neu-tree-select-index')).toBe('199');
    (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.virtualStart()).toBe(0);
    expect(document.activeElement?.getAttribute('data-neu-tree-select-index')).toBe('0');
  });

  it('keeps keyboard navigation and overlay lifecycle exactly once', async () => {
    const { fixture, component } = createTreeSelect({ searchable: false });
    const opened = vi.fn();
    const closed = vi.fn();
    component.opened.subscribe(opened);
    component.closed.subscribe(closed);
    component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(opened).toHaveBeenCalledTimes(1);
    expect(document.activeElement?.getAttribute('data-neu-tree-select-index')).toBe('0');
    component.onOverlayKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('opens at the last eligible node with ArrowUp and selects it with Enter', async () => {
    const { fixture, component } = createTreeSelect({ searchable: false });
    const trigger = fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const active = document.activeElement as HTMLElement;
    expect(active.getAttribute('data-neu-tree-select-index')).toBe('1');
    expect(active.textContent).toContain('Lazy');
    active.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.value()).toBe('lazy');
  });

  it('proposes keyboard expansion and collapse without mutating controlled expanded keys', async () => {
    const { fixture, component } = createTreeSelect({ searchable: false });
    const proposals = vi.fn();
    component.expandedKeysChange.subscribe(proposals);
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = document.querySelector<HTMLElement>('[data-neu-tree-select-index="0"]')!;

    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(proposals).toHaveBeenLastCalledWith(['engineering']);
    expect(component.isExpanded('engineering')).toBe(false);

    fixture.componentRef.setInput('expandedKeys', ['engineering']);
    fixture.detectChanges();
    root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    expect(proposals).toHaveBeenLastCalledWith([]);
    expect(component.isExpanded('engineering')).toBe(true);
  });

  it('selects a parent through the rendered multiple list and clears the propagated value', async () => {
    const { fixture, component } = createTreeSelect<'multiple'>({
      mode: 'multiple', selectionStrategy: 'propagated', expandedKeys: ['engineering'], clearable: true,
    });
    (fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const root = document.querySelector<HTMLElement>('[data-neu-tree-select-index="0"]')!;
    expect(root.textContent).toContain('Engineering');
    root.click();
    fixture.detectChanges();
    expect(component.value()).toEqual(['engineering', 'platform']);
    expect(component.value()).not.toContain('disabled');
    expect(root.getAttribute('aria-checked')).toBe('checked');
    (fixture.nativeElement.querySelector('.neu-tree-select__clear') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.value()).toEqual([]);
  });

  it('blocks a disabled rendered branch and accepts an enabled leaf after expansion', async () => {
    const { fixture, component } = createTreeSelect({ expandedKeys: ['engineering'] });
    (fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const items = Array.from(document.querySelectorAll<HTMLElement>('.neu-tree-select__node'));
    const disabled = items.find((item) => item.textContent?.includes('Disabled branch'))!;
    disabled.click();
    expect(component.value()).toBeNull();
    const platform = items.find((item) => item.textContent?.includes('Platform'))!;
    platform.click();
    expect(component.value()).toBe('platform');
  });

  it('shows no filtered nodes and restores the collapsed parent without selecting it', async () => {
    const { fixture, component } = createTreeSelect({ searchable: true });
    const expansions = vi.fn();
    component.expandedKeysChange.subscribe(expansions);
    (fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const search = document.querySelector('.neu-tree-select__search') as HTMLInputElement;
    search.value = 'no department';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(document.querySelector('.neu-tree-select__empty')).not.toBeNull();
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const twisty = document.querySelector('.neu-tree-select__twisty') as HTMLButtonElement;
    twisty.click();
    expect(expansions).toHaveBeenLastCalledWith(['engineering']);
    expect(component.value()).toBeNull();
    expect(document.querySelectorAll('.neu-tree-select__node')).toHaveLength(2);
  });

  it('emits touch only after focus leaves the composite control', () => {
    const { fixture, component } = createTreeSelect();
    const touched = vi.fn();
    component.touch.subscribe(touched);
    const trigger = fixture.nativeElement.querySelector(
      '.neu-tree-select__trigger',
    ) as HTMLButtonElement;
    component.onCompositeFocusOut(new FocusEvent('focusout', { relatedTarget: trigger }));
    expect(touched).not.toHaveBeenCalled();
    component.onCompositeFocusOut(new FocusEvent('focusout'));
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('blocks gestures for readonly and disabled controls', () => {
    const { fixture, component } = createTreeSelect({ readonly: true });
    component.selectNode(NODES[0]);
    expect(component.value()).toBeNull();
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.selectNode(NODES[0]);
    component.toggle();
    expect(component.value()).toBeNull();
    expect(component.open()).toBe(false);
  });

  it('supports key/function accessors, numeric zero and domain values', () => {
    interface DomainNode {
      id: number;
      name: string;
      blocked?: boolean;
      descendants?: readonly DomainNode[];
    }
    const child: DomainNode = { id: 0, name: 'Zero' };
    const root: DomainNode = { id: 1, name: 'Root', descendants: [child] };
    const fixture = TestBed.createComponent(NeuTreeSelectComponent<DomainNode, number>);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.componentRef.setInput('optionValue', (node: DomainNode) => node.id);
    fixture.componentRef.setInput('optionDisabled', 'blocked');
    fixture.componentRef.setInput('optionChildren', 'descendants');
    fixture.componentRef.setInput('expandedKeys', [1]);
    fixture.detectChanges();
    fixture.componentInstance.selectNode(child);
    expect(fixture.componentInstance.value()).toBe(0);
    expect(fixture.componentInstance.selectedLabel()).toBe('Zero');
  });

  it('bounds cycles and flattens a depth-5000 hierarchy iteratively', () => {
    const root: NeuTreeSelectNode = { value: '0', label: '0', children: [] };
    let current = root;
    for (let index = 1; index < 5_000; index += 1) {
      const child: NeuTreeSelectNode = { value: String(index), label: String(index), children: [] };
      current.children = [child];
      current = child;
    }
    current.children = [root];
    const fixture = TestBed.createComponent(NeuTreeSelectComponent);
    fixture.componentRef.setInput('nodes', [root]);
    fixture.detectChanges();
    expect(fixture.componentInstance.allNodes()).toHaveLength(5_000);
  });

  it('renders every typed template slot without exposing private projection state', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(NeuTreeSelectComponent))
      .componentInstance as NeuTreeSelectComponent<NeuTreeSelectNode, string>;
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(document.querySelector('.neu-tree-select__header')?.textContent).toContain('Header');
    expect(document.querySelector('.custom-node')?.textContent).toContain('0:Engineering');
    expect(document.querySelector('.neu-tree-select__footer')?.textContent).toContain('Footer');
    expect(fixture.nativeElement.querySelector('.neu-tree-select__value b')?.textContent).toContain(
      'Engineering',
    );
  });

  it('distinguishes negative zero from positive zero in selection tokens', () => {
    const { component } = createTreeSelect({
      nodes: [{ value: -0, label: 'Negative zero' }, { value: 0, label: 'Positive zero' }],
      value: -0,
    });
    expect(component.isSelected(-0 as unknown as string)).toBe(true);
    expect(component.isSelected(0 as unknown as string)).toBe(false);
  });

  it('closes an already open panel and clears a stale search on reset', () => {
    const { component } = createTreeSelect({ searchable: true });
    component.query.set('platform');
    component.toggle();
    expect(component.open()).toBe(true);
    const revision = (component as any).queryRevision();
    component.reset();
    expect(component.query()).toBe('');
    expect((component as any).queryRevision()).toBe(revision + 1);
    expect(component.open()).toBe(false);
  });

  it('ignores unrelated trigger and search keys while opening upward from the search', async () => {
    const { fixture, component } = createTreeSelect({ searchable: true });
    const unrelated = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    component.onTriggerKeydown(unrelated);
    component.onSearchKeydown(unrelated);
    expect(unrelated.defaultPrevented).toBe(false);
    component.toggle();
    fixture.detectChanges();
    await fixture.whenStable();
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true });
    component.onSearchKeydown(up);
    expect(up.defaultPrevented).toBe(true);
    const down = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });
    component.onSearchKeydown(down);
    expect(down.defaultPrevented).toBe(true);
  });

  it('keeps selection unchanged when propagation starts from a detached node', () => {
    const { component } = createTreeSelect<'multiple'>({
      mode: 'multiple', selectionStrategy: 'propagated', value: ['platform'],
    });
    const detached = { value: 'platform', label: 'Detached copy' };
    expect((component as any).propagatedSelection(detached, true)).toEqual(['platform']);
  });

  it('does not close a panel that is already closed or react to viewport resize', () => {
    const { component } = createTreeSelect();
    component.close();
    (component as any).onViewportResize();
    expect(component.open()).toBe(false);
    expect((component as any).panelWidth()).toBe('');
  });

  it('does not emit a second virtual range for the same first visible row', () => {
    const { component } = createTreeSelect({
      virtualizationOptions: { enabled: true, itemSize: 24, viewportHeight: 48, buffer: 0 },
    });
    const ranges = vi.fn();
    component.rangeChange.subscribe(ranges);
    component.onVirtualScroll({ currentTarget: { scrollTop: 0 } } as unknown as Event);
    expect(ranges).not.toHaveBeenCalled();
    component.onVirtualScroll({ currentTarget: { scrollTop: 48 } } as unknown as Event);
    expect(component.virtualStart()).toBe(1);
    expect(ranges).toHaveBeenCalledOnce();
  });

  it('measures a visible trigger width when opening its panel', () => {
    const { fixture, component } = createTreeSelect();
    const trigger = fixture.nativeElement.querySelector('.neu-tree-select__trigger') as HTMLElement;
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ width: 187.6 } as DOMRect);
    component.toggle();
    expect((component as any).panelWidth()).toBe(188);
  });

  it('renders the projected empty state after a query with no matching nodes', async () => {
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(NeuTreeSelectComponent))
      .componentInstance as NeuTreeSelectComponent<NeuTreeSelectNode, string>;
    component.toggle();
    component.query.set('not a department');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.neu-tree-select__empty')?.textContent).toContain('Empty');
  });

  it('closes from a second toggle and navigates a collapsed parent in RTL', () => {
    const { fixture, component } = createTreeSelect();
    component.toggle();
    expect(component.open()).toBe(true);
    component.toggle();
    expect(component.open()).toBe(false);
    (fixture.nativeElement as HTMLElement).style.direction = 'rtl';
    const expand = new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true });
    component.onNodeKeydown(component.visibleNodes()[0], 0, expand);
    expect(expand.defaultPrevented).toBe(true);
  });

  it('treats primitive option nodes as leaves without lazy children', () => {
    const { component } = createTreeSelect();
    expect((component as any).childrenOf('leaf')).toEqual([]);
    expect((component as any).isLazyNode('leaf')).toBe(false);
  });
});
