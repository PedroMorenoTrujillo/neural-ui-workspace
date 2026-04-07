import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCodeBlockComponent,
  NeuPaginationComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-pagination-demo',
  imports: [
    TranslocoPipe,
    NeuBadgeComponent,
    NeuPaginationComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination-demo.component.html',
  styleUrl: './pagination-demo.component.scss',
})
export class PaginationDemoComponent {
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

  // Demo interactivo
  readonly page = signal(1);

  cfg: {
    total: number;
    pageSize: number;
    maxVisible: number;
    cfgPage: number;
  } = {
    total: 200,
    pageSize: 10,
    maxVisible: 7,
    cfgPage: 1,
  };

  get configCode(): string {
    const attrs: string[] = [
      `[page]="currentPage"`,
      `[total]="${this.cfg.total}"`,
      `[pageSize]="${this.cfg.pageSize}"`,
      `(pageChange)="currentPage = $event"`,
    ];
    if (this.cfg.maxVisible !== 7) attrs.push(`[maxVisible]="${this.cfg.maxVisible}"`);
    return `<neu-pagination\n  ${attrs.join('\n  ')}\n/>`;
  }

  readonly usageCode = `import { NeuPaginationComponent } from '@neural-ui/core';
import { signal } from '@angular/core';

@Component({
  imports: [NeuPaginationComponent],
  template: \`
    <neu-pagination
      [page]="page()"
      [total]="total"
      [pageSize]="pageSize"
      (pageChange)="page.set($event)"
    />
  \`
})
export class MyComponent {
  page = signal(1);
  total = 150;
  pageSize = 10;
}`;
}
