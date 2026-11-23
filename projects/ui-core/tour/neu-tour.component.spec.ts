import { vi } from 'vitest';
import { DOCUMENT } from '@angular/common';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuTourComponent } from './neu-tour.component';

describe('NeuTourComponent', () => {
  it('anchors late targets and proposes navigation and Escape dismissal', async () => {
    const fixture = TestBed.createComponent(NeuTourComponent);
    const document = TestBed.inject(DOCUMENT);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const target = document.createElement('button');
    target.id = 'tour-test-target';
    fixture.componentRef.setInput('steps', [
      { title: 'First step', description: 'Explore the first action.', targetId: target.id },
      { title: 'Next step', description: 'Explore the next action.', targetId: target.id },
    ]);
    fixture.componentRef.setInput('open', true);
    const missing: string[] = [];
    const indexes: number[] = [];
    const dismissed: boolean[] = [];
    fixture.componentInstance.targetMissing.subscribe((id) => missing.push(id));
    fixture.componentInstance.indexChange.subscribe((index) => indexes.push(index));
    fixture.componentInstance.dismissed.subscribe(() => dismissed.push(true));

    try {
      await fixture.whenStable();
      expect(missing).toEqual([target.id]);
      document.body.append(target);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      const dialog = overlay.querySelector<HTMLElement>('[role=dialog]');
      expect(dialog?.textContent).toContain('First step');
      expect(overlay.querySelector('.neu-tour__marker')).toBeTruthy();
      [...(dialog?.querySelectorAll('button') ?? [])]
        .find((button) => button.textContent?.trim() === 'Next')
        ?.click();
      expect(indexes).toEqual([1]);
      expect(fixture.componentInstance.index()).toBe(0);

      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(dismissed).toEqual([true]);
      expect(fixture.componentInstance.open()).toBe(true);
    } finally {
      fixture.destroy();
      target.remove();
    }
  });
});

describe('NeuTourComponent localized lifecycle', () => {
  it('uses Spanish actions, follows controlled navigation, completes and restores focus', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: NEURAL_LOCALE, useValue: 'es-ES' }] });
    const fixture = TestBed.createComponent(NeuTourComponent);
    const document = TestBed.inject(DOCUMENT);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const trigger = document.createElement('button');
    trigger.id = 'tour-localized-target';
    document.body.append(trigger);
    trigger.focus();
    fixture.componentRef.setInput('steps', [
      { title: 'Primero', description: 'Descripción inicial', targetId: trigger.id },
      { title: 'Segundo', description: 'Descripción final', targetId: trigger.id },
    ]);
    fixture.componentRef.setInput('open', true);
    const indexes: number[] = [];
    let completed = 0;
    fixture.componentInstance.indexChange.subscribe((index) => indexes.push(index));
    fixture.componentInstance.completed.subscribe(() => completed++);
    const action = (label: string) =>
      [...overlay.querySelectorAll('button')].find(
        (button) => button.textContent?.trim() === label,
      )!;
    try {
      await fixture.whenStable();
      expect(action('Omitir')).toBeTruthy();
      action('Siguiente').click();
      expect(indexes).toEqual([1]);
      fixture.componentRef.setInput('index', 1);
      await fixture.whenStable();
      expect(overlay.querySelector('h2')?.textContent).toBe('Segundo');
      action('Anterior').click();
      expect(indexes).toEqual([1, 0]);
      action('Terminar').click();
      expect(completed).toBe(1);
      fixture.componentRef.setInput('open', false);
      await fixture.whenStable();
      expect(overlay.querySelector('[role=dialog]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    } finally {
      fixture.destroy();
      trigger.remove();
    }
  });

  it('closes when a target disappears and reopens when a replacement is inserted', async () => {
    const fixture = TestBed.createComponent(NeuTourComponent);
    const document = TestBed.inject(DOCUMENT);
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    const target = document.createElement('button');
    target.id = 'tour-replaced-target';
    document.body.append(target);
    fixture.componentRef.setInput('steps', [
      { title: 'Step', description: 'Description', targetId: target.id },
    ]);
    fixture.componentRef.setInput('open', true);
    const missing: string[] = [];
    fixture.componentInstance.targetMissing.subscribe((id) => missing.push(id));
    try {
      await fixture.whenStable();
      expect(overlay.querySelector('[role=dialog]')).toBeTruthy();
      target.remove();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      expect(missing).toEqual([target.id]);
      expect(overlay.querySelector('[role=dialog]')).toBeNull();
      document.body.append(target);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await fixture.whenStable();
      expect(overlay.querySelector('[role=dialog]')).toBeTruthy();
    } finally {
      fixture.destroy();
      target.remove();
    }
  });
});

describe('NeuTourComponent target resizing', () => {
  it('updates the highlight and disconnects its resize observer on close', async () => {
    const document = TestBed.inject(DOCUMENT);
    let resized: (() => void) | undefined;
    const observe = vi.fn();
    const disconnect = vi.fn();
    const original = document.defaultView!.ResizeObserver;
    document.defaultView!.ResizeObserver = class {
      constructor(callback: () => void) {
        resized = callback;
      }
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
    } as unknown as typeof ResizeObserver;
    const target = document.createElement('button');
    target.id = 'tour-resize-target';
    document.body.append(target);
    let width = 50;
    vi.spyOn(target, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(20, 30, width, 40),
    );
    const fixture = TestBed.createComponent(NeuTourComponent);
    fixture.componentRef.setInput('steps', [
      { title: 'Resize', description: 'Description', targetId: target.id },
    ]);
    fixture.componentRef.setInput('open', true);
    try {
      await fixture.whenStable();
      expect(observe).toHaveBeenCalledWith(target);
      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      expect(overlay.querySelector<HTMLElement>('.neu-tour__marker')?.style.width).toBe('50px');
      expect(overlay.querySelector('.neu-tour__marker')?.parentElement?.classList.contains('cdk-overlay-backdrop')).toBe(true);
      const pane = overlay.querySelector<HTMLElement>('.cdk-overlay-pane')!;
      vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue(new DOMRect(4, 8, 200, 100));
      width = 250;
      resized!();
      await fixture.whenStable();
      expect(overlay.querySelector<HTMLElement>('.neu-tour__marker')?.style.width).toBe('250px');
      expect(overlay.querySelector<HTMLElement>('.neu-tour__marker')?.style.left).toBe('20px');
      expect(overlay.querySelector<HTMLElement>('.neu-tour__marker')?.style.top).toBe('30px');
      const beforeClose = disconnect.mock.calls.length;
      fixture.componentRef.setInput('open', false);
      await fixture.whenStable();
      expect(disconnect.mock.calls.length).toBeGreaterThan(beforeClose);
    } finally {
      fixture.destroy();
      target.remove();
      document.defaultView!.ResizeObserver = original;
    }
  });
});
