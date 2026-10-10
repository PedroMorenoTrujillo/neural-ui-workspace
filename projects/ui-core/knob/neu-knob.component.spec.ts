import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuKnobComponent } from './neu-knob.component';

function create() {
  const fixture = TestBed.createComponent(NeuKnobComponent);
  fixture.detectChanges();
  return fixture;
}

function dial(fixture: ReturnType<typeof create>): HTMLElement {
  return fixture.nativeElement.querySelector('.neu-knob__dial');
}

function key(fixture: ReturnType<typeof create>, value: string): void {
  dial(fixture).dispatchEvent(
    new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }),
  );
  fixture.detectChanges();
}

describe('NeuKnobComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }),
  );

  it('uses a number ModelSignal and emits exactly once for a keyboard edit', () => {
    const fixture = create();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    key(fixture, 'ArrowRight');
    expect(fixture.componentInstance.value()).toBe(1);
    expect(changes).toHaveBeenCalledExactlyOnceWith(1);
  });

  it.each([
    ['ArrowUp', 55],
    ['ArrowRight', 55],
    ['ArrowDown', 45],
    ['ArrowLeft', 45],
    ['Home', 0],
    ['End', 100],
  ])('handles %s with step and clamp', (pressed, expected) => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('step', 5);
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    key(fixture, pressed);
    expect(fixture.componentInstance.value()).toBe(expected);
  });

  it('ignores unrelated keyboard events and avoids duplicate commits at max', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    key(fixture, 'Tab');
    key(fixture, 'ArrowUp');
    expect(fixture.componentInstance.value()).toBe(100);
    expect(changes).not.toHaveBeenCalled();
  });

  it('snaps relative to min without floating point drift', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('min', 0.1);
    fixture.componentRef.setInput('max', 0.5);
    fixture.componentRef.setInput('step', 0.2);
    fixture.componentRef.setInput('value', 0.1);
    fixture.detectChanges();
    key(fixture, 'ArrowUp');
    expect(fixture.componentInstance.value()).toBe(0.3);
  });

  it('falls back to step 1 when step is non-positive', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('step', Number.NaN);
    fixture.componentRef.setInput('value', 5);
    fixture.detectChanges();
    key(fixture, 'ArrowRight');
    expect(fixture.componentInstance.value()).toBe(6);
  });

  it('blocks keyboard and pointer mutation while readonly or disabled', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    key(fixture, 'ArrowUp');
    fixture.componentInstance.onPointerDown({ button: 0, pointerType: 'mouse' } as PointerEvent);
    expect(fixture.componentInstance.value()).toBe(50);
    expect(dial(fixture).tabIndex).toBe(0);
    expect(dial(fixture).getAttribute('aria-readonly')).toBe('true');
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    key(fixture, 'ArrowUp');
    expect(fixture.componentInstance.value()).toBe(50);
    expect(dial(fixture).tabIndex).toBe(-1);
  });

  it('emits touch on blur, never on pointer start', () => {
    const fixture = create();
    const touched = vi.fn();
    fixture.componentInstance.touch.subscribe(touched);
    const event = {
      button: 0,
      pointerType: 'mouse',
      pointerId: 7,
      clientX: 50,
      clientY: 0,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent;
    vi.spyOn(dial(fixture), 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.componentInstance.onPointerDown(event);
    expect(touched).not.toHaveBeenCalled();
    fixture.componentInstance.onBlur();
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('updates during a matching pointer drag and ignores another pointer', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    vi.spyOn(dial(fixture), 'focus');
    vi.spyOn(dial(fixture), 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    fixture.componentInstance.onPointerDown({
      button: 0,
      pointerType: 'mouse',
      pointerId: 3,
      clientX: 50,
      clientY: 0,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 4, clientX: 100, clientY: 50 }),
    );
    expect(fixture.componentInstance.value()).toBe(50);
    window.dispatchEvent(
      Object.assign(new Event('pointermove'), { pointerId: 3, clientX: 100, clientY: 50 }),
    );
    expect(fixture.componentInstance.value()).toBeGreaterThan(50);
    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 3 }));
  });

  it('normalizes angle wraparound during pointer drag', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    const component = fixture.componentInstance as any;
    component.dragStartAngle = 170;
    component.dragStartValue = 50;
    vi.spyOn(dial(fixture), 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    component.applyCircularDrag(0, 40);
    expect(fixture.componentInstance.value()).toBeGreaterThan(50);
    component.dragStartAngle = -170;
    component.applyCircularDrag(0, 60);
    expect(fixture.componentInstance.value()).toBeLessThan(50);
  });

  it('renders a clamped visual for an out-of-range parent value without echo', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 150);
    fixture.detectChanges();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    expect(fixture.componentInstance.value()).toBe(150);
    expect(fixture.componentInstance.visualValue()).toBe(100);
    expect(dial(fixture).getAttribute('aria-valuenow')).toBe('150');
    expect(changes).not.toHaveBeenCalled();
  });

  it('handles non-finite parent values safely', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', Number.POSITIVE_INFINITY);
    fixture.detectChanges();
    expect(dial(fixture).hasAttribute('aria-valuenow')).toBe(false);
    expect(fixture.componentInstance.displayValue()).toBe('0');
  });

  it('exposes spinbutton labels, descriptions and form state', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('value', 25);
    fixture.componentRef.setInput('label', 'Volume');
    fixture.componentRef.setInput('ariaDescribedBy', 'volume-help');
    fixture.componentRef.setInput('valueText', (value: number) => `${value} percent`);
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('pending', true);
    fixture.detectChanges();
    const element = dial(fixture);
    expect(element.getAttribute('role')).toBe('spinbutton');
    expect(element.getAttribute('aria-valuetext')).toBe('25 percent');
    expect(element.getAttribute('aria-describedby')).toBe('volume-help');
    expect(element.getAttribute('aria-labelledby')).toContain('-label');
    expect(element.getAttribute('aria-required')).toBe('true');
    expect(element.getAttribute('aria-invalid')).toBe('true');
    expect(element.getAttribute('aria-busy')).toBe('true');
  });

  it('renders geometry, optional display and degenerate ranges', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('min', 50);
    fixture.componentRef.setInput('max', 50);
    fixture.componentRef.setInput('value', 50);
    fixture.detectChanges();
    expect(fixture.componentInstance.indicatorAngle()).toBe(230);
    expect(fixture.componentInstance.arcDashArray()).toContain(' ');
    expect(fixture.nativeElement.querySelector('.neu-knob__display')).toBeTruthy();
    fixture.componentRef.setInput('showValue', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-knob__display')).toBeNull();
  });

  it('focus and reset target only interaction state and destroy cleans a drag', () => {
    const fixture = create();
    const focus = vi.spyOn(dial(fixture), 'focus');
    fixture.componentInstance.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    fixture.componentInstance.reset();
    expect(fixture.componentInstance.value()).toBe(0);
    fixture.destroy();
  });

  it('uses deterministic range fallbacks and supports touch pointers', () => {
    const fixture = TestBed.createComponent(NeuKnobComponent);
    fixture.componentRef.setInput('min', Number.NaN);
    fixture.componentRef.setInput('max', Number.POSITIVE_INFINITY);
    fixture.componentRef.setInput('value', 1e-2);
    fixture.componentRef.setInput('step', 1e-2);
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedMin()).toBe(0);
    expect(fixture.componentInstance.resolvedMax()).toBe(100);
    key(fixture, 'ArrowRight');
    expect(fixture.componentInstance.value()).toBe(0.02);
    vi.spyOn(dial(fixture), 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
    const pointer = Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), {
      button: 1,
      pointerType: 'touch',
      pointerId: 11,
      clientX: 50,
      clientY: 0,
    });
    dial(fixture).dispatchEvent(pointer);
    window.dispatchEvent(Object.assign(new Event('pointerup'), { pointerId: 12 }));
    window.dispatchEvent(new Event('blur'));
  });

  it('rejects a non-primary mouse pointer without calling preventDefault', () => {
    const fixture = create();
    const preventDefault = vi.fn();
    fixture.componentInstance.onPointerDown({
      button: 2,
      pointerType: 'mouse',
      pointerId: 1,
      preventDefault,
    } as unknown as PointerEvent);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
