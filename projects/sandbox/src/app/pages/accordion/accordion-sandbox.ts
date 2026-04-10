import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuAccordionComponent } from '@neural-ui/core';
import type { NeuAccordionItem } from '@neural-ui/core';

@Component({
  selector: 'app-accordion-sandbox',
  imports: [NeuAccordionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Accordion</h1>
        <p class="sb-page__desc">NeuAccordionComponent — simple/múltiple, bordered, toggle.</p>
      </div>

      <!-- Básico (single) -->
      <section class="sb-section">
        <h2 class="sb-section__title">Selección simple (por defecto)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-accordion [items]="faqItems" />
        </div>
      </section>

      <!-- Múltiple -->
      <section class="sb-section">
        <h2 class="sb-section__title">Selección múltiple</h2>
        <div class="sb-demo--column sb-demo">
          <neu-accordion [items]="faqItems" [multiple]="true" />
        </div>
      </section>

      <!-- Sin borde -->
      <section class="sb-section">
        <h2 class="sb-section__title">Sin borde (bordered=false)</h2>
        <div class="sb-demo--column sb-demo">
          <neu-accordion [items]="faqItems" [bordered]="false" />
        </div>
      </section>

      <!-- Con ítem abierto por defecto -->
      <section class="sb-section">
        <h2 class="sb-section__title">Ítem abierto por defecto</h2>
        <div class="sb-demo--column sb-demo">
          <neu-accordion [items]="itemsWithDefault" />
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <span class="sb-label" style="margin-bottom: 8px">Un solo ítem</span>
          <neu-accordion
            [items]="[{ id: 'one', title: 'Solo ítem', content: 'Contenido único del accordion.' }]"
          />
          <span class="sb-label" style="margin-top: 1rem; margin-bottom: 8px">Contenido largo</span>
          <neu-accordion [items]="longContent" />
        </div>
      </section>
    </div>
  `,
})
export class AccordionSandboxComponent {
  readonly faqItems: NeuAccordionItem[] = [
    {
      id: 'q1',
      title: '¿Qué es NeuralUI?',
      content:
        'NeuralUI es una librería de componentes Angular diseñada para crear interfaces de usuario modernas y accesibles con un diseño limpio y consistente.',
    },
    {
      id: 'q2',
      title: '¿Cómo instalo NeuralUI?',
      content:
        'Ejecuta `npm install @neural-ui/core` y luego importa `provideNeuralUI()` en tu `app.config.ts`.',
    },
    {
      id: 'q3',
      title: '¿Es compatible con Angular 17+?',
      content:
        'Sí. NeuralUI está construida con Angular 21 y usa standalone components, signals y OnPush por defecto. Es totalmente compatible con projetos zoneless.',
    },
    {
      id: 'q4',
      title: '¿Tiene soporte para dark mode?',
      content:
        'Sí. NeuralUI usa variables CSS y el atributo `data-theme` para gestionar el tema claro/oscuro. Solo necesitas cambiar el atributo en el `<html>` y todos los tokens se actualizan automáticamente.',
    },
  ];

  readonly itemsWithDefault: NeuAccordionItem[] = [
    { id: 'a', title: 'Primer ítem', content: 'Contenido uno.' },
    {
      id: 'b',
      title: 'Segundo ítem (abierto)',
      content: 'Este ítem está abierto por defecto.',
      expanded: true,
    },
    { id: 'c', title: 'Tercer ítem', content: 'Contenido tres.' },
  ];

  readonly longContent: NeuAccordionItem[] = [
    {
      id: 'long',
      title: 'Ítem con contenido largo',
      content:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
  ];
}
