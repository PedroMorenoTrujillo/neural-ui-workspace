import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  NeuCompareComponent,
  NeuCompareHandleComponent,
  NeuCompareIndicatorComponent,
  NeuCompareItemComponent,
} from './neu-compare.component';

describe('NeuCompareComponent', () => {
  let fixture: ComponentFixture<NeuCompareComponent>;
  let component: NeuCompareComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuCompareComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses parent-owned fallback, bounds and step while emitting proposals', () => {
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 90);
    fixture.componentRef.setInput('step', 10);
    fixture.componentRef.setInput('defaultValue', 54);
    fixture.detectChanges();
    const changed = vi.spyOn(component.valueChange, 'emit');
    const ended = vi.spyOn(component.valueChangeEnd, 'emit');
    component.onInputChange({ target: { value: '57' } } as unknown as Event);
    expect(component.currentValue()).toBe(50);
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: 60 }));
    expect(ended).toHaveBeenCalledWith(expect.objectContaining({ value: 60 }));
  });

  it('supports pointer interaction, hover mode and disabled state', () => {
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 100,
    } as DOMRect);
    const event = { clientX: 50, clientY: 50, pointerId: 1 } as PointerEvent;
    component.onRootPointerDown(event);
    expect(component.dragging()).toBe(true);
    expect(component.currentValue()).toBe(50);
    component.onRootPointerMove({ ...event, clientX: 150 } as PointerEvent);
    component.onRootPointerUp(event);
    expect(component.currentValue()).toBe(50);
    expect(component.dragging()).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onRootPointerDown(event);
    expect(component.dragging()).toBe(false);
  });

  it('derives placement from applied value, not the proposed value', () => {
    fixture.componentRef.setInput('value', 25);
    fixture.detectChanges();
    expect(component.valuePercent()).toBe(25);
    component.onInputChange({ target: { value: '75' } } as unknown as Event);
    expect(component.valuePercent()).toBe(25);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();
    expect(component.valuePercent()).toBe(25);
  });

  it('keeps a controlled value external while reporting the requested interaction and edge policies', () => {
    fixture.componentRef.setInput('value', 20);
    fixture.componentRef.setInput('min', 0);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();
    const changed = vi.spyOn(component.valueChange, 'emit');
    component.onInputChange({ target: { value: '80' } } as unknown as Event);
    expect(component.currentValue()).toBe(20);
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: 80 }));
    fixture.componentRef.setInput('value', undefined);
    fixture.componentRef.setInput('min', Number.NaN);
    fixture.componentRef.setInput('max', Number.NaN);
    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
    component.onInputChange({ target: { value: '99' } } as unknown as Event);
    expect(component.currentValue()).toBe(0);
  });

  it('handles vertical pointer math, hover updates and handle-origin events', () => {
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 200,
    } as DOMRect);
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('slideOnHover', true);
    fixture.detectChanges();
    const stop = vi.fn();
    const event = {
      clientX: 0,
      clientY: 50,
      pointerId: 2,
      stopPropagation: stop,
    } as unknown as PointerEvent;
    const changed = vi.spyOn(component.valueChange, 'emit');
    component.onRootPointerDown(event);
    expect(stop).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: 75 }));
    component.onRootPointerUp(event);
    component.onRootPointerMove({ ...event, clientY: 150 } as PointerEvent);
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ value: 25 }));
    component.onRootPointerUp(event);
    expect(component.dragging()).toBe(false);
  });

  it('runs the root pointer binding', () => {
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    } as DOMRect);
    fixture.nativeElement.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true }), {
        clientX: 40,
        clientY: 0,
        pointerId: 5,
      }),
    );
    expect(component.dragging()).toBe(true);
  });

  it('keeps no-op, disabled, zero-span, and complementary clipping boundaries stable', () => {
    const changed = vi.spyOn(component.valueChange, 'emit');
    component.onRootPointerMove({ clientX: 10, clientY: 10 } as PointerEvent);
    component.onRootPointerUp({ pointerId: 1 } as PointerEvent);
    component.onInputChange({ target: { value: '50' } } as unknown as Event);
    expect(changed).not.toHaveBeenCalled();
    expect(component.valuePercent()).toBe(50);

    fixture.componentRef.setInput('orientation', 'vertical');
    expect(component.valuePercent()).toBe(50);
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 10);
    expect(component.valuePercent()).toBe(0);

    fixture.componentRef.setInput('disabled', true);
    component.onInputChange({ target: { value: '10' } } as unknown as Event);
    component.onRootPointerMove({ clientX: 10, clientY: 10 } as PointerEvent);
    expect(changed).not.toHaveBeenCalled();
  });

  it('cancels only the active drag and ignores unrelated pointer completion', () => {
    vi.spyOn(fixture.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 100, height: 100,
    } as DOMRect);
    const ended = vi.spyOn(component.valueChangeEnd, 'emit');
    const down = { pointerId: 7, button: 0, clientX: 70, clientY: 10 } as PointerEvent;
    component.onRootPointerDown(down);
    component.onRootPointerUp({ pointerId: 8 } as PointerEvent);
    expect(component.dragging()).toBe(true);
    component.onRootPointerCancel({ pointerId: 8 } as PointerEvent);
    expect(component.dragging()).toBe(true);
    component.onRootPointerCancel(down);
    expect(component.dragging()).toBe(false);
    expect(ended).not.toHaveBeenCalled();
    component.onRootPointerCancel(down);
  });

  it('maps orientation and text direction to the expected keyboard proposals', () => {
    const changed = vi.spyOn(component.valueChange, 'emit');
    const ended = vi.spyOn(component.valueChangeEnd, 'emit');
    fixture.nativeElement.setAttribute('dir', 'RTL');
    for (const [key, value] of [['ArrowRight', 49], ['ArrowLeft', 51]] as const) {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      component.onHandleKeyDown(event);
      expect(event.defaultPrevented).toBe(true);
      expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ value }));
      expect(ended).toHaveBeenLastCalledWith(expect.objectContaining({ value }));
    }
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: 51 }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: 49 }));
    fixture.componentRef.setInput('orientation', 'horizontal');
    fixture.detectChanges();
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: 0 }));
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'End' }));
    expect(changed).toHaveBeenLastCalledWith(expect.objectContaining({ value: 100 }));
  });

  it('keeps keyboard completion silent when the proposed value is already applied', () => {
    const ended = vi.spyOn(component.valueChangeEnd, 'emit');
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    component.onHandleKeyDown(new KeyboardEvent('keydown', { key: 'Home' }));
    expect(ended).not.toHaveBeenCalled();
  });

  it('renders the composable item, handle and range indicator with proper ARIA', async () => {
    @Component({
      imports: [
        NeuCompareComponent,
        NeuCompareItemComponent,
        NeuCompareHandleComponent,
        NeuCompareIndicatorComponent,
      ],
      template:
        '<neu-compare><neu-compare-item position="before"><div>Before</div></neu-compare-item><neu-compare-item position="after"><div>After</div></neu-compare-item><neu-compare-handle ariaLabel="Comparison" /><neu-compare-indicator /></neu-compare>',
    })
    class Host {}
    await TestBed.resetTestingModule()
      .configureTestingModule({ imports: [Host] })
      .compileComponents();
    const host = TestBed.createComponent(Host);
    host.detectChanges();
    const input = host.nativeElement.querySelector('.neu-compare__input') as HTMLInputElement;
    expect(input.getAttribute('aria-label')).toBe('Comparison');
    expect(host.nativeElement.querySelectorAll('.neu-compare__item')).toHaveLength(2);
    const handle = host.nativeElement.querySelector('.neu-compare__handle') as HTMLElement;
    expect(handle).toBeTruthy();
    handle.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true }), {
        pointerId: 4,
        clientX: 5,
        clientY: 5,
      }),
    );
    input.value = '70';
    input.dispatchEvent(new Event('input'));
  });
});
