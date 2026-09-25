import { TestBed } from '@angular/core/testing';
import { NeuTreeComponent } from './neu-tree.component';
import type { NeuTreeHierarchy, NeuTreeNode, NeuTreeSelection } from './neu-tree.types';

interface Item { readonly id: string }
const nodes: readonly NeuTreeNode<Item, string>[] = [
  { key: 'root', data: { id: 'root' }, label: 'Workspace' },
  { key: 'child', data: { id: 'child' }, label: 'Design', description: 'Shared tokens' },
  { key: 'grandchild', data: { id: 'grandchild' }, label: 'Admin portal' },
  { key: 'disabled', data: { id: 'disabled' }, label: 'Archive', disabled: true },
];
const hierarchy: NeuTreeHierarchy<string> = {
  revision: 1, roots: ['root', 'disabled'], children: [
    { parentKey: 'root', state: 'loaded', keys: ['child'] },
    { parentKey: 'child', state: 'loaded', keys: ['grandchild'] },
    { parentKey: 'disabled', state: 'unloaded' },
  ],
};

describe('NeuTreeComponent controlled C6', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuTreeComponent] }).compileComponents();
  });

  function create(
    state: { nodes?: readonly NeuTreeNode<Item, string>[]; hierarchy?: NeuTreeHierarchy<string>;
      expandedKeys?: readonly string[]; selection?: NeuTreeSelection<string> } = {},
  ) {
    const fixture = TestBed.createComponent(NeuTreeComponent<Item, string>);
    fixture.componentRef.setInput('nodes', state.nodes ?? nodes);
    fixture.componentRef.setInput('hierarchy', state.hierarchy ?? hierarchy);
    fixture.componentRef.setInput('expandedKeys', state.expandedKeys ?? []);
    fixture.componentRef.setInput('selection', state.selection ?? { mode: 'none' });
    fixture.detectChanges();
    return fixture;
  }

  function rows(fixture: ReturnType<typeof create>): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll('[role="treeitem"]')] as HTMLElement[];
  }

  it('renders only applied roots with tree semantics and sibling metadata', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelector('[role="tree"]')).not.toBeNull();
    expect(rows(fixture).map((row) => row.querySelector('.neu-tree__row')?.textContent?.trim())).toEqual(['Workspace', 'Archive']);
    expect(rows(fixture)[0]?.getAttribute('aria-level')).toBe('1');
    expect(rows(fixture)[0]?.getAttribute('aria-posinset')).toBe('1');
    expect(rows(fixture)[1]?.getAttribute('aria-setsize')).toBe('2');
    expect(rows(fixture).filter((row) => row.tabIndex === 0)).toHaveLength(1);
    const internal = fixture.componentInstance as unknown as { model(): unknown; visibleNodes(): unknown };
    const modelBeforeFocus = internal.model();
    const visibleBeforeFocus = internal.visibleNodes();
    rows(fixture)[1]!.focus();
    fixture.detectChanges();
    expect(internal.model()).toBe(modelBeforeFocus);
    expect(internal.visibleNodes()).toBe(visibleBeforeFocus);
  });

  it('renders nested applied expansion and parent collapse without output echo', () => {
    const fixture = create({ expandedKeys: ['root', 'child'] });
    const proposals: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => proposals.push(value));
    expect(rows(fixture).map((row) => row.getAttribute('aria-level'))).toEqual(['1', '2', '3', '1']);
    expect(fixture.nativeElement.querySelectorAll('[role="group"]')).toHaveLength(2);
    fixture.componentRef.setInput('expandedKeys', []);
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(2);
    expect(proposals).toEqual([]);
  });

  it('emits one expansion proposal; rejection leaves DOM applied', () => {
    const fixture = create();
    const proposals: unknown[] = [];
    const requests: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => proposals.push(value));
    fixture.componentInstance.childrenRequest.subscribe((value) => requests.push(value));
    rows(fixture)[0]!.querySelector<HTMLButtonElement>('.neu-tree__toggle')!.click();
    fixture.detectChanges();
    expect(proposals).toEqual([{ keys: ['root'], key: 'root', expanded: true, source: 'pointer' }]);
    expect(rows(fixture)).toHaveLength(2);
    expect(requests).toEqual([]);
  });

  it('requests unloaded children only after accepted expansion, once per revision', () => {
    const fixture = create();
    const requests: unknown[] = [];
    fixture.componentInstance.childrenRequest.subscribe((value) => requests.push(value));
    fixture.componentRef.setInput('expandedKeys', ['disabled']);
    fixture.detectChanges();
    expect(requests).toEqual([{ requestId: 1, hierarchyRevision: 1, parentKey: 'disabled', reason: 'expand' }]);
    fixture.detectChanges();
    expect(requests).toHaveLength(1);
  });

  it('does not request an expanded unloaded descendant hidden by a collapsed ancestor', () => {
    const nested: NeuTreeHierarchy<string> = {
      revision: 2, roots: ['root'], children: [
        { parentKey: 'root', state: 'loaded', keys: ['child'] },
        { parentKey: 'child', state: 'unloaded' },
      ],
    };
    const fixture = create({ nodes: nodes.slice(0, 2), hierarchy: nested, expandedKeys: ['child'] });
    const requests: unknown[] = [];
    fixture.componentInstance.childrenRequest.subscribe((value) => requests.push(value));
    fixture.detectChanges();
    expect(requests).toEqual([]);
    fixture.componentRef.setInput('expandedKeys', ['root', 'child']);
    fixture.detectChanges();
    expect(requests).toEqual([{ requestId: 1, hierarchyRevision: 2, parentKey: 'child', reason: 'expand' }]);
  });

  it('does not duplicate a loading request and retries error on explicit gesture', () => {
    const loading = { ...hierarchy, children: [...hierarchy.children.slice(0, 2), { parentKey: 'disabled', state: 'loading' as const, requestId: 9 }] };
    const fixture = create({ hierarchy: loading, expandedKeys: ['disabled'] });
    const requests: unknown[] = [];
    fixture.componentInstance.childrenRequest.subscribe((value) => requests.push(value));
    fixture.detectChanges();
    expect(requests).toEqual([]);
    fixture.componentRef.setInput('hierarchy', { ...loading, children: [...loading.children.slice(0, 2), { parentKey: 'disabled', state: 'error' }] });
    fixture.detectChanges();
    rows(fixture)[1]!.querySelector<HTMLButtonElement>('.neu-tree__retry')!.click();
    expect(requests).toEqual([{ requestId: 1, hierarchyRevision: 1, parentKey: 'disabled', reason: 'retry' }]);
  });

  it('keeps disabled nodes focusable and structurally expandable but blocks action/selection', () => {
    const fixture = create({ selection: { mode: 'single', key: null } });
    const actions: unknown[] = [];
    const selections: unknown[] = [];
    fixture.componentInstance.nodeAction.subscribe((value) => actions.push(value));
    fixture.componentInstance.selectionChange.subscribe((value) => selections.push(value));
    rows(fixture)[1]!.focus();
    fixture.detectChanges();
    expect(rows(fixture)[1]?.tabIndex).toBe(0);
    rows(fixture)[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    rows(fixture)[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(actions).toEqual([]);
    expect(selections).toEqual([]);
    expect(rows(fixture)[1]?.getAttribute('aria-disabled')).toBe('true');
    expect(rows(fixture)[1]?.querySelector('.neu-tree__toggle')).not.toBeNull();
  });

  it('separates focus from applied selection and emits one keyboard selection proposal', () => {
    const fixture = create({ selection: { mode: 'single', key: null } });
    const proposals: unknown[] = [];
    fixture.componentInstance.selectionChange.subscribe((value) => proposals.push(value));
    rows(fixture)[0]!.focus();
    fixture.detectChanges();
    expect(rows(fixture)[0]?.getAttribute('aria-selected')).toBe('false');
    rows(fixture)[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(proposals).toEqual([{ selection: { mode: 'single', key: 'root' }, key: 'root', source: 'keyboard' }]);
    expect(rows(fixture)[0]?.getAttribute('aria-selected')).toBe('false');
    fixture.componentRef.setInput('selection', { mode: 'single', key: 'root' });
    fixture.detectChanges();
    expect(rows(fixture)[0]?.getAttribute('aria-selected')).toBe('true');
    expect(proposals).toHaveLength(1);
  });

  it('emits semantic action, not DOM event, on Enter', () => {
    const fixture = create();
    const actions: unknown[] = [];
    fixture.componentInstance.nodeAction.subscribe((value) => actions.push(value));
    rows(fixture)[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(actions).toEqual([{ key: 'root' }]);
  });

  it('handles a nested child keyboard action once despite bubbling through ancestor groups', () => {
    const fixture = create({ expandedKeys: ['root'] });
    const actions: unknown[] = [];
    fixture.componentInstance.nodeAction.subscribe((value) => actions.push(value));
    rows(fixture)[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(actions).toEqual([{ key: 'child' }]);
  });

  it('renders checkbox mixed for a selected known node with unloaded descendants', () => {
    const fixture = create({ selection: { mode: 'checkbox', keys: ['disabled'] } });
    expect(rows(fixture)[1]?.getAttribute('aria-checked')).toBe('mixed');
    expect(rows(fixture)[1]?.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it('searches loaded descendants and transiently reveals ancestor paths', () => {
    const fixture = create();
    fixture.componentRef.setInput('searchable', true);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;
    input.value = '  ADMIN   PORTAL ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows(fixture).map((row) => row.querySelector('.neu-tree__row')?.textContent?.trim())).toEqual(['Workspace', 'DesignShared tokens', 'Admin portal']);
    expect(rows(fixture)[0]?.getAttribute('aria-expanded')).toBe('true');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(2);
  });

  it('fails closed with a deterministic error state for malformed hierarchy', () => {
    const fixture = create({ hierarchy: { ...hierarchy, roots: ['root', 'root'] } });
    expect(rows(fixture)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.getAttribute('data-neu-tree-error')).toBe('duplicate-root');
  });

  it('does not mutate frozen applied nodes, relations, expansion or selection', () => {
    const frozenNodes = Object.freeze(nodes.map((node) => Object.freeze({ ...node, data: Object.freeze({ ...node.data }) })));
    const frozenHierarchy = Object.freeze({ ...hierarchy, roots: Object.freeze([...hierarchy.roots]), children: Object.freeze([...hierarchy.children]) });
    const fixture = create({ nodes: frozenNodes, hierarchy: frozenHierarchy, expandedKeys: Object.freeze([]), selection: Object.freeze({ mode: 'single', key: null }) });
    rows(fixture)[0]!.querySelector<HTMLButtonElement>('.neu-tree__toggle')!.click();
    expect(frozenNodes[0]!.label).toBe('Workspace');
    expect(frozenHierarchy.roots).toEqual(['root', 'disabled']);
  });

  it('virtualizes the visible loaded sequence without changing the logical count', () => {
    const many = Array.from({ length: 1000 }, (_, index) => ({ key: `${index}`, data: { id: `${index}` }, label: `Item ${index}` }));
    const fixture = create({ nodes: many, hierarchy: { revision: 1, roots: many.map((node) => node.key), children: [] } });
    fixture.componentRef.setInput('virtualization', { itemSize: 40, viewportHeight: 200, buffer: 2 });
    fixture.detectChanges();
    const internal = fixture.componentInstance as unknown as { model(): unknown; visibleNodes(): unknown };
    const modelBeforeScroll = internal.model();
    const visibleBeforeScroll = internal.visibleNodes();
    expect(rows(fixture).length).toBeLessThan(10);
    const viewport = fixture.nativeElement.querySelector('[role="tree"]') as HTMLElement;
    viewport.scrollTop = 20000;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(rows(fixture).length).toBeLessThan(10);
    expect(rows(fixture)[0]?.textContent).toContain('Item 498');
    expect(internal.model()).toBe(modelBeforeScroll);
    expect(internal.visibleNodes()).toBe(visibleBeforeScroll);
  });

  it('updates reconstructed T with stable K without stale object identity', () => {
    const fixture = create({ expandedKeys: ['root'] });
    fixture.componentRef.setInput('nodes', nodes.map((node) => node.key === 'child' ? { ...node, label: 'Renamed' } : { ...node }));
    fixture.detectChanges();
    expect(rows(fixture)[1]?.textContent).toContain('Renamed');
  });

  it('renders a 1,001-deep applied branch without a stack overflow', () => {
    const deepNodes = Array.from({ length: 1001 }, (_, index) => ({
      key: `${index}`, data: { id: `${index}` }, label: `Node ${index}`,
    }));
    const deepHierarchy: NeuTreeHierarchy<string> = {
      revision: 1, roots: ['0'], children: deepNodes.slice(0, -1).map((node, index) => ({
        parentKey: node.key, state: 'loaded', keys: [`${index + 1}`],
      })),
    };
    const fixture = create({ nodes: deepNodes, hierarchy: deepHierarchy,
      expandedKeys: deepNodes.map((node) => node.key) });
    expect(rows(fixture)).toHaveLength(1001);
    expect(rows(fixture)[1000]?.getAttribute('aria-level')).toBe('1001');
  });

  it('survives 100 controlled expansion, selection, keyboard and lazy open/cancel cycles', () => {
    const fixture = create({ selection: { mode: 'single', key: null } });
    const expansion: unknown[] = [];
    const selection: unknown[] = [];
    const requests: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => expansion.push(value));
    fixture.componentInstance.selectionChange.subscribe((value) => selection.push(value));
    fixture.componentInstance.childrenRequest.subscribe((value) => requests.push(value));
    const keyboardMs: number[] = [];
    const lazyMs: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const root = rows(fixture)[0]!;
      root.focus();
      const keyboardStart = performance.now();
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      keyboardMs.push(performance.now() - keyboardStart);
      root.querySelector<HTMLButtonElement>('.neu-tree__toggle')!.click();
      root.querySelector<HTMLElement>('.neu-tree__content')!.click();
      fixture.componentRef.setInput('hierarchy', { ...hierarchy, revision: index + 2 });
      fixture.componentRef.setInput('expandedKeys', ['disabled']);
      const lazyStart = performance.now();
      fixture.detectChanges();
      lazyMs.push(performance.now() - lazyStart);
      fixture.componentRef.setInput('expandedKeys', []);
      fixture.detectChanges();
    }
    expect(expansion).toHaveLength(100);
    expect(selection).toHaveLength(100);
    expect(requests).toHaveLength(100);
    const quantiles = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      return { p50Ms: +sorted[50]!.toFixed(3), p95Ms: +sorted[95]!.toFixed(3) };
    };
    console.log(`N2_C6_INTERACTION_PERFORMANCE:${JSON.stringify({ keyboard100: quantiles(keyboardMs), lazy100: quantiles(lazyMs) })}`);
    fixture.destroy();
  });
});
