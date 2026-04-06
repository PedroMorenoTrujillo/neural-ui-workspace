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
    {
      name: 'Multiselect',
      route: '/components/multiselect',
      icon: 'lucideListChecks',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Date Input',
      route: '/components/date-input',
      icon: 'lucideCalendar',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Textarea',
      route: '/components/textarea',
      icon: 'lucideFileText',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Switch',
      route: '/components/switch',
      icon: 'lucideToggleLeft',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Checkbox',
      route: '/components/checkbox',
      icon: 'lucideSquareCheck',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Radio',
      route: '/components/radio',
      icon: 'lucideCircleDot',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Split Button',
      route: '/components/split-button',
      icon: 'lucideChevronDown',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Toggle Button',
      route: '/components/toggle-button',
      icon: 'lucideLayoutGrid',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Nav',
      route: '/components/nav',
      icon: 'lucideLayoutDashboard',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Avatar',
      route: '/components/avatar',
      icon: 'lucideUser',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Chart',
      route: '/components/chart',
      icon: 'lucideBarChart2',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Stats Card',
      route: '/components/stats-card',
      icon: 'lucideTrendingUp',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Modal',
      route: '/components/modal',
      icon: 'lucideMaximize2',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Empty State',
      route: '/components/empty-state',
      icon: 'lucideInbox',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Tooltip',
      route: '/components/feedback',
      icon: 'lucideMessageSquare',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Tabs',
      route: '/components/tabs',
      icon: 'lucideLayoutList',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Skeleton',
      route: '/components/skeleton',
      icon: 'lucideLoader',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Divider',
      route: '/components/divider',
      icon: 'lucideMinus',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Chip',
      route: '/components/chip',
      icon: 'lucideTag',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Breadcrumb',
      route: '/components/breadcrumb',
      icon: 'lucideChevronsRight',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Progress Bar',
      route: '/components/progress-bar',
      icon: 'lucideBarChart2',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Accordion',
      route: '/components/accordion',
      icon: 'lucideList',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Pagination',
      route: '/components/pagination',
      icon: 'lucideMoreHorizontal',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Rating',
      route: '/components/rating',
      icon: 'lucideStar',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Slider',
      route: '/components/slider',
      icon: 'lucideSlidersHorizontal',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Timeline',
      route: '/components/timeline',
      icon: 'lucideActivity',
      descKey: 'page.home.components.table',
    },
    {
      name: 'Stepper',
      route: '/components/stepper',
      icon: 'lucideListChecks',
      descKey: 'page.home.components.table',
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
