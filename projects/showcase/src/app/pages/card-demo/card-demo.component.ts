import { TranslocoPipe } from '@jsverse/transloco';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
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
  readonly demoTabs: NeuTab[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'config', label: 'Configurador' },
    { id: 'api', label: 'API' },
  ];

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
}
