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
      min: 10,
      max: 90,
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
    const { component, input } = mount({ value: 20, min: 10, max: 50, step: 10 });
    input.value = '27';
    input.dispatchEvent(new Event('input'));
    expect(component.value()).toBe(30);
    component.onInput({ target: { value: '200' } } as unknown as Event);
    expect(component.value()).toBe(50);
    component.onInput({ target: { value: '-20' } } as unknown as Event);
    expect(component.value()).toBe(10);
  });

  it('supports arrows, PageUp/PageDown and Home/End with one emission per change', () => {
    const { component, input } = mount({ value: 50, min: 0, max: 100, step: 5 });
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
    const { component } = mount({ value: 150, min: 0, max: 100 });
    expect(component.value()).toBe(150);
    expect(component.visualValue()).toBe(100);
    expect(component.fillPercent()).toBe(100);
  });
});
