import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuBottomSheetComponent } from './neu-bottom-sheet.component';

describe('NeuBottomSheetComponent', () => {
  let fixture: ComponentFixture<NeuBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuBottomSheetComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuBottomSheetComponent);
  });

  it('renders when open', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Actions');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Actions');
  });

  it('emits close requests', () => {
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');
    fixture.componentInstance.requestClose();
    expect(spy).toHaveBeenCalled();
  });

  it('closes with Escape unless closing is disabled', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');

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
    const spy = vi.spyOn(fixture.componentInstance.closed, 'emit');

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
    const closed = vi.spyOn(component.closed, 'emit');
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-label')).toBe('Action sheet');
    expect(dialog.classList).toContain('neu-bottom-sheet--full');
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet__backdrop')?.getAttribute('aria-label')).toBe('Dismiss');

    (fixture.nativeElement.querySelector('.neu-bottom-sheet__backdrop') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.neu-bottom-sheet__close') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it('uses the title as fallback aria label and supports sheets without backdrop or header', () => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Fallback title');
    fixture.componentRef.setInput('backdrop', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Fallback title');
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet__backdrop')).toBeNull();

    fixture.componentRef.setInput('title', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-bottom-sheet__header')).toBeNull();
  });
});
