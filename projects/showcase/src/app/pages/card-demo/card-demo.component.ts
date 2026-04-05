import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import {
  NeuBadgeComponent,
  NeuCardComponent,
  NeuTab,
  NeuTabPanelComponent,
  NeuTabsComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-card-demo',
  standalone: true,
  imports: [NeuCardComponent, NeuBadgeComponent, NeuTabsComponent, NeuTabPanelComponent],
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
