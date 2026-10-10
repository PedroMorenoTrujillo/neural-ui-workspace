import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NeuFocusTrapDirective } from '@neural-ui/core/focus-trap';
import { NeuDialogComponent } from './neu-modal.component';

@Component({
  imports: [NeuDialogComponent],
  template: `
    <button id="origin" (click)="parent.set(true)">Open parent</button>
    @if (parentMounted()) {
      <neu-dialog title="Parent" [open]="parent()" (closeRequested)="parent.set(false)">
        <button id="open-child" (click)="child.set(true)">Open child</button>
        <input id="parent-input" />
      </neu-dialog>
    }
    @if (childMounted()) {
      <neu-dialog title="Child" [open]="child()" (closeRequested)="child.set(false)">
        <button id="open-third" (click)="third.set(true)">Open third</button>
        <input id="child-input" />
        <button id="disabled" disabled>Disabled</button>
        <button id="hidden" hidden>Hidden</button>
        <div inert><input id="inert" /></div>
        @if (dynamic()) { <button id="dynamic">Dynamic</button> }
      </neu-dialog>
    }
    <neu-dialog title="Third" [open]="third()" (closeRequested)="third.set(false)">
      <input id="third-input" />
      <button id="third-last">Last</button>
    </neu-dialog>
  `,
})
class NestedDialogHost {
  readonly parent = signal(false);
  readonly child = signal(false);
  readonly third = signal(false);
  readonly parentMounted = signal(true);
  readonly childMounted = signal(true);
  readonly dynamic = signal(false);
}

describe('CORE-P2-002 nested dialog focus ownership', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }));
  afterEach(() => TestBed.resetTestingModule());

  async function setup() {
    const fixture = TestBed.createComponent(NestedDialogHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const query = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
    const panel = (title: string) =>
      Array.from(fixture.nativeElement.querySelectorAll('[role="dialog"]') as NodeListOf<HTMLElement>)
        .find((node) => node.querySelector('h2')?.textContent === title)!;
    const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); };
    const open = async (id: string) => { query(id).focus(); query(id).click(); await settle(); };
    const press = async (key: string, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
      document.activeElement?.dispatchEvent(event);
      await settle();
      return event;
    };
    const traps = () => fixture.debugElement.queryAll(By.directive(NeuFocusTrapDirective))
      .map((node) => node.injector.get(NeuFocusTrapDirective));
    return { fixture, query, panel, settle, open, press, traps };
  }

  it('enables only the topmost of three traps and restores focus through every Escape', async () => {
    const { fixture, query, panel, open, press, traps } = await setup();
    await open('origin');
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([true]);
    await open('open-child');
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([false, true]);
    await open('open-third');
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([false, false, true]);
    for (const shift of [false, true]) for (let i = 0; i < 8; i++) {
      expect((await press('Tab', shift)).defaultPrevented).toBe(true);
      expect(panel('Third').contains(document.activeElement)).toBe(true);
    }
    await press('Escape');
    expect(fixture.componentInstance.third()).toBe(false);
    expect(fixture.componentInstance.child()).toBe(true);
    expect(document.activeElement).toBe(query('open-third'));
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([false, true]);
    await press('Escape');
    expect(document.activeElement).toBe(query('open-child'));
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([true]);
    await press('Escape');
    expect(document.activeElement).toBe(query('origin'));
    expect(traps()).toEqual([]);
  });

  it('advances from an interior input to a button before wrapping, without native browser defaults', async () => {
    const { query, panel, open, press } = await setup();
    await open('origin');
    await open('open-child');
    await open('open-third');
    await press('Tab');
    expect(document.activeElement).toBe(query('third-input'));
    await press('Tab');
    expect(document.activeElement).toBe(query('third-last'));
    await press('Tab');
    expect(document.activeElement).toBe(panel('Third').querySelector('.neu-dialog__close'));
    await press('Tab', true);
    expect(document.activeElement).toBe(query('third-last'));
  });

  it('restores click triggers even when native button activation does not focus them', async () => {
    const { query, settle, press } = await setup();
    query('origin').click();
    await settle();
    query('open-child').click();
    await settle();
    await press('Escape');
    expect(document.activeElement).toBe(query('open-child'));
    await press('Escape');
    expect(document.activeElement).toBe(query('origin'));
  });

  it('queries dynamic controls live and recovers after the focused control is removed', async () => {
    const { fixture, query, panel, settle, open, press } = await setup();
    await open('origin');
    await open('open-child');
    fixture.componentInstance.dynamic.set(true);
    await settle();
    for (let i = 0; i < 3; i++) await press('Tab');
    expect(document.activeElement).toBe(query('dynamic'));
    fixture.componentInstance.dynamic.set(false);
    await settle();
    await press('Tab');
    expect(document.activeElement).toBe(panel('Child').querySelector('.neu-dialog__close'));
    for (let i = 0; i < 6; i++) {
      await press('Tab', i % 2 === 0);
      expect(panel('Child').contains(document.activeElement)).toBe(true);
      expect(['disabled', 'hidden', 'inert']).not.toContain(document.activeElement?.id);
    }
  });

  it('restores the lower context when the focused upper dialog is destroyed', async () => {
    const { fixture, query, open, settle, traps } = await setup();
    await open('origin');
    await open('open-child');
    fixture.componentInstance.childMounted.set(false);
    await settle();
    expect(document.activeElement).toBe(query('open-child'));
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([true]);
  });

  it('does not restore an underlying trigger when a lower dialog is destroyed under an active upper dialog', async () => {
    const { fixture, panel, open, settle } = await setup();
    await open('origin');
    await open('open-child');
    fixture.componentInstance.parentMounted.set(false);
    await settle();
    expect(panel('Child').contains(document.activeElement)).toBe(true);
  });

  it('restores a lower eligible context when the upper dialog origin becomes hidden or inert', async () => {
    const { query, panel, open, press } = await setup();
    await open('origin');
    await open('open-child');
    query('open-child').hidden = true;
    await press('Escape');
    expect(panel('Parent').contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(query('open-child'));
    query('open-child').hidden = false;
    await open('open-child');
    query('open-child').setAttribute('inert', '');
    await press('Escape');
    expect(panel('Parent').contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(query('open-child'));
  });

  it('does not let a lower queued initial focus steal from an upper dialog opened in the same render', async () => {
    const { fixture, panel, query, settle, traps, press } = await setup();
    query('origin').focus();
    fixture.componentInstance.parent.set(true);
    fixture.componentInstance.child.set(true);
    await settle();
    expect(panel('Child').contains(document.activeElement)).toBe(true);
    expect(traps().map((trap) => trap.neuFocusTrap())).toEqual([false, true]);
    await press('Escape');
    expect(panel('Parent').contains(document.activeElement)).toBe(true);
  });

  it('releases all focus listeners and origin references after rapid nested open/close and destruction', async () => {
    const { fixture, query, open, press, traps } = await setup();
    for (let cycle = 0; cycle < 5; cycle++) {
      await open('origin');
      await open('open-child');
      await open('open-third');
      await press('Escape');
      await press('Escape');
      await press('Escape');
      expect(traps()).toEqual([]);
      expect(document.activeElement).toBe(query('origin'));
    }
    await open('origin');
    await open('open-child');
    const directives = traps();
    const spies = directives.map((trap) => vi.spyOn(trap as any, 'onKeydown'));
    const dialogs = fixture.debugElement.queryAll(By.directive(NeuDialogComponent))
      .map((node) => node.componentInstance as NeuDialogComponent);
    const activationSpies = dialogs.map((dialog) => vi.spyOn(dialog as any, 'captureActivationOrigin'));
    fixture.destroy();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    document.body.click();
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(activationSpies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
    expect(directives.every((trap) => (trap as any).lastFocusedInside === null)).toBe(true);
    expect(dialogs.every((dialog) => (dialog as any).previousActiveElement === null)).toBe(true);
    expect(dialogs.every((dialog) => (dialog as any).activationOrigin === null)).toBe(true);
    expect(dialogs.every((dialog) => (dialog as any).activationOriginCleanup === null)).toBe(true);
    expect(dialogs.every((dialog) => (dialog as any).lowerOverlayOwner === null)).toBe(true);
    expect(dialogs.every((dialog) => (dialog as any).deactivateOverlay === null)).toBe(true);
    expect(document.body.style.overflow).not.toBe('hidden');
  });
});
