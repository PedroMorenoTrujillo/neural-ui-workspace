import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogModule } from '@angular/cdk/dialog';
import { NeuDialogComponent, NeuDialogService } from './neu-modal.component';
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

// ── Helper ────────────────────────────────────────────────────────────────────

/** Crea y configura un NeuDialogComponent con open=true / Creates and configures NeuDialogComponent with open=true */
async function mkDialog(inputs: Record<string, unknown> = {}) {
  await TestBed.configureTestingModule({
    imports: [OpenHostComponent, DialogModule, FakeContentComponent],
    providers: [provideIcons({ lucideX })],
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
});

// ── NeuDialogService ──────────────────────────────────────────────────────────

describe('NeuDialogService', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogModule, FakeContentComponent],
      providers: [provideIcons({ lucideX })],
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
