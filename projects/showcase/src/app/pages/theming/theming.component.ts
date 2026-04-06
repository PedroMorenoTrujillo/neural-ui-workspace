import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-theming',
  imports: [TranslocoPipe, NeuBadgeComponent, NeuCodeBlockComponent, NeuTabsComponent, NeuTabPanelComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theming.component.html',
  styleUrl: './theming.component.scss',
})
export class ThemingComponent {
  readonly demoTabs: NeuTab[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'tokens', label: 'Tokens' },
    { id: 'dark', label: 'Dark Mode' },
    { id: 'custom', label: 'Custom Theme' },
  ];

  readonly overrideExample = `/* styles.scss — override NeuralUI tokens */
:root {
  /* Primary brand color */
  --neu-primary:       #7c3aed;   /* Purple */
  --neu-primary-dark:  #5b21b6;
  --neu-primary-light: #a78bfa;
  --neu-primary-fg:    #ffffff;

  /* Border radius */
  --neu-radius:    4px;
  --neu-radius-lg: 8px;
  --neu-radius-xl: 12px;
}`;

  readonly darkModeCode = `// Activate dark mode programmatically
document.documentElement.setAttribute('data-theme', 'dark');

// Or via Angular (NeuralUI built-in toggle already does this)
toggleTheme(): void {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
}`;

  readonly customThemeCode = `/* Corporate green theme */
:root {
  --neu-primary:        #059669;
  --neu-primary-dark:   #047857;
  --neu-primary-light:  #34d399;
  --neu-primary-50:     #ecfdf5;
  --neu-primary-100:    #d1fae5;
  --neu-primary-fg:     #ffffff;

  --neu-secondary:      #0284c7;
  --neu-secondary-dark: #0369a1;

  --neu-radius:    12px;
  --neu-radius-lg: 16px;
  --neu-radius-xl: 20px;

  --neu-font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
}`;

  readonly installCode = `/* In your Angular project's styles.scss */
@use '@neural-ui/core/styles';  /* imports tokens + base styles */

/* Then override below */
:root {
  --neu-primary: #your-color;
}`;

  // ── Token groups for the reference table ──────────────────────────────────
  readonly brandTokens = [
    { token: '--neu-primary',        value: '#007aff', desc_es: 'Color de acción principal',       desc_en: 'Primary action color' },
    { token: '--neu-primary-dark',   value: '#005fcc', desc_es: 'Hover / estado activo',            desc_en: 'Hover / active state' },
    { token: '--neu-primary-light',  value: '#339dff', desc_es: 'Variante clara',                   desc_en: 'Light variant' },
    { token: '--neu-primary-50',     value: '#eff6ff', desc_es: 'Fondo de énfasis muy suave',       desc_en: 'Very soft emphasis background' },
    { token: '--neu-primary-100',    value: '#dbeafe', desc_es: 'Fondo de énfasis suave',           desc_en: 'Soft emphasis background' },
    { token: '--neu-primary-fg',     value: '#ffffff', desc_es: 'Texto sobre color primario',       desc_en: 'Text on primary color' },
    { token: '--neu-secondary',      value: '#10b981', desc_es: 'Color de acción secundaria',       desc_en: 'Secondary action color' },
    { token: '--neu-secondary-dark', value: '#059669', desc_es: 'Hover secundario',                 desc_en: 'Secondary hover' },
    { token: '--neu-accent',         value: '#5ac8fa', desc_es: 'Acento decorativo',                desc_en: 'Decorative accent' },
  ];

  readonly bgTokens = [
    { token: '--neu-bg',          value: '#f8fafc', desc_es: 'Fondo base de la aplicación',     desc_en: 'Application base background' },
    { token: '--neu-surface',     value: '#ffffff', desc_es: 'Tarjetas y paneles',               desc_en: 'Cards and panels' },
    { token: '--neu-surface-2',   value: '#f1f5f9', desc_es: 'Fondos secundarios, zebra',        desc_en: 'Secondary backgrounds, zebra' },
    { token: '--neu-surface-3',   value: '#e2e8f0', desc_es: 'Hover, separadores',               desc_en: 'Hover, separators' },
    { token: '--neu-border',      value: 'rgba(15,23,42,.08)',  desc_es: 'Borde por defecto',    desc_en: 'Default border' },
    { token: '--neu-border-hover',value: 'rgba(15,23,42,.16)', desc_es: 'Borde en hover',        desc_en: 'Border on hover' },
    { token: '--neu-border-focus',value: 'var(--neu-primary)', desc_es: 'Borde en focus',        desc_en: 'Border on focus' },
  ];

  readonly textTokens = [
    { token: '--neu-text',          value: '#0f172a', desc_es: 'Texto principal',                desc_en: 'Primary text' },
    { token: '--neu-text-muted',    value: '#64748b', desc_es: 'Texto secundario / muted',       desc_en: 'Secondary / muted text' },
    { token: '--neu-text-disabled', value: '#94a3b8', desc_es: 'Texto deshabilitado',            desc_en: 'Disabled text' },
    { token: '--neu-text-inverse',  value: '#ffffff', desc_es: 'Texto sobre fondos oscuros',     desc_en: 'Text on dark backgrounds' },
    { token: '--neu-font-sans',     value: "'Inter', system-ui", desc_es: 'Fuente sans-serif', desc_en: 'Sans-serif font' },
    { token: '--neu-font-mono',     value: "'JetBrains Mono'",   desc_es: 'Fuente monoespaciada', desc_en: 'Monospace font' },
  ];

  readonly radiusTokens = [
    { token: '--neu-radius-xs',   value: '2px',    desc_es: 'Radio extra pequeño',   desc_en: 'Extra small radius' },
    { token: '--neu-radius-sm',   value: '6px',    desc_es: 'Radio pequeño',         desc_en: 'Small radius' },
    { token: '--neu-radius',      value: '8px',    desc_es: 'Radio por defecto',     desc_en: 'Default radius' },
    { token: '--neu-radius-lg',   value: '12px',   desc_es: 'Radio grande',          desc_en: 'Large radius' },
    { token: '--neu-radius-xl',   value: '16px',   desc_es: 'Radio extra grande',    desc_en: 'Extra large radius' },
    { token: '--neu-radius-2xl',  value: '24px',   desc_es: 'Radio 2x grande',       desc_en: '2x large radius' },
    { token: '--neu-radius-full', value: '9999px', desc_es: 'Completamente redondeado', desc_en: 'Fully rounded' },
  ];

  readonly shadowTokens = [
    { token: '--neu-shadow-xs', value: '0 1px 2px …',   desc_es: 'Sombra mínima',        desc_en: 'Minimal shadow' },
    { token: '--neu-shadow-sm', value: '0 1px 3px …',   desc_es: 'Sombra suave',         desc_en: 'Soft shadow' },
    { token: '--neu-shadow',    value: '0 4px 12px …',  desc_es: 'Sombra estándar',      desc_en: 'Standard shadow' },
    { token: '--neu-shadow-lg', value: '0 10px 30px …', desc_es: 'Sombra prominente',    desc_en: 'Prominent shadow' },
    { token: '--neu-shadow-glow', value: '0 0 20px rgba(0,122,255,.2)', desc_es: 'Efecto glow azul', desc_en: 'Blue glow effect' },
  ];
}
