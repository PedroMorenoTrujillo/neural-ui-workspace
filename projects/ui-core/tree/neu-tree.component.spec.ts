import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuTreeComponent, NeuTreeNodeDirective } from './neu-tree.component';
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

  function flatTree(labels: readonly { key: string; label: string; disabled?: boolean }[]) {
    return create({
      nodes: labels.map(({ key, label, disabled }) => ({ key, label, disabled, data: { id: key } })),
      hierarchy: { revision: 1, roots: labels.map(({ key }) => key), children: [] },
      selection: { mode: 'single', key: null },
    });
  }

  async function pressFocused(fixture: ReturnType<typeof create>, key: string, options: KeyboardEventInit = {}) {
    const active = fixture.nativeElement.ownerDocument.activeElement as HTMLElement;
    active.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
    fixture.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    fixture.detectChanges();
  }

  function businessOutputs(fixture: ReturnType<typeof create>): unknown[] {
    const emitted: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.selectionChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.childrenRequest.subscribe((value) => emitted.push(value));
    fixture.componentInstance.nodeAction.subscribe((value) => emitted.push(value));
    fixture.componentInstance.nodeMove.subscribe((value) => emitted.push(value));
    return emitted;
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

  it('uses horizontal keys to propose expansion, enter children and return to their parent', async () => {
    const fixture = create();
    const proposals: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => proposals.push(value));
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'ArrowRight');
    expect(proposals).toEqual([{ keys: ['root'], key: 'root', expanded: true, source: 'keyboard' }]);
    expect(rows(fixture)).toHaveLength(2);

    fixture.componentRef.setInput('expandedKeys', ['root']);
    fixture.detectChanges();
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'ArrowRight');
    expect(document.activeElement).toBe(rows(fixture)[1]);
    await pressFocused(fixture, 'ArrowLeft');
    expect(document.activeElement).toBe(rows(fixture)[0]);
    await pressFocused(fixture, 'ArrowLeft');
    expect(proposals.at(-1)).toEqual({ keys: [], key: 'root', expanded: false, source: 'keyboard' });
    expect(rows(fixture)).toHaveLength(3);
  });

  it('maps RTL horizontal keys to expansion, child focus and parent return', async () => {
    const fixture = create();
    (fixture.nativeElement as HTMLElement).style.direction = 'rtl';
    const proposals: unknown[] = [];
    fixture.componentInstance.expandedKeysChange.subscribe((value) => proposals.push(value));
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'ArrowLeft');
    expect(proposals).toEqual([{ keys: ['root'], key: 'root', expanded: true, source: 'keyboard' }]);
    expect(rows(fixture)).toHaveLength(2);
    fixture.componentRef.setInput('expandedKeys', ['root']);
    fixture.detectChanges();
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'ArrowLeft');
    expect(document.activeElement).toBe(rows(fixture)[1]);
    await pressFocused(fixture, 'ArrowRight');
    expect(document.activeElement).toBe(rows(fixture)[0]);
  });

  it('keeps first and last focus boundaries stable through Home, End and arrows', async () => {
    const fixture = flatTree([
      { key: 'a', label: 'Alpha' },
      { key: 'b', label: 'Beta' },
      { key: 'c', label: 'Gamma' },
    ]);
    const output = businessOutputs(fixture);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'End');
    expect(document.activeElement).toBe(rows(fixture)[2]);
    await pressFocused(fixture, 'ArrowDown');
    expect(document.activeElement).toBe(rows(fixture)[2]);
    await pressFocused(fixture, 'Home');
    expect(document.activeElement).toBe(rows(fixture)[0]);
    await pressFocused(fixture, 'ArrowUp');
    expect(document.activeElement).toBe(rows(fixture)[0]);
    expect(output).toEqual([]);
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

  it('typeahead moves real focus to the visible disabled label without changing applied state', async () => {
    const fixture = flatTree([
      { key: 'alpha', label: 'Alpha' },
      { key: 'beta', label: 'Beta', disabled: true },
      { key: 'charlie', label: 'Charlie' },
    ]);
    const emitted = businessOutputs(fixture);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'b');

    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[1]);
    expect(rows(fixture)[1]?.tabIndex).toBe(0);
    expect(rows(fixture)[1]?.getAttribute('aria-disabled')).toBe('true');
    expect(rows(fixture)[1]?.getAttribute('aria-selected')).toBe('false');
    expect(fixture.componentInstance.selection()).toEqual({ mode: 'single', key: null });
    expect(fixture.componentInstance.expandedKeys()).toEqual([]);
    expect(emitted).toEqual([]);
  });

  it('accumulates a case/NFKC-normalized label prefix within the typeahead window', async () => {
    const fixture = flatTree([
      { key: 'alfa', label: 'Alfa' },
      { key: 'beta', label: '  Beta   ' },
      { key: 'berlin', label: 'Berlin' },
      { key: 'bravo', label: 'Bravo' },
    ]);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'Ｂ');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[1]);
    await pressFocused(fixture, 'E');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[2]);
    expect(rows(fixture)[2]?.getAttribute('aria-selected')).toBe('false');
  });

  it('resets the typeahead prefix after the existing 500 ms window', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const fixture = flatTree([
        { key: 'alpha', label: 'Alpha' }, { key: 'beta', label: 'Beta' },
        { key: 'berlin', label: 'Berlin' }, { key: 'echo', label: 'Echo' },
      ]);
      const internal = fixture.componentInstance as unknown as { activeKey(): string | null };
      rows(fixture)[0]!.focus();
      rows(fixture)[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
      expect(internal.activeKey()).toBe('beta');
      vi.advanceTimersByTime(501);
      rows(fixture)[1]!.focus();
      rows(fixture)[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }));
      expect(internal.activeKey()).toBe('echo');
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('searches forward deterministically through duplicate prefixes and wraps to the start', async () => {
    const labels = [
      { key: 'apple', label: 'Apple' }, { key: 'apricot', label: 'Apricot' },
      { key: 'avocado', label: 'Avocado' }, { key: 'beta', label: 'Beta' },
    ];
    const forward = flatTree(labels);
    rows(forward)[0]!.focus();
    await pressFocused(forward, 'a');
    expect(forward.nativeElement.ownerDocument.activeElement).toBe(rows(forward)[1]);

    const wrapped = flatTree(labels);
    rows(wrapped)[2]!.focus();
    await pressFocused(wrapped, 'a');
    expect(wrapped.nativeElement.ownerDocument.activeElement).toBe(rows(wrapped)[0]);
  });

  it('ignores collapsed descendants until expansion is applied without proposing it', async () => {
    const branchNodes: readonly NeuTreeNode<Item, string>[] = [
      { key: 'alpha', data: { id: 'alpha' }, label: 'Alpha' },
      { key: 'hidden', data: { id: 'hidden' }, label: 'Hidden' },
      { key: 'bravo', data: { id: 'bravo' }, label: 'Bravo' },
    ];
    const fixture = create({
      nodes: branchNodes,
      hierarchy: { revision: 1, roots: ['alpha', 'bravo'], children: [
        { parentKey: 'alpha', state: 'loaded', keys: ['hidden'] },
      ] },
      selection: { mode: 'single', key: null },
    });
    const emitted = businessOutputs(fixture);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'h');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[0]);
    expect(rows(fixture)).toHaveLength(2);
    expect(emitted).toEqual([]);

    fixture.componentRef.setInput('expandedKeys', ['alpha']);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 501));
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'h');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[1]);
    expect(rows(fixture)[1]?.getAttribute('aria-level')).toBe('2');
    expect(emitted).toEqual([]);
  });

  it('leaves focus stable on no match and does not let modified/navigation keys pollute the prefix', async () => {
    const fixture = flatTree([
      { key: 'alpha', label: 'Alpha' }, { key: 'beta', label: 'Beta' },
    ]);
    const emitted = businessOutputs(fixture);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'z');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[0]);
    expect(emitted).toEqual([]);

    const clean = flatTree([
      { key: 'alpha', label: 'Alpha' }, { key: 'beta', label: 'Beta' },
    ]);
    rows(clean)[0]!.focus();
    await pressFocused(clean, 'b', { ctrlKey: true });
    await pressFocused(clean, 'b', { altKey: true });
    await pressFocused(clean, 'b', { metaKey: true });
    await pressFocused(clean, 'ArrowDown');
    await pressFocused(clean, 'Home');
    await pressFocused(clean, 'b');
    expect(clean.nativeElement.ownerDocument.activeElement).toBe(rows(clean)[1]);
  });

  it('uses the replaced visible projection while a prefix is pending', async () => {
    const fixture = flatTree([
      { key: 'alpha', label: 'Alpha' }, { key: 'beta', label: 'Beta' },
      { key: 'charlie', label: 'Charlie' },
    ]);
    const emitted = businessOutputs(fixture);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'b');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[1]);

    fixture.componentRef.setInput('nodes', [
      { key: 'alpha', label: 'Alpha', data: { id: 'alpha' } },
      { key: 'beta', label: 'Bravo', data: { id: 'beta' } },
      { key: 'berlin', label: 'Berlin', data: { id: 'berlin' } },
    ]);
    fixture.componentRef.setInput('hierarchy', {
      revision: 2, roots: ['alpha', 'beta', 'berlin'], children: [],
    });
    fixture.detectChanges();
    await pressFocused(fixture, 'e');
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(rows(fixture)[2]);
    expect(rows(fixture)[2]?.textContent).toContain('Berlin');
    expect(emitted).toEqual([]);
  });

  it('finds an offscreen loaded visible node in virtual mode and mounts its focus target', async () => {
    const labels = Array.from({ length: 100 }, (_, index) => ({
      key: String(index), label: index === 50 ? 'Beta' : `Item ${index}`,
    }));
    const fixture = flatTree(labels);
    fixture.componentRef.setInput('virtualization', { itemSize: 40, viewportHeight: 200, buffer: 2 });
    fixture.detectChanges();
    const emitted = businessOutputs(fixture);
    expect(rows(fixture).length).toBeLessThan(10);
    rows(fixture)[0]!.focus();
    await pressFocused(fixture, 'b');
    const target = fixture.nativeElement.querySelector('[data-neu-tree-index="50"]') as HTMLElement;
    expect(target).not.toBeNull();
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(target);
    expect(rows(fixture).length).toBeLessThan(10);
    expect(emitted).toEqual([]);
  });

  it('does not take character keys from an interactive node template', async () => {
    @Component({
      imports: [NeuTreeComponent, NeuTreeNodeDirective],
      template: `<neu-tree [nodes]="nodes" [hierarchy]="hierarchy">
        <ng-template neuTreeNode><input aria-label="Node editor" /></ng-template>
      </neu-tree>`,
    })
    class TemplateHost {
      readonly nodes = [
        { key: 'alpha', label: 'Alpha', data: { id: 'alpha' } },
        { key: 'beta', label: 'Beta', data: { id: 'beta' } },
      ];
      readonly hierarchy = { revision: 1, roots: ['alpha', 'beta'], children: [] };
    }
    const fixture = TestBed.createComponent(TemplateHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
    fixture.detectChanges();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(input);
  });

  it('clears pending typeahead timers and focus frames through 100 destroy cycles', async () => {
    try {
      const schedule = vi.spyOn(globalThis, 'setTimeout');
      const cancel = vi.spyOn(globalThis, 'clearTimeout');
      const allEmitted: unknown[][] = [];
      for (let index = 0; index < 100; index += 1) {
        const fixture = flatTree([
          { key: 'alpha', label: 'Alpha' }, { key: 'beta', label: 'Beta' },
        ]);
        const emitted = businessOutputs(fixture);
        allEmitted.push(emitted);
        rows(fixture)[0]!.focus();
        rows(fixture)[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }));
        let bufferTimer = -1;
        for (let call = schedule.mock.calls.length - 1; call >= 0; call -= 1) {
          if (schedule.mock.calls[call]?.[1] === 500) { bufferTimer = call; break; }
        }
        expect(bufferTimer).toBeGreaterThanOrEqual(0);
        const handle = schedule.mock.results[bufferTimer]?.value;
        fixture.destroy();
        expect(cancel).toHaveBeenCalledWith(handle);
        expect(emitted).toEqual([]);
      }
      await new Promise((resolve) => setTimeout(resolve, 501));
      expect(allEmitted.every((events) => events.length === 0)).toBe(true);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('renders checkbox mixed for a selected known node with unloaded descendants', () => {
    const fixture = create({ selection: { mode: 'checkbox', keys: ['disabled'] } });
    expect(rows(fixture)[1]?.getAttribute('aria-checked')).toBe('mixed');
    expect(rows(fixture)[1]?.querySelector('input[type="checkbox"]')).not.toBeNull();
  });

  it('uses Neural checkbox visuals while keeping selection controlled and one tree tab stop', () => {
    const fixture = create({ selection: { mode: 'checkbox', keys: [] } });
    const row = rows(fixture)[0]!;
    const control = row.querySelector('neu-checkbox')!;
    const native = control.querySelector<HTMLInputElement>('input')!;
    const events: unknown[] = [];
    fixture.componentInstance.selectionChange.subscribe((value) => events.push(value));
    expect(control.querySelector('.neu-checkbox__box')).not.toBeNull();
    expect(native.tabIndex).toBe(-1);
    expect(native.getAttribute('aria-readonly')).toBeNull();
    expect(row.querySelector('.neu-tree__row')!.getAttribute('aria-disabled')).toBeNull();
    control.querySelector<HTMLElement>('.neu-checkbox__box')!.click();
    fixture.detectChanges();
    expect(events).toHaveLength(1);
    expect(native.checked).toBe(false);
    expect(row.getAttribute('aria-checked')).toBe('false');
    fixture.componentRef.setInput('selection', { mode: 'checkbox', keys: ['root', 'child', 'grandchild'] });
    fixture.detectChanges();
    expect(native.checked).toBe(true);
    expect(row.getAttribute('aria-checked')).toBe('true');
    const disabled = rows(fixture)[1]!.querySelector<HTMLInputElement>('input')!;
    disabled.click();
    expect(events).toHaveLength(1);
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

  it('keeps checked and mixed ARIA states while applying a zero-buffer virtual window', () => {
    const fixture = create({
      expandedKeys: ['root', 'child'],
      selection: { mode: 'checkbox', keys: ['grandchild'] },
    });
    const rowFor = (label: string) => rows(fixture).find((row) => row.querySelector('.neu-tree__row')?.textContent?.includes(label));
    expect(rowFor('Admin portal')?.getAttribute('aria-checked')).toBe('true');
    expect(rowFor('Design')?.getAttribute('aria-checked')).toBe('mixed');
    expect(rowFor('Workspace')?.getAttribute('aria-checked')).toBe('mixed');

    const viewport = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="tree"]')!;
    fixture.componentRef.setInput('virtualization', { itemSize: 20, viewportHeight: 20, buffer: 0 });
    fixture.detectChanges();
    viewport.scrollTop = 40;
    viewport.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(rows(fixture).length).toBeLessThanOrEqual(2);
    expect(rows(fixture)[0]?.textContent).toContain('Admin portal');
    expect(rows(fixture)[0]?.getAttribute('aria-checked')).toBe('true');
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

  it('rejects malformed and foreign drag payloads and emits only a valid move', () => {
    const fixture = create();
    const tree = fixture.componentInstance as unknown as {
      dragData(key: string): unknown;
      dropTarget(key: string, position: 'before' | 'inside' | 'after'): unknown;
      acceptDrop(data: unknown, target: unknown): boolean;
      onDrop(event: unknown): void;
    };
    const moves: unknown[] = [];
    fixture.componentInstance.nodeMove.subscribe((move) => moves.push(move));
    const data = tree.dragData('child');
    const target = tree.dropTarget('root', 'after');
    expect(tree.acceptDrop(data, target)).toBe(false);
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();
    for (const invalid of [null, false, 0, {}, { key: 'child' }, { owner: {}, key: 'child' }]) {
      expect(tree.acceptDrop(invalid, target)).toBe(false);
    }
    for (const invalid of [null, false, 0, {}, { key: 'disabled' },
      { key: 'disabled', position: 'middle' }]) {
      expect(tree.acceptDrop(data, invalid)).toBe(false);
    }
    expect(tree.acceptDrop({ owner: {}, key: 'child' }, target)).toBe(false);
    expect(tree.acceptDrop(data, tree.dropTarget('child', 'inside'))).toBe(false);
    tree.onDrop(null);
    tree.onDrop({ data, targetData: { key: 'disabled', position: 'middle' } });
    expect(moves).toEqual([]);
    expect(tree.acceptDrop(data, target)).toBe(true);
    tree.onDrop({ data, targetData: target });
    expect(moves).toHaveLength(1);
    expect(moves[0]).toMatchObject({ sourceKey: 'child', targetKey: 'root', position: 'after' });
  });

  it('keeps empty-tree focus and virtual scrolling bounded', () => {
    const fixture = create({ nodes: [], hierarchy: {
      revision: 1, roots: [], children: [],
    } });
    const tree = fixture.componentInstance as unknown as {
      tabbableKey(): string | null;
      virtualRange(): { start: number; end: number; total: number };
      focusIndex(index: number): void;
      onScroll(event: Event): void;
    };
    expect(tree.tabbableKey()).toBeNull();
    expect(tree.virtualRange()).toEqual({ start: 0, end: 0, total: 0 });
    tree.focusIndex(9);
    tree.onScroll(new Event('scroll'));
    expect(tree.tabbableKey()).toBeNull();
    fixture.componentRef.setInput('virtualization', { itemSize: 0, viewportHeight: 0, buffer: -1 });
    fixture.detectChanges();
    expect(tree.virtualRange()).toEqual({ start: 0, end: 0, total: 0 });
  });

  it('returns unchecked state for an unknown checkbox key', () => {
    const fixture = create();
    const tree = fixture.componentInstance as any;
    expect(tree.checkboxState('missing')).toBe('unchecked');
    expect(tree.checkboxAria('missing')).toBe('false');
  });

  it('ignores retry requests for a relation without an error', () => {
    const fixture = create();
    const requests = vi.fn();
    fixture.componentInstance.childrenRequest.subscribe(requests);
    (fixture.componentInstance as any).onRetryClick('root', new MouseEvent('click'));
    expect(requests).not.toHaveBeenCalled();
  });

  it('keeps nested interactive controls from selecting the enclosing row', () => {
    const fixture = create({ selection: { mode: 'single', key: null } });
    const tree = fixture.componentInstance as any;
    const row = rows(fixture)[0]!;
    const button = row.querySelector('button')!;
    const proposals = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(proposals);
    tree.onContentClick(tree.visibleNodes()[0], { target: button, currentTarget: row } as unknown as MouseEvent);
    expect(proposals).not.toHaveBeenCalled();
    expect(tree.isInteractiveDescendant(button, row)).toBe(true);
    expect(tree.isInteractiveDescendant(row, row)).toBe(false);
  });

  it('drops the remembered focus visit when focus leaves the tree', () => {
    const fixture = create();
    const tree = fixture.componentInstance as any;
    tree.onNodeFocus('root');
    expect(tree.hadTreeFocus).toBe(true);
    const external = document.createElement('button');
    tree.onFocusOut(new FocusEvent('focusout', { relatedTarget: external }));
    expect(tree.hadTreeFocus).toBe(false);
  });

  it('refuses expansion for unknown and known leaf nodes', () => {
    const fixture = create();
    const tree = fixture.componentInstance as any;
    const proposals = vi.fn();
    fixture.componentInstance.expandedKeysChange.subscribe(proposals);
    tree.proposeExpansion('missing', 'keyboard');
    tree.proposeExpansion('grandchild', 'keyboard');
    expect(proposals).not.toHaveBeenCalled();
  });

  it('moves a virtual focus target into view when it falls beyond the window', () => {
    const fixture = flatTree(Array.from({ length: 10 }, (_, index) => ({ key: String(index), label: `Row ${index}` })));
    fixture.componentRef.setInput('virtualization', { itemSize: 20, viewportHeight: 20, buffer: 0 });
    fixture.detectChanges();
    const tree = fixture.componentInstance as any;
    tree.focusIndex(8);
    expect(tree.scrollTop()).toBe(160);
    expect(tree.activeKey()).toBe('8');
  });

  it('uses the default virtual buffer when none is configured', () => {
    const fixture = flatTree(Array.from({ length: 10 }, (_, index) => ({ key: String(index), label: `Row ${index}` })));
    fixture.componentRef.setInput('virtualization', { itemSize: 20, viewportHeight: 20 });
    fixture.detectChanges();
    const tree = fixture.componentInstance as any;
    tree.scrollTop.set(100);
    expect(tree.virtualRange()).toEqual({ start: 2, end: 9, total: 10 });
  });
});
