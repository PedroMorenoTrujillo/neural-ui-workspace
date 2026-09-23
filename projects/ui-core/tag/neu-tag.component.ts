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
import { NeuralIcon } from '@neural-icons/angular';
import type { NeuralIconName } from '@neural-icons/core';

export type NeuTagTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';
export type NeuTagVariant = 'soft' | 'solid';

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
  imports: [NeuralIcon, NgTemplateOutlet],
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
        <neural-icon class="neu-tag__icon" [icon]="icon()!" size="1em" aria-hidden="true" />
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

  /** Semantic intent aligned with the public design contract. */
  tone = input<NeuTagTone>('neutral');
  /** Visual treatment independent from semantic intent. */
  variant = input<NeuTagVariant>('soft');
  /** Visible label. `0` and `''` render faithfully. */
  value = input<string | number | null | undefined>(null);
  /** Registered Neural icon name displayed before `value`. */
  icon = input<NeuralIconName | null>(null);
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
    [`neu-tag--${this.tone()}`]: true,
    [`neu-tag--${this.variant()}`]: true,
    'neu-tag--rounded': this.rounded(),
  }));
}
