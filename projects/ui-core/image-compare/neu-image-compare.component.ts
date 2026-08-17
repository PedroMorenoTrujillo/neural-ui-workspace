import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, signal } from '@angular/core';

@Component({
  selector: 'neu-image-compare',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-image-compare-host' },
  template: `
    <figure
      class="neu-image-compare"
      [style.--neu-image-compare-position.%]="position()"
      [style.aspect-ratio]="aspectRatio()"
    >
      <img class="neu-image-compare__image" [src]="afterSrc()" [alt]="afterAlt()" [attr.loading]="loading()" />
      <div class="neu-image-compare__before" aria-hidden="true">
        <img class="neu-image-compare__image" [src]="beforeSrc()" alt="" [attr.loading]="loading()" />
      </div>
      <span class="neu-image-compare__label neu-image-compare__label--before">{{ beforeLabel() }}</span>
      <span class="neu-image-compare__label neu-image-compare__label--after">{{ afterLabel() }}</span>
      <div class="neu-image-compare__divider" aria-hidden="true"><span>↔</span></div>
      <input
        class="neu-image-compare__range"
        type="range"
        min="0"
        max="100"
        step="1"
        [value]="position()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-valuetext]="beforeLabel() + ' ' + position() + '%, ' + afterLabel() + ' ' + (100 - position()) + '%'"
        (input)="setPosition($any($event.target).valueAsNumber)"
      />
      <figcaption class="neu-image-compare__caption">{{ description() }}</figcaption>
    </figure>
  `,
  styleUrl: './neu-image-compare.component.scss',
})
export class NeuImageCompareComponent {
  readonly beforeSrc = input.required<string>();
  readonly afterSrc = input.required<string>();
  readonly beforeAlt = input('Before image');
  readonly afterAlt = input('After image');
  readonly beforeLabel = input('Before');
  readonly afterLabel = input('After');
  readonly ariaLabel = input('Compare before and after images');
  readonly description = input('');
  readonly aspectRatio = input('16 / 9');
  readonly loading = input<'eager' | 'lazy'>('lazy');
  readonly initialPosition = input(50);
  readonly positionChange = output<number>();
  readonly position = signal(50);

  ngOnInit(): void { this.position.set(this.clamp(this.initialPosition())); }
  setPosition(value: number): void {
    const next = this.clamp(value);
    this.position.set(next);
    this.positionChange.emit(next);
  }
  private clamp(value: number): number { return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50)); }
}
