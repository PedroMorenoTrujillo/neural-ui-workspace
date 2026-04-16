import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuAlertComponent } from './neu-alert.component';

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuAlertComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render projected content', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement).toBeTruthy();
  });

  it('should apply type class', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'success');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-alert--success');
  });

  it('should apply error and info type classes', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'error');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-alert--error');

    f.componentRef.setInput('type', 'info');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-alert--info');
  });

  it('should show default icon', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'warning');
    f.componentRef.setInput('showIcon', true);
    f.detectChanges();
    await f.whenStable();
    const icon = f.nativeElement.querySelector('.neu-alert__icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('⚠');
  });

  it('should use custom icon when provided', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'info');
    f.componentRef.setInput('icon', '🔔');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__icon').textContent.trim()).toBe('🔔');
  });

  it('should hide icon when showIcon=false', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('showIcon', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__icon')).toBeNull();
  });

  it('should show close button when closable=true', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('closable', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__close')).toBeTruthy();
  });

  it('should not show close button when closable=false', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('closable', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__close')).toBeNull();
  });

  it('dismiss() should hide the alert and emit closed', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('closable', true);
    f.detectChanges();
    await f.whenStable();

    const emitted: unknown[] = [];
    f.componentInstance.closed.subscribe(() => emitted.push(true));

    f.componentInstance.dismiss();
    f.detectChanges();
    await f.whenStable();

    expect(emitted.length).toBe(1);
    expect(f.nativeElement.classList).toContain('neu-alert--dismissed');
  });

  it('clicking close button should dismiss', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('closable', true);
    f.detectChanges();
    await f.whenStable();

    const btn: HTMLButtonElement = f.nativeElement.querySelector('.neu-alert__close');
    btn.click();
    f.detectChanges();
    await f.whenStable();

    expect((f.componentInstance as any)._dismissed()).toBe(true);
  });

  it('should apply outline class', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('outline', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-alert--outline');
  });

  it('should render title when provided', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('title', 'Atención');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__title').textContent.trim()).toBe('Atención');
  });

  it('should not render title element when empty', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('title', '');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__title')).toBeNull();
  });

  it('liveRegion returns assertive for error type', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'error');
    f.detectChanges();
    expect((f.componentInstance as any).liveRegion()).toBe('assertive');
  });

  it('liveRegion returns polite for non-error types', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('type', 'info');
    f.detectChanges();
    expect((f.componentInstance as any).liveRegion()).toBe('polite');
  });
});
