import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuSelectComponent,
  NeuSelectOption,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-select-demo',
  imports: [
    TranslocoPipe,
    NeuSelectComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select-demo.component.html',
  styleUrl: './select-demo.component.scss',
})
export class SelectDemoComponent {
  private readonly _t = inject(TranslocoService);
  private readonly _activeLang = toSignal(this._t.langChanges$, { initialValue: this._t.getActiveLang() });
  readonly demoTabs = computed<NeuTab[]>(() => {
    this._activeLang();
    return [
      { id: 'preview', label: this._t.translate('demo.common.tabs.preview') },
      { id: 'config', label: this._t.translate('demo.common.tabs.config') },
      { id: 'api', label: this._t.translate('demo.common.tabs.api') },
    ];
  });

  readonly frameworks: NeuSelectOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS' },
  ];

  readonly countries: NeuSelectOption[] = [
    { value: 'es', label: 'España' },
    { value: 'mx', label: 'México' },
    { value: 'ar', label: 'Argentina' },
    { value: 'co', label: 'Colombia' },
    { value: 'cl', label: 'Chile' },
    { value: 'pe', label: 'Perú' },
    { value: 'us', label: 'Estados Unidos' },
    { value: 'uk', label: 'Reino Unido', disabled: true },
  ];

  selectedFramework = signal('angular');
  selectedCountry = signal('');

  // Configurador
  cfg = {
    label: 'Framework',
    placeholder: 'Seleccionar...',
    error: '',
    disabled: false,
    floatingLabel: false,
    searchable: false,
    searchPlaceholder: 'Buscar...',
  };
  cfgValue = '';

  get configCode(): string {
    const lines: string[] = [`<neu-select`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.placeholder !== 'Seleccionar...')
      lines.push(`  placeholder="${this.cfg.placeholder}"`);
    lines.push(`  [options]="options"`);
    if (this.cfg.floatingLabel) lines.push(`  [floatingLabel]="true"`);
    if (this.cfg.searchable) lines.push(`  [searchable]="true"`);
    if (this.cfg.searchable && this.cfg.searchPlaceholder !== 'Buscar...')
      lines.push(`  searchPlaceholder="${this.cfg.searchPlaceholder}"`);
    if (this.cfg.error) lines.push(`  errorMessage="${this.cfg.error}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuSelectComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

const options: NeuSelectOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'uk', label: 'Reino Unido', disabled: true },
];

@Component({
  imports: [NeuSelectComponent, FormsModule],
  template: \`
    <!-- Con ngModel -->
    <neu-select
      label="País"
      [options]="options"
      [(ngModel)]="country"
    />

    <!-- Con Reactive Forms -->
    <neu-select
      label="Idioma"
      [options]="languages"
      [formControl]="langCtrl"
      [errorMessage]="langCtrl.invalid ? 'Requerido' : ''"
    />
  \`
})
export class MyComponent {
  country = '';
  langCtrl = new FormControl('', Validators.required);
}`;
}
