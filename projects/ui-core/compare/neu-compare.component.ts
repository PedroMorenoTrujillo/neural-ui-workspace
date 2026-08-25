import { ChangeDetectionStrategy, Component, ElementRef, InjectionToken, ViewEncapsulation, computed, forwardRef, inject, input, output, signal } from '@angular/core';

export type NeuCompareOrientation = 'horizontal' | 'vertical';
export interface NeuCompareValueChangeEvent { originalEvent: Event; value: number; }
export const NEU_COMPARE_INSTANCE = new InjectionToken<NeuCompareComponent>('NEU_COMPARE_INSTANCE');

@Component({
  selector: 'neu-compare',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NEU_COMPARE_INSTANCE, useExisting: forwardRef(() => NeuCompareComponent) }],
  host: { '[class]': 'hostClasses()', '(pointerdown)': 'onRootPointerDown($event)', '(pointermove)': 'onRootPointerMove($event)', '(pointerup)': 'onRootPointerUp($event)', '(pointercancel)': 'onRootPointerUp($event)' },
  template: '<ng-content />',
  styleUrl: './neu-compare.component.scss',
})
export class NeuCompareComponent {
  readonly value = input<number | undefined>(undefined);
  readonly defaultValue = input<number>(50);
  readonly orientation = input<NeuCompareOrientation>('horizontal');
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly step = input<number>(1);
  readonly slideOnHover = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly valueChange = output<NeuCompareValueChangeEvent>();
  readonly valueChangeEnd = output<NeuCompareValueChangeEvent>();
  readonly internalValue = signal(50);
  readonly dragging = signal(false);
  readonly currentValue = computed(() => this.normalizeValue(this.value() ?? this.internalValue()));
  readonly hostClasses = computed(() => ({ 'neu-compare': true, 'neu-compare--vertical': this.orientation() === 'vertical', 'neu-compare--disabled': this.disabled(), 'neu-compare--dragging': this.dragging() }));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private lastInteractionValue = 50;

  constructor() { this.internalValue.set(this.normalizeValue(this.defaultValue())); }

  getItemStyle(position: 'before' | 'after'): { clipPath: string } {
    const percent = this.valuePercent();
    if (this.orientation() === 'vertical') return { clipPath: position === 'before' ? `inset(0 0 ${100 - percent}% 0)` : `inset(${percent}% 0 0 0)` };
    return { clipPath: position === 'before' ? `inset(0 ${100 - percent}% 0 0)` : `inset(0 0 0 ${percent}%)` };
  }
  getHandleStyle(): { top?: string; left?: string } { const percent = `${this.valuePercent()}%`; return this.orientation() === 'vertical' ? { top: percent } : { left: percent }; }
  onRootPointerDown(event: PointerEvent): void { if (this.disabled()) return; this.dragging.set(true); this.host.nativeElement.setPointerCapture?.(event.pointerId); this.updateFromPointer(event, true); }
  onRootPointerMove(event: PointerEvent): void { if (this.disabled() || (!this.dragging() && !this.slideOnHover())) return; this.updateFromPointer(event, true); }
  onRootPointerUp(event: PointerEvent): void { if (!this.dragging()) return; this.dragging.set(false); this.host.nativeElement.releasePointerCapture?.(event.pointerId); this.valueChangeEnd.emit({ originalEvent: event, value: this.lastInteractionValue }); }
  onThumbPointerDown(event: PointerEvent): void { event.stopPropagation(); this.onRootPointerDown(event); }
  onInputChange(event: Event): void { if (this.disabled()) return; const value = Number((event.target as HTMLInputElement).value); this.updateValue(event, value, true); this.valueChangeEnd.emit({ originalEvent: event, value: this.lastInteractionValue }); }

  private updateFromPointer(event: PointerEvent, emit: boolean): void { const rect = this.host.nativeElement.getBoundingClientRect(); const ratio = this.orientation() === 'vertical' ? 1 - (event.clientY - rect.top) / Math.max(rect.height, 1) : (event.clientX - rect.left) / Math.max(rect.width, 1); this.updateValue(event, this.normalizedMin() + Math.min(1, Math.max(0, ratio)) * (this.normalizedMax() - this.normalizedMin()), emit); }
  private updateValue(event: Event, value: number, emit: boolean): void { const next = this.normalizeValue(value); this.lastInteractionValue = next; if (next === this.currentValue()) return; if (this.value() === undefined) this.internalValue.set(next); if (emit) this.valueChange.emit({ originalEvent: event, value: next }); }
  private valuePercent(): number { const span = this.normalizedMax() - this.normalizedMin(); return span ? ((this.currentValue() - this.normalizedMin()) / span) * 100 : 0; }
  private normalizedMin(): number { const value = Number(this.min()); return Number.isFinite(value) ? value : 0; }
  private normalizedMax(): number { const min = this.normalizedMin(); const value = Number(this.max()); return Number.isFinite(value) ? Math.max(min, value) : min; }
  private normalizeValue(value: number): number { const min = this.normalizedMin(); const max = this.normalizedMax(); const step = Number(this.step()); const snapped = Number.isFinite(step) && step > 0 ? min + Math.round((value - min) / step) * step : value; return Math.min(max, Math.max(min, Number.isFinite(snapped) ? snapped : min)); }
}

@Component({ selector: 'neu-compare-item', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'neu-compare__item', '[style.clip-path]': 'clipPath()', '[attr.data-position]': 'position()' }, template: '<ng-content />' })
export class NeuCompareItemComponent { readonly position = input<'before' | 'after'>('before'); private readonly compare = inject(NEU_COMPARE_INSTANCE); readonly clipPath = computed(() => this.compare.getItemStyle(this.position()).clipPath); }

@Component({ selector: 'neu-compare-handle', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'neu-compare__handle', '[style]': 'handleStyle()', '(pointerdown)': 'onPointerDown($event)' }, template: '<ng-content />' })
export class NeuCompareHandleComponent { private readonly compare = inject(NEU_COMPARE_INSTANCE); readonly handleStyle = computed(() => this.compare.getHandleStyle()); onPointerDown(event: PointerEvent): void { this.compare.onThumbPointerDown(event); } }

@Component({ selector: 'neu-compare-indicator', encapsulation: ViewEncapsulation.None, changeDetection: ChangeDetectionStrategy.OnPush, host: { class: 'neu-compare__indicator' }, template: '<input class="neu-compare__input" type="range" [min]="compare.min()" [max]="compare.max()" [step]="compare.step()" [value]="compare.currentValue()" [disabled]="compare.disabled()" [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null" [attr.aria-orientation]="compare.orientation()" (input)="compare.onInputChange($event)" /><ng-content />' })
export class NeuCompareIndicatorComponent { readonly ariaLabel = input<string>('Compare position'); readonly ariaLabelledBy = input<string>(''); protected readonly compare = inject(NEU_COMPARE_INSTANCE); }
