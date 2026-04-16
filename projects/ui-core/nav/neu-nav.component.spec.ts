import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuNavComponent, NeuNavItem } from './neu-nav.component';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideExternalLink, lucideChevronLeft } from '@ng-icons/lucide';
import { Router } from '@angular/router';

@Component({ template: '' })
class DummyRouteComponent {}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIMPLE_ITEMS: NeuNavItem[] = [
  { id: 'home', label: 'Inicio', icon: 'lucideChevronRight', route: '/' },
  { id: 'comp', label: 'Componentes', icon: 'lucideChevronRight', route: '/components' },
  { id: 'docs', label: 'Documentación', icon: 'lucideChevronRight', route: '/docs' },
];

const HREF_ITEMS: NeuNavItem[] = [
  { id: 'gh', label: 'GitHub', icon: 'lucideExternalLink', href: 'https://github.com' },
];

const BADGE_ITEMS: NeuNavItem[] = [
  {
    id: 'notif',
    label: 'Notificaciones',
    icon: 'lucideChevronRight',
    route: '/notifs',
    badge: '9',
    badgeVariant: 'danger',
  },
];

const DISABLED_ITEMS: NeuNavItem[] = [
  { id: 'dis', label: 'Deshabilitado', icon: 'lucideChevronRight', route: '/dis', disabled: true },
];

const GROUP_ITEMS: NeuNavItem[] = [
  {
    id: 'grp',
    label: 'Grupo',
    icon: 'lucideChevronRight',
    children: [
      { id: 'c1', label: 'Hijo Ruta', icon: 'lucideChevronRight', route: '/child1' },
      { id: 'c2', label: 'Hijo Externo', icon: 'lucideExternalLink', href: 'https://ext.com' },
      {
        id: 'c3',
        label: 'Hijo Deshabilitado',
        icon: 'lucideChevronRight',
        route: '/child3',
        disabled: true,
      },
    ],
  },
];

const NESTED_GROUP: NeuNavItem[] = [
  {
    id: 'parent',
    label: 'Padre',
    icon: 'lucideChevronRight',
    children: [
      {
        id: 'subgrp',
        label: 'Subgrupo',
        icon: 'lucideChevronRight',
        children: [
          { id: 'grand1', label: 'Nieto Ruta', icon: 'lucideChevronRight', route: '/grand1' },
          {
            id: 'grand2',
            label: 'Nieto Externo',
            icon: 'lucideExternalLink',
            href: 'https://grand.com',
          },
        ],
      },
    ],
  },
];

// Colección mixta para cubrir todas las ramas del flyout (L2 ruta + L2 href + L2 grupo)
const FLYOUT_MIXED: NeuNavItem[] = [
  {
    id: 'fgrp',
    label: 'FlyoutGrupo',
    icon: 'lucideChevronRight',
    children: [
      { id: 'fl1', label: 'FL Ruta', icon: 'lucideChevronRight', route: '/fl1' },
      { id: 'fl2', label: 'FL Externo', icon: 'lucideExternalLink', href: 'https://fl.com' },
    ],
  },
];

function mkProviders() {
  return [
    provideRouter([]),
    provideIcons({ lucideChevronRight, lucideExternalLink, lucideChevronLeft }),
  ];
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('NeuNavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: mkProviders() }).compileComponents();
  });

  // ── Rendering básico ─────────────────────────────────────────────────────

  it('should render nav element', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('nav')).toBeTruthy();
  });

  it('should render all item labels', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('Inicio');
    expect(text).toContain('Componentes');
    expect(text).toContain('Documentación');
  });

  it('should render links for items with route', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const links = f.nativeElement.querySelectorAll('a.neu-nav__item');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  // ── Href items ───────────────────────────────────────────────────────────

  it('should render href item as external anchor with target and rel', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', HREF_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const anchor: HTMLAnchorElement = f.nativeElement.querySelector(
      'a.neu-nav__item[target="_blank"]',
    );
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('rel')).toContain('noopener');
  });

  // ── Badge items ──────────────────────────────────────────────────────────

  it('should render badge on items with badge property', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', BADGE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const text = f.nativeElement.textContent;
    expect(text).toContain('9');
  });

  it('should render badge on a top-level group item', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', [
      {
        id: 'group-badge',
        label: 'Grupo con badge',
        icon: 'lucideChevronRight',
        badge: 'Beta',
        badgeVariant: 'info',
        children: [{ id: 'child', label: 'Child', icon: 'lucideChevronRight', route: '/child' }],
      },
    ]);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('Beta');
    expect(f.nativeElement.querySelector('.neu-nav__item-badge')).toBeTruthy();
  });

  it('should render badge on a top-level external item', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', [
      {
        id: 'gh-badge',
        label: 'GitHub',
        icon: 'lucideExternalLink',
        href: 'https://github.com',
        badge: 'New',
        badgeVariant: 'info',
      },
    ]);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('New');
    expect(f.nativeElement.querySelector('.neu-nav__item-badge')).toBeTruthy();
  });

  it('should render badge on a top-level internal item', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', [
      {
        id: 'home-badge',
        label: 'Inicio',
        icon: 'lucideChevronRight',
        route: '/',
        badge: '4',
        badgeVariant: 'warning',
      },
    ]);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('4');
    expect(f.nativeElement.querySelector('.neu-nav__item-badge')).toBeTruthy();
  });

  // ── Disabled items ───────────────────────────────────────────────────────

  it('should apply disabled class to disabled items', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', DISABLED_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nav__item--disabled')).toBeTruthy();
  });

  // ── Collapsed / expand ───────────────────────────────────────────────────

  it('should apply collapsed class when collapsed=true', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('[class*="collapsed"]')).toBeTruthy();
  });

  it('should show toggle-tab button when collapsible=true', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-nav__toggle-tab')).toBeTruthy();
  });

  it('should NOT show toggle-tab button when collapsible=false', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button.neu-nav__toggle-tab')).toBeNull();
  });

  it('should toggle collapsed state and emit collapsedChange', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    const emitted: boolean[] = [];
    comp.collapsedChange.subscribe((v: boolean) => emitted.push(v));

    comp.toggleCollapse();
    f.detectChanges();
    await f.whenStable();
    expect(comp.isCollapsed()).toBe(true);
    expect(emitted).toContain(true);

    comp.toggleCollapse();
    f.detectChanges();
    await f.whenStable();
    expect(comp.isCollapsed()).toBe(false);
    expect(emitted).toContain(false);
  });

  it('clicking the toggle tab should collapse the nav from the template', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsible', true);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector('.neu-nav__toggle-tab') as HTMLButtonElement;
    button.click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.isCollapsed()).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Expandir menú');
  });

  // ── Group accordion (L1 → L2) ───────────────────────────────────────────

  it('should render group item as parent button', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button.neu-nav__item--parent');
    expect(btn).toBeTruthy();
    expect(f.nativeElement.textContent).toContain('Grupo');
  });

  it('should toggle group open/closed via toggleGroup', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    expect(comp.isGroupOpen('grp')).toBe(false);
    comp.toggleGroup('grp');
    expect(comp.isGroupOpen('grp')).toBe(true);
    comp.toggleGroup('grp');
    expect(comp.isGroupOpen('grp')).toBe(false);
  });

  it('should show child labels when group is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    const text = f.nativeElement.textContent;
    expect(text).toContain('Hijo Ruta');
    expect(text).toContain('Hijo Externo');
  });

  it('clicking a parent group button should toggle the submenu from the template', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector(
      'button.neu-nav__item--parent',
    ) as HTMLButtonElement;
    button.click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.isGroupOpen('grp')).toBe(true);
    expect(f.nativeElement.textContent).toContain('Hijo Ruta');
  });

  it('clicking a parent group button should not open the submenu when collapsed', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();

    const button = f.nativeElement.querySelector(
      'button.neu-nav__item--parent',
    ) as HTMLButtonElement;
    button.click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.isGroupOpen('grp')).toBe(false);
    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('should render L2 href child as external anchor', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    const extLink = f.nativeElement.querySelector('a.neu-nav__item--child[target="_blank"]');
    expect(extLink).toBeTruthy();
  });

  it('should render badge on an external L2 child item', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', [
      {
        id: 'grp-badge-child',
        label: 'Grupo',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'child-external-badge',
            label: 'Child External',
            icon: 'lucideExternalLink',
            href: 'https://example.com',
            badge: 'Hot',
            badgeVariant: 'warning',
          },
        ],
      },
    ]);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.toggleGroup('grp-badge-child');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('Hot');
    expect(
      f.nativeElement.querySelector('.neu-nav__item--child .neu-nav__item-badge'),
    ).toBeTruthy();
  });

  it('should render L2 disabled child with disabled class', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('grp');
    f.detectChanges();
    await f.whenStable();

    expect(
      f.nativeElement.querySelector('.neu-nav__item--child.neu-nav__item--disabled'),
    ).toBeTruthy();
  });

  it('isGroupActive should return false when no child matches current route', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.isGroupActive(GROUP_ITEMS[0])).toBe(false);
  });

  // ── Nested groups (L2 → L3) ──────────────────────────────────────────────

  it('should show L2 subgroup label when parent is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.textContent).toContain('Subgrupo');
  });

  it('should show L3 children when nested subgroup is open', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    comp.toggleGroup('subgrp');
    f.detectChanges();
    await f.whenStable();

    const text = f.nativeElement.textContent;
    expect(text).toContain('Nieto Ruta');
  });

  it('clicking a nested subgroup button should toggle its open state from the template', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.toggleGroup('parent');
    f.detectChanges();
    await f.whenStable();

    const buttons = Array.from(
      f.nativeElement.querySelectorAll('button.neu-nav__item--child.neu-nav__item--parent'),
    ) as HTMLButtonElement[];
    const nestedButton = buttons.find((button) => button.textContent?.includes('Subgrupo'));

    nestedButton?.click();
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.isGroupOpen('subgrp')).toBe(true);
  });

  it('should render L3 href as external anchor', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.toggleGroup('parent');
    comp.toggleGroup('subgrp');
    f.detectChanges();
    await f.whenStable();

    const extLinks = f.nativeElement.querySelectorAll('a[target="_blank"]');
    expect(extLinks.length).toBeGreaterThan(0);
  });

  // ── isCurrentRoute ───────────────────────────────────────────────────────

  it('should return false from isCurrentRoute for empty and non-matching routes', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;
    expect(comp.isCurrentRoute('')).toBe(false);
    expect(comp.isCurrentRoute('/nonexistent')).toBe(false);
  });

  // ── Flyout — modo colapsado ──────────────────────────────────────────────

  it('should set flyoutState on onGroupMouseEnter when collapsed', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent;
    comp.onGroupMouseEnter(GROUP_ITEMS[0], mockEvent);

    expect(comp.flyoutState()).not.toBeNull();
    expect(comp.flyoutState()?.item.id).toBe('grp');
    expect(comp.flyoutState()?.top).toBe(100);
    expect(comp.flyoutState()?.left).toBe(200);
  });

  it('should NOT set flyoutState when not collapsed', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    const mockEvent = {
      currentTarget: { getBoundingClientRect: () => ({ top: 100, right: 200 }) },
    } as unknown as MouseEvent;
    comp.onGroupMouseEnter(GROUP_ITEMS[0], mockEvent);

    expect(comp.flyoutState()).toBeNull();
  });

  it('should render flyout panel in DOM once flyoutState is set', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_MIXED);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(FLYOUT_MIXED[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutEl = f.nativeElement.querySelector('.neu-nav__flyout');
    expect(flyoutEl).toBeTruthy();
    expect(flyoutEl.textContent).toContain('FlyoutGrupo');
    expect(flyoutEl.textContent).toContain('FL Ruta');
    expect(flyoutEl.textContent).toContain('FL Externo');
  });

  it('should render flyout with nested L3 children', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(NESTED_GROUP[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutEl = f.nativeElement.querySelector('.neu-nav__flyout');
    expect(flyoutEl).toBeTruthy();
    expect(flyoutEl.textContent).toContain('Nieto Ruta');
  });

  it('onFlyoutMouseEnter should cancel pending close timer', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    comp.onGroupMouseLeave();
    comp.onFlyoutMouseEnter(); // cancels timer → flyout should remain
    expect(comp.flyoutState()).not.toBeNull();
  });

  it('onGroupMouseLeave should clear flyoutState after 150ms', () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    expect(comp.flyoutState()).not.toBeNull();

    comp.onGroupMouseLeave();
    vi.advanceTimersByTime(200);
    expect(comp.flyoutState()).toBeNull();
    vi.useRealTimers();
  });

  it('onGroupMouseLeave should do nothing when the nav is expanded', () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();

    const comp = f.componentInstance;
    comp.flyoutState.set({ item: GROUP_ITEMS[0], top: 10, left: 20 });
    comp.onGroupMouseLeave();
    vi.advanceTimersByTime(200);

    expect(comp.flyoutState()?.item.id).toBe('grp');
    vi.useRealTimers();
  });

  it('onFlyoutMouseLeave should clear flyoutState after 150ms', () => {
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;

    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    comp.onFlyoutMouseLeave();
    vi.advanceTimersByTime(200);
    expect(comp.flyoutState()).toBeNull();
    vi.useRealTimers();
  });

  it('flyout with nested group renders grandchild href link that closes flyout on click', async () => {
    const NESTED_FLYOUT: NeuNavItem[] = [
      {
        id: 'nf',
        label: 'Nested Flyout',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'nf-sub',
            label: 'Subgrupo',
            icon: 'lucideChevronRight',
            children: [
              {
                id: 'nf-g1',
                label: 'Nieto Externo',
                icon: 'lucideExternalLink',
                href: 'https://example.com',
              },
              { id: 'nf-g2', label: 'Nieto Ruta', icon: 'lucideChevronRight', route: '/grand2' },
            ],
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_FLYOUT);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onGroupMouseEnter(NESTED_FLYOUT[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    expect(comp.flyoutState()).not.toBeNull();
    // The flyout with nested group + external grandchild should be rendered
    const extLinks = f.nativeElement.querySelectorAll('.neu-nav__flyout-item');
    expect(extLinks.length).toBeGreaterThan(0);
  });

  it('clicking a nested flyout external link should close the flyout from the template', async () => {
    const nestedFlyout: NeuNavItem[] = [
      {
        id: 'parent-ext',
        label: 'Parent',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'sub-ext',
            label: 'Sub',
            icon: 'lucideChevronRight',
            children: [
              {
                id: 'grand-ext',
                label: 'Grand External',
                icon: 'lucideExternalLink',
                href: 'https://example.com',
              },
            ],
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', nestedFlyout);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.onGroupMouseEnter(nestedFlyout[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 30, right: 60 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutItems = Array.from(
      f.nativeElement.querySelectorAll('.neu-nav__flyout-item'),
    ) as HTMLAnchorElement[];
    const link = flyoutItems.find((item) =>
      item.textContent?.includes('Grand External'),
    ) as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    f.detectChanges();

    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('flyout with child href link is rendered in collapsed mode', async () => {
    const FLYOUT_HREF: NeuNavItem[] = [
      {
        id: 'fh',
        label: 'Flyout Href',
        icon: 'lucideChevronRight',
        children: [
          { id: 'fh-l', label: 'External', icon: 'lucideExternalLink', href: 'https://ext.com' },
          { id: 'fh-r', label: 'Route', icon: 'lucideChevronRight', route: '/route' },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_HREF);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;
    comp.onGroupMouseEnter(FLYOUT_HREF[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 30, right: 60 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const flyoutItems = f.nativeElement.querySelectorAll('.neu-nav__flyout-item');
    expect(flyoutItems.length).toBeGreaterThanOrEqual(2);
    // External link should have external link icon
    expect(f.nativeElement.textContent).toContain('External');
  });

  it('clicking a flyout route item should close the flyout from the template', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_MIXED);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.onGroupMouseEnter(FLYOUT_MIXED[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const routeLink = f.nativeElement.querySelector('.neu-nav__flyout-item') as HTMLAnchorElement;
    routeLink.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
    );
    f.detectChanges();

    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('clicking a flyout external child link should close the flyout from the template', async () => {
    const FLYOUT_HREF: NeuNavItem[] = [
      {
        id: 'fh',
        label: 'Flyout Href',
        icon: 'lucideChevronRight',
        children: [
          { id: 'fh-l', label: 'External', icon: 'lucideExternalLink', href: 'https://ext.com' },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_HREF);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.onGroupMouseEnter(FLYOUT_HREF[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 30, right: 60 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const link = f.nativeElement.querySelector('.neu-nav__flyout-item') as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    f.detectChanges();

    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('clicking a nested flyout route link should close the flyout from the template', async () => {
    const nested: NeuNavItem[] = [
      {
        id: 'parent',
        label: 'Parent',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'sub',
            label: 'Sub',
            icon: 'lucideChevronRight',
            children: [
              {
                id: 'grand-route',
                label: 'Grand Route',
                icon: 'lucideChevronRight',
                route: '/grand-route',
              },
            ],
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', nested);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.onGroupMouseEnter(nested[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 30, right: 60 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();

    const flyoutItems = Array.from(
      f.nativeElement.querySelectorAll('.neu-nav__flyout-item'),
    ) as HTMLAnchorElement[];
    const link = flyoutItems.find((item) =>
      item.textContent?.includes('Grand Route'),
    ) as HTMLAnchorElement;
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    f.detectChanges();

    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('onGroupMouseEnter should ignore items without children', () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();

    f.componentInstance.onGroupMouseEnter(SIMPLE_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 1, right: 2 }) },
    } as unknown as MouseEvent);

    expect(f.componentInstance.flyoutState()).toBeNull();
  });

  it('_openActiveGroup should open groups when a grandchild route matches', async () => {
    const DEEP_ACTIVE: NeuNavItem[] = [
      {
        id: 'parent',
        label: 'Padre',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'mid',
            label: 'Medio',
            icon: 'lucideChevronRight',
            children: [
              { id: 'grand', label: 'Nieto', icon: 'lucideChevronRight', route: '/grand' },
            ],
          },
          { id: 'child', label: 'Hijo', icon: 'lucideChevronRight', route: '/child' },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', DEEP_ACTIVE);
    f.detectChanges();
    await f.whenStable();
    // Manually call _openActiveGroup as afterNextRender doesn't run in unit tests
    // Simulate router url by overriding the private router and calling _openActiveGroup
    const comp = f.componentInstance as any;
    comp.router = { url: '/grand', events: { pipe: () => ({ subscribe: () => ({}) }) } };
    comp._openActiveGroup();
    expect(comp.isGroupOpen('parent')).toBe(true);
    expect(comp.isGroupOpen('mid')).toBe(true);
  });

  it('isCollapsed input change should update isCollapsed signal', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.isCollapsed()).toBe(false);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance.isCollapsed()).toBe(true);
  });

  it('isCurrentRoute returns true when router URL matches exactly', () => {
    // isCurrentRoute debe devolver true cuando la URL del router coincide exactamente
    // isCurrentRoute must return true when the router URL matches exactly
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    // Override router with mock URL
    comp['router'] = {
      url: '/components',
      events: { pipe: () => ({ subscribe: () => ({}) }) },
    };
    expect(comp.isCurrentRoute('/components')).toBe(true);
  });

  it('isCurrentRoute returns true when URL starts with route + query string', () => {
    // isCurrentRoute debe devolver true cuando la URL empieza con ruta + query string
    // isCurrentRoute must return true when URL starts with route + query string
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp['router'] = {
      url: '/docs?tab=api',
      events: { pipe: () => ({ subscribe: () => ({}) }) },
    };
    expect(comp.isCurrentRoute('/docs')).toBe(true);
  });

  it('isGroupActive returns true when a child route matches current URL', () => {
    // isGroupActive debe devolver true cuando la ruta de un hijo coincide con la URL actual
    // isGroupActive must return true when a child route matches the current URL
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp['router'] = {
      url: '/child1',
      events: { pipe: () => ({ subscribe: () => ({}) }) },
    };
    // GROUP_ITEMS[0] has a child with route '/child1'
    const result = comp.isGroupActive(GROUP_ITEMS[0]);
    expect(result).toBe(true);
  });

  // ── Badge on group children (L2, L3, flyout) ─────────────────────────────

  it('should render badge on L2 child when group is open and child has badge', async () => {
    // Debe renderizar badge en hijo L2 cuando el grupo está abierto y el hijo tiene badge
    // Must render badge on L2 child when group is open and child has badge property
    const BADGED_GROUP: NeuNavItem[] = [
      {
        id: 'bg',
        label: 'GrupoBadge',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'bc1',
            label: 'Con Badge',
            icon: 'lucideChevronRight',
            route: '/bc1',
            badge: '5',
          },
          { id: 'bc2', label: 'Sin Badge', icon: 'lucideChevronRight', route: '/bc2' },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', BADGED_GROUP);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.toggleGroup('bg');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('5');
  });

  it('should render badge on L3 grandchild when nested groups are open', async () => {
    // Debe renderizar badge en nieto L3 cuando los grupos anidados están abiertos
    // Must render badge on L3 grandchild when nested groups are open
    const BADGED_NESTED: NeuNavItem[] = [
      {
        id: 'bn-parent',
        label: 'PadreBadge',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'bn-sub',
            label: 'SubgrupoBadge',
            icon: 'lucideChevronRight',
            badge: '7',
            children: [
              {
                id: 'bn-grand',
                label: 'NietoBadge',
                icon: 'lucideChevronRight',
                route: '/grand',
                badge: '3',
              },
            ],
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', BADGED_NESTED);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.toggleGroup('bn-parent');
    f.componentInstance.toggleGroup('bn-sub');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('3');
    expect(f.nativeElement.textContent).toContain('7');
  });

  it('isGroupActive returns true when a grandchild route matches current URL', () => {
    // isGroupActive debe devolver true cuando la ruta de un nieto coincide con la URL
    // isGroupActive must return true when a grandchild route matches current URL
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    const comp = f.componentInstance as any;
    // Override the router URL to match a grandchild route
    comp['router'] = { url: '/grand1', events: { pipe: () => ({ subscribe: () => ({}) }) } };
    // NESTED_GROUP[0] (parent) has child[0] (subgrp) which has children with route '/grand1'
    const result = comp.isGroupActive(NESTED_GROUP[0]);
    expect(result).toBe(true);
  });

  it('isGroupActive should check c.children (grandchild) routes via some()', () => {
    // isGroupActive debe verificar las rutas de los hijos de segundo nivel (nietos)
    // isGroupActive must verify grandchild routes via some()
    const DEEP_ITEM: any = {
      id: 'deep',
      label: 'Deep',
      icon: 'lucideChevronRight',
      children: [
        {
          id: 'mid',
          label: 'Mid',
          icon: 'lucideChevronRight',
          children: [{ id: 'leaf', label: 'Leaf', icon: 'lucideChevronRight', route: '/target' }],
        },
      ],
    };
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', [DEEP_ITEM]);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp['router'] = { url: '/target', events: { pipe: () => ({ subscribe: () => ({}) }) } };
    expect(comp.isGroupActive(DEEP_ITEM)).toBe(true);
  });

  it('DOM mouseenter on nav group should trigger onGroupMouseEnter', async () => {
    // mouseenter DOM en un grupo de nav debe llamar a onGroupMouseEnter
    // DOM mouseenter on a nav group must call onGroupMouseEnter
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    const groupEl: HTMLElement = f.nativeElement.querySelector('.neu-nav__group');
    expect(groupEl).toBeTruthy();
    // Dispatch mouseenter — triggers the template event handler (covers template lambda at line 65)
    groupEl.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    f.detectChanges();
    // When collapsed=true and item has children, flyoutState should be set
    expect(f.componentInstance.flyoutState()).not.toBeNull();
  });

  it('should render badge on flyout item when collapsed and item has badge', async () => {
    // Debe renderizar badge en item del flyout cuando está colapsado y tiene badge
    // Must render badge on flyout item when nav is collapsed and item has badge
    const FLYOUT_WITH_BADGE: NeuNavItem[] = [
      {
        id: 'fbg',
        label: 'FlyoutBadge',
        icon: 'lucideChevronRight',
        children: [
          {
            id: 'fbc1',
            label: 'FlyoutItemBadge',
            icon: 'lucideChevronRight',
            route: '/fbc1',
            badge: '8',
          },
        ],
      },
    ];
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', FLYOUT_WITH_BADGE);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.onGroupMouseEnter(FLYOUT_WITH_BADGE[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    f.detectChanges();
    await f.whenStable();
    const flyoutEl = f.nativeElement.querySelector('.neu-nav__flyout');
    expect(flyoutEl).toBeTruthy();
    // El flyout renderiza el label del item (el badge no se muestra en el flyout template)
    // The flyout renders the item label (badge is not rendered in the flyout template)
    expect(f.nativeElement.textContent).toContain('FlyoutItemBadge');
  });

  it('onGroupMouseEnter when _flyoutTimer is already pending should clear it', () => {
    // onGroupMouseEnter debe cancelar el timer pendiente si ya existe
    // onGroupMouseEnter must cancel the existing timer before setting new flyout
    vi.useFakeTimers();
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    const comp = f.componentInstance;
    // Start a leave timer (_flyoutTimer becomes non-null)
    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 50, right: 80 }) },
    } as unknown as MouseEvent);
    comp.onGroupMouseLeave(); // sets _flyoutTimer
    expect((comp as any)._flyoutTimer).not.toBeNull();
    // Enter again with timer pending → clears timer (covers lines 558-559)
    comp.onGroupMouseEnter(GROUP_ITEMS[0], {
      currentTarget: { getBoundingClientRect: () => ({ top: 60, right: 90 }) },
    } as unknown as MouseEvent);
    // Timer should be cleared, flyout should be updated
    expect((comp as any)._flyoutTimer).toBeNull();
    expect(comp.flyoutState()?.top).toBe(60);
    vi.useRealTimers();
  });

  it('_openActiveGroup direct call opens group for matching child route', () => {
    // _openActiveGroup directo debe abrir el grupo cuando la ruta del hijo coincide
    // _openActiveGroup direct call must open the group when child route matches
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', GROUP_ITEMS);
    f.detectChanges();
    const comp = f.componentInstance as any;
    // Simulate router URL matching child route
    comp['router'] = {
      url: '/child1',
      events: { pipe: () => ({ subscribe: () => ({}) }) },
    };
    // Call private method directly (covers line 587)
    comp['_openActiveGroup']();
    expect(comp.isGroupOpen('grp')).toBe(true);
  });

  it('_openActiveGroup direct call opens parent group for matching grandchild route', () => {
    // _openActiveGroup debe abrir el grupo padre cuando la ruta del nieto coincide
    // _openActiveGroup must open the parent group when grandchild route matches
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', NESTED_GROUP);
    f.detectChanges();
    const comp = f.componentInstance as any;
    comp['router'] = {
      url: '/grand1',
      events: { pipe: () => ({ subscribe: () => ({}) }) },
    };
    comp['_openActiveGroup']();
    expect(comp.isGroupOpen('parent')).toBe(true);
    expect(comp.isGroupOpen('subgrp')).toBe(true);
  });

  it('isCurrentRoute should react to a real router navigation event', async () => {
    const f = TestBed.createComponent(NeuNavComponent);
    f.componentRef.setInput('items', SIMPLE_ITEMS);
    f.detectChanges();
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: 'docs', component: DummyRouteComponent }]);

    await router.navigateByUrl('/docs?tab=api');
    f.detectChanges();

    expect(f.componentInstance.isCurrentRoute('/docs')).toBe(true);
  });
});
