import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuBadgeComponent,
  NeuButtonComponent,
  NeuCardComponent,
  NeuIconComponent,
} from '@neural-ui/core';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    NeuButtonComponent,
    NeuBadgeComponent,
    NeuCardComponent,
    NeuIconComponent,
    TranslocoPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly techTabs = [
    { label: 'Angular 21', icon: 'lucideShieldCheck' },
    { label: 'Signals', icon: 'lucideZap' },
    { label: 'URL State', icon: 'lucideLink' },
  ];

  readonly components = [
    {
      name: 'Badge',
      route: '/components/badge',
      icon: 'lucideTag',
      descKey: 'page.home.components.badge',
    },
    {
      name: 'Button',
      route: '/components/button',
      icon: 'lucidePlaySquare',
      descKey: 'page.home.components.button',
    },
    {
      name: 'Card',
      route: '/components/card',
      icon: 'lucideLayout',
      descKey: 'page.home.components.card',
    },
    {
      name: 'Input',
      route: '/components/input',
      icon: 'lucideType',
      descKey: 'page.home.components.input',
    },
    {
      name: 'Select',
      route: '/components/select',
      icon: 'lucideList',
      descKey: 'page.home.components.select',
    },
    {
      name: 'Sidebar',
      route: '/components/sidebar',
      icon: 'lucidePanelLeft',
      descKey: 'page.home.components.sidebar',
    },
    {
      name: 'Table',
      route: '/components/table',
      icon: 'lucideTable2',
      descKey: 'page.home.components.table',
      star: true,
    },
  ];

  readonly features = [
    {
      icon: 'lucideZap',
      labelKey: 'page.home.features.reactive.label',
      descKey: 'page.home.features.reactive.desc',
      accent: true,
    },
    {
      icon: 'lucideLink2',
      labelKey: 'page.home.features.urlState.label',
      descKey: 'page.home.features.urlState.desc',
      accent: false,
    },
    {
      icon: 'lucideAccessibility',
      labelKey: 'page.home.features.accessible.label',
      descKey: 'page.home.features.accessible.desc',
      accent: false,
    },
    {
      icon: 'lucidePalette',
      labelKey: 'page.home.features.tokens.label',
      descKey: 'page.home.features.tokens.desc',
      accent: false,
    },
  ];
}
