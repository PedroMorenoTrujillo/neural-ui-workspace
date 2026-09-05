import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { NeuColorPickerComponent } from './neu-color-picker.component';

@Component({
  template: `<neu-color-picker [formControl]="colorControl" />`,
  imports: [NeuColorPickerComponent, ReactiveFormsModule],
})
class ColorPickerHostComponent {
  readonly colorControl = new FormControl('#3b82f6', { nonNullable: true });
}

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

function fakePointerTarget(width = 100, height = 100): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => ({ left: 0, top: 0, width, height }),
  });
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  element.hasPointerCapture = vi.fn(() => true);
  return element;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuColorPickerComponent', () => {
  it('creates with the legacy-compatible HEX default', async () => {
    const fixture = setup();
    await fixture.whenStable();
    expect(fixture.componentInstance['_textValue']()).toMatch(/^#[\da-f]{6}$/);
    expect(fixture.nativeElement.querySelector('.neu-cp__trigger')).toBeTruthy();
  });

  it('opens and closes its viewport-safe CDK overlay', async () => {
    const fixture = await openPanel();
    expect(document.querySelector('.neu-cp__panel')).toBeTruthy();
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
    fixture.componentInstance['_toggle']();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('emits opened and closed only for real attach/detach lifecycle', () => {
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

  it('keeps programmatic writes silent and preserves null CVA state', () => {
    const fixture = setup();
    const change = vi.fn();
    const output = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.colorChange.subscribe(output);
    fixture.componentInstance.writeValue('rgb(255 0 0 / 50%)');
    expect(fixture.componentInstance['_textValue']()).toBe('#ff0000');
    fixture.componentInstance.writeValue(null);
    expect(fixture.componentInstance['_textValue']()).toBe('');
    fixture.componentInstance.writeValue('#22c55e');
    expect(change).not.toHaveBeenCalled();
    expect(output).not.toHaveBeenCalled();
  });

  it.each([
    ['#33669980', '#336699'],
    ['rgba(51, 102, 153, 0.5)', '#336699'],
    ['hsla(210, 50%, 40%, 0.5)', '#336699'],
    ['oklch(0.499314 0.098738 250.448 / 0.5)', '#336699'],
  ])('accepts silent CVA writeValue syntax %s while alpha is hidden', (value, expected) => {
    const fixture = setup();
    const change = vi.fn();
    const output = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.colorChange.subscribe(output);
    fixture.componentInstance.writeValue(value);
    expect(fixture.componentInstance['_textValue']()).toBe(expected);
    expect(fixture.componentInstance['_color']().alpha).toBeCloseTo(0.5, 2);
    expect(change).not.toHaveBeenCalled();
    expect(output).not.toHaveBeenCalled();
  });

  it('retains the previous canonical color for an invalid programmatic value', () => {
    const fixture = setup();
    fixture.componentInstance.writeValue('#abcdef');
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance.writeValue('invalid');
    expect(fixture.componentInstance['_color']()).toEqual(before);
  });

  it('commits one CVA and output event for each changed user value', () => {
    const fixture = setup();
    const change = vi.fn();
    const output = vi.fn();
    fixture.componentInstance.registerOnChange(change);
    fixture.componentInstance.colorChange.subscribe(output);
    fixture.componentInstance['_pickSwatch']('#ef4444');
    expect(change).toHaveBeenCalledTimes(1);
    expect(output).toHaveBeenCalledTimes(1);
    expect(output.mock.calls[0][0]).toBe(change.mock.calls[0][0]);
    fixture.componentInstance['_pickSwatch']('#ef4444');
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('makes built-in opaque swatches reset alpha to one', () => {
    const fixture = setup({ showAlpha: true });
    fixture.componentInstance.writeValue('#00000040');
    fixture.componentInstance['_pickSwatch']('#ef4444');
    expect(fixture.componentInstance['_color']().alpha).toBe(1);
    expect(fixture.componentInstance['_textValue']()).toBe('#ef4444ff');
  });

  it('supports alpha in HEX, RGB, HSL and OKLCH without format explosion', () => {
    const fixture = setup({ showAlpha: true });
    fixture.componentInstance.writeValue('#33669980');
    expect(fixture.componentInstance['_textValue']()).toBe('#33669980');
    fixture.componentInstance['_selectMode']('rgb');
    expect(fixture.componentInstance['_textValue']()).toBe('rgb(51 102 153 / 0.502)');
    fixture.componentInstance['_selectMode']('hsl');
    expect(fixture.componentInstance['_textValue']()).toContain(' / 0.502)');
    fixture.componentInstance['_selectMode']('oklch');
    expect(fixture.componentInstance['_textValue']()).toMatch(/^oklch\(.+ \/ 0\.502\)$/);
  });

  it('changes alpha continuously and emits one end event', () => {
    const fixture = setup({ showAlpha: true });
    const changes = vi.fn();
    const ends = vi.fn();
    fixture.componentInstance.colorChange.subscribe(changes);
    fixture.componentInstance.colorChangeEnd.subscribe(ends);
    fixture.componentInstance['_onAlphaChange'](0.8);
    fixture.componentInstance['_onAlphaChange'](0.5);
    fixture.componentInstance['finishColorChange']();
    fixture.componentInstance['finishColorChange']();
    expect(changes).toHaveBeenCalledTimes(2);
    expect(ends).toHaveBeenCalledTimes(1);
    expect(ends.mock.calls[0][0]).toMatch(/[80]$/);
  });

  it('preserves a text draft, rejects invalid input silently, and reverts on blur', () => {
    const fixture = setup();
    const change = vi.fn();
    fixture.componentInstance.colorChange.subscribe(change);
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['beginColorChange']();
    fixture.componentInstance['_onTextChange']('rgb(2');
    expect(fixture.componentInstance['_draft']()).toBe('rgb(2');
    expect(fixture.componentInstance['_textInvalid']()).toBe(true);
    expect(fixture.componentInstance['_color']()).toEqual(before);
    expect(change).not.toHaveBeenCalled();
    fixture.componentInstance['_onTextBlur']();
    expect(fixture.componentInstance['_draft']()).toBeNull();
    expect(fixture.componentInstance['_textInvalid']()).toBe(false);
  });

  it('commits valid pasted CSS and emits one text-edit completion', () => {
    const fixture = setup({ showAlpha: true });
    const ends = vi.fn();
    fixture.componentInstance.colorChangeEnd.subscribe(ends);
    fixture.componentInstance['_selectMode']('oklch');
    fixture.componentInstance['beginColorChange']();
    fixture.componentInstance['_onTextChange']('oklch(0.65 0.12 220 / 75%)');
    fixture.componentInstance['_onTextKeydown']({
      key: 'Enter',
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    expect(fixture.componentInstance['_textValue']()).toMatch(/^oklch\(/);
    expect(ends).toHaveBeenCalledTimes(1);
  });

  it('reverts a draft on Escape without an end event', () => {
    const fixture = setup();
    const ends = vi.fn();
    fixture.componentInstance.colorChangeEnd.subscribe(ends);
    fixture.componentInstance['beginColorChange']();
    fixture.componentInstance['_onTextChange']('not-a-color');
    fixture.componentInstance['_onTextKeydown']({
      key: 'Escape',
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent);
    expect(fixture.componentInstance['_draft']()).toBeNull();
    expect(ends).not.toHaveBeenCalled();
  });

  it('updates hue with wrapping and does not mutate for non-finite values', () => {
    const fixture = setup();
    fixture.componentInstance['_onHueChange'](480);
    expect(fixture.componentInstance['_hue']()).toBe(120);
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['_onHueChange'](Number.NaN);
    expect(fixture.componentInstance['_color']()).toEqual(before);
  });

  it.each(['#808080', '#000000', '#ffffff'])(
    'retains the last chromatic hue when adjusting achromatic %s',
    (value) => {
      const fixture = setup();
      fixture.componentInstance.writeValue(value);
      fixture.componentInstance['_onHueChange'](275);
      expect(fixture.componentInstance['_hue']()).toBe(275);
      fixture.componentInstance['_onAreaKeydown']({
        key: 'End',
        shiftKey: false,
        preventDefault: vi.fn(),
      } as unknown as KeyboardEvent);
      expect(fixture.componentInstance['_hue']()).toBe(275);
    },
  );

  it('uses pointer capture and bounded O(1) SV updates', () => {
    const fixture = setup();
    const target = fakePointerTarget();
    const down = {
      pointerId: 7,
      clientX: 10,
      clientY: 90,
      currentTarget: target,
    } as unknown as PointerEvent;
    fixture.componentInstance['_canvasDown'](down);
    fixture.componentInstance['_canvasDrag']({
      pointerId: 7,
      clientX: 70,
      clientY: 20,
      currentTarget: target,
    } as unknown as PointerEvent);
    expect(fixture.componentInstance['_roundedHsv']().saturation).toBe(70);
    expect(fixture.componentInstance['_roundedHsv']().value).toBe(80);
    fixture.componentInstance['_canvasUp']({
      pointerId: 7,
      currentTarget: target,
    } as unknown as PointerEvent);
    expect(target.setPointerCapture).toHaveBeenCalledWith(7);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(7);
  });

  it('ignores unrelated pointers, zero-size geometry and drags outside a gesture', () => {
    const fixture = setup();
    const target = fakePointerTarget();
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['_canvasDrag']({
      pointerId: 1,
      currentTarget: target,
    } as unknown as PointerEvent);
    expect(fixture.componentInstance['_color']()).toEqual(before);
    fixture.componentInstance['_canvasDown']({
      pointerId: 1,
      clientX: 10,
      clientY: 10,
      currentTarget: target,
    } as unknown as PointerEvent);
    const afterDown = fixture.componentInstance['_color']();
    fixture.componentInstance['_canvasDrag']({
      pointerId: 2,
      clientX: 50,
      clientY: 50,
      currentTarget: target,
    } as unknown as PointerEvent);
    expect(fixture.componentInstance['_color']()).toEqual(afterDown);
    fixture.componentInstance['_canvasUp']({
      pointerId: 2,
      currentTarget: target,
    } as unknown as PointerEvent);
    fixture.componentInstance['cancelColorChange']();

    const zero = fakePointerTarget(0, 0);
    fixture.componentInstance['_canvasDown']({
      pointerId: 3,
      clientX: 0,
      clientY: 0,
      currentTarget: zero,
    } as unknown as PointerEvent);
    expect(fixture.componentInstance['_color']()).toEqual(afterDown);
  });

  it.each([
    ['ArrowLeft', 79, 90],
    ['ArrowRight', 81, 90],
    ['ArrowUp', 80, 91],
    ['ArrowDown', 80, 89],
    ['Home', 0, 90],
    ['End', 100, 90],
    ['PageUp', 80, 100],
    ['PageDown', 80, 80],
  ])('supports %s on the two-dimensional area', (key, saturation, value) => {
    const fixture = setup();
    fixture.componentInstance['_onAreaKeydown']({
      key,
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    expect(fixture.componentInstance['_roundedHsv']()).toMatchObject({ saturation, value });
  });

  it('ignores unrelated area keys and supports shifted ten-point increments', () => {
    const fixture = setup();
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['_onAreaKeydown']({ key: 'Enter' } as KeyboardEvent);
    expect(fixture.componentInstance['_color']()).toEqual(before);
    fixture.componentInstance['_onAreaKeydown']({
      key: 'ArrowLeft',
      shiftKey: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    expect(fixture.componentInstance['_roundedHsv']().saturation).toBe(70);
  });

  it('edits RGB/alpha channels with clamping', () => {
    const fixture = setup({ showAlpha: true });
    fixture.componentInstance['_onChannelInput']('red', '300');
    fixture.componentInstance['_onChannelInput']('green', '-2');
    fixture.componentInstance['_onChannelInput']('alpha', '25');
    const color = fixture.componentInstance['_color']();
    expect(color.red).toBe(1);
    expect(color.green).toBe(0);
    expect(color.alpha).toBe(0.25);
  });

  it('edits HSL and OKLCH channel models while retaining alpha', () => {
    const fixture = setup({ showAlpha: true, showChannels: true });
    fixture.componentInstance.writeValue('#33669980');
    fixture.componentInstance['_selectMode']('hsl');
    expect(fixture.componentInstance['_channelViews']()).toHaveLength(4);
    fixture.componentInstance['_onChannelInput']('hue', '120');
    fixture.componentInstance['_onChannelInput']('saturation', '25');
    fixture.componentInstance['_onChannelInput']('lightness', '70');
    expect(fixture.componentInstance['_hue']()).toBe(120);
    expect(fixture.componentInstance['_color']().alpha).toBeCloseTo(0.502, 3);
    fixture.componentInstance['_selectMode']('oklch');
    expect(fixture.componentInstance['_channelViews']()).toHaveLength(4);
    fixture.componentInstance['_onChannelInput']('lightness', '0.6');
    fixture.componentInstance['_onChannelInput']('chroma', '0.12');
    fixture.componentInstance['_onChannelInput']('hue', '250');
    expect(fixture.componentInstance['_textValue']()).toMatch(/^oklch\(/);
  });

  it('ignores blank/non-finite channels and finishes a channel edit on blur', () => {
    const fixture = setup();
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['_onChannelInput']('red', '');
    fixture.componentInstance['_onChannelInput']('red', 'NaN');
    expect(fixture.componentInstance['_color']()).toEqual(before);
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    fixture.componentInstance['beginColorChange']();
    fixture.componentInstance['_onChannelInput']('red', '255');
    fixture.componentInstance['_onChannelBlur']();
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('composes direct and CVA disabled state and enforces readonly', () => {
    const fixture = setup();
    const before = fixture.componentInstance['_color']();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.componentInstance['_pickSwatch']('#ff0000');
    expect(fixture.componentInstance['_color']()).toEqual(before);
    fixture.componentRef.setInput('disabled', false);
    fixture.componentInstance.setDisabledState(true);
    expect(fixture.componentInstance['_isDisabled']()).toBe(true);
    fixture.componentInstance.setDisabledState(false);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    fixture.componentInstance['_onAlphaChange'](0.2);
    fixture.componentInstance['_onChannelInput']('red', '0');
    expect(fixture.componentInstance['_color']()).toEqual(before);
  });

  it('marks touched on blur but never during a programmatic write', () => {
    const fixture = setup();
    const touched = vi.fn();
    fixture.componentInstance.registerOnTouched(touched);
    fixture.componentInstance.writeValue('#ffffff');
    expect(touched).not.toHaveBeenCalled();
    fixture.componentInstance.onBlur();
    expect(touched).toHaveBeenCalledTimes(1);
  });

  it('works as a real value accessor with FormControl', async () => {
    const fixture = TestBed.createComponent(ColorPickerHostComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const picker = fixture.debugElement.children[0].componentInstance as NeuColorPickerComponent;
    picker['_pickSwatch']('#22c55e');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.colorControl.value).toBe('#22c55e');
  });

  it('renders alpha and channel controls only when enabled', async () => {
    const fixture = await openPanel(setup({ showAlpha: true, showChannels: true }));
    expect(document.querySelector('.neu-cp__alpha-slider')).toBeTruthy();
    expect(document.querySelectorAll('.neu-cp__channel')).toHaveLength(4);
    const alpha = document.querySelector('.neu-cp__alpha-slider') as HTMLInputElement;
    alpha.value = '0.5';
    alpha.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance['_alphaPercent']()).toBe(50);
  });

  it('switches format from the template without emitting a color change', async () => {
    const fixture = await openPanel();
    const output = vi.fn();
    fixture.componentInstance.colorChange.subscribe(output);
    const button = [...document.querySelectorAll<HTMLButtonElement>('.neu-cp__mode-btn')].find(
      (item) => item.textContent?.trim() === 'OKLCH',
    );
    button?.click();
    fixture.detectChanges();
    expect(fixture.componentInstance['_activeMode']()).toBe('oklch');
    expect(fixture.componentInstance['_draft']()).toBeNull();
    expect(output).not.toHaveBeenCalled();
  });

  it('keeps programmatic mode and capability toggles silent and clears stale drafts', async () => {
    const fixture = setup({ showAlpha: true, showChannels: true, mode: 'rgb' });
    const cva = vi.fn();
    const change = vi.fn();
    const end = vi.fn();
    fixture.componentInstance.registerOnChange(cva);
    fixture.componentInstance.colorChange.subscribe(change);
    fixture.componentInstance.colorChangeEnd.subscribe(end);
    fixture.componentInstance.writeValue('rgba(10, 20, 30, 0.4)');
    fixture.componentInstance['_onTextChange']('rgb(');
    fixture.componentRef.setInput('mode', 'oklch');
    fixture.componentRef.setInput('showAlpha', false);
    fixture.componentRef.setInput('showChannels', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance['_activeMode']()).toBe('oklch');
    expect(fixture.componentInstance['_textValue']()).not.toContain('/');
    expect(fixture.componentInstance['_channelViews']()).toHaveLength(3);
    expect(fixture.componentInstance['_color']().alpha).toBe(0.4);
    expect(cva).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });

  it('wires every advanced control through the rendered template', async () => {
    const fixture = setup({ showAlpha: true, showChannels: true });
    const trigger = fixture.nativeElement.querySelector('.neu-cp__trigger') as HTMLButtonElement;
    trigger.dispatchEvent(new FocusEvent('blur'));
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const area = document.querySelector('.neu-cp__canvas-wrap') as HTMLElement;
    Object.defineProperty(area, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });
    area.setPointerCapture = vi.fn();
    area.releasePointerCapture = vi.fn();
    area.hasPointerCapture = vi.fn(() => true);
    area.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 4,
        clientX: 20,
        clientY: 80,
        bubbles: true,
      }),
    );
    area.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 4,
        clientX: 60,
        clientY: 30,
        bubbles: true,
      }),
    );
    area.dispatchEvent(
      new PointerEvent('pointerup', {
        pointerId: 4,
        clientX: 60,
        clientY: 30,
        bubbles: true,
      }),
    );
    area.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 4, bubbles: true }));
    area.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 4, bubbles: true }));
    area.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    area.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    const hue = document.querySelector('.neu-cp__hue-slider') as HTMLInputElement;
    hue.value = '72';
    hue.dispatchEvent(new Event('input', { bubbles: true }));
    hue.dispatchEvent(new Event('change', { bubbles: true }));

    const alpha = document.querySelector('.neu-cp__alpha-slider') as HTMLInputElement;
    alpha.value = '0.4';
    alpha.dispatchEvent(new Event('input', { bubbles: true }));
    alpha.dispatchEvent(new Event('change', { bubbles: true }));

    (document.querySelector('.neu-cp__sw') as HTMLButtonElement).click();

    const channel = document.querySelector('.neu-cp__channel input') as HTMLInputElement;
    channel.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    channel.value = '64';
    channel.dispatchEvent(new Event('input', { bubbles: true }));
    channel.dispatchEvent(new Event('change', { bubbles: true }));
    channel.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    const text = document.querySelector('.neu-cp__text-input') as HTMLInputElement;
    text.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    text.value = '#12345678';
    text.dispatchEvent(new Event('input', { bubbles: true }));
    text.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    text.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    fixture.detectChanges();
    expect(fixture.componentInstance['_textValue']()).toBe('#12345678');

    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
  });

  it('routes document mousedown through the host listener', () => {
    const fixture = setup();
    fixture.componentInstance['_isOpen'].set(true);
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
    outside.remove();
  });

  it('closes for outside pointer intent but not panel/trigger/backdrop mousedown', () => {
    const fixture = setup();
    fixture.componentInstance['_isOpen'].set(true);
    const outside = document.createElement('div');
    fixture.componentInstance['_outsideClick']({ target: outside } as unknown as MouseEvent);
    expect(fixture.componentInstance['_isOpen']()).toBe(false);

    fixture.componentInstance['_isOpen'].set(true);
    const panel = document.createElement('div');
    panel.className = 'neu-cp__panel';
    fixture.componentInstance['_outsideClick']({ target: panel } as unknown as MouseEvent);
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
    fixture.componentInstance['_outsideClick']({
      target: fixture.nativeElement.querySelector('.neu-cp__trigger'),
    } as unknown as MouseEvent);
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
    const backdrop = document.createElement('div');
    backdrop.className = 'cdk-overlay-backdrop';
    fixture.componentInstance['_outsideClick']({ target: backdrop } as unknown as MouseEvent);
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
  });

  it('applies the shared dismissal policy to Escape and preserves prevented drafts', () => {
    const fixture = setup();
    const reasons: string[] = [];
    (fixture.componentInstance as any).dismissGuard = (request: { reason: string }) => {
      reasons.push(request.reason);
      return request.reason !== 'escape';
    };
    fixture.componentInstance['_isOpen'].set(true);
    fixture.componentInstance['_onTextChange']('invalid draft');
    fixture.componentInstance['requestEscapeDismiss']({
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent);
    expect(reasons).toEqual(['escape']);
    expect(fixture.componentInstance['_isOpen']()).toBe(true);
    expect(fixture.componentInstance['_draft']()).toBe('invalid draft');
    fixture.componentInstance['requestOutsideDismiss']({
      preventDefault: vi.fn(),
    } as unknown as Event);
    expect(reasons).toEqual(['escape', 'outside-pointer']);
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
    expect(fixture.componentInstance['_draft']()).toBeNull();
  });

  it('cleans draft and continuous state on programmatic close without a late end event', () => {
    const fixture = setup();
    const ends = vi.fn();
    fixture.componentInstance.colorChangeEnd.subscribe(ends);
    fixture.componentInstance['_isOpen'].set(true);
    fixture.componentInstance['beginColorChange']();
    fixture.componentInstance['_onTextChange']('rgb(1');
    fixture.componentInstance['_toggle']();
    fixture.componentInstance['finishColorChange']();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);
    expect(fixture.componentInstance['_draft']()).toBeNull();
    expect(ends).not.toHaveBeenCalled();
  });

  it('syncs the mode input through linked state', async () => {
    const fixture = setup({ mode: 'rgb' });
    await fixture.whenStable();
    expect(fixture.componentInstance['_activeMode']()).toBe('rgb');
    expect(fixture.componentInstance['_textValue']()).toMatch(/^rgb\(/);
  });

  it('covers safe no-op branches for hidden, guarded and destroyed state', () => {
    const fixture = setup();
    expect(fixture.componentInstance['_channelViews']()).toHaveLength(3);
    fixture.componentInstance.writeValue(null);
    expect(fixture.componentInstance['_cssColor']()).toBe('transparent');

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    fixture.componentInstance['_toggle']();
    expect(fixture.componentInstance['_isOpen']()).toBe(false);

    fixture.componentRef.setInput('disabled', false);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    const before = fixture.componentInstance['_color']();
    fixture.componentInstance['_onAreaKeydown']({ key: 'ArrowRight' } as KeyboardEvent);
    expect(fixture.componentInstance['_color']()).toEqual(before);

    fixture.componentRef.setInput('readonly', false);
    fixture.detectChanges();
    fixture.componentInstance['_pickSwatch']('invalid');
    fixture.componentInstance['_onTextChange']('invalid');
    fixture.componentInstance['_onTextKeydown']({ key: 'Enter' } as KeyboardEvent);

    (fixture.componentInstance as any).dismissGuard = () => false;
    fixture.componentInstance['_isOpen'].set(true);
    fixture.componentInstance['requestOutsideDismiss'](new Event('mousedown'));
    expect(fixture.componentInstance['_isOpen']()).toBe(true);

    fixture.componentInstance['requestEscapeDismiss']({ preventDefault: vi.fn() } as any);
    fixture.componentInstance['_isOpen'].set(false);
    fixture.componentInstance['requestEscapeDismiss']({ preventDefault: vi.fn() } as any);

    fixture.destroy();
    expect(() => fixture.componentInstance['onPanelDetached']()).not.toThrow();
  });

  it('emits nothing late when destroyed during every advanced interaction state', () => {
    const fixture = setup({ showAlpha: true, showChannels: true });
    const output = vi.fn();
    const end = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.colorChange.subscribe(output);
    fixture.componentInstance.colorChangeEnd.subscribe(end);
    fixture.componentInstance.closed.subscribe(closed);
    const target = fakePointerTarget();
    fixture.componentInstance['_canvasDown']({
      pointerId: 11,
      clientX: 20,
      clientY: 20,
      currentTarget: target,
    } as unknown as PointerEvent);
    fixture.componentInstance['_onAlphaChange'](0.6);
    fixture.componentInstance['_onHueChange'](80);
    fixture.componentInstance['_onChannelInput']('red', '100');
    fixture.componentInstance['_onTextChange']('rgb(');
    fixture.componentInstance['_isOpen'].set(true);
    const beforeDestroy = output.mock.calls.length;
    fixture.destroy();
    fixture.componentInstance['_canvasUp']({ pointerId: 11, currentTarget: target } as any);
    fixture.componentInstance['finishColorChange']();
    fixture.componentInstance['_onAlphaChange'](0.2);
    fixture.componentInstance['_onHueChange'](120);
    fixture.componentInstance['_onChannelInput']('red', '200');
    fixture.componentInstance['_onTextChange']('#ffffff');
    fixture.componentInstance['onPanelDetached']();
    expect(output).toHaveBeenCalledTimes(beforeDestroy);
    expect(end).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();
  });
});
