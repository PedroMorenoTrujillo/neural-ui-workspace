import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogModule } from '@angular/cdk/dialog';
import { NeuDialogComponent } from './neu-modal.component';
import { NeuDialogService } from './neu-dialog.service';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconX } from '@neural-icons/core/icons/x';
import { provideNeuOverlayDismissGuard } from '@neural-ui/core/foundation';

// ── Hosts ─────────────────────────────────────────────────────────────────────

@Component({
  template: `<neu-dialog [open]="true" title="Confirmar acción"
    ><p>Contenido del diálogo</p></neu-dialog
  >`,
  standalone: true,
  imports: [NeuDialogComponent],
})
class OpenHostComponent {}

@Component({ template: '<p>Servicio</p>' })
class FakeContentComponent {}

@Component({
  template: `
    <neu-dialog [open]="true" [disableClose]="true" title="Focusable test">
      <button type="button" aria-hidden="true">Oculto</button>
      <button type="button" class="visible-action">Visible</button>
      <a href="#" class="visible-link">Link</a>
    </neu-dialog>
  `,
  standalone: true,
  imports: [NeuDialogComponent],
})
class FocusableHostComponent {}

@Component({
  template: `
    <neu-dialog [open]="true" [disableClose]="true" title="No focusable test">
      <p>Solo texto</p>
    </neu-dialog>
  `,
  standalone: true,
  imports: [NeuDialogComponent],
})
class NoFocusableHostComponent {}

// ── Helper ────────────────────────────────────────────────────────────────────

/** Crea y configura un NeuDialogComponent con open=true / Creates and configures NeuDialogComponent with open=true */
async function mkDialog(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [OpenHostComponent, DialogModule, FakeContentComponent],
    providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
  }).compileComponents();
  const f = TestBed.createComponent(NeuDialogComponent);
  f.componentRef.setInput('open', true);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  await f.whenStable();
  return { f, comp: f.componentInstance };
}

// ── NeuDialogComponent ────────────────────────────────────────────────────────

describe('NeuDialogComponent', () => {
  it('uses the consuming application close label without changing the default', async () => {
    const { f } = await mkDialog({ closeLabel: 'Cerrar diálogo' });
    expect(f.nativeElement.querySelector('.neu-dialog__close').getAttribute('aria-label')).toBe(
      'Cerrar diálogo',
    );
  });
  it('keeps the dialog frame aligned with a keyboard-sized visual viewport', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'visualViewport');
    const viewport = Object.assign(new EventTarget(), {
      width: 390,
      height: 844,
      offsetTop: 0,
      offsetLeft: 0,
    });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
    try {
      const { f } = await mkDialog();
      const frame = f.nativeElement.querySelector('.neu-dialog__visual-viewport') as HTMLElement;
      expect(frame.style.height).toBe('844px');
      viewport.height = 350;
      viewport.offsetTop = 160;
      viewport.dispatchEvent(new Event('resize'));
      f.detectChanges();
      await f.whenStable();
      expect(frame.style.height).toBe('350px');
      expect(frame.style.inset).toBe('160px auto auto 0px');
      expect(frame.style.width).toBe('390px');
      viewport.height = 180;
      viewport.dispatchEvent(new Event('resize'));
      f.detectChanges();
      await f.whenStable();
      expect(frame.style.height).toBe('180px');
      viewport.height = 844;
      viewport.dispatchEvent(new Event('resize'));
      f.detectChanges();
      await f.whenStable();
      expect(frame.style.height).toBe('844px');
    } finally {
      if (original) Object.defineProperty(window, 'visualViewport', original);
      else Reflect.deleteProperty(window, 'visualViewport');
    }
  });
  // ── Rendering básico ───────────────────────────────────────────────────────

  it('should not render panel when open=false', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideNeuralIcons(iconX)],
    }).compileComponents();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', false);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-dialog__panel')).toBeFalsy();
  });

  it('should render panel when open=true', async () => {
    const { f } = await mkDialog({ title: 'Test' });
    expect(f.nativeElement.querySelector('.neu-dialog__panel')).toBeTruthy();
  });

  it('should render title when open', async () => {
    const { f } = await mkDialog({ title: 'Confirmar acción' });
    expect(f.nativeElement.textContent).toContain('Confirmar acción');
  });

  it('should render projected content when open', async () => {
    await TestBed.configureTestingModule({
      imports: [OpenHostComponent, DialogModule],
      providers: [provideNeuralIcons(iconX)],
    }).compileComponents();
    const df = TestBed.createComponent(OpenHostComponent);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Contenido del diálogo');
  });

  // ── Cierre con botón ───────────────────────────────────────────────────────

  it('should emit an action close request when close button is clicked', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let requestReason = '';
    comp.closeRequested.subscribe((request) => {
      requestReason = request.reason;
    });
    f.nativeElement.querySelector('.neu-dialog__close')?.click();
    expect(requestReason).toBe('action');
  });

  it('should show close button when disableClose=false', async () => {
    const { f } = await mkDialog({ title: 'Test' });
    expect(f.nativeElement.querySelector('.neu-dialog__close')).toBeTruthy();
  });

  // ── disableClose ───────────────────────────────────────────────────────────

  it('should NOT show close button when disableClose=true', async () => {
    const { f } = await mkDialog({ disableClose: true });
    expect(f.nativeElement.querySelector('.neu-dialog__close')).toBeFalsy();
  });

  // ── Cierre con backdrop ────────────────────────────────────────────────────

  it('should emit an outside request when backdrop is clicked (disableClose=false)', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let requestReason = '';
    comp.closeRequested.subscribe((request) => {
      requestReason = request.reason;
    });
    f.nativeElement.querySelector('.neu-dialog__backdrop')?.click();
    expect(requestReason).toBe('outside');
  });

  it('should NOT emit closeRequested when backdrop clicked and disableClose=true', async () => {
    const { f, comp } = await mkDialog({ title: 'Test', disableClose: true });
    let requested = false;
    comp.closeRequested.subscribe(() => {
      requested = true;
    });
    f.nativeElement.querySelector('.neu-dialog__backdrop')?.click();
    expect(requested).toBe(false);
  });

  // ── Cierre con ESC ─────────────────────────────────────────────────────────

  it('should emit an escape request on Escape keydown (disableClose=false)', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let requestReason = '';
    comp.closeRequested.subscribe((request) => {
      requestReason = request.reason;
    });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(requestReason).toBe('escape');
  });

  it('should NOT emit closed on Escape when disableClose=true', async () => {
    const { f, comp } = await mkDialog({ title: 'Test', disableClose: true });
    let requested = false;
    comp.closeRequested.subscribe(() => {
      requested = true;
    });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(requested).toBe(false);
  });

  // ── Tamaños ────────────────────────────────────────────────────────────────

  it('should apply size class sm', async () => {
    const { f } = await mkDialog({ size: 'sm' });
    expect(f.nativeElement.querySelector('.neu-dialog__panel--sm')).toBeTruthy();
  });

  it('should apply size class md (default)', async () => {
    const { f } = await mkDialog();
    expect(f.nativeElement.querySelector('.neu-dialog__panel--md')).toBeTruthy();
  });

  it('should apply size class lg', async () => {
    const { f } = await mkDialog({ size: 'lg' });
    expect(f.nativeElement.querySelector('.neu-dialog__panel--lg')).toBeTruthy();
  });

  it('should apply size class xl', async () => {
    const { f } = await mkDialog({ size: 'xl' });
    expect(f.nativeElement.querySelector('.neu-dialog__panel--xl')).toBeTruthy();
  });

  it('should apply size class full', async () => {
    const { f } = await mkDialog({ size: 'full' });
    expect(f.nativeElement.querySelector('.neu-dialog__panel--full')).toBeTruthy();
  });

  it('should apply auto layout classes by default', async () => {
    const { f } = await mkDialog();
    expect(f.nativeElement.classList.contains('neu-dialog--layout-auto')).toBe(true);
    expect(f.nativeElement.querySelector('.neu-dialog__panel--layout-auto')).toBeTruthy();
  });

  it('should apply viewport layout classes', async () => {
    const { f } = await mkDialog({ layout: 'viewport' });
    expect(f.nativeElement.classList.contains('neu-dialog--layout-viewport')).toBe(true);
    expect(f.nativeElement.querySelector('.neu-dialog__panel--layout-viewport')).toBeTruthy();
  });

  it('should expose responsive state on the host', async () => {
    const { f } = await mkDialog({ responsive: true });
    expect(f.nativeElement.classList.contains('neu-dialog--responsive')).toBe(true);
  });

  it('should keep the panel inside the token-configurable host', async () => {
    const { f } = await mkDialog();
    f.nativeElement.style.setProperty('--neu-dialog-height', '31rem');
    f.nativeElement.style.setProperty('--neu-dialog-footer-wrap', 'wrap');
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;

    expect(f.nativeElement.style.getPropertyValue('--neu-dialog-height')).toBe('31rem');
    expect(f.nativeElement.style.getPropertyValue('--neu-dialog-footer-wrap')).toBe('wrap');
    const viewport = f.nativeElement.querySelector('.neu-dialog__viewport') as HTMLElement;
    expect(viewport).toBeTruthy();
    expect(panel.parentElement).toBe(viewport);
    expect(viewport.closest('[style*="--neu-dialog-height"]')).toBe(f.nativeElement);
  });

  it('should center declarative panels through a viewport wrapper without stretching auto layout', async () => {
    const { f } = await mkDialog({ layout: 'auto' });
    const viewport = f.nativeElement.querySelector('.neu-dialog__viewport') as HTMLElement;
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;

    const visualViewport = f.nativeElement.querySelector(
      '.neu-dialog__visual-viewport',
    ) as HTMLElement;
    expect(getComputedStyle(visualViewport).position).toBe('fixed');
    expect(getComputedStyle(viewport).position).toBe('absolute');
    expect(getComputedStyle(viewport).display).toBe('flex');
    expect(getComputedStyle(panel).position).toBe('relative');
    expect(getComputedStyle(panel).height).toBe('var(--neu-dialog-height, auto)');
  });

  // ── Accesibilidad ──────────────────────────────────────────────────────────

  it('should set aria-labelledby matching the title element id', async () => {
    const { f } = await mkDialog({ title: 'Aria Test' });
    const panel: HTMLElement = f.nativeElement.querySelector('[role="dialog"]');
    const labelledBy = panel?.getAttribute('aria-labelledby');
    const titleEl: HTMLElement = f.nativeElement.querySelector('.neu-dialog__title');
    expect(labelledBy).toBeTruthy();
    expect(titleEl?.id).toBe(labelledBy);
  });

  it('host should have aria-hidden="true" when open=false', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideNeuralIcons(iconX)],
    }).compileComponents();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', false);
    f.detectChanges();
    expect(f.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });

  it('host should have aria-hidden="false" when open=true', async () => {
    const { f } = await mkDialog({ title: 'Test' });
    expect(f.nativeElement.getAttribute('aria-hidden')).toBe('false');
  });

  it('panel should have role="dialog"', async () => {
    const { f } = await mkDialog({ title: 'Test' });
    expect(f.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('panel should have aria-modal=true', async () => {
    const { f } = await mkDialog({ title: 'Test' });
    const panel = f.nativeElement.querySelector('[role="dialog"]');
    expect(panel?.getAttribute('aria-modal')).toBe('true');
  });

  it('should focus the first visible focusable element when opened', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(FocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const visibleButton = f.nativeElement.querySelector('.visible-action');
    expect(document.activeElement).toBe(visibleButton);
  });

  it('should focus the panel when no visible focusable elements exist', async () => {
    await TestBed.configureTestingModule({
      imports: [NoFocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(NoFocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    expect(document.activeElement).toBe(panel);
  });

  it('keeps focus on the panel when tabbing with no available focusable children', async () => {
    await TestBed.configureTestingModule({
      imports: [NoFocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
    const f = TestBed.createComponent(NoFocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(panel);
  });

  it('returns focus to the element active before an open dialog is closed declaratively', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    await f.whenStable();
    f.componentRef.setInput('open', false);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('should ignore non-Tab keys after handling Escape', async () => {
    const { comp } = await mkDialog({ title: 'Test' });
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const emitSpy = vi.spyOn(comp.closeRequested, 'emit');

    comp.onPanelKeydown(event);

    expect(emitSpy).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('should return early on Tab when panel is unavailable', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', false);
    f.detectChanges();

    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    expect(() => f.componentInstance.onPanelKeydown(event)).not.toThrow();
    expect(event.defaultPrevented).toBe(false);
  });

  it('should keep focus trapped when tabbing forward from the last focusable element', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(FocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    const visibleButton = f.nativeElement.querySelector('.visible-action') as HTMLButtonElement;
    const visibleLink = f.nativeElement.querySelector('.visible-link') as HTMLAnchorElement;
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

    visibleLink.focus();
    panel.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(visibleButton);
  });

  it('should keep focus trapped when shift-tabbing from the first focusable element', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(FocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    const visibleButton = f.nativeElement.querySelector('.visible-action') as HTMLButtonElement;
    const visibleLink = f.nativeElement.querySelector('.visible-link') as HTMLAnchorElement;
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    visibleButton.focus();
    panel.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(visibleLink);
  });

  it('should keep focus trapped when shift-tabbing from the panel itself', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(FocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLDivElement;
    const visibleLink = f.nativeElement.querySelector('.visible-link') as HTMLAnchorElement;
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    panel.focus();
    panel.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(visibleLink);
  });

  it('should advance focus both directions inside the focusable range', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(FocusableHostComponent);
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLDivElement;
    const visibleButton = f.nativeElement.querySelector('.visible-action') as HTMLButtonElement;
    const visibleLink = f.nativeElement.querySelector('.visible-link') as HTMLAnchorElement;
    const forwardEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const backwardEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    visibleButton.focus();
    panel.dispatchEvent(forwardEvent);
    expect(document.activeElement).toBe(visibleLink);
    visibleLink.focus();
    panel.dispatchEvent(backwardEvent);

    expect(forwardEvent.defaultPrevented).toBe(true);
    expect(backwardEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(visibleButton);
  });

  it('focus initial guard should be safe before the panel exists', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();

    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', false);
    f.detectChanges();

    expect(() => (f.componentInstance as any).focusInitialElement()).not.toThrow();
  });

  it('locks background scrolling only while a declarative dialog is open', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    await f.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    f.componentRef.setInput('open', false);
    f.detectChanges();
    await f.whenStable();
    expect(document.body.style.overflow).toBe('');
  });

  it('preserves the original focus target across a close-open race', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
    const origin = document.createElement('button');
    document.body.append(origin);
    origin.focus();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    await f.whenStable();

    f.componentRef.setInput('open', false);
    f.detectChanges();
    f.componentRef.setInput('open', true);
    f.detectChanges();
    await Promise.resolve();
    expect(document.activeElement).not.toBe(origin);

    f.componentRef.setInput('open', false);
    f.detectChanges();
    await Promise.resolve();
    expect(document.activeElement).toBe(origin);
    origin.remove();
  });

  it('maximizes and restores once with an accessible changing toggle name', async () => {
    const { f, comp } = await mkDialog({ maximizable: true });
    const changes: boolean[] = [];
    comp.maximizedChange.subscribe((value) => changes.push(value));
    const toggle = f.nativeElement.querySelector('.neu-dialog__maximize') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-label')).toBe('Maximize dialog');
    const maximizePath = toggle.querySelector('path')?.getAttribute('d');
    toggle.click();
    f.detectChanges();
    expect(changes).toEqual([true]);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Restore dialog');
    expect(toggle.querySelector('path')?.getAttribute('d')).not.toBe(maximizePath);
    expect(f.nativeElement.querySelector('.neu-dialog__panel').classList).toContain(
      'neu-dialog__panel--maximized',
    );
    toggle.click();
    expect(changes).toEqual([true, false]);
  });

  it('keeps controlled maximize state proposal-only until the consumer echo', async () => {
    const { f, comp } = await mkDialog({ maximizable: true, maximized: false });
    const changes: boolean[] = [];
    comp.maximizedChange.subscribe((value) => changes.push(value));
    (f.nativeElement.querySelector('.neu-dialog__maximize') as HTMLButtonElement).click();
    f.detectChanges();
    expect(changes).toEqual([true]);
    expect(comp.effectiveMaximized()).toBe(false);
    f.componentRef.setInput('maximized', true);
    f.detectChanges();
    expect(comp.effectiveMaximized()).toBe(true);
    expect(changes).toHaveLength(1);
  });

  it('applies drag and keyboard resize geometry without emitting per-pixel events', async () => {
    const { f, comp } = await mkDialog({ draggable: true, resizable: true });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    const header = f.nativeElement.querySelector('.neu-dialog__header') as HTMLElement;
    const rect = {
      left: 300,
      top: 200,
      right: 700,
      bottom: 500,
      width: 400,
      height: 300,
      x: 300,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect;
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect);
    comp.onDragStart({
      button: 0,
      target: header,
      pointerId: 7,
      clientX: 400,
      clientY: 240,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    comp.onPointerMove({
      pointerId: 7,
      clientX: 440,
      clientY: 270,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);
    expect(panel.style.transform).toContain('40px, 30px');
    comp.onPointerEnd({ pointerId: 7 } as PointerEvent);

    const handle = f.nativeElement.querySelector('.neu-dialog__resize-handle') as HTMLButtonElement;
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    expect(panel.style.width).toBe('408px');
    expect(handle.getAttribute('aria-label')).toBe('Resize dialog');
  });

  it('rejects unavailable drag, resize, maximize and pointer interactions', async () => {
    const { comp } = await mkDialog();
    const event = {
      button: 0,
      target: document.createElement('div'),
      pointerId: 41,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as PointerEvent;

    comp.toggleMaximize();
    comp.onDragStart(event);
    comp.onResizeStart(event);
    comp.onPointerMove(event);
    comp.onPointerEnd(event);
    comp.onResizeKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('handles RTL pointer resize and both rendered pointer completion events', async () => {
    const { f } = await mkDialog({ draggable: true, resizable: true });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    const header = f.nativeElement.querySelector('.neu-dialog__header') as HTMLElement;
    const handle = f.nativeElement.querySelector('.neu-dialog__resize-handle') as HTMLButtonElement;
    panel.style.direction = 'rtl';
    panel.setPointerCapture = vi.fn();
    panel.hasPointerCapture = vi.fn(() => true);
    panel.releasePointerCapture = vi.fn();
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      left: 300,
      top: 200,
      right: 700,
      bottom: 500,
      width: 400,
      height: 300,
      x: 300,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect);
    const pointer = (type: string, pointerId: number, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        button: { value: 0 },
        pointerId: { value: pointerId },
        clientX: { value: clientX },
        clientY: { value: clientY },
      });
      return event;
    };

    header.dispatchEvent(pointer('pointerdown', 51, 400, 240));
    panel.dispatchEvent(pointer('pointerup', 51, 400, 240));
    handle.dispatchEvent(pointer('pointerdown', 52, 700, 500));
    panel.dispatchEvent(pointer('pointermove', 52, 660, 530));
    expect(panel.style.width).toBe('440px');
    expect(panel.style.height).toBe('330px');
    expect(panel.style.transform).toContain('-20px, 15px');
    panel.dispatchEvent(pointer('pointercancel', 52, 660, 530));

    expect(panel.releasePointerCapture).toHaveBeenCalledWith(51);
    expect(panel.releasePointerCapture).toHaveBeenCalledWith(52);
  });

  it('supports coarse RTL keyboard resizing and safely ignores it without a panel', async () => {
    const { f, comp } = await mkDialog({ resizable: true });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    const handle = f.nativeElement.querySelector('.neu-dialog__resize-handle') as HTMLButtonElement;
    panel.style.direction = 'rtl';
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      left: 300,
      top: 200,
      right: 700,
      bottom: 500,
      width: 400,
      height: 300,
      x: 300,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect);

    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, cancelable: true }),
    );
    expect(panel.style.width).toBe('368px');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    expect(panel.style.height).toBe('308px');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    expect(panel.style.height).toBe('292px');

    f.componentRef.setInput('open', false);
    f.detectChanges();
    expect(() =>
      comp.onResizeKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true })),
    ).not.toThrow();
    expect(() =>
      comp.onDragStart({
        button: 0,
        target: document.createElement('div'),
        pointerId: 60,
        preventDefault: vi.fn(),
      } as unknown as PointerEvent),
    ).not.toThrow();
  });

  it('releases an active pointer interaction during destruction', async () => {
    const { f, comp } = await mkDialog({ resizable: true });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    panel.setPointerCapture = vi.fn();
    panel.hasPointerCapture = vi.fn(() => true);
    panel.releasePointerCapture = vi.fn();
    comp.onResizeStart({
      button: 0,
      target: f.nativeElement.querySelector('.neu-dialog__resize-handle'),
      pointerId: 11,
      clientX: 700,
      clientY: 500,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as PointerEvent);

    f.destroy();
    expect(panel.releasePointerCapture).toHaveBeenCalledWith(11);
  });

  it('releases an active drag during destruction', async () => {
    const { f, comp } = await mkDialog({ draggable: true });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;
    const header = f.nativeElement.querySelector('.neu-dialog__header') as HTMLElement;
    panel.setPointerCapture = vi.fn();
    panel.hasPointerCapture = vi.fn(() => true);
    panel.releasePointerCapture = vi.fn();
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({
      left: 300,
      top: 200,
      right: 700,
      bottom: 500,
      width: 400,
      height: 300,
      x: 300,
      y: 200,
      toJSON: () => ({}),
    } as DOMRect);
    comp.onDragStart({
      button: 0,
      target: header,
      pointerId: 12,
      clientX: 400,
      clientY: 240,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent);

    f.destroy();
    expect(panel.releasePointerCapture).toHaveBeenCalledWith(12);
  });

  it('does not emit after destruction inside a dismissal guard', async () => {
    let f!: ComponentFixture<NeuDialogComponent>;
    const guard = vi.fn(() => {
      f.destroy();
      return true;
    });
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [DialogModule],
        providers: [
          provideZonelessChangeDetection(),
          provideNeuralIcons(iconX),
          provideNeuOverlayDismissGuard(guard),
        ],
      })
      .compileComponents();
    f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    const requested = vi.spyOn(f.componentInstance.closeRequested, 'emit');

    f.nativeElement
      .querySelector('.neu-dialog__panel')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(guard).toHaveBeenCalledOnce();
    expect(requested).not.toHaveBeenCalled();
  });

  it('fails closed when a dismissal guard prevents or throws during Escape', async () => {
    const guard = vi.fn(() => false);
    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [DialogModule],
        providers: [
          provideZonelessChangeDetection(),
          provideNeuralIcons(iconX),
          provideNeuOverlayDismissGuard(guard),
        ],
      })
      .compileComponents();
    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', true);
    f.detectChanges();
    const requested = vi.spyOn(f.componentInstance.closeRequested, 'emit');
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    f.nativeElement.querySelector('.neu-dialog__panel').dispatchEvent(event);
    expect(guard).toHaveBeenCalledOnce();
    expect(requested).not.toHaveBeenCalled();

    guard.mockImplementation(() => {
      throw new Error('consumer failure');
    });
    f.nativeElement.querySelector('.neu-dialog__panel').dispatchEvent(event);
    expect(requested).not.toHaveBeenCalled();

    guard.mockImplementation(() => {
      f.componentInstance.close();
      return true;
    });
    f.nativeElement.querySelector('.neu-dialog__panel').dispatchEvent(event);
    expect(requested).toHaveBeenCalledOnce();
    expect(requested).toHaveBeenCalledWith({ reason: 'programmatic-command' });
  });
});

// ── NeuDialogService ──────────────────────────────────────────────────────────

describe('NeuDialogService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule, FakeContentComponent],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
  });

  it('should be injectable', () => {
    const service = TestBed.inject(NeuDialogService);
    expect(service).toBeTruthy();
  });

  it('open() should return a DialogRef with close method', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent, { title: 'Hola', size: 'md' });
    expect(ref).toBeTruthy();
    expect(typeof ref.close).toBe('function');
    ref.close();
  });

  it('open() with size lg should not throw', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent, { size: 'lg' });
    expect(ref).toBeTruthy();
    ref.close();
  });

  it('open() should apply viewport layout to the CDK panel', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent, { layout: 'viewport' });
    expect(document.querySelector('.neu-dialog-panel--layout-viewport')).toBeTruthy();
    ref.close();
  });

  it('open() should apply responsive layout to the CDK panel by default', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent);
    const panel = document.querySelector('.neu-dialog-panel--responsive') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.maxWidth).toBe('none');
    ref.close();
  });

  it('open() should allow disabling responsive CDK layout', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent, { responsive: false });
    expect(document.querySelector('.neu-dialog-panel--responsive')).toBeFalsy();
    ref.close();
  });

  it('open() with disableClose=true should not throw', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent, { disableClose: true });
    expect(ref).toBeTruthy();
    ref.close();
  });

  it('open() without config should use defaults', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open(FakeContentComponent);
    expect(ref).toBeTruthy();
    ref.close();
  });

  it('open() with data should pass data to DialogRef', () => {
    const service = TestBed.inject(NeuDialogService);
    const ref = service.open<{ id: number }>(FakeContentComponent, {
      title: 'Edit',
      data: { id: 42 },
      size: 'xl',
    });
    expect(ref).toBeTruthy();
    ref.close();
  });
});
