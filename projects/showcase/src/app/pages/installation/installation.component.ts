import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { NeuBadgeComponent, NeuCodeBlockComponent, NeuIconComponent } from '@neural-ui/core';

@Component({
  selector: 'app-installation',
  imports: [RouterLink, TranslocoPipe, NeuBadgeComponent, NeuCodeBlockComponent, NeuIconComponent],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './installation.component.html',
  styleUrl: './installation.component.scss',
})
export class InstallationComponent {
  readonly installCmd = `npm install @neural-ui/core`;

  readonly peerDepsCmd = `# Peer dependency de Angular (si no la tienes ya)
npm install @angular/cdk`;

  readonly appConfigCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIcons, provideNgIconsConfig } from '@ng-icons/core';
import { lucideCheck, lucideX, lucideChevronDown } from '@ng-icons/lucide';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideNgIconsConfig({ size: '1em' }),
    provideIcons({ lucideCheck, lucideX, lucideChevronDown }),
  ],
};`;

  readonly stylesCode = `/* styles.scss — una sola línea con todos los componentes y tokens */
@use '@neural-ui/core/styles' as *;`;

  readonly firstUseCode = `<!-- app.component.html -->
<button neu-button variant="primary">
  ¡Hola NeuralUI!
</button>`;

  readonly firstUseTsCode = `// my.component.ts
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  standalone: true,
  imports: [NeuButtonComponent],
  template: \`<button neu-button variant="primary">Click me</button>\`,
})
export class MyComponent {}`;

  readonly steps = [
    { num: 1, icon: 'lucideDownload', labelKey: 'page.install.step1.title' },
    { num: 2, icon: 'lucideSettings', labelKey: 'page.install.step2.title' },
    { num: 3, icon: 'lucidePalette', labelKey: 'page.install.step3.title' },
    { num: 4, icon: 'lucidePlaySquare', labelKey: 'page.install.step4.title' },
  ];
}
