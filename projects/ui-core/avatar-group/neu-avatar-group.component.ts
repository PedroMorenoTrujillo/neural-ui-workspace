import { Component, ViewEncapsulation, computed, input } from '@angular/core';

/** Composes projected avatars into an overlapping visual group. */
@Component({
  selector: 'neu-avatar-group',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'ariaLabel() || ariaLabelledBy() ? "group" : null',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-labelledby]': 'ariaLabelledBy() || null',
  },
  template: '<ng-content />',
  styleUrl: './neu-avatar-group.component.scss',
})
export class NeuAvatarGroupComponent {
  /** Optional group name. Omitting it leaves individual avatar semantics untouched. */
  ariaLabel = input<string>('');
  /** Optional external label relationship for the group. */
  ariaLabelledBy = input<string>('');

  readonly hostClasses = computed(() => ({ 'neu-avatar-group': true }));
}
