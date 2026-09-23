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
  afterEach(() => vi.unstubAllGlobals());

  it('exposes a string ModelSignal and keeps parent writes silent', () => {
    const fixture = setup();
    const changes = vi.fn();
    fixture.componentInstance.value.subscribe(changes);
    fixture.componentRef.setInput('value', 'rgb(255 0 0 / 50%)');
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe('rgb(255 0 0 / 50%)');
    expect(fixture.componentInstance['_hexValue']()).toBe('#ff000080');
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
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it('releases pointer capture on destruction and rejects stale format gestures', () => {
    const fixture = setup({ value: '#ff0000' });
    const target = pointerTarget();
    const committed = vi.fn();
    fixture.componentInstance.valueCommitted.subscribe(committed);
    fixture.componentInstance['_canvasDown']({
      pointerId: 9, clientX: 20, clientY: 20, currentTarget: target,
    } as unknown as PointerEvent);
    fixture.componentRef.setInput('mode', 'hsl');
    fixture.detectChanges();
    fixture.componentInstance['_canvasDrag']({
      pointerId: 9, clientX: 80, clientY: 80, currentTarget: target,
    } as unknown as PointerEvent);
    expect(committed).not.toHaveBeenCalled();
    expect(target.releasePointerCapture).toHaveBeenCalledWith(9);
    fixture.destroy();
    expect(fixture.componentInstance['activePointerId']).toBeNull();
  });

  it('keeps one pointer owner when a second pointer starts', () => {
    const fixture = setup({ value: '#ff0000' });
    const target = pointerTarget();
    fixture.componentInstance['_canvasDown']({
      pointerId: 1, clientX: 20, clientY: 20, currentTarget: target,
    } as unknown as PointerEvent);
    fixture.componentInstance['_canvasDown']({
      pointerId: 2, clientX: 80, clientY: 80, currentTarget: target,
    } as unknown as PointerEvent);
    expect(fixture.componentInstance['activePointerId']).toBe(1);
    expect(target.setPointerCapture).toHaveBeenCalledTimes(1);
    fixture.destroy();
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

  it('retains an applied alpha channel when alpha editing is hidden', () => {
    const fixture = setup({ value: '#33669980', showAlpha: false });
    fixture.componentInstance['_onAreaKeydown'](
      new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
    );
    expect(fixture.componentInstance.value()).toMatch(/^#[0-9a-f]{6}80$/);
    expect(fixture.componentInstance['_textValue']()).toMatch(/^#[0-9a-f]{6}80$/);
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
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    fixture.componentInstance.onBlur();
    fixture.componentInstance.onBlur();
    await fixture.whenStable();
    expect(touch).toHaveBeenCalledTimes(1);
    outside.remove();
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

  it('keeps the manual editor available without EyeDropper support', async () => {
    const fixture = await openPanel();
    expect(fixture.componentInstance['_eyeDropperAvailable']()).toBe(false);
    expect(document.querySelector('.neu-cp__sample-button')).toBeNull();
    expect(document.querySelector('.neu-cp__text-input')).not.toBeNull();
    fixture.destroy();
  });

  it('samples exactly once, preserves alpha and keeps the string value contract', async () => {
    const open = vi.fn(async () => ({ sRGBHex: '#abcdef' }));
    vi.stubGlobal('EyeDropper', class { open = open; });
    const fixture = await openPanel(setup({ value: '#33669980' }));
    const component = fixture.componentInstance;
    const committed = vi.fn();
    component.valueCommitted.subscribe(committed);
    expect(component['_eyeDropperAvailable']()).toBe(true);
    expect(document.querySelector('.neu-cp__sample-button')).not.toBeNull();
    await component['_sampleScreenColor']();
    expect(open).toHaveBeenCalledTimes(1);
    expect(component.value()).toBe('#abcdef80');
    expect(committed).toHaveBeenCalledExactlyOnceWith('#abcdef80');
    fixture.destroy();
  });

  it('leaves the value unchanged on cancellation or permission failure', async () => {
    const open = vi.fn()
      .mockRejectedValueOnce(new DOMException('Canceled', 'AbortError'))
      .mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
    vi.stubGlobal('EyeDropper', class { open = open; });
    const fixture = await openPanel(setup({ value: '#336699' }));
    const component = fixture.componentInstance;
    const committed = vi.fn();
    component.valueCommitted.subscribe(committed);
    await component['_sampleScreenColor']();
    expect(component['_sampleError']()).toBe(false);
    await component['_sampleScreenColor']();
    expect(component['_sampleError']()).toBe(true);
    expect(component.value()).toBe('#336699');
    expect(committed).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('aborts sampling on destroy and ignores a late browser result', async () => {
    let resolveSample!: (value: { sRGBHex: string }) => void;
    const open = vi.fn((_options?: { signal?: AbortSignal }) =>
      new Promise<{ sRGBHex: string }>((resolve) => { resolveSample = resolve; }));
    vi.stubGlobal('EyeDropper', class { open = open; });
    const fixture = await openPanel(setup({ value: '#336699' }));
    const component = fixture.componentInstance;
    const committed = vi.fn();
    component.valueCommitted.subscribe(committed);
    const pending = component['_sampleScreenColor']();
    const signal = open.mock.calls[0]?.[0]?.signal as AbortSignal | undefined;
    fixture.destroy();
    expect(signal?.aborted).toBe(true);
    resolveSample({ sRGBHex: '#abcdef' });
    await pending;
    expect(component.value()).toBe('#336699');
    expect(committed).not.toHaveBeenCalled();
  });

  it('does not overwrite a parent value applied during pending sampling', async () => {
    let resolveSample!: (value: { sRGBHex: string }) => void;
    vi.stubGlobal('EyeDropper', class {
      open() { return new Promise<{ sRGBHex: string }>((resolve) => { resolveSample = resolve; }); }
    });
    const fixture = await openPanel(setup({ value: '#336699' }));
    const committed = vi.fn();
    fixture.componentInstance.valueCommitted.subscribe(committed);
    const pending = fixture.componentInstance['_sampleScreenColor']();
    fixture.componentRef.setInput('value', '#123456');
    fixture.detectChanges();
    resolveSample({ sRGBHex: '#abcdef' });
    await pending;
    expect(fixture.componentInstance.value()).toBe('#123456');
    expect(committed).not.toHaveBeenCalled();
    fixture.destroy();
  });

  it('isolates focus boundaries and panel IDs across instances', async () => {
    const first = await openPanel();
    const second = await openPanel();
    const secondTouch = vi.fn();
    second.componentInstance.touch.subscribe(secondTouch);
    expect(first.componentInstance['panelId']).not.toBe(second.componentInstance['panelId']);
    const firstArea = document.getElementById(first.componentInstance['panelId'])
      ?.querySelector('.neu-cp__canvas-wrap') as HTMLElement | null;
    firstArea?.focus();
    expect(document.activeElement).toBe(firstArea);
    second.componentInstance.onBlur();
    await Promise.resolve();
    expect(secondTouch).toHaveBeenCalledTimes(1);
    first.destroy();
    second.destroy();
  });

  it('releases overlays through 100 create/destroy cycles and records interaction timing', async () => {
    const lifecycle: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      const started = performance.now();
      const fixture = setup({ value: '#336699' });
      fixture.componentInstance['_toggle']();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.destroy();
      lifecycle.push(performance.now() - started);
    }
    expect(document.querySelectorAll('.neu-cp__panel')).toHaveLength(0);
    const fixture = setup({ value: '#336699' });
    const pointer = pointerTarget();
    const pointerSamples: number[] = [];
    const keyboardSamples: number[] = [];
    for (let index = 0; index < 100; index += 1) {
      let started = performance.now();
      fixture.componentInstance['_canvasDown']({
        pointerId: index, clientX: index % 100, clientY: 50, currentTarget: pointer,
      } as unknown as PointerEvent);
      fixture.componentInstance['_canvasUp']({
        pointerId: index, currentTarget: pointer,
      } as unknown as PointerEvent);
      pointerSamples.push(performance.now() - started);
      started = performance.now();
      fixture.componentInstance['_onAreaKeydown'](
        new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }),
      );
      keyboardSamples.push(performance.now() - started);
    }
    fixture.destroy();
    const percentiles = (samples: number[]) => {
      const sorted = [...samples].sort((left, right) => left - right);
      return { p50ms: sorted[50], p95ms: sorted[95] };
    };
    console.info('N2-024 ColorPicker JSDOM timings', JSON.stringify({
      lifecycle: percentiles(lifecycle),
      pointer: percentiles(pointerSamples),
      keyboard: percentiles(keyboardSamples),
    }));
  });
});
