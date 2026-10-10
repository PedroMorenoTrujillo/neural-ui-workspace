import { describe, expect, it, vi } from 'vitest';
import { NeuTreeNavigationController } from './neu-tree-navigation-controller';

const items = [
  { key: 'root', label: 'Root', level: 1, hasChildren: true, expanded: true },
  { key: 'child', label: 'Child', level: 2, parentKey: 'root' },
  { key: 'disabled', label: 'Disabled', level: 2, parentKey: 'root', disabled: true },
  { key: 'sibling', label: 'Sibling', level: 1 },
];

function keyEvent(key: string) {
  return { key, altKey: false, ctrlKey: false, metaKey: false, preventDefault: vi.fn() };
}

describe('NeuTreeNavigationController', () => {
  it('owns roving focus, skips disabled nodes and does not loop', () => {
    const controller = new NeuTreeNavigationController();
    expect(controller.setItems(items)).toBe(0);
    expect(controller.handleKey(keyEvent('ArrowDown')).activeKey).toBe('child');
    expect(controller.handleKey(keyEvent('ArrowDown')).activeKey).toBe('sibling');
    expect(controller.handleKey(keyEvent('ArrowDown')).activeKey).toBe('sibling');
    expect(controller.handleKey(keyEvent('Home')).activeKey).toBe('root');
    expect(controller.handleKey(keyEvent('End')).activeKey).toBe('sibling');
  });

  it('moves into children, collapses parents and returns to a parent', () => {
    const controller = new NeuTreeNavigationController();
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('ArrowRight')).activeKey).toBe('child');
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('root');
    expect(controller.handleKey(keyEvent('ArrowLeft')).action).toBe('collapse');

    controller.setItems([{ ...items[0], expanded: false }, items[3]]);
    expect(controller.handleKey(keyEvent('ArrowRight')).action).toBe('expand');
  });

  it('mirrors hierarchy keys in RTL and activates with Enter or Space', () => {
    const controller = new NeuTreeNavigationController({ direction: 'rtl' });
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('child');
    expect(controller.handleKey(keyEvent('Enter')).action).toBe('activate');
    expect(controller.handleKey(keyEvent(' ')).action).toBe('activate');
  });

  it('supports typeahead and reconciles dynamic visible nodes by key', () => {
    const controller = new NeuTreeNavigationController({ typeaheadResetMs: 10 });
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('s'), 100).activeKey).toBe('sibling');
    controller.setItems([items[3], items[0]]);
    expect(controller.activeKey).toBe('sibling');
    controller.setItems([items[0]]);
    expect(controller.activeKey).toBe('root');
  });

  it('is safe for empty and all-disabled collections and reports unhandled keys', () => {
    const controller = new NeuTreeNavigationController({ typeahead: false });
    expect(controller.setItems([])).toBe(-1);
    expect(controller.tabIndexFor(0)).toBe(-1);
    expect(controller.handleKey(keyEvent('Escape')).handled).toBe(false);
    expect(controller.setItems([items[2]])).toBe(-1);
    expect(controller.setActiveIndex(4)).toBe(-1);
    expect(controller.setActiveKey('missing')).toBe(-1);
    expect(controller.handleKey(keyEvent('Enter')).action).toBe('none');
  });

  it('moves upward, ignores missing children and finds the nearest enabled node', () => {
    const controller = new NeuTreeNavigationController();
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('End')).activeKey).toBe('sibling');
    expect(controller.handleKey(keyEvent('ArrowUp')).activeKey).toBe('child');
    expect(controller.handleKey(keyEvent('ArrowRight')).activeKey).toBe('child');
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('root');

    controller.setActiveKey('sibling');
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('sibling');
    controller.setItems([items[0], { ...items[1], disabled: true }, items[2]]);
    expect(controller.activeKey).toBe('root');
    expect(controller.handleKey(keyEvent('End')).activeKey).toBe('root');
  });

  it('continues typeahead within its window and resets after the timeout', () => {
    const controller = new NeuTreeNavigationController({ typeaheadResetMs: 10 });
    controller.setItems([
      { key: 'alpha', label: 'Alpha', level: 1 },
      { key: 'sable', label: 'Sable', level: 1 },
      { key: 'salmon', label: 'Salmon', level: 1 },
      { key: 'beta', label: 'Beta', level: 1 },
    ]);
    expect(controller.handleKey(keyEvent('s'), 100).activeKey).toBe('sable');
    expect(controller.handleKey(keyEvent('a'), 105).activeKey).toBe('salmon');
    expect(controller.handleKey(keyEvent('b'), 120).activeKey).toBe('beta');
  });
});
