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

  it('normalizes default, bounds and step values while emitting live and final changes', () => {
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 90);
    fixture.componentRef.setInput('step', 10);
    fixture.componentRef.setInput('defaultValue', 54);
    fixture.detectChanges();
    const changed = vi.spyOn(component.valueChange, 'emit');
    const ended = vi.spyOn(component.valueChangeEnd, 'emit');
    component.onInputChange({ target: { value: '57' } } as unknown as Event);
    expect(component.currentValue()).toBe(60);
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
    expect(component.currentValue()).toBe(25);
    component.onRootPointerMove({ ...event, clientX: 150 } as PointerEvent);
    component.onRootPointerUp(event);
    expect(component.currentValue()).toBe(75);
    expect(component.dragging()).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.onRootPointerDown(event);
    expect(component.dragging()).toBe(false);
  });

  it('calculates horizontal and vertical clipping and handle placement', () => {
    component.onInputChange({ target: { value: '25' } } as unknown as Event);
    expect(component.getItemStyle('before').clipPath).toContain('75%');
    expect(component.getHandleStyle().left).toBe('25%');
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.detectChanges();
    expect(component.getItemStyle('after').clipPath).toContain('25%');
    expect(component.getHandleStyle().top).toBe('25%');
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
    component.onThumbPointerDown(event);
    expect(stop).toHaveBeenCalled();
    expect(component.currentValue()).toBe(75);
    component.onRootPointerUp(event);
    component.onRootPointerMove({ ...event, clientY: 150 } as PointerEvent);
    expect(component.currentValue()).toBe(25);
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
    expect(component.getItemStyle('after').clipPath).toContain('50%');

    fixture.componentRef.setInput('orientation', 'vertical');
    expect(component.getItemStyle('before').clipPath).toContain('50%');
    fixture.componentRef.setInput('min', 10);
    fixture.componentRef.setInput('max', 10);
    expect(component.getHandleStyle().top).toBe('0%');

    fixture.componentRef.setInput('disabled', true);
    component.onInputChange({ target: { value: '10' } } as unknown as Event);
    component.onRootPointerMove({ clientX: 10, clientY: 10 } as PointerEvent);
    expect(changed).not.toHaveBeenCalled();
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
        '<neu-compare><neu-compare-item position="before"><div>Before</div></neu-compare-item><neu-compare-item position="after"><div>After</div></neu-compare-item><neu-compare-handle /><neu-compare-indicator ariaLabel="Comparison" /></neu-compare>',
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
