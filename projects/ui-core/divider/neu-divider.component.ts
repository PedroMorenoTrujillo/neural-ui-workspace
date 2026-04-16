import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * NeuralUI Divider
 *
 * Separador visual para secciones de contenido.
 *
 * Uso:
 *   <neu-divider />
 *   <neu-divider label="O continúa con" />
 *   <neu-divider orientation="vertical" />
 */
@Component({
  selector: 'neu-divider',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="neu-divider"
      [class.neu-divider--vertical]="orientation() === 'vertical'"
      [class.neu-divider--has-label]="!!label()"
      role="separator"
      [attr.aria-orientation]="orientation()"
    >
      @if (label()) {
        <span class="neu-divider__label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .neu-divider {
        display: flex;
        align-items: center;
        gap: var(--neu-space-3);
        color: var(--neu-text-muted);
        font-size: var(--neu-text-xs);
        font-family: var(--neu-font-sans);

        &::before,
        &::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--neu-border);
        }

        &:not(.neu-divider--has-label)::after {
          display: none;
        }
        &:not(.neu-divider--has-label)::before {
          flex: 1;
        }
      }

      .neu-divider--vertical {
        flex-direction: column;
        align-self: stretch;
        height: auto;
        width: auto;

        &::before,
        &::after {
          flex: 1;
          width: 1px;
          height: auto;
        }
      }

      .neu-divider__label {
        white-space: nowrap;
        padding: 0 var(--neu-space-2);
        letter-spacing: 0.04em;
        font-weight: 500;
      }
    `,
  ],
})
export class NeuDividerComponent {
  label = input<string>('');
  orientation = input<'horizontal' | 'vertical'>('horizontal');
}
