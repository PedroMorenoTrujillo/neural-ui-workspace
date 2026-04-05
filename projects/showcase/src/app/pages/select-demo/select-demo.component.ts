import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
  };
  cfgValue = '';

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
