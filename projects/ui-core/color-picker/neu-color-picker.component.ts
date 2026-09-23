import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { NeuIdGenerator } from '@neural-ui/core/internal';
import { NEU_OVERLAY_DISMISS_GUARD, allowsNeuOverlayDismissal } from '@neural-ui/core/foundation';
import {
  NeuColorMode,
  NeuSrgbColor,
  clamp,
  colorsEqual,
  hslToSrgb,
  hsvToSrgb,
  oklchToSrgb,
  parseColor,
  serializeColor,
  srgbToHsl,
  srgbToHsv,
  srgbToOklch,
  wrapHue,
} from './color-utils';

export type { NeuColorMode } from './color-utils';

type NeuColorChannel =
  | 'red'
  | 'green'
  | 'blue'
  | 'hue'
  | 'saturation'
  | 'lightness'
  | 'chroma'
  | 'alpha';

interface NeuColorChannelView {
  readonly key: NeuColorChannel;
  readonly shortLabel: string;
  readonly label: string;
  readonly value: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
}

interface NeuEyeDropperResult {
  readonly sRGBHex: string;
}

interface NeuEyeDropper {
  open(options?: { readonly signal?: AbortSignal }): Promise<NeuEyeDropperResult>;
}

type NeuEyeDropperWindow = Window & { readonly EyeDropper?: new () => NeuEyeDropper };

const DEFAULT_COLOR: NeuSrgbColor = hsvToSrgb(210, 80, 90);
const DEFAULT_COLOR_VALUE = serializeColor(DEFAULT_COLOR, 'hex', false, 210);

/**
 * NeuralUI ColorPicker.
 *
 * String-valued Signal Forms control with optional alpha, direct CSS input,
 * compact channel editing and HEX/RGB/HSL/OKLCH serialization.
 */
@Component({
  selector: 'neu-color-picker',
  imports: [OverlayModule],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'neu-cp',
    '[class.neu-cp--open]': '_isOpen()',
    '[class.neu-cp--disabled]': '_isDisabled()',
  },
  template: `
    <button
      cdkOverlayOrigin
      #colorPickerOrigin="cdkOverlayOrigin"
      type="button"
      class="neu-cp__trigger"
      [id]="triggerId()"
      [attr.aria-expanded]="_isOpen()"
      [attr.aria-controls]="_isOpen() ? panelId : null"
      aria-haspopup="dialog"
      [attr.aria-label]="ariaLabel() || 'Color: ' + (_textValue() || 'not set')"
      [attr.aria-labelledby]="ariaLabelledBy() || null"
      [attr.aria-describedby]="ariaDescribedBy() || null"
      [attr.aria-required]="required() ? 'true' : null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-readonly]="readonly() ? 'true' : null"
      [disabled]="_isDisabled()"
      (focus)="onBoundaryFocusIn()"
      (click)="_toggle()"
      (blur)="onBlur()"
    >
      <span class="neu-cp__swatch" [style.--neu-cp-color]="_cssColor()"></span>
      <span class="neu-cp__value-label neu-cp__hex-label">{{ _hexValue() }}</span>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="colorPickerOrigin"
      [cdkConnectedOverlayOpen]="_isOpen()"
      [cdkConnectedOverlayPositions]="overlayPositions"
      [cdkConnectedOverlayScrollStrategy]="overlayScrollStrategy"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="_viewportMargin"
      (backdropClick)="requestOutsideDismiss($event)"
      (overlayKeydown)="requestEscapeDismiss($event)"
      (detach)="onPanelDetached()"
      (attach)="onPanelAttached()"
    >
      <div
        class="neu-cp__panel"
        [id]="panelId"
        role="dialog"
        aria-label="Color picker"
        (focusin)="onBoundaryFocusIn()"
      >
        <div
          class="neu-cp__canvas-wrap"
          role="slider"
          aria-roledescription="two-dimensional color area"
          [attr.tabindex]="_isDisabled() ? -1 : 0"
          aria-label="Saturation and brightness"
          aria-valuemin="0"
          aria-valuemax="100"
          [attr.aria-valuenow]="_roundedHsv().saturation"
          [attr.aria-valuetext]="_areaValueText()"
          [attr.aria-disabled]="_isDisabled() ? 'true' : null"
          [attr.aria-readonly]="readonly() ? 'true' : null"
          [style.background-color]="_hueCss()"
          (keydown)="_onAreaKeydown($event)"
          (blur)="onBlur()"
          (pointerdown)="_canvasDown($event)"
          (pointermove)="_canvasDrag($event)"
          (pointerup)="_canvasUp($event)"
          (pointercancel)="cancelColorChange()"
          (lostpointercapture)="cancelColorChange()"
        >
          <div
            class="neu-cp__canvas-cursor"
            [style.left]="_roundedHsv().saturation + '%'"
            [style.top]="100 - _roundedHsv().value + '%'"
          ></div>
        </div>

        <label class="neu-cp__slider-row">
          <span class="neu-cp__slider-label">H</span>
          <input
            type="range"
            class="neu-cp__hue-slider"
            min="0"
            max="359"
            step="1"
            [value]="_roundedHsv().hue"
            [disabled]="_isDisabled() || readonly()"
            (input)="_onHueChange(+$any($event.target).value)"
            (change)="finishColorChange()"
            (pointercancel)="cancelColorChange()"
            (lostpointercapture)="cancelColorChange()"
            aria-label="Hue"
            [attr.aria-valuetext]="_roundedHsv().hue + ' degrees'"
          />
          <span class="neu-cp__slider-value">{{ _roundedHsv().hue }}°</span>
        </label>

        @if (showAlpha()) {
          <label class="neu-cp__slider-row">
            <span class="neu-cp__slider-label">A</span>
            <span class="neu-cp__alpha-track" [style.--neu-cp-opaque]="_opaqueCss()">
              <input
                type="range"
                class="neu-cp__alpha-slider"
                min="0"
                max="1"
                step="0.01"
                [value]="_color().alpha"
                [disabled]="_isDisabled() || readonly()"
                (input)="_onAlphaChange(+$any($event.target).value)"
                (change)="finishColorChange()"
                (pointercancel)="cancelColorChange()"
                (lostpointercapture)="cancelColorChange()"
                aria-label="Alpha"
                [attr.aria-valuetext]="_alphaPercent() + ' percent opacity'"
              />
            </span>
            <span class="neu-cp__slider-value">{{ _alphaPercent() }}%</span>
          </label>
        }

        <div class="neu-cp__swatches" role="group" aria-label="Preset colors">
          @for (swatch of _swatches; track swatch) {
            <button
              type="button"
              class="neu-cp__sw"
              [style.--neu-cp-color]="swatch"
              [attr.aria-label]="'Color ' + swatch"
              [disabled]="_isDisabled() || readonly()"
              (click)="_pickSwatch(swatch)"
            ></button>
          }
        </div>

        <div class="neu-cp__mode-tabs" role="group" aria-label="Color format">
          @for (modeOption of _modes; track modeOption) {
            <button
              type="button"
              class="neu-cp__mode-btn"
              [class.neu-cp__mode-btn--active]="_activeMode() === modeOption"
              [attr.aria-pressed]="_activeMode() === modeOption"
              [disabled]="_isDisabled()"
              (click)="_selectMode(modeOption)"
            >
              {{ modeOption.toUpperCase() }}
            </button>
          }
        </div>

        @if (showChannels()) {
          <div
            class="neu-cp__channels"
            role="group"
            [attr.aria-label]="_activeMode().toUpperCase() + ' channels'"
          >
            @for (channel of _channelViews(); track channel.key) {
              <label class="neu-cp__channel">
                <span>{{ channel.shortLabel }}</span>
                <input
                  type="number"
                  inputmode="decimal"
                  [min]="channel.minimum"
                  [max]="channel.maximum"
                  [step]="channel.step"
                  [value]="channel.value"
                  [disabled]="_isDisabled()"
                  [readonly]="readonly()"
                  [attr.aria-label]="channel.label"
                  (focus)="beginColorChange()"
                  (input)="_onChannelInput(channel.key, $any($event.target).value)"
                  (change)="finishColorChange()"
                  (blur)="_onChannelBlur()"
                />
              </label>
            }
          </div>
        }

        <div class="neu-cp__input-row">
          <input
            class="neu-cp__text-input"
            type="text"
            spellcheck="false"
            autocomplete="off"
            [value]="_displayText()"
            [disabled]="_isDisabled()"
            [readonly]="readonly()"
            [attr.aria-invalid]="_textInvalid() ? 'true' : null"
            [attr.aria-label]="'CSS color value in ' + _activeMode() + ' format'"
            (focus)="beginColorChange()"
            (input)="_onTextChange($any($event.target).value)"
            (keydown)="_onTextKeydown($event)"
            (blur)="_onTextBlur()"
          />
          <span class="neu-cp__swatch-sm" [style.--neu-cp-color]="_cssColor()"></span>
        </div>
        @if (_eyeDropperAvailable()) {
          <button
            type="button"
            class="neu-cp__sample-button"
            [disabled]="_isDisabled() || readonly() || _sampling()"
            [attr.aria-busy]="_sampling() ? 'true' : null"
            (click)="_sampleScreenColor()"
          >
            {{ _sampling() ? 'Sampling screen color…' : 'Sample screen color' }}
          </button>
        }
        @if (_sampleError()) {
          <span class="neu-cp__error" role="status">
            Screen sampling is unavailable. Use the color controls instead.
          </span>
        }
        @if (_textInvalid()) {
          <span class="neu-cp__error" role="status">
            Enter a valid HEX, RGB, HSL, or OKLCH color.
          </span>
        }
      </div>
    </ng-template>
  `,
  styleUrl: './neu-color-picker.component.scss',
})
export class NeuColorPickerComponent implements FormValueControl<string> {
  readonly value = model<string>(DEFAULT_COLOR_VALUE);
  readonly mode = input<NeuColorMode>('hex');
  readonly showAlpha = input(false);
  readonly showChannels = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly inputId = input('');
  readonly ariaLabel = input('');
  readonly ariaLabelledBy = input('');
  readonly ariaDescribedBy = input('');
  readonly required = input(false);
  readonly invalid = input(false);
  readonly hidden = input(false);
  readonly pending = input(false);
  readonly touched = input(false);
  readonly dirty = input(false);
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly touch = output<void>();

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly valueCommitted = output<string>();

  private readonly eventDestroyRef = inject(DestroyRef);
  private readonly dismissGuard = inject(NEU_OVERLAY_DISMISS_GUARD, { optional: true });
  private readonly _el = inject(ElementRef<HTMLElement>);
  private readonly _overlay = inject(Overlay);
  private readonly _id = inject(NeuIdGenerator).getId('neu-cp-');
  protected readonly panelId = `${this._id}-panel`;

  protected readonly _modes: readonly NeuColorMode[] = ['hex', 'rgb', 'hsl', 'oklch'];
  protected readonly _swatches: readonly string[] = [
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
  protected readonly _isOpen = signal(false);
  protected readonly _eyeDropperAvailable = signal(false);
  protected readonly _sampling = signal(false);
  protected readonly _sampleError = signal(false);
  private readonly _hasValue = computed(() => !!parseColor((this.value() ?? '').trim()));
  protected readonly _color = computed(
    () => parseColor((this.value() ?? '').trim())?.color ?? DEFAULT_COLOR,
  );
  private readonly _hueHint = signal(210);
  protected readonly _activeMode = linkedSignal<NeuColorMode>(() => this.mode());
  protected readonly _draft = linkedSignal<string | null>(() => {
    this.mode();
    this.showAlpha();
    this.showChannels();
    return null;
  });
  protected readonly _textInvalid = computed(() => {
    const draft = this._draft();
    return draft !== null && !parseColor(draft);
  });
  protected readonly _isDisabled = computed(() => this.disabled());
  readonly triggerId = computed(() => this.inputId() || this._id);

  private panelAttached = false;
  private _dragging = false;
  private activePointerId: number | null = null;
  private activePointerTarget: HTMLElement | null = null;
  private activeSample: AbortController | null = null;
  private continuousStart: string | null = null;
  private continuousValue: string | null = null;
  private continuousConfig: {
    mode: NeuColorMode;
    showAlpha: boolean;
    showChannels: boolean;
  } | null = null;
  private touchSent = false;

  protected readonly _hsv = computed(() => srgbToHsv(this._color(), this._hueHint()));
  /** Internal compatibility view used by the H9 event-contract harness. */
  protected readonly _hue = computed(() => this._roundedHsv().hue);
  protected readonly _roundedHsv = computed(() => {
    const hsv = this._hsv();
    return {
      hue: Math.round(hsv.hue),
      saturation: Math.round(hsv.saturation),
      value: Math.round(hsv.value),
    };
  });
  protected readonly _alphaPercent = computed(() => Math.round(this._color().alpha * 100));
  private readonly _serializeAlpha = computed(() => this.showAlpha() || this._color().alpha < 1);
  protected readonly _textValue = computed(() =>
    this._hasValue()
      ? serializeColor(this._color(), this._activeMode(), this._serializeAlpha(), this._hueHint())
      : '',
  );
  /** Stable compact trigger label retained for existing consumers and test harnesses. */
  protected readonly _hexValue = computed(() =>
    this._hasValue()
      ? serializeColor(this._color(), 'hex', this._serializeAlpha(), this._hueHint())
      : '',
  );
  protected readonly _displayText = computed(() => this._draft() ?? this._textValue());
  protected readonly _cssColor = computed(() =>
    this._hasValue() ? serializeColor(this._color(), 'rgb', true, this._hueHint()) : 'transparent',
  );
  protected readonly _opaqueCss = computed(() =>
    serializeColor({ ...this._color(), alpha: 1 }, 'rgb', false, this._hueHint()),
  );
  protected readonly _hueCss = computed(() => `hsl(${this._roundedHsv().hue} 100% 50%)`);
  protected readonly _areaValueText = computed(() => {
    const hsv = this._roundedHsv();
    return `${hsv.saturation} percent saturation, ${hsv.value} percent brightness`;
  });
  protected readonly _channelViews = computed<readonly NeuColorChannelView[]>(() => {
    const color = this._color();
    const alpha: NeuColorChannelView = {
      key: 'alpha',
      shortLabel: 'A',
      label: 'Alpha',
      value: this._alphaPercent(),
      minimum: 0,
      maximum: 100,
      step: 1,
    };
    let channels: NeuColorChannelView[];
    if (this._activeMode() === 'hsl') {
      const hsl = srgbToHsl(color, this._hueHint());
      channels = [
        {
          key: 'hue',
          shortLabel: 'H',
          label: 'Hue',
          value: Math.round(hsl.hue),
          minimum: 0,
          maximum: 359,
          step: 1,
        },
        {
          key: 'saturation',
          shortLabel: 'S',
          label: 'Saturation',
          value: Math.round(hsl.saturation),
          minimum: 0,
          maximum: 100,
          step: 1,
        },
        {
          key: 'lightness',
          shortLabel: 'L',
          label: 'Lightness',
          value: Math.round(hsl.lightness),
          minimum: 0,
          maximum: 100,
          step: 1,
        },
      ];
    } else if (this._activeMode() === 'oklch') {
      const oklch = srgbToOklch(color, this._hueHint());
      channels = [
        {
          key: 'lightness',
          shortLabel: 'L',
          label: 'Perceptual lightness',
          value: Number(oklch.lightness.toFixed(3)),
          minimum: 0,
          maximum: 1,
          step: 0.01,
        },
        {
          key: 'chroma',
          shortLabel: 'C',
          label: 'Chroma',
          value: Number(oklch.chroma.toFixed(3)),
          minimum: 0,
          maximum: 0.5,
          step: 0.01,
        },
        {
          key: 'hue',
          shortLabel: 'H',
          label: 'Hue',
          value: Math.round(oklch.hue),
          minimum: 0,
          maximum: 359,
          step: 1,
        },
      ];
    } else {
      channels = [
        {
          key: 'red',
          shortLabel: 'R',
          label: 'Red',
          value: Math.round(color.red * 255),
          minimum: 0,
          maximum: 255,
          step: 1,
        },
        {
          key: 'green',
          shortLabel: 'G',
          label: 'Green',
          value: Math.round(color.green * 255),
          minimum: 0,
          maximum: 255,
          step: 1,
        },
        {
          key: 'blue',
          shortLabel: 'B',
          label: 'Blue',
          value: Math.round(color.blue * 255),
          minimum: 0,
          maximum: 255,
          step: 1,
        },
      ];
    }
    return this.showAlpha() ? [...channels, alpha] : channels;
  });

  protected readonly _viewportMargin = 16;
  readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];
  readonly overlayScrollStrategy = this._overlay.scrollStrategies.reposition();

  constructor() {
    afterNextRender(() => {
      const view = this._el.nativeElement.ownerDocument.defaultView as NeuEyeDropperWindow | null;
      this._eyeDropperAvailable.set(typeof view?.EyeDropper === 'function');
    });
    this.eventDestroyRef.onDestroy(() => {
      this.panelAttached = false;
      this.cancelColorChange();
      this.cancelSampling();
    });
  }

  protected onPanelAttached(): void {
    if (this.eventDestroyRef.destroyed || this.panelAttached) return;
    this.panelAttached = true;
    this.opened.emit();
    queueMicrotask(() => {
      if (!this.eventDestroyRef.destroyed && this._isOpen()) {
        const area = this._el.nativeElement.ownerDocument
          .getElementById(this.panelId)
          ?.querySelector('.neu-cp__canvas-wrap') as HTMLElement | null;
        area?.focus();
      }
    });
  }

  protected onPanelDetached(): void {
    const wasAttached = this.panelAttached;
    this.panelAttached = false;
    if (this.eventDestroyRef.destroyed) return;
    this._isOpen.set(false);
    this.resetDraft();
    this.cancelColorChange();
    this.cancelSampling();
    this._sampleError.set(false);
    if (wasAttached) this.closed.emit();
  }

  protected requestOutsideDismiss(event: Event): void {
    this.requestDismissal('outside-pointer', event);
  }

  protected requestEscapeDismiss(event: Event): void {
    if (!this._isOpen() || (event as KeyboardEvent).key !== 'Escape') return;
    this.requestDismissal('escape', event);
  }

  private requestDismissal(reason: 'escape' | 'outside-pointer', event: Event): void {
    if (
      !allowsNeuOverlayDismissal(this.dismissGuard, {
        source: 'color-picker',
        reason,
        originalEvent: event,
      })
    ) {
      return;
    }
    (event as Partial<Event>).preventDefault?.();
    this.closePanel();
  }

  protected beginColorChange(): void {
    if (this.continuousStart === null) {
      this.continuousStart = this.value();
      this.continuousValue = this.value();
      this.continuousConfig = {
        mode: this.mode(),
        showAlpha: this.showAlpha(),
        showChannels: this.showChannels(),
      };
    }
  }

  protected finishColorChange(): void {
    const previous = this.continuousStart;
    const gestureValue = this.continuousValue;
    const gestureConfig = this.continuousConfig;
    this.continuousStart = null;
    this.continuousValue = null;
    this.continuousConfig = null;
    if (
      previous === null ||
      !gestureConfig ||
      gestureConfig.mode !== this.mode() ||
      gestureConfig.showAlpha !== this.showAlpha() ||
      gestureConfig.showChannels !== this.showChannels() ||
      this.eventDestroyRef.destroyed ||
      this._isDisabled() ||
      this.readonly()
    ) {
      return;
    }
    const value = this.value();
    if (gestureValue !== value) return;
    if (previous !== value) this.valueCommitted.emit(value);
  }

  protected cancelColorChange(): void {
    this.releasePointerCapture();
    this.continuousStart = null;
    this.continuousValue = null;
    this.continuousConfig = null;
  }

  protected _canvasDown(event: PointerEvent): void {
    if (!this.canMutate() || this._dragging) return;
    this.beginColorChange();
    this._dragging = true;
    this.activePointerId = event.pointerId;
    this.activePointerTarget = event.currentTarget as HTMLElement;
    this.activePointerTarget.setPointerCapture(event.pointerId);
    this._updateFromCanvas(event);
  }

  protected _canvasDrag(event: PointerEvent): void {
    if (!this._dragging || event.pointerId !== this.activePointerId || !this.canMutate()) return;
    this._updateFromCanvas(event);
  }

  protected _canvasUp(event: PointerEvent): void {
    if (!this._dragging || event.pointerId !== this.activePointerId) return;
    this.finishColorChange();
    this.releasePointerCapture();
  }

  private _updateFromCanvas(event: PointerEvent): void {
    if (!this.gestureStillOwned()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const saturation = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100;
    const value = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1) * 100;
    const hsv = this._hsv();
    this.commitColor(hsvToSrgb(hsv.hue, saturation, value, this._color().alpha), hsv.hue);
  }

  protected _onAreaKeydown(event: KeyboardEvent): void {
    if (!this.canMutate()) return;
    const hsv = this._hsv();
    const step = event.shiftKey ? 10 : 1;
    let saturation = hsv.saturation;
    let value = hsv.value;
    switch (event.key) {
      case 'ArrowLeft':
        saturation -= step;
        break;
      case 'ArrowRight':
        saturation += step;
        break;
      case 'ArrowUp':
        value += step;
        break;
      case 'ArrowDown':
        value -= step;
        break;
      case 'Home':
        saturation = 0;
        break;
      case 'End':
        saturation = 100;
        break;
      case 'PageUp':
        value += 10;
        break;
      case 'PageDown':
        value -= 10;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.beginColorChange();
    if (!this.gestureStillOwned()) return;
    this.commitColor(
      hsvToSrgb(hsv.hue, clamp(saturation, 0, 100), clamp(value, 0, 100), this._color().alpha),
      hsv.hue,
    );
    this.finishColorChange();
  }

  protected _toggle(): void {
    if (this._isDisabled()) return;
    if (this._isOpen()) this.closePanel();
    else this._isOpen.set(true);
  }

  protected _selectMode(mode: NeuColorMode): void {
    this.cancelColorChange();
    this._draft.set(null);
    this._activeMode.set(mode);
  }

  protected _onHueChange(value: number): void {
    if (!this.canMutate() || !Number.isFinite(value)) return;
    this.beginColorChange();
    if (!this.gestureStillOwned()) return;
    const hsv = this._hsv();
    const hue = wrapHue(value);
    this.commitColor(hsvToSrgb(hue, hsv.saturation, hsv.value, this._color().alpha), hue);
  }

  protected _onAlphaChange(value: number): void {
    if (!this.canMutate() || !Number.isFinite(value)) return;
    this.beginColorChange();
    if (!this.gestureStillOwned()) return;
    this.commitColor({ ...this._color(), alpha: clamp(value, 0, 1) });
  }

  protected _pickSwatch(value: string): void {
    if (!this.canMutate()) return;
    this.beginColorChange();
    const parsed = parseColor(value);
    if (parsed) {
      this.commitColor(parsed.color, parsed.hueHint);
      this.finishColorChange();
    }
  }

  protected _onTextChange(text: string): void {
    if (!this.canMutate()) return;
    if (!this.gestureStillOwned()) return;
    this._draft.set(text);
    const parsed = parseColor(text);
    if (parsed) this.commitColor(parsed.color, parsed.hueHint);
  }

  protected _onTextKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.resetDraft();
      this.cancelColorChange();
      return;
    }
    if (event.key === 'Enter' && !this._textInvalid()) {
      event.preventDefault();
      this._draft.set(null);
      this.finishColorChange();
    }
  }

  protected _onTextBlur(): void {
    this._draft.set(null);
    this.finishColorChange();
    this.onBlur();
  }

  protected _onChannelInput(channel: NeuColorChannel, text: string): void {
    if (!this.canMutate() || !text.trim()) return;
    if (!this.gestureStillOwned()) return;
    const value = Number(text);
    if (!Number.isFinite(value)) return;
    const color = this._color();
    if (channel === 'alpha') {
      this.commitColor({ ...color, alpha: clamp(value / 100, 0, 1) });
      return;
    }
    if (this._activeMode() === 'hsl') {
      const hsl = srgbToHsl(color, this._hueHint());
      const hue = channel === 'hue' ? wrapHue(value) : hsl.hue;
      const saturation = channel === 'saturation' ? clamp(value, 0, 100) : hsl.saturation;
      const lightness = channel === 'lightness' ? clamp(value, 0, 100) : hsl.lightness;
      this.commitColor(hslToSrgb(hue, saturation, lightness, color.alpha), hue);
      return;
    }
    if (this._activeMode() === 'oklch') {
      const oklch = srgbToOklch(color, this._hueHint());
      const hue = channel === 'hue' ? wrapHue(value) : oklch.hue;
      const lightness = channel === 'lightness' ? clamp(value, 0, 1) : oklch.lightness;
      const chroma = channel === 'chroma' ? clamp(value, 0, 0.5) : oklch.chroma;
      this.commitColor(oklchToSrgb(lightness, chroma, hue, color.alpha), hue);
      return;
    }
    const key = channel as 'red' | 'green' | 'blue';
    this.commitColor({ ...color, [key]: clamp(value / 255, 0, 1) });
  }

  protected _onChannelBlur(): void {
    this.finishColorChange();
    this.onBlur();
  }

  onBlur(): void {
    queueMicrotask(() => {
      if (this.eventDestroyRef.destroyed) return;
      const active = this._el.nativeElement.ownerDocument.activeElement;
      const panel = this._el.nativeElement.ownerDocument.getElementById(this.panelId);
      if (this._el.nativeElement.contains(active) || panel?.contains(active)) return;
      this.markTouched();
    });
  }

  focus(options?: FocusOptions): void {
    if (this._isDisabled()) return;
    (
      (this._el.nativeElement as HTMLElement).querySelector(
        '.neu-cp__trigger',
      ) as HTMLButtonElement | null
    )?.focus(options);
  }

  reset(): void {
    this._isOpen.set(false);
    this.resetDraft();
    this.cancelColorChange();
    this.cancelSampling();
    this._sampleError.set(false);
    this.touchSent = false;
  }

  protected onBoundaryFocusIn(): void {
    if (this._isDisabled()) return;
    this.touchSent = false;
  }

  private canMutate(): boolean {
    return !this._isDisabled() && !this.readonly() && !this.eventDestroyRef.destroyed;
  }

  private closePanel(): void {
    const panel = this._el.nativeElement.ownerDocument.getElementById(this.panelId);
    const restoreFocus = !!panel?.contains(this._el.nativeElement.ownerDocument.activeElement);
    this._isOpen.set(false);
    this.resetDraft();
    this.cancelColorChange();
    this.cancelSampling();
    this._sampleError.set(false);
    if (restoreFocus) {
      queueMicrotask(() => {
        if (!this.eventDestroyRef.destroyed && !this._isDisabled()) this.focus();
      });
    }
  }

  private resetDraft(): void {
    this._draft.set(null);
  }

  private commitColor(color: NeuSrgbColor, hueHint?: number): boolean {
    const previous = this._color();
    if (hueHint !== undefined) this._hueHint.set(wrapHue(hueHint));
    if (colorsEqual(previous, color)) return false;
    const value = serializeColor(color, this._activeMode(), this.showAlpha() || color.alpha < 1, this._hueHint());
    this.value.set(value);
    if (this.continuousStart !== null) this.continuousValue = value;
    return true;
  }

  private gestureStillOwned(): boolean {
    if (this.continuousStart === null) return true;
    const config = this.continuousConfig;
    if (
      this.continuousValue === this.value() &&
      config?.mode === this.mode() &&
      config.showAlpha === this.showAlpha() &&
      config.showChannels === this.showChannels()
    ) {
      return true;
    }
    this.resetDraft();
    this.cancelColorChange();
    return false;
  }

  private markTouched(): void {
    if (this.touchSent) return;
    this.touchSent = true;
    this.touch.emit();
  }

  private releasePointerCapture(): void {
    const pointerId = this.activePointerId;
    const pointerTarget = this.activePointerTarget;
    this._dragging = false;
    this.activePointerId = null;
    this.activePointerTarget = null;
    if (pointerId !== null && pointerTarget?.hasPointerCapture?.(pointerId)) {
      pointerTarget.releasePointerCapture(pointerId);
    }
  }

  private cancelSampling(): void {
    this.activeSample?.abort();
    this.activeSample = null;
    this._sampling.set(false);
  }

  protected async _sampleScreenColor(): Promise<void> {
    if (!this.canMutate() || !this._isOpen() || this.activeSample) return;
    const view = this._el.nativeElement.ownerDocument.defaultView as NeuEyeDropperWindow | null;
    const EyeDropper = view?.EyeDropper;
    if (typeof EyeDropper !== 'function') return;
    const controller = new AbortController();
    const startingValue = this.value();
    this.activeSample = controller;
    this._sampling.set(true);
    this._sampleError.set(false);
    try {
      // open() must be called synchronously from the activation gesture.
      const sample = await new EyeDropper().open({ signal: controller.signal });
      if (
        this.eventDestroyRef.destroyed ||
        this.activeSample !== controller ||
        !this._isOpen() ||
        !this.canMutate() ||
        this.value() !== startingValue
      ) return;
      const parsed = parseColor(sample.sRGBHex);
      if (!parsed) {
        this._sampleError.set(true);
        return;
      }
      this.beginColorChange();
      this.commitColor({ ...parsed.color, alpha: this._color().alpha }, parsed.hueHint);
      this.finishColorChange();
    } catch (error: unknown) {
      if (
        this.activeSample === controller &&
        !controller.signal.aborted &&
        !this.eventDestroyRef.destroyed &&
        !(error instanceof DOMException && error.name === 'AbortError')
      ) this._sampleError.set(true);
    } finally {
      if (this.activeSample === controller) {
        this.activeSample = null;
        this._sampling.set(false);
      }
    }
  }
}
