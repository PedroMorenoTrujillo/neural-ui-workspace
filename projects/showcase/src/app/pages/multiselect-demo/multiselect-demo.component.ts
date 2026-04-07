import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuMultiselectComponent,
  NeuSelectOption,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-multiselect-demo',
  imports: [
    TranslocoPipe,
    NeuMultiselectComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './multiselect-demo.component.html',
  styleUrl: './multiselect-demo.component.scss',
})
export class MultiselectDemoComponent {
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

  readonly technologies: NeuSelectOption[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'nuxt', label: 'Nuxt' },
    { value: 'remix', label: 'Remix', disabled: true },
  ];

  readonly countries: NeuSelectOption[] = [
    { value: 'es', label: 'España' },
    { value: 'mx', label: 'México' },
    { value: 'ar', label: 'Argentina' },
    { value: 'co', label: 'Colombia' },
    { value: 'cl', label: 'Chile' },
    { value: 'pe', label: 'Perú' },
    { value: 'us', label: 'Estados Unidos' },
    { value: 'uk', label: 'Reino Unido' },
    { value: 'de', label: 'Alemania' },
    { value: 'fr', label: 'Francia' },
  ];

  previewTechs: string[] = ['angular', 'vue'];
  previewCountries: string[] = [];

  // Configurador
  cfg = {
    label: 'Tecnologías',
    placeholder: 'Seleccionar...',
    searchable: false,
    searchPlaceholder: 'Buscar...',
    error: '',
    disabled: false,
  };
  cfgValue: string[] = [];

  get configCode(): string {
    const lines: string[] = [`<neu-multiselect`];
    if (this.cfg.label) lines.push(`  label="${this.cfg.label}"`);
    if (this.cfg.placeholder !== 'Seleccionar...')
      lines.push(`  placeholder="${this.cfg.placeholder}"`);
    if (this.cfg.searchable) lines.push(`  [searchable]="true"`);
    if (this.cfg.searchable && this.cfg.searchPlaceholder !== 'Buscar...')
      lines.push(`  searchPlaceholder="${this.cfg.searchPlaceholder}"`);
    if (this.cfg.error) lines.push(`  errorMessage="${this.cfg.error}"`);
    if (this.cfg.disabled) lines.push(`  [disabled]="true"`);
    lines.push(`  [options]="options"`);
    lines.push(`  [(ngModel)]="selected"`);
    lines.push(`/>`);
    return lines.join('\n');
  }

  readonly usageCode = `import { NeuMultiselectComponent } from '@neural-ui/core';
import { FormsModule } from '@angular/forms';

const options: NeuSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js', disabled: true },
];

@Component({
  imports: [NeuMultiselectComponent, FormsModule],
  template: \`
    <!-- Con ngModel -->
    <neu-multiselect
      label="Tecnologías"
      [options]="options"
      [(ngModel)]="selected"
    />

    <!-- Con Reactive Forms -->
    <neu-multiselect
      label="Países"
      [options]="countries"
      [formControl]="countriesCtrl"
      [errorMessage]="countriesCtrl.invalid ? 'Requerido' : ''"
    />
  \`
})
export class MyComponent {
  selected: string[] = [];
  countriesCtrl = new FormControl<string[]>([], Validators.required);
}`;
}
