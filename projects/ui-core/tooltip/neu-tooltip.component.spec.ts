import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuTooltipOverlayComponent } from './neu-tooltip.component';

describe('NeuTooltipOverlayComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the component', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Test');
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should render the text input in the tooltip span', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Mi tooltip de prueba');
    f.detectChanges();
    const span = f.nativeElement.querySelector('.neu-tooltip__text');
    expect(span).not.toBeNull();
    expect(span.textContent).toContain('Mi tooltip de prueba');
  });

  it('should set id on host element from tooltipId input', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Test');
    f.componentRef.setInput('tooltipId', 'neu-tooltip-xyz');
    f.detectChanges();
    expect(f.nativeElement.getAttribute('id')).toBe('neu-tooltip-xyz');
  });

  it('host element should have role="tooltip"', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Test');
    f.detectChanges();
    expect(f.nativeElement.getAttribute('role')).toBe('tooltip');
  });

  it('host element should have class "neu-tooltip"', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Test');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-tooltip');
  });

  it('tooltipId defaults to empty string when not provided', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Test');
    f.detectChanges();
    // id="" o id no seteado / id="" or id not set
    const idAttr = f.nativeElement.getAttribute('id');
    expect(idAttr === '' || idAttr === null).toBe(true);
  });

  it('should update rendered text when text input changes', () => {
    const f = TestBed.createComponent(NeuTooltipOverlayComponent);
    f.componentRef.setInput('text', 'Texto inicial');
    f.detectChanges();
    f.componentRef.setInput('text', 'Texto actualizado');
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-tooltip__text').textContent).toContain(
      'Texto actualizado',
    );
  });
});
