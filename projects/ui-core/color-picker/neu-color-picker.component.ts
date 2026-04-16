import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type NeuColorMode = 'hex' | 'rgb' | 'hsl';

/** Parse hex → { r, g, b } */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').padEnd(6, '0');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const _r = r / 255,
    _g = g / 255,
    _b = b / 255;
  const max = Math.max(_r, _g, _b),
    min = Math.min(_r, _g, _b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case _r:
        h = ((_g - _b) / d + (_g < _b ? 6 : 0)) / 6;
        break;
      case _g:
        h = ((_b - _r) / d + 2) / 6;
        break;
      case _b:
        h = ((_r - _g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const _r = r / 255,
    _g = g / 255,
    _b = b / 255;
  const max = Math.max(_r, _g, _b),
    min = Math.min(_r, _g, _b);
  const v = max;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case _r:
        h = ((_g - _b) / d + (_g < _b ? 6 : 0)) / 6;
        break;
      case _g:
        h = ((_b - _r) / d + 2) / 6;
        break;
      case _b:
        h = ((_r - _g) / d + 4) / 6;
        break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex(h: number, s: number, v: number): string {
  const _s = s / 100,
    _v = v / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const val = _v - _v * _s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(val * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}

function hslToHex(h: number, s: number, l: number): string {
  const _s = s / 100,
    _l = l / 100;
  const a = _s * Math.min(_l, 1 - _l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = _l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

let _seq = 0;

/**
 * NeuralUI ColorPicker
 *
 * Selector de color con swatch, hue slider y modos hex/rgb/hsl. CVA.
 *
 * Uso:
 *   <neu-color-picker [formControl]="colorCtrl" mode="hex" />
 */
@Component({
  selector: 'neu-color-picker',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NeuColorPickerComponent),
      multi: true,
    },
  ],
  host: {
    class: 'neu-cp',
    '[class.neu-cp--open]': '_isOpen()',
    '[class.neu-cp--disabled]': '_cvaDisabled()',
  },
  template: `
    <!-- Swatch trigger -->
    <button
      type="button"
      class="neu-cp__trigger"
      [attr.aria-expanded]="_isOpen()"
      [attr.aria-label]="'Color: ' + _hexValue()"
      [disabled]="_cvaDisabled()"
      (click)="_toggle()"
    >
      <span class="neu-cp__swatch" [style.background]="_hexValue()"></span>
      <span class="neu-cp__hex-label">{{ _hexValue() }}</span>
    </button>

    @if (_isOpen()) {
      <div class="neu-cp__panel" role="dialog" aria-label="Selector de color">
        <!-- HSV Canvas -->
        <div
          class="neu-cp__canvas-wrap"
          [style.background-color]="'hsl(' + _hue() + ', 100%, 50%)'"
          (pointerdown)="_canvasDown($event)"
          (pointermove)="_canvasDrag($event)"
          (pointerup)="_canvasUp($event)"
        >
          <div
            class="neu-cp__canvas-cursor"
            [style.left]="_sv().s + '%'"
            [style.top]="100 - _sv().v + '%'"
          ></div>
        </div>

        <!-- Hue slider -->
        <input
          type="range"
          class="neu-cp__hue-slider"
          min="0"
          max="360"
          [value]="_hue()"
          (input)="_onHueChange(+$any($event.target).value)"
          [attr.aria-label]="'Tono ' + _hue() + '°'"
        />

        <!-- Swatches -->
        <div class="neu-cp__swatches" role="group" aria-label="Colores predefinidos">
          @for (sw of _swatches; track sw) {
            <button
              type="button"
              class="neu-cp__sw"
              [style.background]="sw"
              [attr.aria-label]="'Color ' + sw"
              (click)="_pickSwatch(sw)"
            ></button>
          }
        </div>

        <!-- Mode tabs -->
        <div class="neu-cp__mode-tabs">
          @for (m of _modes; track m) {
            <button
              type="button"
              class="neu-cp__mode-btn"
              [class.neu-cp__mode-btn--active]="_activeMode() === m"
              (click)="_activeMode.set(m)"
            >
              {{ m.toUpperCase() }}
            </button>
          }
        </div>

        <!-- Value input -->
        <div class="neu-cp__input-row">
          <input
            class="neu-cp__text-input"
            type="text"
            [value]="_textValue()"
            (input)="_onTextChange($any($event.target).value)"
            [attr.aria-label]="'Valor ' + _activeMode()"
          />
          <span class="neu-cp__swatch-sm" [style.background]="_hexValue()"></span>
        </div>
      </div>
    }
  `,
  styleUrl: './neu-color-picker.component.scss',
})
export class NeuColorPickerComponent implements ControlValueAccessor {
  // ── Inputs / Outputs ────────────────────────────────────────────
  readonly mode = input<NeuColorMode>('hex');

  /** Emitido al cambiar el color / Emitted when color changes */
  readonly colorChange = output<string>();

  // ── Internal state ───────────────────────────────────────────────
  readonly _id = `neu-cp-${++_seq}`;
  readonly _modes: NeuColorMode[] = ['hex', 'rgb', 'hsl'];
  readonly _swatches: string[] = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#a855f7',
    '#ec4899',
  ];

  readonly _isOpen = signal(false);
  readonly _cvaDisabled = signal(false);
  readonly _hue = signal(210);
  readonly _sv = signal({ s: 80, v: 90 });
  readonly _activeMode = signal<NeuColorMode>('hex');

  private _dragging = false;
  private _onChange: (v: string) => void = () => {};
  private _onTouched: () => void = () => {};

  private readonly _el = inject(ElementRef<HTMLElement>);

  constructor() {
    // Sync mode input → internal active mode
    effect(() => {
      this._activeMode.set(this.mode());
    });
  }

  // ── Close on outside click ─────────────────────────────────────
  @HostListener('document:mousedown', ['$event'])
  _outsideClick(e: MouseEvent): void {
    if (!this._el.nativeElement.contains(e.target as Node)) {
      this._isOpen.set(false);
    }
  }

  // ── Computed ──────────────────────────────────────────────────
  readonly _hexValue = computed(() => hsvToHex(this._hue(), this._sv().s, this._sv().v));

  readonly _textValue = computed(() => {
    const hex = this._hexValue();
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    switch (this._activeMode()) {
      case 'rgb':
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      case 'hsl': {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      }
      default:
        return hex;
    }
  });

  // ── Canvas interactions ───────────────────────────────────────
  _canvasDown(e: PointerEvent): void {
    this._dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this._updateFromCanvas(e);
  }

  _canvasDrag(e: PointerEvent): void {
    if (!this._dragging) return;
    this._updateFromCanvas(e);
  }

  _canvasUp(e: PointerEvent): void {
    this._dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  private _updateFromCanvas(e: PointerEvent): void {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const s = Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100);
    const v = Math.round(Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)) * 100);
    this._sv.set({ s, v });
    this._emit();
  }

  // ── Event handlers ────────────────────────────────────────────
  _toggle(): void {
    this._isOpen.update((v) => !v);
  }

  _onHueChange(v: number): void {
    this._hue.set(Number(v));
    this._emit();
  }

  _pickSwatch(hex: string): void {
    this._applyHex(hex);
    this._emit();
  }

  _onTextChange(text: string): void {
    const t = text.trim();
    if (t.startsWith('#')) {
      this._applyHex(t);
    } else if (t.startsWith('rgb')) {
      const m = t.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) this._applyHex(rgbToHex(+m[1], +m[2], +m[3]));
    } else if (t.startsWith('hsl')) {
      const m = t.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
      if (m) this._applyHex(hslToHex(+m[1], +m[2], +m[3]));
    }
    this._emit();
  }

  // ── Helpers ───────────────────────────────────────────────────
  private _applyHex(hex: string): void {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    this._hue.set(hsv.h);
    this._sv.set({ s: hsv.s, v: hsv.v });
  }

  private _emit(): void {
    const val = this._textValue();
    this._onChange(val);
    this.colorChange.emit(val);
  }

  // ── CVA ──────────────────────────────────────────────────────
  writeValue(val: string | null): void {
    if (!val) return;
    this._onTextChange(val);
  }

  registerOnChange(fn: (v: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this._cvaDisabled.set(d);
  }
}
