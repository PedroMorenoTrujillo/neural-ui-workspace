import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type NeuAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type NeuAvatarShape = 'circle' | 'square';
export type NeuAvatarColor = 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'slate';
export type NeuAvatarStatus = 'online' | 'offline' | 'busy' | 'away' | '';

/**
 * NeuAvatar — Avatar circular o cuadrado para foto o iniciales.
 *
 * Uso:
 *   <neu-avatar name="Pedro Moreno" />
 *   <neu-avatar src="/assets/avatar.jpg" alt="Pedro" size="lg" />
 *   <neu-avatar name="PM" size="lg" color="blue" status="online" />
 */
@Component({
  selector: 'neu-avatar',
  imports: [NgClass],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-avatar-host' },
  template: `
    <span
      class="neu-avatar"
      [ngClass]="hostClasses()"
      [attr.aria-label]="alt() || name() || 'Avatar'"
      role="img"
    >
      @if (src() && !imgError()) {
        <img
          class="neu-avatar__img"
          [src]="src()"
          [alt]="alt() || name()"
          (error)="imgError.set(true)"
        />
      } @else {
        <span class="neu-avatar__initials" aria-hidden="true">{{ initials() }}</span>
      }
    </span>

    @if (status()) {
      <span
        class="neu-avatar__status"
        [ngClass]="'neu-avatar__status--' + status()"
        aria-hidden="true"
      ></span>
    }
  `,
  styleUrl: './neu-avatar.component.scss',
})
export class NeuAvatarComponent {
  /** URL de la imagen. Si falla la carga, muestra las iniciales. */
  src = input<string>('');
  /** Texto alternativo de la imagen. */
  alt = input<string>('');
  /** Nombre completo — se usan las iniciales como fallback. */
  name = input<string>('');
  /** Tamaño: xs (24) | sm (32) | md (40) | lg (48) | xl (64). Por defecto 'md'. */
  size = input<NeuAvatarSize>('md');
  /** Forma: 'circle' (default) o 'square'. */
  shape = input<NeuAvatarShape>('circle');
  /** Color de fondo para iniciales. */
  color = input<NeuAvatarColor>('blue');
  /** Indicador de presencia. */
  status = input<NeuAvatarStatus>('');

  /** @internal Imagen fallida */
  protected readonly imgError = signal(false);

  protected readonly initials = computed(() => {
    const n = this.name().trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  protected readonly hostClasses = computed(() => [
    `neu-avatar--${this.size()}`,
    `neu-avatar--${this.shape()}`,
    ...(!this.src() || this.imgError() ? [`neu-avatar--${this.color()}`] : []),
  ]);
}
