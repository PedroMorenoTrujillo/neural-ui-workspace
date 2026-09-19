import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuColorPickerComponent } from './neu-color-picker.component';

function setup(inputs: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(NeuColorPickerComponent);
  for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
  fixture.detectChanges();
  return fixture;
}

async function openPanel(fixture = setup()) {
  fixture.componentInstance['_toggle']();
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

function pointerTarget(width = 100, height = 100): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, width, height }),
  });
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  element.hasPointerCapture = vi.fn(() => true);
  return element;
}

describe('NeuColorPickerComponent N2-009', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('exposes a string ModelSignal and keeps parent writes silent', () => {
    const fixture = setup();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', 'rgb(255 0 0 / 50%)');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('rgb(255 0 0 / 50%)');
    expect(fixture.componentInstance['_hexValue']()).toBe('#ff0000');
    expect(changes).not.toHaveBeenCalled();
  });

  it('opens for readonly inspection but not when disabled', async () => {
    const readonlyFixture = await openPanel(setup({ readonly: true }));
    expect(readonlyFixture.componentInstance['_isOpen']()).toBe(true);
    expect((document.querySelector('.neu-cp__hue-slider') as HTMLInputElement).disabled).toBe(true);
    readonlyFixture.destroy();

    const disabledFixture = setup({ disabled: true });
    disabledFixture.componentInstance['_toggle']();
    expect(disabledFixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('emits overlay lifecycle exactly once per attach and detach', () => {
    const fixture = setup();
    const opened = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.opened.subscribe(opened);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance['onPanelAttached']();
    fixture.componentInstance['onPanelAttached']();
    fixture.componentInstance['onPanelDetached']();
    fixture.componentInstance['onPanelDetached']();
    expect(opened).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('updates value continuously during a pointer drag and commits once at pointerup', () => {
    const fixture = setup({ value: '#ff0000' });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    const committed = vi.fn();
    component.value.subscribe(changes);
    component.valueCommitted.subscribe(committed);
    const target = pointerTarget();

    component['_canvasDown']({
      pointerId: 7,
      clientX: 50,
      clientY: 50,
      currentTarget: target,
    } as unknown as PointerEvent);
    component['_canvasDrag']({
      pointerId: 7,
      clientX: 70,
      clientY: 20,
      currentTarget: target,
    } as unknown as PointerEvent);
    component['_canvasUp']({ pointerId: 7, currentTarget: target } as unknown as PointerEvent);

    expect(changes.mock.calls.length).toBeGreaterThan(0);
    expect(committed).toHaveBeenCalledTimes(1);
    expect(committed).toHaveBeenLastCalledWith(component.value());
  });

  it('lets a parent write win during a drag and emits no commit for the stale gesture', async () => {
    const fixture = setup({ value: '#ff0000' });
    const component = fixture.componentInstance;
    const committed = vi.fn();
    component.valueCommitted.subscribe(committed);
    const target = pointerTarget();
    component['_canvasDown']({
      pointerId: 1,
      clientX: 20,
      clientY: 20,
      currentTarget: target,
    } as unknown as PointerEvent);
    fixture.componentRef.setInput('value', '#00ff00');
    fixture.detectChanges();
    component['_canvasDrag']({
      pointerId: 1,
      clientX: 80,
      clientY: 80,
      currentTarget: target,
    } as unknown as PointerEvent);
    component['_canvasUp']({ pointerId: 1, currentTarget: target } as unknown as PointerEvent);
    expect(component.value()).toBe('#00ff00');
    expect(committed).not.toHaveBeenCalled();
  });

  it('commits keyboard canvas edits exactly once', () => {
    const fixture = setup({ value: '#336699' });
    const component = fixture.componentInstance;
    const committed = vi.fn();
    component.valueCommitted.subscribe(committed);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
    component['_onAreaKeydown'](event);
    expect(event.defaultPrevented).toBe(true);
    expect(committed).toHaveBeenCalledTimes(1);
  });

  it('supports text, channels, alpha and OKLCH without a parallel value event', () => {
    const fixture = setup({ value: '#336699', showAlpha: true, showChannels: true });
    const component = fixture.componentInstance;
    const changes = vi.fn();
    component.value.subscribe(changes);
    component['beginColorChange']();
    component['_onTextChange']('rgba(255, 0, 0, 0.5)');
    component['_onTextBlur']();
    expect(component.value()).toContain('ff0000');

    fixture.componentRef.setInput('mode', 'oklch');
    fixture.detectChanges();
    component['beginColorChange']();
    component['_onChannelInput']('lightness', '0.7');
    component['_onChannelBlur']();
    component['beginColorChange']();
    component['_onAlphaChange'](0.25);
    component['finishColorChange']();
    expect(changes.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects invalid text drafts and restores the canonical value with Escape', () => {
    const fixture = setup({ value: '#336699' });
    const component = fixture.componentInstance;
    component['beginColorChange']();
    component['_onTextChange']('not-a-color');
    expect(component['_textInvalid']()).toBe(true);
    component['_onTextKeydown'](
      new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }),
    );
    expect(component['_textInvalid']()).toBe(false);
    expect(component['_displayText']()).toBe('#336699');
  });

  it('selects swatches as one committed user gesture', () => {
    const fixture = setup({ value: '#000000' });
    const committed = vi.fn();
    fixture.componentInstance.valueCommitted.subscribe(committed);
    fixture.componentInstance['_pickSwatch']('#ef4444');
    expect(fixture.componentInstance.value()).toBe('#ef4444');
    expect(committed).toHaveBeenCalledExactlyOnceWith('#ef4444');
  });

  it('marks the trigger and overlay as one touch boundary', async () => {
    const fixture = await openPanel();
    const touch = vi.fn();
    fixture.componentInstance.touch.subscribe(touch);
    fixture.componentInstance['onBoundaryFocusIn']();
    fixture.componentInstance.onBlur();
    fixture.componentInstance.onBlur();
    await fixture.whenStable();
    expect(touch).toHaveBeenCalledTimes(1);
  });

  it('honors guarded dismissals and cleanup', async () => {
    const fixture = await openPanel();
    fixture.componentInstance['requestEscapeDismiss'](
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
    fixture.destroy();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });
});
