import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogModule } from '@angular/cdk/dialog';
import { NeuConfirmDialogComponent, NeuConfirmDialogService } from './neu-confirm-dialog.component';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

function mkDialogBed(data = { message: '¿Seguro?' }) {
  const closeFn = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: DIALOG_DATA, useValue: data },
      {
        provide: DialogRef,
        useValue: { close: closeFn, closed: { subscribe: () => {} } },
      },
    ],
  });
  return closeFn;
}

describe('NeuConfirmDialogComponent', () => {
  it('should render message', async () => {
    mkDialogBed({ message: 'Mensaje de prueba' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Mensaje de prueba');
  });

  it('should render title when provided', async () => {
    mkDialogBed({ message: 'Msg', title: 'Mi Título' } as any);
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-confirm-dialog__title')?.textContent).toContain(
      'Mi Título',
    );
  });

  it('should not render title when not provided', async () => {
    mkDialogBed({ message: 'Msg' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-confirm-dialog__title')).toBeNull();
  });

  it('accept() should close with true', async () => {
    const closeFn = mkDialogBed({ message: 'Test' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    f.componentInstance.accept();
    expect(closeFn).toHaveBeenCalledWith(true);
  });

  it('reject() should close with false', async () => {
    const closeFn = mkDialogBed({ message: 'Test' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    f.componentInstance.reject();
    expect(closeFn).toHaveBeenCalledWith(false);
  });

  it('accept button should call accept()', async () => {
    const closeFn = mkDialogBed({ message: 'Test' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector(
      '.neu-confirm-dialog__btn--primary',
    ) as HTMLButtonElement;
    btn.click();
    expect(closeFn).toHaveBeenCalledWith(true);
  });

  it('reject button should call reject()', async () => {
    const closeFn = mkDialogBed({ message: 'Test' });
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector(
      '.neu-confirm-dialog__btn--reject',
    ) as HTMLButtonElement;
    btn.click();
    expect(closeFn).toHaveBeenCalledWith(false);
  });

  it('should show custom acceptLabel', async () => {
    mkDialogBed({ message: 'Test', acceptLabel: 'Sí, eliminar' } as any);
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Sí, eliminar');
  });

  it('should show custom rejectLabel', async () => {
    mkDialogBed({ message: 'Test', rejectLabel: 'No, volver' } as any);
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('No, volver');
  });

  it('should apply danger class when rejectVariant is danger', async () => {
    mkDialogBed({ message: 'Test', rejectVariant: 'danger' } as any);
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector(
      '.neu-confirm-dialog__btn--reject.neu-confirm-dialog__btn--danger',
    );
    expect(btn).not.toBeNull();
  });

  it('should apply danger class when acceptVariant is danger', async () => {
    mkDialogBed({ message: 'Test', acceptVariant: 'danger' } as any);
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('.neu-confirm-dialog__btn--danger');
    expect(btn).not.toBeNull();
  });

  it('should have role alertdialog and aria-modal', async () => {
    mkDialogBed();
    const f = TestBed.createComponent(NeuConfirmDialogComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.getAttribute('role')).toBe('alertdialog');
    expect(f.nativeElement.getAttribute('aria-modal')).toBe('true');
  });
});

describe('NeuConfirmDialogService', () => {
  it('should open a dialog and resolve false on undefined close', async () => {
    TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), NeuConfirmDialogService],
    });
    const svc = TestBed.inject(NeuConfirmDialogService);
    // Spy on Dialog.open to avoid real DOM
    const dialog = (svc as any)._dialog;
    const subject = { subscribe: (cb: (v: boolean | undefined) => void) => cb(undefined) };
    vi.spyOn(dialog, 'open').mockReturnValue({ closed: subject } as any);
    const result = await svc.confirm({ message: 'Test?' });
    expect(result).toBe(false);
  });

  it('should resolve true when dialog closes with true', async () => {
    TestBed.configureTestingModule({
      imports: [DialogModule],
      providers: [provideZonelessChangeDetection(), NeuConfirmDialogService],
    });
    const svc = TestBed.inject(NeuConfirmDialogService);
    const dialog = (svc as any)._dialog;
    const subject = { subscribe: (cb: (v: boolean) => void) => cb(true) };
    vi.spyOn(dialog, 'open').mockReturnValue({ closed: subject } as any);
    const result = await svc.confirm({ message: 'Test?' });
    expect(result).toBe(true);
  });
});
