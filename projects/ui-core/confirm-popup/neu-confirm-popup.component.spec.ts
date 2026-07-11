import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuConfirmPopupComponent, NeuConfirmPopupService } from './neu-confirm-popup.component';

describe('NeuConfirmPopupComponent', () => {
  let fixture: ComponentFixture<NeuConfirmPopupComponent>;
  let service: NeuConfirmPopupService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuConfirmPopupComponent] }).compileComponents();
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

  it('prefers service state and resolves accepted confirmations', async () => {
    const accepted = vi.spyOn(fixture.componentInstance.accepted, 'emit');
    const promise = service.confirm({ title: 'Continue', message: 'Proceed?', acceptLabel: 'Yes', rejectLabel: 'No' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Proceed?');
    expect(fixture.nativeElement.textContent).toContain('Yes');
    (fixture.nativeElement.querySelector('.neu-confirm-popup__accept') as HTMLButtonElement).click();
    expect(accepted).toHaveBeenCalled();
    await expect(promise).resolves.toBe(true);
    expect(service.state()).toBeNull();
  });

  it('rejects service confirmations and ignores close calls without a resolver', async () => {
    const rejected = vi.spyOn(fixture.componentInstance.rejected, 'emit');
    service.close(false);
    const promise = service.confirm({ message: 'Discard?' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.neu-confirm-popup__reject') as HTMLButtonElement).click();
    expect(rejected).toHaveBeenCalled();
    await expect(promise).resolves.toBe(false);
    service.close(true);
    expect(service.state()).toBeNull();
  });
});
