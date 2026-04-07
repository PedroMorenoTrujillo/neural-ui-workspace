import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NeuBadgeComponent,
  NeuCardComponent,
  NeuCodeBlockComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-card-demo',
  imports: [
    TranslocoPipe,
    NeuCardComponent,
    NeuBadgeComponent,
    NeuCodeBlockComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-demo.component.html',
  styleUrl: './card-demo.component.scss',
})
export class CardDemoComponent {
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

  cfg = {
    hoverable: false,
    flat: false,
    bordered: false,
    padding: 'md' as 'none' | 'sm' | 'md' | 'lg',
  };

  get configCode(): string {
    const attrs: string[] = [];
    if (this.cfg.hoverable) attrs.push(`[hoverable]="true"`);
    if (this.cfg.flat) attrs.push(`[flat]="true"`);
    if (this.cfg.bordered) attrs.push(`[bordered]="true"`);
    if (this.cfg.padding !== 'md') attrs.push(`padding="${this.cfg.padding}"`);
    const attrsStr = attrs.length ? '\n  ' + attrs.join('\n  ') + '\n' : '';
    return `<neu-card${attrsStr}>\n  <p>Contenido</p>\n</neu-card>`;
  }

  readonly basicCode = `<neu-card>
  <div neu-card-header>
    <h3>Título de la tarjeta</h3>
  </div>

  <p>Contenido principal de la tarjeta. Puedes incluir
     cualquier elemento HTML aquí mediante content projection.</p>

  <div neu-card-footer>
    <button neu-button variant="ghost" size="sm">Cancelar</button>
    <button neu-button size="sm">Confirmar</button>
  </div>
</neu-card>`;

  readonly hoverableCode = `<!-- Hoverable — eleva la sombra en hover -->
<neu-card [hoverable]="true">
  <p>Tarjeta con efecto hover</p>
</neu-card>

<!-- Flat — sin sombra ni borde -->
<neu-card [flat]="true">
  <p>Tarjeta flat (solo fondo)</p>
</neu-card>

<!-- Bordered — borde de color primario -->
<neu-card [bordered]="true">
  <p>Tarjeta con borde de acento</p>
</neu-card>`;

  readonly paddingCode = `<!-- padding="none" — ideal para imágenes de portada -->
<neu-card padding="none">
  <img src="..." alt="Cover" />
  <div style="padding: 16px">
    <h3>Contenido</h3>
  </div>
</neu-card>

<!-- Otros valores: 'sm' | 'md' (default) | 'lg' -->
<neu-card padding="lg">
  <p>Tarjeta con relleno grande</p>
</neu-card>`;

  readonly usageCode = `import { NeuCardComponent } from '@neural-ui/core';

@Component({
  imports: [NeuCardComponent],
  template: \`
    <!-- Básica -->
    <neu-card>
      <p>Contenido de la tarjeta</p>
    </neu-card>

    <!-- Con header y footer -->
    <neu-card>
      <div neu-card-header><h3>Título</h3></div>
      <p>Cuerpo de la tarjeta</p>
      <div neu-card-footer>
        <button neu-button variant="ghost" size="sm">Cancelar</button>
        <button neu-button size="sm">Confirmar</button>
      </div>
    </neu-card>

    <!-- Hoverable -->
    <neu-card [hoverable]="true"><p>Eleva la sombra en hover</p></neu-card>

    <!-- Flat (sin sombra) -->
    <neu-card [flat]="true"><p>Tarjeta flat</p></neu-card>

    <!-- Bordered -->
    <neu-card [bordered]="true"><p>Borde de acento</p></neu-card>

    <!-- Padding personalizado -->
    <neu-card padding="sm"><p>Relleno pequeño</p></neu-card>
    <neu-card padding="lg"><p>Relleno grande</p></neu-card>
  \`
})
export class MyComponent {}`;
}
