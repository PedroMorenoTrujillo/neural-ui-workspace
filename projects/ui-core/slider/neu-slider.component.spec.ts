import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuSliderComponent } from './neu-slider.component';

function pointer(type: string, pointerId = 1): PointerEvent {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event as PointerEvent;
}

describe('NeuSliderComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  function mount(inputs: Record<string, unknown> = {}) {
    const fixture = TestBed.createComponent(NeuSliderComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      input: fixture.nativeElement.querySelector('input[type="range"]') as HTMLInputElement,
    };
  }

  it('renders the scalar range, label, limits, step, value and ticks', () => {
    const { fixture, input } = mount({
      value: 50,
      minValue: 10,
      maxValue: 90,
      step: 5,
      label: 'Volume',
      showTicks: true,
      unit: '%',
    });
    expect(input.min).toBe('10');
    expect(input.max).toBe('90');
    expect(input.step).toBe('5');
    expect(input.value).toBe('50');
    expect(input.getAttribute('aria-labelledby')).toBe(`${input.id}-label`);
    expect(input.getAttribute('aria-valuetext')).toBe('50%');
    expect(fixture.nativeElement.querySelector('.neu-slider__ticks').textContent).toContain('90%');
  });

  it('writes pointer/input edits to the ModelSignal exactly once per changed value', () => {
    const { component, input } = mount({ value: 10, step: 5 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    input.dispatchEvent(pointer('pointerdown'));
    input.value = '25';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(pointer('pointermove'));
    input.value = '30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(pointer('pointerup'));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(component.value()).toBe(30);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([25, 30]);
  });

  it('snaps to step and clamps input to min/max', () => {
    const { component, input } = mount({ value: 20, minValue: 10, maxValue: 50, step: 10 });
    input.value = '27';
    input.dispatchEvent(new Event('input'));
    expect(component.value()).toBe(30);
    component.onInput({ target: { value: '200' } } as unknown as Event);
    expect(component.value()).toBe(50);
    component.onInput({ target: { value: '-20' } } as unknown as Event);
    expect(component.value()).toBe(10);
  });

  it('supports arrows, PageUp/PageDown and Home/End with one emission per change', () => {
    const { component, input } = mount({ value: 50, minValue: 0, maxValue: 100, step: 5 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    for (const key of ['ArrowRight', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }
    expect(component.value()).toBe(100);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([55, 50, 100, 50, 0, 100]);
  });

  it('blocks pointer, input and keyboard mutation while readonly but remains focusable', () => {
    const { component, input } = mount({ value: 40, readonly: true });
    const changes = vi.fn();
    component.value.subscribe(changes);
    input.dispatchEvent(pointer('pointerdown'));
    input.value = '80';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', cancelable: true }));
    component.focus();
    expect(component.value()).toBe(40);
    expect(input.value).toBe('40');
    expect(input.getAttribute('aria-readonly')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(changes).not.toHaveBeenCalled();
  });

  it('fully disables the native range and ignores direct handlers', () => {
    const { component, input } = mount({ value: 40, disabled: true });
    component.onInput({ target: input } as unknown as Event);
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(input.disabled).toBe(true);
    expect(component.value()).toBe(40);
  });

  it('emits touch only when focus leaves, never on focus or pointerdown', () => {
    const { component, input } = mount();
    const touched = vi.fn();
    component.touch.subscribe(touched);
    input.focus();
    input.dispatchEvent(pointer('pointerdown'));
    expect(touched).not.toHaveBeenCalled();
    input.blur();
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('accepts external writes without echo and reset only clears ephemeral state', () => {
    const { fixture, component, input } = mount({ value: 10 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    input.dispatchEvent(pointer('pointerdown', 7));
    fixture.componentRef.setInput('value', 75);
    fixture.detectChanges();
    component.reset();
    expect(component.value()).toBe(75);
    expect(input.value).toBe('75');
    expect(changes).not.toHaveBeenCalled();
  });

  it('projects official validation and accessibility state without owning it', () => {
    const { fixture, input } = mount({
      ariaLabel: 'Brightness',
      ariaDescribedBy: 'slider-help',
      required: true,
      invalid: true,
      pending: true,
    });
    expect(input.getAttribute('aria-label')).toBe('Brightness');
    expect(input.getAttribute('aria-describedby')).toBe('slider-help');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.neu-slider--invalid')).toBeTruthy();
  });

  it('derives a clamped visual fill without rewriting an external value', () => {
    const { component } = mount({ value: 150, minValue: 0, maxValue: 100 });
    expect(component.value()).toBe(150);
    expect(component.visualValue()).toBe(100);
    expect(component.fillPercent()).toBe(100);
  });

  it('renders two distinct range sliders with applied bounds and a minimum gap', () => {
    const { fixture, component } = mount({
      value: [20, 80] as const,
      minValue: 0,
      maxValue: 100,
      step: 10,
      minStepsBetweenThumbs: 2,
      label: 'Price',
    });
    const thumbs = Array.from(fixture.nativeElement.querySelectorAll('[role="slider"]')) as HTMLElement[];
    expect(thumbs).toHaveLength(2);
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-label'))).toEqual([
      'Price minimum', 'Price maximum',
    ]);
    expect(thumbs.map((thumb) => thumb.getAttribute('aria-valuenow'))).toEqual(['20', '80']);
    expect(thumbs[0].getAttribute('aria-valuemax')).toBe('60');
    expect(thumbs[1].getAttribute('aria-valuemin')).toBe('40');
    expect(component.resolvedGap()).toBe(20);
  });

  it('keeps thumb identity stable and clamps crossing on keyboard edits', () => {
    const { fixture, component } = mount({
      value: [20, 80] as const, step: 10, minStepsBetweenThumbs: 2,
    });
    const changes = vi.fn();
    component.value.subscribe(changes);
    const thumbs = fixture.nativeElement.querySelectorAll('[role="slider"]') as NodeListOf<HTMLElement>;
    thumbs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    expect(component.value()).toEqual([60, 80]);
    thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    expect(component.value()).toEqual([60, 80]);
    expect(changes.mock.calls.map(([value]) => value)).toEqual([[60, 80]]);
    expect(document.activeElement).not.toBe(thumbs[1]);
  });

  it('supports range page, arrow and boundary keys with bounded proposals', () => {
    const { fixture, component } = mount({ value: [20, 80] as const, step: 10,
      minStepsBetweenThumbs: 1 });
    const thumb = fixture.nativeElement.querySelector('[role="slider"]') as HTMLElement;
    const press = (key: string) => thumb.dispatchEvent(new KeyboardEvent('keydown', {
      key, bubbles: true, cancelable: true,
    }));
    press('PageUp');
    expect(component.value()).toEqual([70, 80]);
    press('PageDown');
    expect(component.value()).toEqual([0, 80]);
    press('ArrowRight');
    expect(component.value()).toEqual([10, 80]);
    press('ArrowLeft');
    expect(component.value()).toEqual([0, 80]);
    press('ArrowUp');
    expect(component.value()).toEqual([10, 80]);
    press('ArrowDown');
    expect(component.value()).toEqual([0, 80]);
    press('End');
    expect(component.value()).toEqual([70, 80]);
    press('Home');
    expect(component.value()).toEqual([0, 80]);
    press('Delete');
    expect(component.value()).toEqual([0, 80]);
  });

  it('retains focus within a range and emits touch when leaving the whole control', () => {
    const { fixture, component } = mount({ value: [20, 80] as const });
    const wrap = fixture.nativeElement.querySelector('.neu-slider__track-wrap') as HTMLElement;
    const thumbs = wrap.querySelectorAll('[role="slider"]') as NodeListOf<HTMLElement>;
    const touches = vi.fn();
    component.touch.subscribe(touches);
    thumbs[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: thumbs[1] }));
    expect(touches).not.toHaveBeenCalled();
    thumbs[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(touches).toHaveBeenCalledTimes(1);
  });

  it('normalizes an invalid external tuple only for view, then emits a canonical user edit', () => {
    const { fixture, component } = mount({ value: [90, 10] as const, step: 10 });
    const changes = vi.fn();
    component.value.subscribe(changes);
    expect(component.value()).toEqual([90, 10]);
    expect(component.visualRange()).toEqual([10, 90]);
    const thumb = fixture.nativeElement.querySelector('[role="slider"]') as HTMLElement;
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(component.value()).toEqual([20, 90]);
    expect(changes).toHaveBeenCalledTimes(1);
  });

  it('maps vertical pointer coordinates bottom-to-top and ignores RTL for numeric direction', () => {
    const { fixture, component } = mount({
      value: [20, 80] as const, orientation: 'vertical', step: 10,
    });
    const wrap = fixture.nativeElement.querySelector('.neu-slider__track-wrap') as HTMLElement;
    fixture.nativeElement.setAttribute('dir', 'rtl');
    vi.spyOn(wrap, 'getBoundingClientRect').mockReturnValue({
      left: 0, right: 20, top: 0, bottom: 100, width: 20, height: 100,
    } as DOMRect);
    const down = pointer('pointerdown');
    Object.defineProperty(down, 'clientY', { value: 70 });
    wrap.dispatchEvent(down);
    expect(component.value()).toEqual([30, 80]);
    const move = pointer('pointermove');
    Object.defineProperty(move, 'clientY', { value: 60 });
    wrap.dispatchEvent(move);
    wrap.dispatchEvent(pointer('pointerup'));
    expect(component.value()).toEqual([40, 80]);
    const thumb = wrap.querySelector('[role="slider"]') as HTMLElement;
    expect(thumb.getAttribute('aria-orientation')).toBe('vertical');
    thumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(component.value()).toEqual([50, 80]);
  });

  it('keeps scalar native input and keyboard direction in vertical orientation', () => {
    const { component, input, fixture } = mount({ value: 40, orientation: 'vertical', step: 5 });
    fixture.nativeElement.setAttribute('dir', 'rtl');
    expect(input.getAttribute('aria-orientation')).toBe('vertical');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(45);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(component.value()).toBe(40);
  });

  it('normalizes non-finite bounds, step and gap without changing the supplied model', () => {
    const { component, fixture } = mount({
      value: [Number.NaN, 200] as const,
      minValue: Number.NaN,
      maxValue: Number.POSITIVE_INFINITY,
      step: 0,
      minStepsBetweenThumbs: Number.NaN,
      showValue: true,
    });
    expect(component.resolvedMin()).toBe(0);
    expect(component.resolvedMax()).toBe(100);
    expect(component.resolvedStep()).toBe(1);
    expect(component.resolvedGap()).toBe(0);
    expect(component.value()).toEqual([Number.NaN, 200]);
    expect(fixture.nativeElement.textContent).toContain('100');

    fixture.componentRef.setInput('minValue', 20);
    fixture.componentRef.setInput('maxValue', 10);
    fixture.componentRef.setInput('minStepsBetweenThumbs', 500);
    fixture.detectChanges();
    expect(component.resolvedMax()).toBe(20);
    expect(component.resolvedGap()).toBe(0);
    expect(component.rangeThumbPercent(0)).toBe(0);
  });

  it('ends a range pointer drag on cancellation and keeps the selected thumb stable', () => {
    const { fixture, component } = mount({ value: [20, 80] as const, step: 10 });
    const wrap = fixture.nativeElement.querySelector('.neu-slider__track-wrap') as HTMLElement;
    vi.spyOn(wrap, 'getBoundingClientRect').mockReturnValue({
      left: 0, right: 100, top: 0, bottom: 20, width: 100, height: 20,
    } as DOMRect);
    const down = pointer('pointerdown', 7);
    Object.defineProperty(down, 'clientX', { value: 50 });
    wrap.dispatchEvent(down);
    const cancelled = pointer('pointercancel', 7);
    wrap.dispatchEvent(cancelled);
    const staleMove = pointer('pointermove', 7);
    Object.defineProperty(staleMove, 'clientX', { value: 90 });
    wrap.dispatchEvent(staleMove);
    expect(component.value()).toEqual([50, 80]);

    const upperDown = pointer('pointerdown', 8);
    Object.defineProperty(upperDown, 'clientX', { value: 90 });
    wrap.dispatchEvent(upperDown);
    expect(component.value()).toEqual([50, 90]);
    wrap.dispatchEvent(pointer('lostpointercapture', 8));
  });

  it('renders the optional scalar value label when requested', () => {
    const { fixture } = mount({ value: 35, showValue: true });
    expect(fixture.nativeElement.textContent).toContain('35');
  });

  it('uses zero percent when the scalar track has no numeric span', () => {
    const { component } = mount({ value: 5, minValue: 5, maxValue: 5 });
    expect(component.fillPercent()).toBe(0);
  });

  it('rejects nonfinite scalar and range candidates without writing the model', () => {
    const scalar = mount({ value: 25 });
    (scalar.component as any).commit(Number.NaN);
    expect(scalar.component.value()).toBe(25);
    const range = mount({ value: [20, 80] as const });
    (range.component as any).commitRange(0, Number.POSITIVE_INFINITY);
    expect(range.component.value()).toEqual([20, 80]);
  });

  it('blocks range keyboard and pointer changes while disabled or readonly', () => {
    const { fixture, component } = mount({ value: [20, 80] as const, disabled: true });
    const key = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    component.onRangeKeyDown(0, key);
    expect(key.defaultPrevented).toBe(false);
    const down = pointer('pointerdown');
    component.onRangePointerDown(down);
    expect(down.defaultPrevented).toBe(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    const readonlyKey = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    component.onRangeKeyDown(0, readonlyKey);
    expect(readonlyKey.defaultPrevented).toBe(true);
    expect(component.value()).toEqual([20, 80]);
  });

  it('ignores a pointer move from another pointer and resets active drag state', () => {
    const { component } = mount({ value: [20, 80] as const });
    (component as any).activePointerId = 1;
    component.onRangePointerMove(pointer('pointermove', 2));
    expect(component.value()).toEqual([20, 80]);
    component.reset();
    expect((component as any).activePointerId).toBeNull();
  });

  it('commits the scalar End key and releases only the active pointer', () => {
    const { component } = mount({ value: 25 });
    component.onKeyDown(new KeyboardEvent('keydown', { key: 'End', cancelable: true }));
    expect(component.value()).toBe(100);
    component.onPointerDown(pointer('pointerdown', 7));
    component.onPointerEnd(pointer('pointerup', 8));
    expect((component as any).activePointerId).toBe(7);
    component.onPointerEnd(pointer('pointerup', 7));
    expect((component as any).activePointerId).toBeNull();
  });

  it('keeps a started range drag inert after readonly becomes applied', () => {
    const { fixture, component } = mount({ value: [20, 80] as const });
    (component as any).activePointerId = 3;
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.onRangePointerMove(pointer('pointermove', 3));
    expect(component.value()).toEqual([20, 80]);
  });

  it('releases an owned range pointer capture and focuses the last active thumb', () => {
    const { component } = mount({ value: [20, 80] as const });
    const wrap = document.createElement('div');
    const releasePointerCapture = vi.fn();
    Object.assign(wrap, { hasPointerCapture: () => true, releasePointerCapture });
    (component as any).activePointerId = 7;
    (component as any).lastFocusedThumb = 1;
    component.onRangePointerEnd({ pointerId: 7, currentTarget: wrap } as unknown as PointerEvent);
    expect(releasePointerCapture).toHaveBeenCalledExactlyOnceWith(7);
    expect((component as any).activePointerId).toBeNull();
    const thumb = (component as any).rangeThumbs()[1]!.nativeElement as HTMLElement;
    const focus = vi.spyOn(thumb, 'focus');
    component.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledOnce();
    focus.mockRestore();
  });

  it('keeps vertical and horizontal pointer values finite on zero-area tracks', () => {
    const { fixture, component } = mount({ value: [20, 80] as const, orientation: 'vertical' });
    const target = document.createElement('div');
    target.getBoundingClientRect = () => ({
      x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0,
      width: 0, height: 0, toJSON: () => ({}),
    } as DOMRect);
    const event = { currentTarget: target, clientX: 0, clientY: 0 } as unknown as PointerEvent;
    expect(Number.isFinite((component as any).pointerValue(event))).toBe(true);
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    expect(Number.isFinite((component as any).pointerValue(event))).toBe(true);
  });
});
