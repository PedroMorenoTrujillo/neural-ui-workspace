import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuCloseRequest } from '@neural-ui/core/foundation';
import { NeuSidebarComponent } from './neu-sidebar.component';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

// ── Host Component ─────────────────────────────────────────────────────────────

@Component({
  template: `
    <neu-sidebar
      [open]="open()"
      [persistent]="persistent"
      [side]="side"
      [hideHeader]="hideHeader"
      [ariaLabel]="ariaLabel"
      (closeRequested)="closeRequests.push($event)"
      (opened)="openedCount = openedCount + 1"
      (closed)="closedCount = closedCount + 1"
    >
      <span neu-sidebar-header>Mi App</span>
      <p>Contenido del sidebar</p>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class HostComponent {
  readonly open = signal(false);
  persistent = false;
  side: 'left' | 'right' = 'left';
  hideHeader = false;
  ariaLabel = 'Menú de navegación';
  closeRequests: NeuCloseRequest[] = [];
  openedCount = 0;
  closedCount = 0;
}

@Component({
  template: `
    <neu-sidebar [open]="open()">
      <span neu-sidebar-header>Menu</span>
      <button class="inside-action" type="button">Action</button>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class FocusHostComponent {
  readonly open = signal(false);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('NeuSidebarComponent', () => {
  let originalHtmlOverflow: string;
  let originalBodyOverflow: string;

  beforeEach(async () => {
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    document
      .querySelectorAll('[data-sidebar-focus-trigger]')
      .forEach((element) => element.remove());
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
  });

  // ── Rendering básico ───────────────────────────────────────────────────────

  it('should render sidebar element', () => {
    const f = TestBed.createComponent(HostComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('neu-sidebar')).toBeTruthy();
  });

  it('should render aside element', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('aside.neu-sidebar')).toBeTruthy();
  });

  // ── Modo persistente ──────────────────────────────────────────────────────

  it('should always be open (neu-sidebar--open) when persistent=true', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();
  });

  it('should apply neu-sidebar--persistent class when persistent=true', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--persistent')).toBeTruthy();
  });

  it('should not render aria-modal in persistent navigation mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();

    const aside = f.nativeElement.querySelector('aside.neu-sidebar');
    expect(aside.getAttribute('role')).toBe('navigation');
    expect(aside.hasAttribute('aria-modal')).toBe(false);
  });

  it('should show projected content when persistent', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Contenido del sidebar');
  });

  it('should NOT show overlay div in persistent mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__overlay')).toBeFalsy();
  });

  it('should NOT show close button in persistent mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__close')).toBeFalsy();
  });

  // ── Modo overlay (no persistente) ─────────────────────────────────────────

  it('should NOT have neu-sidebar--open class when applied open is false', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeFalsy();
  });

  it('should have neu-sidebar--open class when applied open is true', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();
  });

  it('should render aria-modal when opened as an overlay dialog', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();

    const aside = f.nativeElement.querySelector('aside.neu-sidebar');
    expect(aside.getAttribute('role')).toBe('dialog');
    expect(aside.getAttribute('aria-modal')).toBe('true');
  });

  it('should show overlay div in non-persistent mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__overlay')).toBeTruthy();
  });

  it('overlay div should have visible class when sidebar is open', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__overlay--visible')).toBeTruthy();
  });

  it('should lock document scroll when overlay sidebar is open', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore document scroll when overlay sidebar closes', async () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();

    f.componentInstance.open.set(false);
    f.detectChanges();
    await f.whenStable();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('should not lock document scroll in persistent mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = true;
    f.detectChanges();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('should show close button in overlay mode when open', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__close')).toBeTruthy();
  });

  // ── Posición ──────────────────────────────────────────────────────────────

  it('should apply neu-sidebar--right class when side="right"', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.componentInstance.side = 'right';
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--right')).toBeTruthy();
  });

  it('should NOT apply neu-sidebar--right when side="left"', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.componentInstance.side = 'left';
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--right')).toBeFalsy();
  });

  // ── Cabecera ──────────────────────────────────────────────────────────────

  it('should show header by default', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__header')).toBeTruthy();
  });

  it('should NOT show header when hideHeader=true', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.componentInstance.hideHeader = true;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__header')).toBeFalsy();
  });

  // ── Accesibilidad ─────────────────────────────────────────────────────────

  it('should set aria-label on the aside element', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.ariaLabel = 'Mi menú custom';
    f.detectChanges();
    const aside: HTMLElement = f.nativeElement.querySelector('aside.neu-sidebar');
    expect(aside?.getAttribute('aria-label')).toBe('Mi menú custom');
  });

  it('aside should have role="navigation"', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="navigation"]')).toBeTruthy();
  });

  // ── Controlled close intents ──────────────────────────────────────────────

  it('clicking the overlay emits one outside intent without changing applied open', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();
    f.nativeElement.querySelector('.neu-sidebar__overlay')?.click();
    f.detectChanges();
    expect(f.componentInstance.closeRequests).toHaveLength(1);
    expect(f.componentInstance.closeRequests[0]?.reason).toBe('outside');
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();
  });

  it('clicking close button in overlay mode should emit closeRequested on host', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.open.set(true);
    f.componentInstance.persistent = false;
    f.detectChanges();
    f.nativeElement.querySelector('.neu-sidebar__close')?.click();
    f.detectChanges();
    expect(f.componentInstance.closeRequests).toHaveLength(1);
    expect(f.componentInstance.closeRequests[0]?.reason).toBe('action');
    expect(f.componentInstance.closedCount).toBe(0);
  });

  // ── isOpen computed ───────────────────────────────────────────────────────

  it('isOpen() should return true when persistent=true', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', true);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(true);
  });

  it('isOpen() should return false when not persistent and applied open is false', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(false);
  });

  it('isOpen() should return true when not persistent and applied open is true', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(true);
  });

  it('applies reconstructed parent writes without emitting close intent', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.detectChanges();
    const requests = vi.fn();
    f.componentInstance.closeRequested.subscribe(requests);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(true);
    expect(requests).not.toHaveBeenCalled();
  });

  // ── Collapsed mode ────────────────────────────────────────────────────────

  it('should apply neu-sidebar--collapsed class when collapsed=true', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--collapsed')).toBeTruthy();
  });

  it('should NOT apply neu-sidebar--collapsed class when collapsed=false', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--collapsed')).toBeFalsy();
  });

  // ── Drawer mode a11y (role="dialog" + aria-modal) ────────────────────────

  it('should have role="dialog" and aria-modal="true" in drawer mode (non-persistent)', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.detectChanges();
    const aside = f.nativeElement.querySelector('aside.neu-sidebar');
    expect(aside?.getAttribute('role')).toBe('dialog');
    expect(aside?.getAttribute('aria-modal')).toBe('true');
  });

  it('should have role="navigation" in persistent mode', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', true);
    f.detectChanges();
    const aside = f.nativeElement.querySelector('aside.neu-sidebar');
    expect(aside?.getAttribute('role')).toBe('navigation');
    expect(aside?.hasAttribute('aria-modal')).toBe(false);
  });

  // ── Focus management ──────────────────────────────────────────────────────

  function createFocusTrigger(): HTMLButtonElement {
    const trigger = document.createElement('button');
    trigger.dataset['sidebarFocusTrigger'] = '';
    document.body.append(trigger);
    trigger.focus();
    return trigger;
  }

  it('restores focus once after a normal close', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');
    focus.mockClear();
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    vi.runOnlyPendingTimers();

    f.componentInstance.open.set(false);
    f.detectChanges();
    vi.runOnlyPendingTimers();

    expect(document.activeElement).toBe(trigger);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(f.componentInstance).toBeTruthy();
  });

  it('does not restore focus after destruction', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');
    focus.mockClear();
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    const sidebar = f.debugElement.children[0].componentInstance as NeuSidebarComponent;
    vi.runOnlyPendingTimers();

    f.componentInstance.open.set(false);
    f.detectChanges();
    f.destroy();
    vi.runAllTimers();

    expect(focus).not.toHaveBeenCalled();
    expect(sidebar['pendingFocusTimer']).toBeNull();
    expect(sidebar['previousActiveElement']).toBeNull();
  });

  it('rejects a restoration target detached before the callback', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');
    focus.mockClear();
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    vi.runOnlyPendingTimers();

    f.componentInstance.open.set(false);
    f.detectChanges();
    trigger.remove();
    vi.runOnlyPendingTimers();

    expect(trigger.isConnected).toBe(false);
    expect(focus).not.toHaveBeenCalled();
    expect(f.debugElement.children[0].componentInstance['pendingFocusTimer']).toBeNull();
    expect(f.debugElement.children[0].componentInstance['previousActiveElement']).toBeNull();
  });

  it('replaces pending focus work across close-reopen-close', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');
    focus.mockClear();
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    vi.runOnlyPendingTimers();

    f.componentInstance.open.set(false);
    f.detectChanges();
    f.componentInstance.open.set(true);
    f.detectChanges();
    vi.runOnlyPendingTimers();
    expect(focus).not.toHaveBeenCalled();

    f.componentInstance.open.set(false);
    f.detectChanges();
    vi.runOnlyPendingTimers();
    vi.runAllTimers();

    expect(document.activeElement).toBe(trigger);
    expect(focus).toHaveBeenCalledTimes(1);
    expect(f.debugElement.children[0].componentInstance['pendingFocusTimer']).toBeNull();
  });

  it('is safe to destroy after focus restoration completed', () => {
    vi.useFakeTimers();
    const trigger = createFocusTrigger();
    const focus = vi.spyOn(trigger, 'focus');
    focus.mockClear();
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    vi.runOnlyPendingTimers();

    f.componentInstance.open.set(false);
    f.detectChanges();
    vi.runOnlyPendingTimers();
    f.destroy();
    vi.runAllTimers();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('collapsedChange emits and applies an uncontrolled collapse gesture', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    let emittedValue: boolean | null = null;
    f.componentInstance.collapsedChange.subscribe((value) => {
      emittedValue = value;
    });
    f.componentInstance.toggleCollapsed();
    expect(emittedValue).toBe(true);
    expect(f.componentInstance.effectiveCollapsed()).toBe(true);
  });

  it('keeps controlled collapse applied until the parent accepts', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    const changes: boolean[] = [];
    f.componentInstance.collapsedChange.subscribe((value) => changes.push(value));
    f.componentInstance.toggleCollapsed();
    f.detectChanges();
    expect(changes).toEqual([true]);
    expect(f.componentInstance.effectiveCollapsed()).toBe(false);
    expect(f.nativeElement.querySelector('aside').classList).not.toContain(
      'neu-sidebar--collapsed',
    );
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    expect(f.componentInstance.effectiveCollapsed()).toBe(true);
    expect(changes).toEqual([true]);
  });

  it('reads initialCollapsed once and diagnoses lifetime mode switching once', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('initialCollapsed', true);
    f.detectChanges();
    expect(f.componentInstance.effectiveCollapsed()).toBe(true);
    f.componentRef.setInput('initialCollapsed', false);
    f.detectChanges();
    expect(f.componentInstance.effectiveCollapsed()).toBe(true);
    f.componentRef.setInput('collapsed', false);
    f.detectChanges();
    expect(f.componentInstance.effectiveCollapsed()).toBe(true);
    expect(warning).toHaveBeenCalledOnce();
    f.componentRef.setInput('collapsed', true);
    f.detectChanges();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('exposes inert semantics while closed and removes URL-owned API', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    const aside = f.nativeElement.querySelector('aside.neu-sidebar') as HTMLElement;
    expect(aside.getAttribute('aria-hidden')).toBe('true');
    expect(aside.getAttribute('inert')).toBe('');
    expect('urlParam' in f.componentInstance).toBe(false);
    expect(typeof f.componentInstance.open).toBe('function');
    expect('set' in f.componentInstance.open).toBe(false);
    expect('close' in f.componentInstance).toBe(false);
  });

  it('traps Tab navigation and handles Escape only when enabled in drawer mode', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    const requests = vi.fn();
    f.componentInstance.closeRequested.subscribe(requests);
    const closeButton = f.nativeElement.querySelector('.neu-sidebar__close') as HTMLButtonElement;
    closeButton.focus();
    const forward = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const preventForward = vi.spyOn(forward, 'preventDefault');
    closeButton.dispatchEvent(forward);
    expect(preventForward).toHaveBeenCalled();
    expect(document.activeElement).toBe(closeButton);

    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventBackward = vi.spyOn(backward, 'preventDefault');
    closeButton.dispatchEvent(backward);
    expect(preventBackward).toHaveBeenCalled();

    const escape = new KeyboardEvent('keydown', { key: 'Escape' });
    const preventEscape = vi.spyOn(escape, 'preventDefault');
    f.componentInstance['onKeyDown'](escape);
    expect(preventEscape).toHaveBeenCalled();
    expect(requests).toHaveBeenCalledOnce();
    expect(requests.mock.calls[0]?.[0].reason).toBe('escape');
  });

  it('does not close with Escape when disabled or operating as persistent navigation', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('open', true);
    f.componentRef.setInput('closeOnEscape', false);
    f.detectChanges();
    const requests = vi.fn();
    f.componentInstance.closeRequested.subscribe(requests);
    f.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(requests).not.toHaveBeenCalled();

    f.componentRef.setInput('persistent', true);
    f.componentRef.setInput('closeOnEscape', true);
    f.detectChanges();
    f.componentInstance['onKeyDown'](new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(requests).not.toHaveBeenCalled();
  });

  it('keeps scroll locked until every overlay sidebar is closed', () => {
    const first = TestBed.createComponent(NeuSidebarComponent);
    const second = TestBed.createComponent(NeuSidebarComponent);
    first.componentRef.setInput('open', true);
    second.componentRef.setInput('open', true);
    first.detectChanges();
    second.detectChanges();

    expect(document.body.style.overflow).toBe('hidden');

    first.destroy();
    expect(document.body.style.overflow).toBe('hidden');

    second.destroy();
    expect(document.body.style.overflow).toBe('');
  });

  it('handles host keydown before the aside is rendered without focusable elements', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('open', true);
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    f.componentInstance['onKeyDown'](event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('uses the document HostListener for Escape even before focus enters the drawer', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    const requests = vi.fn();
    f.componentInstance.closeRequested.subscribe(requests);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
    expect(requests).toHaveBeenCalledOnce();
  });

  it('does not cycle focus when tabbing inside the focusable range', () => {
    const f = TestBed.createComponent(FocusHostComponent);
    f.componentInstance.open.set(true);
    f.detectChanges();
    const closeButton = f.nativeElement.querySelector('.neu-sidebar__close') as HTMLButtonElement;
    const action = f.nativeElement.querySelector('.inside-action') as HTMLButtonElement;
    closeButton.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventForward = vi.spyOn(forward, 'preventDefault');
    const backward = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const preventBackward = vi.spyOn(backward, 'preventDefault');

    closeButton.dispatchEvent(forward);
    action.focus();
    action.dispatchEvent(backward);

    expect(preventForward).not.toHaveBeenCalled();
    expect(preventBackward).not.toHaveBeenCalled();
  });
});
