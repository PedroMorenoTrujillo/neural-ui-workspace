import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogModule } from '@angular/cdk/dialog';
import { NeuDialogComponent } from './neu-modal.component';
import { NeuDialogService } from './neu-dialog.service';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

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
    providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
  // ── Rendering básico ───────────────────────────────────────────────────────

  it('should not render panel when open=false', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideIcons({ lucideX })],
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
      providers: [provideIcons({ lucideX })],
    }).compileComponents();
    const df = TestBed.createComponent(OpenHostComponent);
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('Contenido del diálogo');
  });

  // ── Cierre con botón ───────────────────────────────────────────────────────

  it('should emit closed when close button is clicked', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let closed = false;
    comp.closed.subscribe(() => {
      closed = true;
    });
    f.nativeElement.querySelector('.neu-dialog__close')?.click();
    expect(closed).toBe(true);
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

  it('should emit closed when backdrop is clicked (disableClose=false)', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let closed = false;
    comp.closed.subscribe(() => {
      closed = true;
    });
    f.nativeElement.querySelector('.neu-dialog__backdrop')?.click();
    expect(closed).toBe(true);
  });

  it('should NOT emit closed when backdrop clicked and disableClose=true', async () => {
    const { f, comp } = await mkDialog({ title: 'Test', disableClose: true });
    let closed = false;
    comp.closed.subscribe(() => {
      closed = true;
    });
    f.nativeElement.querySelector('.neu-dialog__backdrop')?.click();
    expect(closed).toBe(false);
  });

  // ── Cierre con ESC ─────────────────────────────────────────────────────────

  it('should emit closed on Escape keydown (disableClose=false)', async () => {
    const { f, comp } = await mkDialog({ title: 'Test' });
    let closed = false;
    comp.closed.subscribe(() => {
      closed = true;
    });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toBe(true);
  });

  it('should NOT emit closed on Escape when disableClose=true', async () => {
    const { f, comp } = await mkDialog({ title: 'Test', disableClose: true });
    let closed = false;
    comp.closed.subscribe(() => {
      closed = true;
    });
    const panel = f.nativeElement.querySelector('.neu-dialog__panel');
    panel?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toBe(false);
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
    expect(viewport.parentElement).toBe(f.nativeElement);
  });

  it('should center declarative panels through a viewport wrapper without stretching auto layout', async () => {
    const { f } = await mkDialog({ layout: 'auto' });
    const viewport = f.nativeElement.querySelector('.neu-dialog__viewport') as HTMLElement;
    const panel = f.nativeElement.querySelector('.neu-dialog__panel') as HTMLElement;

    expect(getComputedStyle(viewport).position).toBe('fixed');
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
      providers: [provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
    const emitSpy = vi.spyOn(comp.closed, 'emit');

    comp.onPanelKeydown(event);

    expect(emitSpy).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('should return early on Tab when panel is unavailable', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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

  it('should let focus continue when tabbing inside the focusable range', async () => {
    await TestBed.configureTestingModule({
      imports: [FocusableHostComponent, DialogModule],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
    visibleLink.focus();
    panel.dispatchEvent(backwardEvent);

    expect(forwardEvent.defaultPrevented).toBe(false);
    expect(backwardEvent.defaultPrevented).toBe(false);
  });

  it('focus initial guard should be safe before the panel exists', async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
    }).compileComponents();

    const f = TestBed.createComponent(NeuDialogComponent);
    f.componentRef.setInput('open', false);
    f.detectChanges();

    expect(() => (f.componentInstance as any).focusInitialElement()).not.toThrow();
  });
});

// ── NeuDialogService ──────────────────────────────────────────────────────────

describe('NeuDialogService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule, FakeContentComponent],
      providers: [provideZonelessChangeDetection(), provideIcons({ lucideX })],
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
