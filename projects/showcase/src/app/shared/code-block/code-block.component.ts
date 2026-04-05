import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Componente para mostrar bloques de código con estilo
 * de editor (dark theme en el bloque, aunque la página sea light).
 */
@Component({
  selector: 'app-code-block',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <div class="code-block__header">
        <span class="code-block__lang">{{ lang() }}</span>
        <button
          class="code-block__copy"
          type="button"
          (click)="copy()"
          [attr.aria-label]="copied() ? 'Copiado' : 'Copiar código'"
        >
          @if (copied()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copiado
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copiar
          }
        </button>
      </div>
      <pre class="code-block__pre"><code class="code-block__code">{{ code() }}</code></pre>
    </div>
  `,
  styles: [`
    .code-block {
      border-radius: var(--neu-radius-lg);
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.06);
      font-family: var(--neu-font-mono);
    }

    .code-block__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      background: #1a1b26;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }

    .code-block__lang {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #7aa2f7;
    }

    .code-block__copy {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      color: #a9b1d6;
      cursor: pointer;
      font-family: var(--neu-font-sans);
      transition: all 150ms;

      svg { width: 12px; height: 12px; }

      &:hover { background: rgba(255,255,255,0.1); color: #fff; }
    }

    .code-block__pre {
      margin: 0;
      padding: 20px;
      background: #1e1e2e;
      overflow-x: auto;
      font-size: 13.5px;
      line-height: 1.7;
    }

    .code-block__code {
      color: #cdd6f4;
      font-family: inherit;
      white-space: pre;
      display: block;
    }
  `],
})
export class CodeBlockComponent {
  code = input<string>('');
  lang = input<string>('TypeScript');

  protected readonly copied = signal(false);
  private _copyTimeout?: ReturnType<typeof setTimeout>;

  copy(): void {
    void navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      clearTimeout(this._copyTimeout);
      this._copyTimeout = setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
