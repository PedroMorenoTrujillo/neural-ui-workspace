import { Component, DestroyRef, ElementRef, InjectionToken, ViewEncapsulation, computed, forwardRef, inject, input, output, signal } from '@angular/core';

export type NeuCompareOrientation = 'horizontal' | 'vertical';
export interface NeuCompareValueChangeEvent { originalEvent: Event; value: number; }
export const NEU_COMPARE_INSTANCE = new InjectionToken<NeuCompareComponent>('NEU_COMPARE_INSTANCE');

@Component({
  selector: 'neu-compare',
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NEU_COMPARE_INSTANCE, useExisting: forwardRef(() => NeuCompareComponent) }],
  host: { '[class]': 'hostClasses()', '(pointerdown)': 'onRootPointerDown($event)', '(pointermove)': 'onRootPointerMove($event)', '(pointerup)': 'onRootPointerUp($event)', '(pointercancel)': 'onRootPointerCancel($event)', '(lostpointercapture)': 'onRootPointerCancel($event)' },
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
  // defaultValue remains a parent-provided fallback, not an uncontrolled value owner.
  readonly dragging = signal(false);
  readonly currentValue = computed(() => this.normalizeValue(this.value() ?? this.defaultValue()));
  readonly valuePercent = computed(() => {
    const span = this.normalizedMax() - this.normalizedMin();
    return span ? ((this.currentValue() - this.normalizedMin()) / span) * 100 : 0;
  });
  readonly hostClasses = computed(() => ({ 'neu-compare': true, 'neu-compare--vertical': this.orientation() === 'vertical', 'neu-compare--disabled': this.disabled(), 'neu-compare--dragging': this.dragging() }));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private activePointerId: number | null = null;
  private lastInteractionValue: number | null = null;

  constructor() { inject(DestroyRef).onDestroy(() => this.finishPointer(null, false)); }

  onRootPointerDown(event: PointerEvent): void {
    if (this.disabled() || this.activePointerId !== null || (event.button !== undefined && event.button !== 0)) return;
    this.activePointerId = event.pointerId;
    this.lastInteractionValue = this.currentValue();
    this.dragging.set(true);
    try { this.host.nativeElement.setPointerCapture?.(event.pointerId); } catch { /* Synthetic events have no active browser pointer. */ }
    this.updateFromPointer(event);
  }
  onRootPointerMove(event: PointerEvent): void {
    if (this.disabled()) return;
    if (this.activePointerId !== null) {
      if (event.pointerId === this.activePointerId) this.updateFromPointer(event);
    } else if (this.slideOnHover()) this.updateFromPointer(event);
  }
  onRootPointerUp(event: PointerEvent): void { if (event.pointerId === this.activePointerId) this.finishPointer(event, true); }
  onRootPointerCancel(event: PointerEvent): void { if (event.pointerId === this.activePointerId) this.finishPointer(event, false); }
  onInputChange(event: Event): void {
    if (this.disabled()) return;
    const next = this.propose(event, Number((event.target as HTMLInputElement).value));
    if (next !== null) this.valueChangeEnd.emit({ originalEvent: event, value: next });
  }
  onHandleKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const step = this.normalizedStep();
    const rtl = this.isRtl();
    let next: number;
    switch (event.key) {
      case 'Home': next = this.normalizedMin(); break;
      case 'End': next = this.normalizedMax(); break;
      case 'ArrowRight': if (this.orientation() !== 'horizontal') return; next = this.currentValue() + (rtl ? -step : step); break;
      case 'ArrowLeft': if (this.orientation() !== 'horizontal') return; next = this.currentValue() + (rtl ? step : -step); break;
      case 'ArrowUp': if (this.orientation() !== 'vertical') return; next = this.currentValue() + step; break;
      case 'ArrowDown': if (this.orientation() !== 'vertical') return; next = this.currentValue() - step; break;
      default: return;
    }
    event.preventDefault();
    const proposed = this.propose(event, next);
    if (proposed !== null) this.valueChangeEnd.emit({ originalEvent: event, value: proposed });
  }
  private finishPointer(event: PointerEvent | null, completed: boolean): void {
    if (this.activePointerId === null) return;
    const pointerId = this.activePointerId;
    const last = this.lastInteractionValue;
    this.activePointerId = null;
    this.lastInteractionValue = null;
    this.dragging.set(false);
    try { this.host.nativeElement.releasePointerCapture?.(pointerId); } catch { /* Capture can already be lost. */ }
    if (completed && event && last !== null) this.valueChangeEnd.emit({ originalEvent: event, value: last });
  }
  private updateFromPointer(event: PointerEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    const position = this.orientation() === 'vertical' ? 1 - (event.clientY - rect.top) / Math.max(rect.height, 1) : (event.clientX - rect.left) / Math.max(rect.width, 1);
    const ratio = this.orientation() === 'horizontal' && this.isRtl() ? 1 - position : position;
    this.propose(event, this.normalizedMin() + Math.min(1, Math.max(0, ratio)) * (this.normalizedMax() - this.normalizedMin()));
  }
  private propose(event: Event, value: number): number | null {
    const next = this.normalizeValue(value);
    if (next === (this.activePointerId === null ? this.currentValue() : this.lastInteractionValue)) return null;
    if (this.activePointerId !== null) this.lastInteractionValue = next;
    this.valueChange.emit({ originalEvent: event, value: next });
    return next;
  }
  private isRtl(): boolean {
    const explicit = this.host.nativeElement.closest('[dir]')?.getAttribute('dir');
    return explicit ? explicit.toLowerCase() === 'rtl' : this.host.nativeElement.ownerDocument.defaultView?.getComputedStyle(this.host.nativeElement).direction === 'rtl';
  }
  private normalizedMin(): number { const value = Number(this.min()); return Number.isFinite(value) ? value : 0; }
  private normalizedMax(): number { const min = this.normalizedMin(); const value = Number(this.max()); return Number.isFinite(value) ? Math.max(min, value) : min; }
  private normalizedStep(): number { const value = Number(this.step()); return Number.isFinite(value) && value > 0 ? value : 1; }
  private normalizeValue(value: number): number { const min = this.normalizedMin(); const max = this.normalizedMax(); const step = this.normalizedStep(); const snapped = min + Math.round((value - min) / step) * step; return Math.min(max, Math.max(min, Number.isFinite(snapped) ? snapped : min)); }
}

@Component({ selector: 'neu-compare-item', encapsulation: ViewEncapsulation.None, host: { class: 'neu-compare__item', '[style.--neu-compare-percent]': 'percent()', '[attr.data-position]': 'position()' }, template: '<ng-content />' })
export class NeuCompareItemComponent { readonly position = input<'before' | 'after'>('before'); private readonly compare = inject(NEU_COMPARE_INSTANCE); readonly percent = computed(() => `${this.compare.valuePercent()}%`); }

@Component({ selector: 'neu-compare-handle', encapsulation: ViewEncapsulation.None, host: { class: 'neu-compare__handle', '[style.--neu-compare-percent]': 'percent()' }, template: '<input class="neu-compare__input" type="range" [min]="compare.min()" [max]="compare.max()" [step]="compare.step()" [value]="compare.currentValue()" [disabled]="compare.disabled()" [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null" [attr.aria-orientation]="compare.orientation()" (keydown)="compare.onHandleKeyDown($event)" (input)="compare.onInputChange($event)" /><ng-content />' })
export class NeuCompareHandleComponent {
  readonly ariaLabel = input<string>('Compare position');
  readonly ariaLabelledBy = input<string>('');
  protected readonly compare = inject(NEU_COMPARE_INSTANCE);
  readonly percent = computed(() => `${this.compare.valuePercent()}%`);
}

@Component({ selector: 'neu-compare-indicator', encapsulation: ViewEncapsulation.None, host: { class: 'neu-compare__indicator', '[style.--neu-compare-percent]': 'percent()' }, template: '<ng-content />' })
export class NeuCompareIndicatorComponent { private readonly compare = inject(NEU_COMPARE_INSTANCE); readonly percent = computed(() => `${this.compare.valuePercent()}%`); }
