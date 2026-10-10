import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NeuModalFocusDirective } from '@neural-ui/core/focus-trap';
import { NeuBottomSheetComponent } from './neu-bottom-sheet.component';

describe('NeuBottomSheetComponent', () => {
  let fixture: ComponentFixture<NeuBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuBottomSheetComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NeuBottomSheetComponent);
  });

  it('renders when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Actions');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Actions');
  });

  it('emits close requests', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');
    fixture.componentInstance.requestClose();
    expect(spy).toHaveBeenCalledWith({ reason: 'programmatic-command' });
  });

  it('closes with Escape unless closing is disabled', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(spy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('disableClose', true);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape while closed and renders no sheet content', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(spy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet')).toBeNull();
  });

  it('uses explicit aria labels, full size, backdrop and close button actions', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Actions');
    fixture.componentRef.setInput('ariaLabel', 'Action sheet');
    fixture.componentRef.setInput('closeLabel', 'Dismiss');
    fixture.componentRef.setInput('size', 'full');
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const requested = vi.spyOn(component.closeRequested, 'emit');
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-label')).toBe('Action sheet');
    expect(dialog.classList).toContain('neu-bottom-sheet--full');
    expect(
      fixture.nativeElement
        .querySelector('.neu-bottom-sheet__backdrop')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');

    (
      fixture.nativeElement.querySelector('.neu-bottom-sheet__backdrop') as HTMLButtonElement
    ).click();
    (fixture.nativeElement.querySelector('.neu-bottom-sheet__close') as HTMLButtonElement).click();
    expect(requested).toHaveBeenCalledTimes(2);
    expect(requested.mock.calls.map(([request]) => request.reason)).toEqual(['outside', 'action']);
  });

  it('uses the title as fallback aria label and supports sheets without backdrop or header', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Fallback title');
    fixture.componentRef.setInput('backdrop', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Fallback title',
    );
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet__backdrop')).toBeNull();

    fixture.componentRef.setInput('title', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet__header')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Bottom sheet',
    );
  });

  it('locks document scrolling only for the lifetime of an open sheet', async () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus into the modal surface and restores the opening control on destroy', async () => {
    const origin = document.createElement('button');
    document.body.append(origin);
    origin.focus();
    fixture.componentRef.setInput('title', 'Actions');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.neu-bottom-sheet__close'),
    );

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(document.activeElement).toBe(origin);
    origin.remove();
  });

  it('routes the focus-surface Escape output through the close contract', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const requested = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');
    const modalFocus = fixture.debugElement
      .query(By.directive(NeuModalFocusDirective))
      .injector.get(NeuModalFocusDirective);

    modalFocus.neuModalFocusEscape.emit(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested.mock.calls[0]?.[0].reason).toBe('escape');
  });

  it('emits lifecycle only for applied transitions after initial render', async () => {
    const opened = vi.spyOn(fixture.componentInstance.opened, 'emit');
    const closed = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(opened).not.toHaveBeenCalled();
    expect(closed).not.toHaveBeenCalled();

    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(opened).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('does not emit closed when a close intent is rejected by the parent', async () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    await fixture.whenStable();
    const requested = vi.spyOn(fixture.componentInstance.closeRequested, 'emit');
    const closed = vi.spyOn(fixture.componentInstance.closed, 'emit');

    fixture.componentInstance.requestClose('action', new Event('click'));
    fixture.detectChanges();

    expect(requested).toHaveBeenCalledOnce();
    expect(closed).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet')).toBeTruthy();
  });
});
