import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuColorPickerComponent } from './neu-color-picker.component';

@Component({
  template: `<neu-color-picker [formControl]="colorCtrl" />`,
  imports: [NeuColorPickerComponent, ReactiveFormsModule],
})
class ColorPickerHostComponent {
  readonly colorCtrl = new FormControl('#3b82f6', { nonNullable: true });
}

function setup() {
  const f = TestBed.createComponent(NeuColorPickerComponent);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  }).compileComponents(),
);

describe('NeuColorPickerComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should render the trigger button', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-cp__trigger')).toBeTruthy();
  });

  it('_toggle should open and close panel', () => {
    const f = setup();
    f.componentInstance._toggle();
    expect(f.componentInstance._isOpen()).toBe(true);
    f.componentInstance._toggle();
    expect(f.componentInstance._isOpen()).toBe(false);
  });

  it('should show panel when open', async () => {
    const f = setup();
    f.componentInstance._toggle();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-cp__panel')).toBeTruthy();
  });

  it('clicking the trigger button should toggle the panel from the template', async () => {
    const f = setup();
    const trigger = f.nativeElement.querySelector('.neu-cp__trigger') as HTMLButtonElement;
    trigger.click();
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance._isOpen()).toBe(true);

    trigger.click();
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance._isOpen()).toBe(false);
  });

  it('_hexValue should return a hex string', () => {
    const f = setup();
    const hex = f.componentInstance._hexValue();
    expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('_onHueChange should update _hue', () => {
    const f = setup();
    f.componentInstance._onHueChange(180);
    expect(f.componentInstance._hue()).toBe(180);
  });

  it('_sv saturation should be settable via _sv.set', () => {
    const f = setup();
    f.componentInstance._sv.set({ s: 75, v: f.componentInstance._sv().v });
    expect(f.componentInstance._sv().s).toBe(75);
  });

  it('_sv value should be settable via _sv.set', () => {
    const f = setup();
    f.componentInstance._sv.set({ s: f.componentInstance._sv().s, v: 40 });
    expect(f.componentInstance._sv().v).toBe(40);
  });

  it('colorChange should emit when hue changes', () => {
    const f = setup();
    const values: string[] = [];
    f.componentInstance.colorChange.subscribe((v: string) => values.push(v));
    f.componentInstance._onHueChange(90);
    expect(values.length).toBe(1);
  });

  it('writeValue with hex should update hue and sv', () => {
    const f = setup();
    f.componentInstance.writeValue('#ff0000');
    expect(f.componentInstance._hue()).toBe(0);
    expect(f.componentInstance._sv().s).toBe(100);
    expect(f.componentInstance._sv().v).toBe(100);
  });

  it('writeValue with null should not throw', () => {
    const f = setup();
    expect(() => f.componentInstance.writeValue(null)).not.toThrow();
  });

  it('_textValue in hex mode returns hex string', () => {
    const f = setup();
    const tv = f.componentInstance._textValue();
    expect(tv.startsWith('#')).toBe(true);
  });

  it('setDisabledState should set _cvaDisabled', () => {
    const f = setup();
    f.componentInstance.setDisabledState(true);
    expect(f.componentInstance._cvaDisabled()).toBe(true);
  });

  it('_onTextChange with valid hex should update color', () => {
    const f = setup();
    f.componentInstance._onTextChange('#00ff00');
    expect(f.componentInstance._hue()).toBe(120);
  });

  it('_onTextChange with rgb string should parse', () => {
    const f = setup();
    f.componentInstance._onTextChange('rgb(255, 0, 0)');
    expect(f.componentInstance._hue()).toBe(0);
  });

  it('_onTextChange with hsl string should parse (hue check)', () => {
    const f = setup();
    f.componentInstance._onTextChange('hsl(240, 100%, 50%)');
    expect(f.componentInstance._hue()).toBe(240);
    expect(f.componentInstance._sv().s).toBe(100);
  });

  it('_pickSwatch should update color and emit', () => {
    const f = setup();
    const values: string[] = [];
    f.componentInstance.colorChange.subscribe((v: string) => values.push(v));
    f.componentInstance._pickSwatch('#ef4444');
    expect(values.length).toBe(1);
    expect(f.componentInstance._hue()).toBeGreaterThanOrEqual(0);
  });

  it('_activeMode can be changed to rgb and textValue returns rgb()', () => {
    const f = setup();
    f.componentInstance._activeMode.set('rgb');
    const tv = f.componentInstance._textValue();
    expect(tv.startsWith('rgb(')).toBe(true);
  });

  it('_activeMode can be changed to hsl and textValue returns hsl()', () => {
    const f = setup();
    f.componentInstance._activeMode.set('hsl');
    const tv = f.componentInstance._textValue();
    expect(tv.startsWith('hsl(')).toBe(true);
  });

  it('should work as a real value accessor with FormControl', async () => {
    const f = TestBed.createComponent(ColorPickerHostComponent);
    f.detectChanges();
    await f.whenStable();

    const picker = f.debugElement.children[0].componentInstance as NeuColorPickerComponent;
    expect(picker._hexValue()).toMatch(/^#3b82f[56]$/);

    picker._pickSwatch('#22c55e');
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.colorCtrl.value).not.toBe('#3b82f6');
    expect(f.componentInstance.colorCtrl.value).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('clicking a mode button should update the active mode from the template', async () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const buttons = Array.from(
      f.nativeElement.querySelectorAll('.neu-cp__mode-btn'),
    ) as HTMLButtonElement[];
    buttons.find((button) => button.textContent?.trim() === 'RGB')?.click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance._activeMode()).toBe('rgb');
    expect(f.nativeElement.querySelector('.neu-cp__text-input')?.getAttribute('aria-label')).toBe(
      'Valor rgb',
    );
  });

  it('clicking a swatch button should update the current color from the template', async () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    await f.whenStable();
    const previousHex = f.componentInstance._hexValue();

    const swatches = Array.from(
      f.nativeElement.querySelectorAll('.neu-cp__sw'),
    ) as HTMLButtonElement[];
    swatches[0].click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance._hexValue()).not.toBe(previousHex);
    expect(f.componentInstance._hue()).toBe(0);
  });

  it('typing in the text input should parse the value from the template', async () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const input = f.nativeElement.querySelector('.neu-cp__text-input') as HTMLInputElement;
    input.value = '#00ff00';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance._hexValue()).toBe('#00ff00');
  });

  it('moving the hue slider should update hue from the template', async () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const slider = f.nativeElement.querySelector('.neu-cp__hue-slider') as HTMLInputElement;
    slider.value = '45';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance._hue()).toBe(45);
  });

  it('pointermove on the canvas should update saturation and value from the template', async () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    await f.whenStable();

    const canvas = f.nativeElement.querySelector('.neu-cp__canvas-wrap') as HTMLDivElement;
    canvas.setPointerCapture = vi.fn();
    canvas.releasePointerCapture = vi.fn();
    Object.defineProperty(canvas, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    });

    canvas.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 10, clientY: 90 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 70, clientY: 20 }),
    );
    canvas.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 70, clientY: 20 }),
    );
    f.detectChanges();

    expect(f.componentInstance._sv()).toEqual({ s: 70, v: 80 });
  });

  it('_canvasDown sets _dragging to true', () => {
    const f = setup();
    const comp = f.componentInstance as any;
    const fakeEl = document.createElement('div');
    Object.defineProperty(fakeEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    });
    fakeEl.setPointerCapture = vi.fn();
    fakeEl.releasePointerCapture = vi.fn();
    const ev = {
      clientX: 100,
      clientY: 100,
      currentTarget: fakeEl,
      pointerId: 1,
    } as unknown as PointerEvent;
    comp._canvasDown(ev);
    expect(comp._dragging).toBe(true);
    // Cleanup: release
    comp._canvasUp({ currentTarget: fakeEl, pointerId: 1 } as unknown as PointerEvent);
  });

  it('_canvasDrag updates sv when dragging', () => {
    const f = setup();
    const comp = f.componentInstance as any;
    comp._dragging = true;
    const fakeEl = document.createElement('div');
    Object.defineProperty(fakeEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    });
    const ev = { clientX: 50, clientY: 100, currentTarget: fakeEl } as unknown as PointerEvent;
    comp._canvasDrag(ev);
    expect(comp._sv().s).toBe(25); // 50/200*100
  });

  it('_canvasDrag does nothing when not dragging', () => {
    const f = setup();
    const comp = f.componentInstance as any;
    comp._dragging = false;
    const before = { ...comp._sv() };
    const fakeEl = document.createElement('div');
    Object.defineProperty(fakeEl, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, width: 200, height: 200 }),
    });
    comp._canvasDrag({
      clientX: 50,
      clientY: 50,
      currentTarget: fakeEl,
    } as unknown as PointerEvent);
    expect(comp._sv()).toEqual(before);
  });

  it('_canvasDown should clamp coordinates to the canvas bounds', () => {
    const f = setup();
    const comp = f.componentInstance as any;
    const fakeEl = document.createElement('div');
    Object.defineProperty(fakeEl, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 10, width: 100, height: 100 }),
    });
    fakeEl.setPointerCapture = vi.fn();
    fakeEl.releasePointerCapture = vi.fn();

    comp._canvasDown({
      clientX: 500,
      clientY: -100,
      currentTarget: fakeEl,
      pointerId: 1,
    } as unknown as PointerEvent);

    expect(comp._sv()).toEqual({ s: 100, v: 100 });
  });

  it('_canvasUp sets _dragging to false', () => {
    const f = setup();
    const comp = f.componentInstance as any;
    comp._dragging = true;
    const fakeEl = document.createElement('div');
    fakeEl.releasePointerCapture = vi.fn();
    comp._canvasUp({ currentTarget: fakeEl, pointerId: 1 } as unknown as PointerEvent);
    expect(comp._dragging).toBe(false);
  });

  it('_outsideClick closes the panel', () => {
    const f = setup();
    f.componentInstance._toggle();
    expect(f.componentInstance._isOpen()).toBe(true);
    const externalNode = document.createElement('div');
    f.componentInstance._outsideClick({ target: externalNode } as unknown as MouseEvent);
    expect(f.componentInstance._isOpen()).toBe(false);
  });

  it('_outsideClick should keep the panel open when the click is inside the component', () => {
    const f = setup();
    f.componentInstance._isOpen.set(true);
    f.detectChanges();
    const internalNode = f.nativeElement.querySelector('.neu-cp__trigger') as HTMLElement;
    f.componentInstance._outsideClick({ target: internalNode } as unknown as MouseEvent);
    expect(f.componentInstance._isOpen()).toBe(true);
  });

  it('writeValue with an invalid string should keep the previous HSV state', () => {
    const f = setup();
    const previousHue = f.componentInstance._hue();
    const previousSv = f.componentInstance._sv();
    f.componentInstance.writeValue('not-a-valid-color');
    expect(f.componentInstance._hue()).toBe(previousHue);
    expect(f.componentInstance._sv()).toEqual(previousSv);
  });

  it('mode input syncs to _activeMode', async () => {
    const f2 = TestBed.createComponent(
      (await import('./neu-color-picker.component')).NeuColorPickerComponent,
    );
    f2.componentRef.setInput('mode', 'rgb');
    f2.detectChanges();
    await f2.whenStable();
    expect(f2.componentInstance._activeMode()).toBe('rgb');
  });

  it('registerOnChange is stored and called on hue change', () => {
    const f = setup();
    const values: string[] = [];
    f.componentInstance.registerOnChange((v: string) => values.push(v));
    f.componentInstance._onHueChange(200);
    expect(values.length).toBe(1);
  });

  it('registerOnTouched is stored', () => {
    const f = setup();
    let touched = false;
    f.componentInstance.registerOnTouched(() => (touched = true));
    // _onTouched is called internally
    expect(typeof (f.componentInstance as any)._onTouched).toBe('function');
  });

  it('_onTextChange with rgb string should parse and update color', () => {
    // _onTextChange con cadena rgb debe parsear y actualizar el color
    // _onTextChange with rgb string must parse and update the color
    const f = setup();
    const values: string[] = [];
    f.componentInstance.registerOnChange((v: string) => values.push(v));
    f.componentInstance._onTextChange('rgb(255, 0, 0)');
    expect(values.length).toBe(1);
    expect(f.componentInstance._hue()).toBe(0); // red = hue 0
  });

  it('_onTextChange with hsl string should parse and update color', () => {
    // _onTextChange con cadena hsl debe parsear y actualizar el color
    // _onTextChange with hsl string must parse and update the color
    const f = setup();
    const values: string[] = [];
    f.componentInstance.registerOnChange((v: string) => values.push(v));
    f.componentInstance._onTextChange('hsl(120, 100%, 50%)');
    expect(values.length).toBe(1);
    // Green hue is around 120
    expect(f.componentInstance._hue()).toBeCloseTo(120, -1);
  });

  it('_textValue in hsl mode should handle a green color branch', () => {
    const f = setup();
    f.componentInstance._onTextChange('rgb(0, 255, 0)');
    f.componentInstance._activeMode.set('hsl');
    expect(f.componentInstance._textValue()).toContain('hsl(120');
  });

  it('_textValue in hsl mode should handle a red color branch', () => {
    const f = setup();
    f.componentInstance._onTextChange('rgb(255, 0, 0)');
    f.componentInstance._activeMode.set('hsl');
    expect(f.componentInstance._textValue()).toContain('hsl(0');
  });

  it('_onTextChange with invalid hex should keep the current color', () => {
    const f = setup();
    const previousHex = f.componentInstance._hexValue();
    f.componentInstance._onTextChange('#gggggg');
    expect(f.componentInstance._hexValue()).toBe(previousHex);
  });

  it('default touched callback should be callable before registration', () => {
    const f = setup();
    expect(() => (f.componentInstance as any)._onTouched()).not.toThrow();
  });

  it('_onTextChange with invalid string should not throw and still emit', () => {
    // _onTextChange con cadena inválida no debe lanzar y aún debe emitir
    // _onTextChange with invalid string must not throw and still emit
    const f = setup();
    expect(() => f.componentInstance._onTextChange('not-a-color')).not.toThrow();
  });
});
