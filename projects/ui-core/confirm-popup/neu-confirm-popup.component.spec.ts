import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuConfirmPopupComponent, NeuConfirmPopupService } from './neu-confirm-popup.component';

describe('NeuConfirmPopupComponent', () => {
  let fixture: ComponentFixture<NeuConfirmPopupComponent>;
  let service: NeuConfirmPopupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuConfirmPopupComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuConfirmPopupComponent);
    service = TestBed.inject(NeuConfirmPopupService);
  });

  it('renders declarative title, labels and message when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Delete');
    fixture.componentRef.setInput('message', 'Delete item?');
    fixture.componentRef.setInput('acceptLabel', 'Delete');
    fixture.componentRef.setInput('rejectLabel', 'Keep');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Delete item?');
    expect(fixture.nativeElement.textContent).toContain('Keep');
  });

  it('keeps an anchored popup inside the viewport and clears offsets after resizing', async () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const panel = fixture.nativeElement.querySelector('.neu-confirm-popup') as HTMLElement;
    const bounds = vi.spyOn(panel, 'getBoundingClientRect');
    bounds.mockReturnValue({
      left: window.innerWidth - 50,
      right: window.innerWidth + 238,
      top: window.innerHeight - 30,
      bottom: window.innerHeight + 170,
    } as DOMRect);
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.transform).toBe('translate(-254px, -186px)');
    bounds.mockReturnValue({ left: 20, right: 308, top: 30, bottom: 230 } as DOMRect);
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.transform).toBe('translate(0px, 0px)');
    bounds.mockReturnValue({ left: -100, right: 188, top: -10, bottom: 190 } as DOMRect);
    window.dispatchEvent(new Event('resize'));
    expect(panel.style.transform).toBe('translate(116px, 26px)');
  });

  it('prefers service state and resolves accepted confirmations', async () => {
    const accepted = vi.spyOn(fixture.componentInstance.accepted, 'emit');
    const promise = service.confirm({
      title: 'Continue',
      message: 'Proceed?',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Proceed?');
    expect(fixture.nativeElement.textContent).toContain('Yes');
    (
      fixture.nativeElement.querySelector('.neu-confirm-popup__accept') as HTMLButtonElement
    ).click();
    expect(accepted).toHaveBeenCalled();
    await expect(promise).resolves.toBe(true);
    expect(service.state()).toBeNull();
  });

  it('rejects service confirmations and ignores close calls without a resolver', async () => {
    const rejected = vi.spyOn(fixture.componentInstance.rejected, 'emit');
    service.close(false);
    const promise = service.confirm({ message: 'Discard?' });
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.neu-confirm-popup__reject') as HTMLButtonElement
    ).click();
    expect(rejected).toHaveBeenCalled();
    await expect(promise).resolves.toBe(false);
    service.close(true);
    expect(service.state()).toBeNull();
  });

  it('resolves a superseded service confirmation instead of leaking its promise', async () => {
    const first = service.confirm({ message: 'First?' });
    const second = service.confirm({ message: 'Second?' });

    await expect(first).resolves.toBe(false);
    service.close(true);
    await expect(second).resolves.toBe(true);
  });

  it('provides unique accessible naming and rejects with Escape while restoring focus', async () => {
    const origin = document.createElement('button');
    document.body.append(origin);
    origin.focus();
    const promise = service.confirm({ title: 'Delete', message: 'Delete item?' });
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();

    const dialog = fixture.nativeElement.querySelector('[role="alertdialog"]') as HTMLElement;
    const labelledBy = dialog.getAttribute('aria-labelledby');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(labelledBy).toMatch(/^neu-confirm-popup-title-/);
    expect(describedBy).toMatch(/^neu-confirm-popup-message-/);
    expect(fixture.nativeElement.querySelector('.neu-confirm-popup__reject')).toBe(
      document.activeElement,
    );

    dialog.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await expect(promise).resolves.toBe(false);
    expect(service.state()).toBeNull();
    expect(document.activeElement).toBe(origin);
    origin.remove();
  });

  it('resolves a pending service confirmation when its rendering host is destroyed', async () => {
    const promise = service.confirm({ message: 'Still there?' });
    fixture.detectChanges();

    fixture.destroy();

    await expect(promise).resolves.toBe(false);
    expect(service.state()).toBeNull();
  });

  it('renders a service session on only one host and keeps it when another host is destroyed', async () => {
    const other = TestBed.createComponent(NeuConfirmPopupComponent);
    const promise = service.confirm({ message: 'One panel?' });
    fixture.detectChanges();
    other.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
    expect(other.nativeElement.querySelectorAll('[role="alertdialog"]')).toHaveLength(0);

    other.destroy();
    expect(service.state()?.message).toBe('One panel?');
    fixture.componentInstance.accept();
    await expect(promise).resolves.toBe(true);
  });

  it('transfers a pending service session when its first host is destroyed', async () => {
    const other = TestBed.createComponent(NeuConfirmPopupComponent);
    const promise = service.confirm({ message: 'Continue?' });
    fixture.detectChanges();
    other.detectChanges();

    fixture.destroy();
    other.detectChanges();
    expect(other.nativeElement.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
    expect(other.nativeElement.textContent).toContain('Continue?');
    other.componentInstance.reject();
    await expect(promise).resolves.toBe(false);
  });

  it('rejects a service session exactly once on an outside pointer gesture', async () => {
    const rejected = vi.spyOn(fixture.componentInstance.rejected, 'emit');
    const promise = service.confirm({ message: 'Outside?' });
    fixture.detectChanges();
    await fixture.whenStable();

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    await expect(promise).resolves.toBe(false);
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(service.state()).toBeNull();
  });

  it('leaves a rejected declarative close applied and does not trap outside focus', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const rejected = vi.spyOn(fixture.componentInstance.rejected, 'emit');

    outside.focus();
    expect(document.activeElement).toBe(outside);
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('[role="alertdialog"]')).toBeTruthy();
    outside.remove();
  });
});
