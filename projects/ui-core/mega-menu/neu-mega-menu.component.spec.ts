import { Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  NeuMegaMenuComponent,
  NeuMegaMenuEndDirective,
  NeuMegaMenuItemDirective,
  NeuMegaMenuStartDirective,
  type NeuMegaMenuItem,
  type NeuMegaMenuLeaf,
} from './neu-mega-menu.component';

function compileOnlyBoundedContract(): void {
  const valid: NeuMegaMenuItem = { key: 'home', label: 'Home', kind: 'link', url: '/' };
  // @ts-expect-error Legacy recursive items are not a MegaMenu root contract.
  const recursive: NeuMegaMenuItem = { key: 'legacy', label: 'Legacy', items: [] };
  // @ts-expect-error A panel trigger cannot also navigate.
  const dualRoot: NeuMegaMenuItem = { key: 'mixed', label: 'Mixed', kind: 'panel', panel: { columns: [] }, url: '/mixed' };
  // @ts-expect-error A command leaf cannot also navigate.
  const dualLeaf: NeuMegaMenuLeaf = { key: 'mixed', label: 'Mixed', kind: 'command', command: () => {}, url: '/mixed' };
  void [valid, recursive, dualRoot, dualLeaf];
}
void compileOnlyBoundedContract;

const items: readonly NeuMegaMenuItem[] = [
  {
    key: 'products', label: 'Products', kind: 'panel',
    panel: { columns: [
      { key: 'platform-column', groups: [
        { key: 'platform', label: 'Platform', items: [
          { key: 'api', label: 'API', kind: 'link', routerLink: ['/api'] },
          { key: 'off', label: 'Off', kind: 'link', url: '/off', disabled: true },
        ] },
      ] },
      { key: 'resources-column', groups: [
        { key: 'resources', label: 'Resources', items: [
          { key: 'docs', label: 'Docs', kind: 'link', url: 'https://example.test', active: true },
        ] },
      ] },
    ] },
  },
  { key: 'pricing', label: 'Pricing', kind: 'link', routerLink: ['/pricing'] },
];

@Component({
  imports: [NeuMegaMenuComponent, NeuMegaMenuItemDirective, NeuMegaMenuStartDirective, NeuMegaMenuEndDirective],
  template: `<neu-mega-menu [items]="items" ariaLabel="Company" orientation="vertical">
    <ng-template neuMegaMenuStart><strong class="start">Neural</strong></ng-template>
    <ng-template neuMegaMenuItem let-item let-level="level">
      <span class="custom" [attr.data-level]="level">{{ item.label }}</span>
    </ng-template>
    <ng-template neuMegaMenuEnd><span class="end">Account</span></ng-template>
  </neu-mega-menu>`,
})
class MegaHost {
  items = items;
}

describe('NeuMegaMenuComponent — C3 navigation-first contract', () => {
  const fixtures: ComponentFixture<unknown>[] = [];
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }).compileComponents());
  afterEach(() => {
    for (const fixture of fixtures) fixture.destroy();
    fixtures.length = 0;
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => node.replaceChildren());
    vi.restoreAllMocks();
  });

  function create(data: readonly NeuMegaMenuItem[] = items): ComponentFixture<NeuMegaMenuComponent> {
    const fixture = TestBed.createComponent(NeuMegaMenuComponent);
    fixtures.push(fixture);
    fixture.componentRef.setInput('items', data);
    fixture.detectChanges();
    return fixture;
  }

  function rootButtons(fixture: ComponentFixture<NeuMegaMenuComponent>): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.neu-mega-menu__root-action[type="button"]'));
  }

  async function open(fixture: ComponentFixture<NeuMegaMenuComponent>, index = 0): Promise<HTMLElement> {
    rootButtons(fixture)[index].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const panel = document.querySelector('.cdk-overlay-container .neu-mega-menu__panel') as HTMLElement | null;
    expect(panel).not.toBeNull();
    return panel!;
  }

  it('renders native navigation roots without application-menu roles', () => {
    const fixture = create();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav).toBeTruthy();
    expect(nav.querySelector('[role="menubar"], [role="menu"], [role="menuitem"]')).toBeNull();
    expect(nav.querySelector('a[href="/pricing"]')).toBeTruthy();
    expect(nav.querySelector('.neu-mega-menu__panel')).toBeNull();
    expect(nav.querySelector('button[aria-expanded="false"]')).toBeTruthy();
    expect(nav.querySelector('a[aria-expanded]')).toBeNull();
  });

  it('mounts only the active grouped panel in a CDK overlay', async () => {
    const fixture = create();
    const panel = await open(fixture);
    expect(panel.querySelectorAll('.neu-mega-menu__column')).toHaveLength(2);
    expect(panel.querySelectorAll('section')).toHaveLength(2);
    expect(Array.from(panel.querySelectorAll('h2')).map((node) => node.textContent)).toEqual(['Platform', 'Resources']);
    expect(panel.querySelector('a[href="/api"]')).toBeTruthy();
    expect(panel.querySelector('a[href="https://example.test"]')).toBeTruthy();
    expect(panel.querySelector('[role="grid"], [role="menu"], [role="menuitem"]')).toBeNull();
    expect(rootButtons(fixture)[0].getAttribute('aria-controls')).toBe(panel.id);
  });

  it('keeps current, open and focus independent', async () => {
    const fixture = create();
    const root = rootButtons(fixture)[0];
    root.focus();
    const panel = await open(fixture);
    expect(document.activeElement).toBe(root);
    expect(root.classList.contains('neu-mega-menu__root-action--active')).toBe(false);
    expect(panel.querySelector('[aria-current="page"]')?.textContent).toContain('Docs');
    expect(panel.querySelector('a[href="/api"]')?.hasAttribute('aria-current')).toBe(false);
    const next = [{ ...items[0], active: true }, items[1]] as readonly NeuMegaMenuItem[];
    fixture.componentRef.setInput('items', next);
    fixture.detectChanges();
    expect(root.classList.contains('neu-mega-menu__root-action--active')).toBe(true);
    expect(root.getAttribute('aria-expanded')).toBe('true');
  });

  it('Tab from the open root enters native panel content; Escape restores trigger focus', async () => {
    const fixture = create();
    const trigger = rootButtons(fixture)[0];
    trigger.focus();
    const panel = await open(fixture);
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(panel.querySelector('a[href="/api"]'));
    expect(panel.querySelector('a[href="/api"]')?.hasAttribute('tabindex')).toBe(false);
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps a panel open for internal pointer actions and dismisses it outside', async () => {
    const fixture = create();
    const trigger = rootButtons(fixture)[0];
    const panel = await open(fixture);

    panel.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.cdk-overlay-container .neu-mega-menu__panel')).toBeNull();
  });

  it('hover cannot open a closed panel, but switches an open panel without focus theft', async () => {
    const second: NeuMegaMenuItem = {
      key: 'company', label: 'Company', kind: 'panel',
      panel: { columns: [{ key: 'main', groups: [{ key: 'about', items: [
        { key: 'about-link', label: 'About', kind: 'link', url: '/about' },
      ] }] }] },
    };
    const fixture = create([items[0], second]);
    const [first, other] = rootButtons(fixture);
    other.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-container .neu-mega-menu__panel')).toBeNull();
    first.focus();
    await open(fixture);
    other.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(other.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(first);
    expect(document.querySelectorAll('.cdk-overlay-container .neu-mega-menu__panel')).toHaveLength(1);
  });

  it('runs command leaves exactly once and reports actual activations only', async () => {
    const command = vi.fn();
    const rootCommand = vi.fn();
    const fixture = create([
      { key: 'utility', label: 'Utility', kind: 'command', command: rootCommand },
      { key: 'panel', label: 'Panel', kind: 'panel', panel: { columns: [
        { key: 'c', groups: [{ key: 'g', items: [
          { key: 'run', label: 'Run', kind: 'command', command },
        ] }] },
      ] } },
    ]);
    const emitted = vi.spyOn(fixture.componentInstance.itemClick, 'emit');
    rootButtons(fixture)[0].click();
    expect(rootCommand).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledTimes(1);
    const panel = await open(fixture, 1);
    expect(emitted).toHaveBeenCalledTimes(1);
    (panel.querySelector('button') as HTMLButtonElement).click();
    expect(command).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledTimes(2);
  });

  it('renders disabled destinations as non-interactive presentation', async () => {
    const fixture = create();
    const panel = await open(fixture);
    expect(panel.querySelector('a[href="/off"]')).toBeNull();
    expect(panel.querySelector('[aria-disabled="true"]')?.textContent).toContain('Off');
    const root = create([{ key: 'off', label: 'Off', kind: 'link', url: '/off', disabled: true }]);
    expect(root.nativeElement.querySelector('a')).toBeNull();
    expect(root.nativeElement.querySelector('[aria-disabled="true"]')).toBeTruthy();
  });

  it('fails closed for dual-kind root input and diagnoses it once', async () => {
    const command = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const malformed = {
      key: 'mixed', label: 'Mixed', kind: 'panel', url: '/wrong', command,
      panel: { columns: [{ key: 'c', groups: [{ key: 'g', items: [
        { key: 'safe', label: 'Safe', kind: 'link', url: '/safe' },
      ] }] }] },
    } as unknown as NeuMegaMenuItem;
    const fixture = create([malformed]);
    await open(fixture);
    fixture.detectChanges();
    expect(command).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('a[href="/wrong"]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('fails closed for duplicate sibling keys and conflicting leaf actions', async () => {
    const command = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const data: NeuMegaMenuItem[] = [
      { key: 'duplicate', label: 'First', kind: 'command', command },
      { key: 'duplicate', label: 'Second', kind: 'command', command },
      { key: 'panel', label: 'Panel', kind: 'panel', panel: { columns: [
        { key: 'c', groups: [{ key: 'g', items: [
          { key: 'mixed', label: 'Mixed', kind: 'command', command, url: '/wrong' } as unknown as NeuMegaMenuItem & never,
        ] }] },
      ] } },
    ];
    const fixture = create(data);
    expect(fixture.nativeElement.querySelectorAll('.neu-mega-menu__root-action[type="button"]')).toHaveLength(1);
    const panel = await open(fixture);
    expect(panel.querySelector('button')).toBeNull();
    expect(panel.querySelector('a[href="/wrong"]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    expect(command).not.toHaveBeenCalled();
  });

  it('preserves custom visual templates, slots and vertical structure', () => {
    const fixture = TestBed.createComponent(MegaHost);
    fixtures.push(fixture);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.start').textContent).toBe('Neural');
    expect(fixture.nativeElement.querySelector('.end').textContent).toBe('Account');
    expect(fixture.nativeElement.querySelector('nav').getAttribute('aria-label')).toBe('Company');
    expect(fixture.nativeElement.querySelector('neu-mega-menu').classList.contains('neu-mega-menu--vertical')).toBe(true);
    expect(fixture.nativeElement.querySelector('.custom[data-level="0"]')).toBeTruthy();
  });

  it('keeps only one panel when applied roots are reconstructed or removed', async () => {
    const fixture = create();
    await open(fixture);
    fixture.componentRef.setInput('items', items.map((item) => ({ ...item })));
    fixture.detectChanges();
    expect(document.querySelectorAll('.cdk-overlay-container .neu-mega-menu__panel')).toHaveLength(1);
    fixture.componentRef.setInput('items', [items[1]]);
    fixture.detectChanges();
    expect(document.querySelector('.cdk-overlay-container .neu-mega-menu__panel')).toBeNull();
  });

  it('does not retain overlay resources across 50 create/destroy cycles', async () => {
    for (let index = 0; index < 50; index++) {
      const fixture = create();
      await open(fixture);
      fixture.destroy();
      fixtures.pop();
    }
    expect(document.querySelectorAll('.cdk-overlay-container .neu-mega-menu__panel')).toHaveLength(0);
  });
});
