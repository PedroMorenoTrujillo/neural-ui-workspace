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

  it('should apply tone class', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'success');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-alert--success');
  });

  it('should apply danger and info tone classes', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'danger');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-alert--danger');

    f.componentRef.setInput('tone', 'info');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-alert--info');
  });

  it('should show default icon', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'warning');
    f.componentRef.setInput('showIcon', true);
    f.detectChanges();
    await f.whenStable();
    const icon = f.nativeElement.querySelector('.neu-alert__icon');
    expect(icon).toBeTruthy();
    expect(icon.querySelector('neu-icon-outlet')).toBeTruthy();
  });

  it('should use custom icon when provided', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'info');
    f.componentRef.setInput('icon', 'close');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__icon neu-icon-outlet svg')).toBeTruthy();
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
    const close = f.nativeElement.querySelector('.neu-alert__close');
    expect(close).toBeTruthy();
    expect(close.classList).toContain('neu-button');
    expect(close.getAttribute('aria-label')).toBe('Close alert');
    expect(close.querySelector('neu-icon-outlet')?.getAttribute('aria-hidden')).toBe('true');
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

    expect((f.componentInstance as any)['_dismissed']()).toBe(true);
  });

  it('should apply outline class', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('variant', 'outline');
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
    expect(f.nativeElement.classList).toContain('neu-alert--with-title');
  });

  it('should not render title element when empty', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('title', '');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-alert__title')).toBeNull();
    expect(f.nativeElement.classList).not.toContain('neu-alert--with-title');
  });

  it('liveRegion returns assertive for danger tone', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'danger');
    f.detectChanges();
    expect((f.componentInstance as any).liveRegion()).toBe('assertive');
  });

  it('liveRegion returns polite for non-danger tones', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'info');
    f.detectChanges();
    expect((f.componentInstance as any).liveRegion()).toBe('polite');
  });

  it('uses an assertive alert role only for errors', async () => {
    const f = TestBed.createComponent(NeuAlertComponent);
    f.componentRef.setInput('tone', 'info');
    f.detectChanges();
    expect(f.nativeElement.getAttribute('role')).toBe('status');

    f.componentRef.setInput('tone', 'danger');
    f.detectChanges();
    expect(f.nativeElement.getAttribute('role')).toBe('alert');
    expect(f.nativeElement.getAttribute('aria-live')).toBe('assertive');
  });
});
