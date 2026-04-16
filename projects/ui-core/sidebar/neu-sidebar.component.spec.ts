import { Component, Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuSidebarComponent } from './neu-sidebar.component';
import { NeuUrlStateService } from '../url-state/neu-url-state.service';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

// ── Mock de NeuUrlStateService ────────────────────────────────────────────────
// Signal controlable que simula el estado del parámetro de URL / Controllable signal simulating the URL param state

let _menuParam: ReturnType<typeof signal<string | null>>;
let _mockSetParam: ReturnType<typeof vi.fn>;

function createMockUrlState() {
  _menuParam = signal<string | null>(null);
  _mockSetParam = vi.fn();
  return {
    params: signal<Record<string, string>>({}),
    getParam: (_key: string): Signal<string | null> => _menuParam,
    setParam: _mockSetParam,
    patchParams: vi.fn(),
    clearParams: vi.fn(),
  };
}

// ── Host Component ─────────────────────────────────────────────────────────────

@Component({
  template: `
    <neu-sidebar
      [persistent]="persistent"
      [side]="side"
      [hideHeader]="hideHeader"
      [ariaLabel]="ariaLabel"
      (closeRequested)="closedCount = closedCount + 1"
    >
      <span neu-sidebar-header>Mi App</span>
      <p>Contenido del sidebar</p>
    </neu-sidebar>
  `,
  imports: [NeuSidebarComponent],
})
class HostComponent {
  persistent = false;
  side: 'left' | 'right' = 'left';
  hideHeader = false;
  ariaLabel = 'Menú de navegación';
  closedCount = 0;
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('NeuSidebarComponent', () => {
  let mockUrlState: ReturnType<typeof createMockUrlState>;
  let originalHtmlOverflow: string;
  let originalBodyOverflow: string;

  beforeEach(async () => {
    mockUrlState = createMockUrlState();
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: NeuUrlStateService, useValue: mockUrlState },
        provideIcons({ lucideX }),
      ],
    }).compileComponents();
  });

  afterEach(() => {
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

  it('should NOT have neu-sidebar--open class when not persistent and URL param is null', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeFalsy();
  });

  it('should have neu-sidebar--open class when URL param is "open"', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();
  });

  it('should show overlay div in non-persistent mode', () => {
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__overlay')).toBeTruthy();
  });

  it('overlay div should have visible class when sidebar is open', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-sidebar__overlay--visible')).toBeTruthy();
  });

  it('should lock document scroll when overlay sidebar is open', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();

    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore document scroll when overlay sidebar closes', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();

    _menuParam.set(null);
    f.detectChanges();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('should not lock document scroll in persistent mode', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = true;
    f.detectChanges();

    expect(document.documentElement.style.overflow).toBe('');
    expect(document.body.style.overflow).toBe('');
  });

  it('should show close button in overlay mode when open', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
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
    f.detectChanges();
    expect(f.nativeElement.querySelector('[role="navigation"]')).toBeTruthy();
  });

  // ── close() ───────────────────────────────────────────────────────────────

  it('close() should call urlState.setParam with null', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    f.componentInstance.close();
    expect(_mockSetParam).toHaveBeenCalledWith('menu', null, true);
  });

  it('close() should emit closeRequested', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    let emitted = false;
    f.componentInstance.closeRequested.subscribe(() => {
      emitted = true;
    });
    f.componentInstance.close();
    expect(emitted).toBe(true);
  });

  // ── open() ────────────────────────────────────────────────────────────────

  it('open() should call urlState.setParam with "open" and replaceUrl=false', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    f.componentInstance.open();
    expect(_mockSetParam).toHaveBeenCalledWith('menu', 'open', false);
  });

  it('open(true) should call urlState.setParam with replaceUrl=true', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.detectChanges();
    f.componentInstance.open(true);
    expect(_mockSetParam).toHaveBeenCalledWith('menu', 'open', true);
  });

  // ── Overlay click cierra ──────────────────────────────────────────────────

  it('clicking the overlay should call close()', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    f.nativeElement.querySelector('.neu-sidebar__overlay')?.click();
    f.detectChanges();
    expect(_mockSetParam).toHaveBeenCalledWith('menu', null, true);
  });

  it('clicking close button in overlay mode should emit closeRequested on host', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(HostComponent);
    f.componentInstance.persistent = false;
    f.detectChanges();
    f.nativeElement.querySelector('.neu-sidebar__close')?.click();
    f.detectChanges();
    expect(f.componentInstance.closedCount).toBe(1);
  });

  // ── isOpen computed ───────────────────────────────────────────────────────

  it('isOpen() should return true when persistent=true', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', true);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(true);
  });

  it('isOpen() should return false when not persistent and URL param is null', () => {
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(false);
  });

  it('isOpen() should return true when not persistent and URL param is "open"', () => {
    _menuParam.set('open');
    const f = TestBed.createComponent(NeuSidebarComponent);
    f.componentRef.setInput('persistent', false);
    f.detectChanges();
    expect(f.componentInstance.isOpen()).toBe(true);
  });
});
