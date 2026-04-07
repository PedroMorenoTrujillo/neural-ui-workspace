import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuSplitButtonAction,
  NeuSplitButtonComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-split-button-demo',
  imports: [
    TranslocoPipe,
    NeuSplitButtonComponent,
    NeuBadgeComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuCodeBlockComponent,
  ],
  templateUrl: './split-button-demo.component.html',
  styleUrl: './split-button-demo.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitButtonDemoComponent {
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

  readonly isLoading = signal(false);
  readonly lastAction = signal<string | null>(null);

  cfg: {
    label: string;
    variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
  } = {
    label: 'Guardar',
    variant: 'primary',
    size: 'md',
    disabled: false,
  };

  readonly previewActions: NeuSplitButtonAction[] = [
    { id: 'save-draft', label: 'Guardar borrador' },
    { id: 'save-copy', label: 'Guardar copia' },
    { id: 'divider-1', label: '', divider: true },
    { id: 'export', label: 'Exportar' },
    { id: 'delete', label: 'Eliminar', disabled: true },
  ];

  simulateLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2000);
  }

  onAction(action: NeuSplitButtonAction): void {
    this.lastAction.set(action.label);
    setTimeout(() => this.lastAction.set(null), 3000);
  }

  get configActions(): NeuSplitButtonAction[] {
    return [
      { id: 'option-1', label: 'Opción 1' },
      { id: 'option-2', label: 'Opción 2' },
      { id: 'option-3', label: 'Opción 3', disabled: true },
    ];
  }

  get configCode(): string {
    const actions = this.configActions
      .map((a) => `  { id: '${a.id}', label: '${a.label}'${a.disabled ? ', disabled: true' : ''} }`)
      .join(',\n');

    const attrs: string[] = [];
    if (this.cfg.variant !== 'primary') attrs.push(`variant="${this.cfg.variant}"`);
    if (this.cfg.size !== 'md') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.disabled) attrs.push(`[disabled]="true"`);

    const attrsStr = attrs.length ? '\n  ' + attrs.join('\n  ') : '';

    return `// En tu componente
actions: NeuSplitButtonAction[] = [
${actions}
];

// Template
<neu-split-button
  label="${this.cfg.label}"${attrsStr}
  [actions]="actions"
  (primaryClick)="onSave($event)"
  (actionClick)="onAction($event)"
/>`;
  }

  readonly usageCode = `import { NeuSplitButtonComponent, NeuSplitButtonAction } from '@neural-ui/core';

@Component({
  imports: [NeuSplitButtonComponent],
  template: \`
    <neu-split-button
      label="Guardar"
      [actions]="actions"
      (primaryClick)="save($event)"
      (actionClick)="onAction($event)"
    />
  \`
})
export class MyComponent {
  actions: NeuSplitButtonAction[] = [
    { id: 'draft', label: 'Guardar borrador' },
    { id: 'copy',  label: 'Guardar copia' },
    { id: 'export', label: 'Exportar', divider: true },
    { id: 'delete', label: 'Eliminar', disabled: true },
  ];

  save(e: MouseEvent) { /* acción principal */ }
  onAction(a: NeuSplitButtonAction) { console.log(a.id); }
}\``;
}
