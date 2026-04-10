import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NeuToggleButtonGroupComponent } from '@neural-ui/core';
import type { NeuToggleOption } from '@neural-ui/core';

type Align = 'left' | 'center' | 'right';
type View = 'grid' | 'list';
type Size = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-toggle-button-group-sandbox',
  imports: [NeuToggleButtonGroupComponent, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Toggle Button Group</h1>
        <p class="sb-page__desc">
          NeuToggleButtonGroupComponent — selección simple/múltiple, iconos.
        </p>
      </div>

      <!-- Selección simple -->
      <section class="sb-section">
        <h2 class="sb-section__title">Selección simple</h2>
        <div class="sb-demo--column sb-demo">
          <neu-toggle-button-group [options]="alignOptions" (neuChange)="align.set($any($event))" />
          <span class="sb-value">alineación: {{ align() ?? 'sin selección' }}</span>
        </div>
      </section>

      <!-- Selección múltiple -->
      <section class="sb-section">
        <h2 class="sb-section__title">Selección múltiple</h2>
        <div class="sb-demo--column sb-demo">
          <neu-toggle-button-group
            [options]="formatOptions"
            [multiple]="true"
            (neuChange)="formats.set($any($event) ?? [])"
          />
          <span class="sb-value">formatos: {{ formats() | json }}</span>
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo--column sb-demo">
          <neu-toggle-button-group [options]="viewOptions" size="sm" />
          <neu-toggle-button-group [options]="viewOptions" size="md" />
          <neu-toggle-button-group [options]="viewOptions" size="lg" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Deshabilitado (grupo)</span>
            <neu-toggle-button-group [options]="viewOptions" [disabled]="true" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Solo texto (sin iconos)</span>
            <neu-toggle-button-group [options]="textOptions" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class ToggleButtonGroupSandboxComponent {
  align = signal<Align | null>(null);
  formats = signal<string[]>([]);

  readonly alignOptions: NeuToggleOption<Align>[] = [
    { value: 'left', label: 'Izq', icon: 'lucideAlignLeft' },
    { value: 'center', label: 'Centro', icon: 'lucideAlignCenter' },
    { value: 'right', label: 'Dcha', icon: 'lucideAlignRight' },
  ];

  readonly formatOptions: NeuToggleOption<string>[] = [
    { value: 'bold', label: 'Bold' },
    { value: 'italic', label: 'Italic' },
    { value: 'underline', label: 'Underline' },
    { value: 'strikethrough', label: 'Strike' },
  ];

  readonly viewOptions: NeuToggleOption<View>[] = [
    { value: 'grid', label: 'Grid', icon: 'lucideLayoutGrid' },
    { value: 'list', label: 'Lista', icon: 'lucideList' },
  ];

  readonly textOptions: NeuToggleOption<string>[] = [
    { value: 'xs', label: 'XS' },
    { value: 'sm', label: 'SM' },
    { value: 'md', label: 'MD' },
    { value: 'lg', label: 'LG' },
    { value: 'xl', label: 'XL' },
  ];
}
