import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuFocusTrapDirective } from './neu-focus-trap.directive';

@Component({
  imports: [NeuFocusTrapDirective],
  template: `
    <button data-testid="outside">Outside</button>
    <div data-testid="trap" tabindex="-1" [neuFocusTrap]="enabled()">
      <a data-testid="anchor" href="/docs">Anchor</a>
      <button data-testid="first">First</button>
      <input data-testid="input" />
      <div data-testid="editable" contenteditable="true">Editable</div>
      <button data-testid="disabled" disabled>Disabled</button>
      <button data-testid="aria-disabled" aria-disabled="true">ARIA disabled</button>
      <button data-testid="hidden" hidden>Hidden</button>
      <div inert><button data-testid="inert">Inert</button></div>
      <div style="display: none"><button data-testid="display-none">Display none</button></div>
      <button data-testid="negative" tabindex="-1">Negative</button>
      <details>
        <summary data-testid="closed-summary">Summary</summary>
        <button data-testid="closed-details">Closed details</button>
      </details>
      <fieldset disabled>
        <legend><button data-testid="legend-action">Legend action</button></legend>
        <button data-testid="disabled-fieldset">Disabled fieldset action</button>
      </fieldset>
      <button data-testid="last">Last</button>
      @if (showDynamic()) {
        <button data-testid="dynamic">Dynamic</button>
      }
    </div>
  `,
})
class HostComponent {
  readonly enabled = signal(true);
  readonly showDynamic = signal(false);
}

@Component({
  imports: [NeuFocusTrapDirective],
  template: `
    <div data-testid="outer" neuFocusTrap>
      <button data-testid="outer-first">Outer first</button>
      <div data-testid="inner" neuFocusTrap>
        <button data-testid="inner-first">Inner first</button>
        <button data-testid="inner-last">Inner last</button>
      </div>
      <button data-testid="outer-last">Outer last</button>
    </div>
  `,
})
class NestedHostComponent {}

@Component({
  imports: [NeuFocusTrapDirective],
  template: `
    <div data-testid="empty" tabindex="-1" neuFocusTrap></div>
    <div data-testid="single" neuFocusTrap><button>Only</button></div>
  `,
})
class BoundaryHostComponent {}

describe('NeuFocusTrapDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  async function createHost() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const query = (testId: string) =>
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
    return {
      fixture,
      query,
      trap: query('trap'),
      directive: fixture.debugElement
        .query(By.directive(NeuFocusTrapDirective))
        .injector.get(NeuFocusTrapDirective),
    };
  }

  function pressTab(target: HTMLElement, shiftKey = false): KeyboardEvent {
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
  }

  it('is standalone and does not move focus or invent ARIA on activation', async () => {
    const { query, trap } = await createHost();
    query('outside').focus();

    expect(document.activeElement).toBe(query('outside'));
    expect(trap.getAttribute('role')).toBeNull();
    expect(trap.getAttribute('aria-modal')).toBeNull();
    expect(trap.querySelector('[data-neu-focus-trap-anchor]')).toBeNull();
  });

  it('cycles Tab from the last eligible descendant to the first', async () => {
    const { query } = await createHost();
    query('last').focus();

    const event = pressTab(query('last'));

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('anchor'));
  });

  it('cycles Shift+Tab from the first eligible descendant to the last', async () => {
    const { query } = await createHost();
    query('anchor').focus();

    const event = pressTab(query('anchor'), true);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('last'));
  });

  it('advances both directions inside the eligible range without relying on native Tab eligibility', async () => {
    const { query } = await createHost();
    query('first').focus();

    expect(pressTab(query('first')).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('input'));
    expect(pressTab(query('input'), true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('first'));
  });

  it('discovers dynamic descendants on every keydown without a stale list', async () => {
    const { fixture, directive, query } = await createHost();
    fixture.componentInstance.showDynamic.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const dynamic = query('dynamic');

    expect(directive.focusLast()).toBe(true);
    expect(document.activeElement).toBe(dynamic);
  });

  it('skips disabled, aria-disabled, hidden, inert, display-none and negative-tabindex nodes', async () => {
    const { directive, query } = await createHost();

    expect(directive.focusLast()).toBe(true);
    expect(document.activeElement).toBe(query('last'));
    for (const testId of [
      'disabled',
      'aria-disabled',
      'hidden',
      'inert',
      'display-none',
      'negative',
      'closed-details',
      'disabled-fieldset',
    ]) {
      expect(document.activeElement).not.toBe(query(testId));
    }

    query('closed-summary').focus();
    expect(pressTab(query('closed-summary')).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('legend-action'));
    query('legend-action').focus();
    expect(pressTab(query('legend-action')).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('last'));
  });

  it('supports anchors, native controls, contenteditable and custom tabindex order', async () => {
    const { directive, trap, query } = await createHost();
    query('input').setAttribute('tabindex', '2');
    query('editable').setAttribute('tabindex', '1');
    const custom = document.createElement('div');
    custom.tabIndex = 3;
    custom.dataset['testid'] = 'custom';
    trap.append(custom);

    expect(directive.focusFirst()).toBe(true);
    expect(document.activeElement).toBe(query('editable'));
    expect(directive.focusLast()).toBe(true);
    expect(document.activeElement).toBe(query('last'));
  });

  it('allows autofocus or consumer focus to establish initial focus without fighting it', async () => {
    const { query } = await createHost();
    query('input').setAttribute('autofocus', '');
    query('input').focus();

    expect(document.activeElement).toBe(query('input'));
    expect(pressTab(query('input')).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('closed-summary'));
  });

  it('updates enabled state dynamically and does not restore or move focus when disabled', async () => {
    const { fixture, query } = await createHost();
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    query('last').focus();

    const event = pressTab(query('last'));

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(query('last'));
  });

  it('recovers deterministically after the focused dynamic child is removed', async () => {
    const { fixture, query } = await createHost();
    fixture.componentInstance.showDynamic.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    query('dynamic').focus();

    fixture.componentInstance.showDynamic.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    const event = pressTab(document.body);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(query('anchor'));
  });

  it('owns only unmodified Tab and Shift+Tab', async () => {
    const { directive, query } = await createHost();
    const spy = vi.spyOn(directive, 'focusFirst');
    query('last').focus();

    for (const key of ['ArrowDown', 'Enter', ' ', 'Escape']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      query('last').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    const modifiedTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    query('last').dispatchEvent(modifiedTab);

    expect(modifiedTab.defaultPrevented).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('lets the inner enabled trap own nested boundary cycling', async () => {
    const fixture = TestBed.createComponent(NestedHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const query = (testId: string) =>
      fixture.nativeElement.querySelector(`[data-testid="${testId}"]`) as HTMLElement;
    query('inner-last').focus();

    pressTab(query('inner-last'));

    expect(document.activeElement).toBe(query('inner-first'));
  });

  it('handles empty and single-focusable traps deterministically', async () => {
    const fixture = TestBed.createComponent(BoundaryHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const empty = fixture.nativeElement.querySelector('[data-testid="empty"]') as HTMLElement;
    const single = fixture.nativeElement.querySelector('[data-testid="single"]') as HTMLElement;
    const only = single.querySelector('button')!;

    empty.focus();
    expect(pressTab(empty).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(empty);

    only.focus();
    expect(pressTab(only).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(only);
    expect(pressTab(only, true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(only);
  });

  it('removes its host and removed-focus listeners on destroy', async () => {
    const { fixture, directive, trap, query } = await createHost();
    const spy = vi.spyOn(directive as any, 'onKeydown');
    fixture.componentInstance.showDynamic.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    query('dynamic').focus();
    fixture.componentInstance.showDynamic.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.destroy();

    pressTab(trap);
    pressTab(document.body);

    expect(spy).not.toHaveBeenCalled();
  });
});
