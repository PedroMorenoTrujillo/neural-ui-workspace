import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * NeuralUI Code Block
 *
 * Bloque de código con estilo editor oscuro (Tokyo Night).
 * Incluye botón de copiar al portapapeles, badge del lenguaje
 * y soporte para resaltado futuro con ngx-highlightjs.
 *
 * Uso:
 *   <neu-code-block [code]="snippet" lang="TypeScript" />
 *
 * Con ngx-highlightjs instalado, envuelve el <pre> con
 *   [highlight]="code" para resaltado automático.
 */
@Component({
  selector: 'neu-code-block',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neu-code-block">
      <!-- Encabezado del editor -->
      <div class="neu-code-block__header">
        <!-- Traffic lights decorativos -->
        <div class="neu-code-block__dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <span class="neu-code-block__lang">{{ lang() }}</span>
        <button
          class="neu-code-block__copy"
          type="button"
          [attr.aria-label]="copied() ? 'Código copiado' : 'Copiar código'"
          (click)="copy()"
        >
          @if (copied()) {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copiado
          } @else {
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copiar
          }
        </button>
      </div>

      <!-- Bloque de código -->
      <pre class="neu-code-block__pre"><code class="neu-code-block__code">{{ code() }}</code></pre>
    </div>
  `,
  styleUrl: './neu-code-block.component.scss',
})
export class NeuCodeBlockComponent {
  private readonly doc = inject(DOCUMENT);

  /** Código fuente a mostrar */
  code = input<string>('');

  /** Nombre del lenguaje (decorativo) */
  lang = input<string>('TypeScript');

  protected readonly copied = signal(false);
  private _copyTimer?: ReturnType<typeof setTimeout>;

  copy(): void {
    void this.doc.defaultView?.navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      clearTimeout(this._copyTimer);
      this._copyTimer = setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
