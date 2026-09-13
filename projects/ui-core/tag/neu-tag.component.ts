import {
  Component,
  ContentChild,
  Directive,
  TemplateRef,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NeuIconComponent } from '@neural-ui/core/icon';

export type NeuTagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Custom icon content for a tag. */
@Directive({ selector: 'ng-template[neuTagIcon]' })
export class NeuTagIconDirective {
  constructor(readonly templateRef: TemplateRef<void>) {}
}

/**
 * A compact, non-interactive label used to categorize or communicate status.
 * Projected content is used when `value` is null or undefined; an empty string
 * remains an intentional value and does not fall back to projection.
 */
@Component({
  selector: 'neu-tag',
  imports: [NeuIconComponent, NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'ariaLabel() || null',
  },
  template: `
    @if (hasValue()) {
      @if (iconTemplate) {
        <ng-container [ngTemplateOutlet]="iconTemplate.templateRef" />
      } @else if (icon()) {
        <neu-icon class="neu-tag__icon" [name]="icon()" size="1em" aria-hidden="true" />
      }
      <span class="neu-tag__label">{{ value() }}</span>
    } @else {
      <ng-content />
    }
  `,
  styleUrl: './neu-tag.component.scss',
})
export class NeuTagComponent {
  @ContentChild(NeuTagIconDirective) iconTemplate?: NeuTagIconDirective;

  /** Semantic color treatment aligned with the public design contract. */
  severity = input<NeuTagSeverity | null>(null);
  /** Visible label. `0` and `''` render faithfully. */
  value = input<string | number | null | undefined>(null);
  /** Registered Neural icon name displayed before `value`. */
  icon = input<string>('');
  /** Gives the tag fully rounded corners. */
  rounded = input<boolean>(false);
  /** Optional accessible name, useful for custom icon-only projected content. */
  ariaLabel = input<string>('');

  readonly hasValue = computed(() => {
    const value = this.value();
    return value !== null && value !== undefined;
  });

  readonly hostClasses = computed(() => ({
    'neu-tag': true,
    [`neu-tag--${this.severity() ?? 'default'}`]: true,
    'neu-tag--rounded': this.rounded(),
  }));
}
