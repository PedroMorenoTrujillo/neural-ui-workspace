import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** @internal — componente flotante del tooltip, renderizado vía CDK Portal */
@Component({
  selector: 'neu-tooltip-overlay',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'neu-tooltip',
    role: 'tooltip',
    '[id]': 'tooltipId()',
  },
  template: `<span class="neu-tooltip__text">{{ text() }}</span>`,
  styleUrl: './neu-tooltip.component.scss',
})
export class NeuTooltipOverlayComponent {
  readonly text = input.required<string>();
  readonly tooltipId = input<string>('');
}
