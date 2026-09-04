import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, input } from '@angular/core';

export type NeuButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Layout-only group for projected native `button[neu-button]` controls.
 * It does not own selection state or alter any child button input.
 */
@Component({
  selector: 'neu-button-group',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-button-group-host' },
  template: `
    <div class="neu-button-group" [class]="groupClasses()" role="group"
      [attr.aria-label]="ariaLabel() || null" [attr.aria-labelledby]="ariaLabelledBy() || null">
      <ng-content />
    </div>
  `,
  styleUrl: './neu-button-group.component.scss',
})
export class NeuButtonGroupComponent {
  /** Layout direction; horizontal is the default behavior. */
  orientation = input<NeuButtonGroupOrientation>('horizontal');
  /** Makes projected buttons share the available inline size. */
  fluid = input<boolean>(false);
  /** Accessible group name. */
  ariaLabel = input<string>('');
  /** External accessible group label. */
  ariaLabelledBy = input<string>('');

  readonly groupClasses = computed(() => ({
    'neu-button-group': true,
    [`neu-button-group--${this.orientation()}`]: true,
    'neu-button-group--fluid': this.fluid(),
  }));
}
