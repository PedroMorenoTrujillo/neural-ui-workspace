import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-code-block-demo',
  templateUrl: './code-block-demo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
})
export class CodeBlockDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _translations = toSignal(this._t.selectTranslation());

  readonly demoTabs = computed<NeuTab[]>(() => {
    this._translations();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  // Muestra de código por lenguaje
  readonly snippets: Record<string, string> = {
    TypeScript: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`<h1>{{ title() }}</h1>\`
})
export class AppComponent {
  title = signal('NeuralUI');
}`,
    HTML: `<neu-stats-card
  title="Ingresos"
  value="$48,295"
  change="+12.5%"
  trend="up"
/>`,
    SCSS: `.my-component {
  display: flex;
  gap: var(--neu-space-4);
  padding: var(--neu-space-6);
  background: var(--neu-surface);
  border-radius: var(--neu-radius-lg);
}`,
    JSON: `{
  "name": "@neural-ui/core",
  "version": "1.0.0",
  "peerDependencies": {
    "@angular/core": ">=17.0.0"
  }
}`,
    Bash: `npm install @neural-ui/core
ng generate component my-feature
ng build --configuration production`,
  };

  cfg: {
    lang: string;
    copyLabel: string;
    copiedLabel: string;
  } = {
    lang: 'TypeScript',
    copyLabel: 'Copiar',
    copiedLabel: 'Copiado',
  };

  get cfgCode(): string {
    return this.snippets[this.cfg.lang] ?? this.snippets['TypeScript'];
  }

  get configCode(): string {
    const attrs: string[] = [`[code]="snippet"`, `lang="${this.cfg.lang}"`];
    if (this.cfg.copyLabel !== 'Copiar') attrs.push(`copyLabel="${this.cfg.copyLabel}"`);
    if (this.cfg.copiedLabel !== 'Copiado') attrs.push(`copiedLabel="${this.cfg.copiedLabel}"`);
    return `<neu-code-block ${attrs.join(' ')} />`;
  }

  readonly tsCode = `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`<h1>{{ title() }}</h1>\`
})
export class AppComponent {
  title = signal('NeuralUI');
}`;

  readonly htmlCode = `<neu-stats-card
  title="Ingresos"
  value="$48,295"
  change="+12.5%"
  trend="up"
  [sparkData]="data"
/>`;

  readonly scssCode = `.my-component {
  display: flex;
  gap: var(--neu-space-4);
  padding: var(--neu-space-6);
  background: var(--neu-surface);
  border-radius: var(--neu-radius-lg);
}`;

  readonly usageCode = `import { NeuCodeBlockComponent } from '@neural-ui/core';

@Component({
  imports: [NeuCodeBlockComponent],
  template: \`
    <neu-code-block [code]="snippet" lang="TypeScript" />
  \`
})
export class MyComponent {
  snippet = \`const x = 1;\`;
}`;
}
