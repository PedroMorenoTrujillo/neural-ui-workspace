import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuChipComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-chip-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuChipComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chip-demo.component.html',
  styleUrl: './chip-demo.component.scss',
})
export class ChipDemoComponent {
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

  cfg: {
    variant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    size: 'sm' | 'md';
    selected: boolean;
    removable: boolean;
    disabled: boolean;
    label: string;
  } = {
    variant: 'default',
    size: 'md',
    selected: false,
    removable: false,
    disabled: false,
    label: 'Angular',
  };

  // Estado para demo interactivo de filtros
  readonly filters = signal<Set<string>>(new Set(['Angular', 'TypeScript']));
  readonly filterOptions = ['Angular', 'TypeScript', 'CSS', 'RxJS', 'Signals', 'OnPush'];

  toggleFilter(tag: string): void {
    this.filters.update((s) => {
      const next = new Set(s);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  removeFilter(tag: string): void {
    this.filters.update((s) => {
      const next = new Set(s);
      next.delete(tag);
      return next;
    });
  }

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.variant !== 'default') attrs.push(`variant="${this.cfg.variant}"`);
    if (this.cfg.size !== 'md') attrs.push(`size="${this.cfg.size}"`);
    if (this.cfg.selected) attrs.push(`[selected]="true"`);
    if (this.cfg.removable) attrs.push(`[removable]="true"`);
    if (this.cfg.disabled) attrs.push(`[disabled]="true"`);
    const attrsStr = attrs.length ? ' ' + attrs.join(' ') : '';
    return `<neu-chip${attrsStr}>${this.cfg.label}</neu-chip>`;
  }

  readonly usageCode = `import { NeuChipComponent } from '@neural-ui/core';
import { signal } from '@angular/core';

@Component({
  imports: [NeuChipComponent],
  template: \`
    <!-- Chips estáticos -->
    <neu-chip>Angular</neu-chip>
    <neu-chip variant="primary" [selected]="true">TypeScript</neu-chip>

    <!-- Filtros interactivos -->
    @for (tag of tags; track tag) {
      <neu-chip
        [selected]="selected().has(tag)"
        [removable]="true"
        (selectedChange)="toggle(tag)"
        (removed)="remove(tag)"
      >{{ tag }}</neu-chip>
    }
  \`
})
export class MyComponent {
  readonly selected = signal(new Set(['Angular']));
  tags = ['Angular', 'TypeScript', 'RxJS'];

  toggle(tag: string) {
    this.selected.update(s => {
      const n = new Set(s);
      n.has(tag) ? n.delete(tag) : n.add(tag);
      return n;
    });
  }

  remove(tag: string) {
    this.selected.update(s => { const n = new Set(s); n.delete(tag); return n; });
  }
}`;
}
