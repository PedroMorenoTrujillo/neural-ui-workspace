import { describe, expect, it, vi } from 'vitest';
import { activateNeuMenuAction, resolveNeuMenuAction } from './neu-menu-action';
import {
  adaptNeuContextMenuItems,
  adaptNeuMenuItems,
  adaptNeuSplitButtonActions,
} from './neu-menu-adapters';
import { NeuRovingMenuController } from './neu-roving-menu-controller';

function keyEvent(key: string) {
  return { key, altKey: false, ctrlKey: false, metaKey: false, preventDefault: vi.fn() };
}

describe('menu action resolver', () => {
  it('resolves commands, links, presentation state and safe blank targets', () => {
    const command = vi.fn();
    const action = resolveNeuMenuAction({
      key: 'docs',
      label: 'Docs',
      icon: 'bookmark',
      badge: 3,
      active: true,
      url: 'https://example.test',
      target: '_blank',
      command,
    });
    expect(action).toMatchObject({
      key: 'docs',
      label: 'Docs',
      icon: 'bookmark',
      badge: 3,
      active: true,
      kind: 'external',
      rel: 'noopener noreferrer',
    });
    const event = new Event('click', { cancelable: true });
    expect(activateNeuMenuAction(action, event)).toBe(true);
    expect(command).toHaveBeenCalledWith({ originalEvent: event, item: action.original });
  });

  it('prefers router navigation and blocks disabled actions', () => {
    const action = resolveNeuMenuAction({
      id: 'settings',
      label: 'Settings',
      routerLink: ['/settings'],
      disabled: true,
    });
    const event = new Event('click', { cancelable: true });
    expect(action).toMatchObject({ key: 'settings', kind: 'router', disabled: true });
    expect(activateNeuMenuAction(action, event)).toBe(false);
    expect(event.defaultPrevented).toBe(true);
  });

  it('adapts legacy menu-family contracts without mutating them', () => {
    const menu = [{ key: 'copy', label: 'Copy' }];
    const context = [{ key: 'delete', label: 'Delete', tone: 'danger' as const }];
    const split = [{ id: 'save', label: 'Save', divider: true }];
    expect(adaptNeuMenuItems(menu)[0]).toMatchObject({ key: 'copy' });
    expect(adaptNeuContextMenuItems(context)[0]).toMatchObject({ key: 'delete' });
    expect(adaptNeuSplitButtonActions(split)[0]).toMatchObject({ key: 'save', separator: true });
    expect(menu).toEqual([{ key: 'copy', label: 'Copy' }]);
    expect(context[0]).toHaveProperty('tone', 'danger');
    expect(split[0]).toHaveProperty('divider', true);
  });

  it('applies resolver fallbacks and blocks hidden separators', () => {
    const fallback = resolveNeuMenuAction({}, 4);
    expect(fallback).toMatchObject({ key: 'item-4', label: '', kind: 'none', visible: true });
    const identified = resolveNeuMenuAction({ id: 'identified', target: '_self' });
    expect(identified).toMatchObject({ key: 'identified', rel: undefined });
    for (const item of [{ separator: true }, { visible: false }]) {
      const event = new Event('click', { cancelable: true });
      expect(activateNeuMenuAction(resolveNeuMenuAction(item), event)).toBe(false);
      expect(event.defaultPrevented).toBe(true);
    }
  });
});

describe('NeuRovingMenuController', () => {
  const items = [
    { key: 'one', label: 'One' },
    { key: 'disabled', label: 'Disabled', disabled: true },
    { key: 'three', label: 'Three' },
    { key: 'hidden', label: 'Hidden', hidden: true },
  ];

  it('skips ineligible items and supports arrows, Home, End and activation', () => {
    const controller = new NeuRovingMenuController({ orientation: 'vertical' });
    expect(controller.setItems(items)).toBe(0);
    expect(controller.handleKey(keyEvent('ArrowDown')).activeKey).toBe('three');
    expect(controller.handleKey(keyEvent('End')).activeKey).toBe('three');
    expect(controller.handleKey(keyEvent('Home')).activeKey).toBe('one');
    expect(controller.handleKey(keyEvent('Enter')).activate).toBe(true);
  });

  it('reverses horizontal navigation in RTL and can avoid looping', () => {
    const controller = new NeuRovingMenuController({
      orientation: 'horizontal',
      direction: 'rtl',
      loop: false,
    });
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('three');
    expect(controller.handleKey(keyEvent('ArrowLeft')).activeKey).toBe('three');
    expect(controller.handleKey(keyEvent('ArrowRight')).activeKey).toBe('one');
  });

  it('supports typeahead and reconciles dynamic items by stable key', () => {
    const controller = new NeuRovingMenuController();
    controller.setItems(items);
    expect(controller.handleKey(keyEvent('t'), 100).activeKey).toBe('three');
    controller.setItems([{ key: 'zero', label: 'Zero' }, ...items]);
    expect(controller.activeKey).toBe('three');
    controller.setItems([{ key: 'zero', label: 'Zero' }]);
    expect(controller.activeKey).toBe('zero');
  });

  it('reports unhandled keys and an empty collection safely', () => {
    const controller = new NeuRovingMenuController();
    controller.setItems([]);
    const event = keyEvent('Escape');
    expect(controller.handleKey(event)).toEqual({
      handled: false,
      activeIndex: -1,
      activeKey: null,
      activate: false,
    });
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(controller.tabIndexFor(0)).toBe(-1);
  });

  it('covers direct selection, all-ineligible collections and typeahead guards', () => {
    const controller = new NeuRovingMenuController({ typeahead: false, loop: false });
    controller.setItems(items);
    expect(controller.activeItem?.key).toBe('one');
    expect(controller.setActiveKey('three')).toBe(2);
    expect(controller.setActiveKey('missing')).toBe(2);
    expect(controller.setActiveIndex(-1)).toBe(2);
    expect(controller.handleKey(keyEvent('ArrowDown')).activeKey).toBe('three');
    expect(controller.handleKey(keyEvent('ArrowUp')).activeKey).toBe('one');
    expect(controller.handleKey({ ...keyEvent('x'), ctrlKey: true }).handled).toBe(false);
    expect(controller.handleKey(keyEvent(' ')).activate).toBe(true);
    expect(controller.setItems([{ key: 'off', label: 'Off', disabled: true }])).toBe(-1);
    expect(controller.activeItem).toBeNull();
    expect(controller.handleKey(keyEvent('End')).activeIndex).toBe(-1);
    expect(controller.handleKey(keyEvent('ArrowDown')).activeIndex).toBe(-1);
    (controller as any).activeIndex = 5;
    expect(controller.activeKey).toBeNull();
    expect(controller.activeItem).toBeNull();
  });

  it('resets and accumulates typeahead searches without selecting separators', () => {
    const controller = new NeuRovingMenuController({ typeaheadResetMs: 10 });
    controller.setItems([
      { key: 'alpha', label: 'Alpha' },
      { key: 'separator', label: 'Beta', separator: true },
      { key: 'alpine', label: 'Alpine' },
    ]);
    expect(controller.handleKey(keyEvent('a'), 100).activeKey).toBe('alpine');
    expect(controller.handleKey(keyEvent('l'), 105).activeKey).toBe('alpha');
    expect(controller.handleKey(keyEvent('z'), 200).activeKey).toBe('alpha');
  });
});
