import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  computed,
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
        <span class="neu-code-block__lang">{{ displayLang() }}</span>
        <button
          class="neu-code-block__copy"
          type="button"
          [attr.aria-label]="copied() ? resolvedCopiedAriaLabel() : resolvedCopyAriaLabel()"
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
            {{ resolvedCopiedLabel() }}
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
            {{ resolvedCopyLabel() }}
          }
        </button>
      </div>

      <!-- Bloque de código -->
      <pre
        class="neu-code-block__pre"
        tabindex="0"
      ><code class="neu-code-block__code">{{ code() }}</code></pre>
    </div>
  `,
  host: { '[attr.lang]': 'null' },
  styleUrl: './neu-code-block.component.scss',
})
export class NeuCodeBlockComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Código fuente a mostrar / Source code to display */
  code = input<string>('');

  /** Nombre del lenguaje (decorativo) / Language name (decorative) */
  lang = input<string>('');

  /**
   * Identificador de lenguaje estándar (typescript, scss, html, bash…).
   * Genera automáticamente el label legible para el badge.
   * Language identifier — auto-generates a readable badge label.
   */
  language = input<string>('');

  /** Label legible derivado de lang o language / Readable label derived from lang or language */
  protected readonly displayLang = computed(() => {
    const explicit = this.lang();
    if (explicit) return explicit;
    const id = this.language().toLowerCase().trim();
    const map: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      ts: 'TypeScript',
      js: 'JavaScript',
      scss: 'SCSS',
      css: 'CSS',
      less: 'Less',
      html: 'HTML',
      xml: 'XML',
      bash: 'Bash',
      shell: 'Shell',
      sh: 'Shell',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      angular: 'Angular',
      jsx: 'JSX',
      tsx: 'TSX',
    };
    return map[id] ?? (id ? id.toUpperCase() : 'TypeScript');
  });

  /** Texto del botón cuando no se ha copiado / Button text when not yet copied */
  copyLabel = input<string | undefined>(undefined);

  /** Texto del botón tras copiar / Button text after copying */
  copiedLabel = input<string | undefined>(undefined);

  /** Aria-label del botón copiar / Aria-label for the copy button */
  copyAriaLabel = input<string | undefined>(undefined);

  /** Aria-label del botón tras copiar / Aria-label for the button after copying */
  copiedAriaLabel = input<string | undefined>(undefined);

  private readonly localeLabels = signal(this._getLocaleLabels());

  protected readonly resolvedCopyLabel = computed(
    () => this._resolveInputLabel(this.copyLabel()) ?? this.localeLabels().copyLabel,
  );

  protected readonly resolvedCopiedLabel = computed(
    () => this._resolveInputLabel(this.copiedLabel()) ?? this.localeLabels().copiedLabel,
  );

  protected readonly resolvedCopyAriaLabel = computed(
    () => this._resolveInputLabel(this.copyAriaLabel()) ?? this.localeLabels().copyAriaLabel,
  );

  protected readonly resolvedCopiedAriaLabel = computed(
    () => this._resolveInputLabel(this.copiedAriaLabel()) ?? this.localeLabels().copiedAriaLabel,
  );

  protected readonly copied = signal(false);
  private _copyTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    const root = this.doc.documentElement;
    const win = this.doc.defaultView;

    if (!root || !win?.MutationObserver) return;

    const observer = new win.MutationObserver(() => {
      this.localeLabels.set(this._getLocaleLabels());
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['lang'],
    });

    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  copy(): void {
    const text = this.code();
    const win = this.doc.defaultView;

    if (win?.navigator?.clipboard) {
      void win.navigator.clipboard.writeText(text).then(() => this._markCopied());
    } else {
      // Fallback para HTTP o navegadores sin Clipboard API
      const ta = this.doc.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      this.doc.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        this.doc.execCommand('copy');
        this._markCopied();
      } finally {
        this.doc.body.removeChild(ta);
      }
    }
  }

  private _markCopied(): void {
    this.copied.set(true);
    clearTimeout(this._copyTimer);
    this._copyTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  private _getLocaleLabels(): {
    copyLabel: string;
    copiedLabel: string;
    copyAriaLabel: string;
    copiedAriaLabel: string;
  } {
    const lang = this.doc.documentElement?.lang?.toLowerCase() ?? 'en';

    if (lang.startsWith('es')) {
      return {
        copyLabel: 'Copiar',
        copiedLabel: 'Copiado',
        copyAriaLabel: 'Copiar código',
        copiedAriaLabel: 'Código copiado',
      };
    }

    return {
      copyLabel: 'Copy',
      copiedLabel: 'Copied',
      copyAriaLabel: 'Copy code',
      copiedAriaLabel: 'Code copied',
    };
  }

  private _resolveInputLabel(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? value : undefined;
  }
}
