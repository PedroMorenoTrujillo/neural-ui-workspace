import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTieredLevelComponent, type NeuTieredOwner } from './neu-tiered-level.component';
import type { NeuMenuItem } from '@neural-ui/core/menu-shared';

const leaf: NeuMenuItem = { key: 'leaf', label: 'Leaf', shortcut: '⌘L' };
const branch: NeuMenuItem = { key: 'branch', label: 'Branch', children: [leaf] };

function create(items: readonly NeuMenuItem[] = [branch, leaf]) {
  let direction: 'ltr' | 'rtl' = 'ltr';
  const expanded = new Set<string>();
  const owner: NeuTieredOwner = {
    id: 'menu-owner',
    overlayReady: () => true,
    isExpanded: (key) => expanded.has(key),
    openBranch: vi.fn((_ancestors, key) => expanded.add(key)),
    closeBranch: vi.fn((key) => expanded.delete(key)),
    closeDeepest: vi.fn(),
    activateLeaf: vi.fn(),
    direction: () => direction,
  };
  const fixture = TestBed.createComponent(NeuTieredLevelComponent);
  fixture.componentRef.setInput('owner', owner);
  fixture.componentRef.setInput('levelId', 'root');
  fixture.componentRef.setInput('items', items);
  fixture.detectChanges();
  return { fixture, level: fixture.componentInstance, owner, expanded, setDirection: (next: 'ltr' | 'rtl') => { direction = next; } };
}

describe('tiered menu level branch behavior', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('renders visible shortcuts and branch controls while hiding invisible items', () => {
    const { fixture } = create([
      { key: 'hidden', label: 'Hidden', visible: false },
      { key: 'separator', label: '', separator: true },
      branch,
      leaf,
    ]);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).not.toContain('Hidden');
    expect(root.querySelectorAll('[role="separator"]')).toHaveLength(1);
    expect(root.querySelector('.neu-menu__shortcut')?.textContent).toBe('⌘L');
    expect(root.querySelector('[aria-haspopup="menu"]')).not.toBeNull();
  });

  it('reverses primary and fallback submenu positions for RTL', () => {
    const { level, setDirection } = create();
    expect(level.positions()[0]).toMatchObject({ originX: 'end', overlayX: 'start' });
    setDirection('rtl');
    expect(level.positions()[0]).toMatchObject({ originX: 'start', overlayX: 'end' });
    expect(level.positions()[1]).toMatchObject({ originX: 'end', overlayX: 'start' });
  });

  it('opens a branch on pointer entry only while it is enabled and collapsed', () => {
    const { level, owner, expanded } = create();
    level.onPointerEnter({ ...branch, disabled: true });
    level.onPointerEnter(leaf);
    expect(owner.openBranch).not.toHaveBeenCalled();
    level.onPointerEnter(branch);
    expect(owner.openBranch).toHaveBeenCalledExactlyOnceWith([], 'branch');
    level.onPointerEnter(branch);
    expect(owner.openBranch).toHaveBeenCalledTimes(1);
    expect(expanded.has('branch')).toBe(true);
  });

  it('activates a leaf and ignores a disabled click', () => {
    const { level, owner } = create();
    const event = new MouseEvent('click');
    level.onClick({ ...leaf, disabled: true }, event);
    expect(owner.activateLeaf).not.toHaveBeenCalled();
    level.onClick(leaf, event);
    expect(owner.activateLeaf).toHaveBeenCalledExactlyOnceWith(leaf, event);
  });

  it('opens a child branch from the forward arrow and closes it from the parent arrow', () => {
    const { fixture, level, owner, setDirection } = create();
    const open = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    level.onKeydown(branch, 0, open);
    expect(open.defaultPrevented).toBe(true);
    expect(owner.openBranch).toHaveBeenCalledExactlyOnceWith([], 'branch');
    fixture.componentRef.setInput('parentKey', 'branch');
    fixture.componentRef.setInput('parentTriggerId', 'root-item-branch');
    fixture.detectChanges();
    setDirection('rtl');
    const close = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    level.onKeydown(leaf, 1, close);
    expect(close.defaultPrevented).toBe(true);
    expect(owner.closeBranch).toHaveBeenCalledWith('branch');
  });

  it('closes the deepest branch on root Escape and encodes keys in element IDs', () => {
    const { level, owner } = create();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    level.onKeydown(leaf, 1, escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(owner.closeDeepest).toHaveBeenCalledOnce();
    expect(level.childPath('leaf')).toEqual(['leaf']);
    expect(level.triggerId('a/b')).not.toContain('/');
    expect(level.submenuId('leaf')).toContain('-submenu');
  });

  it('opens a branch on click once and toggles it with keyboard activation', () => {
    const { level, owner, expanded } = create();
    level.onClick(branch, new MouseEvent('click'));
    level.onClick(branch, new MouseEvent('click'));
    expect(owner.openBranch).toHaveBeenCalledOnce();
    expect(expanded.has('branch')).toBe(true);
    const close = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    level.onKeydown(branch, 0, close);
    expect(owner.closeBranch).toHaveBeenCalledWith('branch');
    const reopen = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    level.onKeydown(branch, 0, reopen);
    expect(owner.openBranch).toHaveBeenCalledTimes(2);
  });

  it('activates a leaf by keyboard while preserving unrelated keys', () => {
    const { level, owner } = create();
    const unrelated = new KeyboardEvent('keydown', { key: 'F1', cancelable: true });
    level.onKeydown(leaf, 1, unrelated);
    expect(unrelated.defaultPrevented).toBe(false);
    const activate = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    level.onKeydown(leaf, 1, activate);
    expect(owner.activateLeaf).toHaveBeenCalledExactlyOnceWith(leaf, activate);
    expect(level.triggerId('')).toContain('empty');
  });

  it('closes a child level on Escape even without a focus-return target', () => {
    const { fixture, level, owner } = create();
    fixture.componentRef.setInput('parentKey', 'branch');
    fixture.detectChanges();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    level.onKeydown(leaf, 1, escape);
    expect(escape.defaultPrevented).toBe(true);
    expect(owner.closeBranch).toHaveBeenCalledWith('branch');
  });
});
