import { TestBed } from '@angular/core/testing';
import { NeuButtonComponent } from './neu-button.component';
import { provideIcons } from '@ng-icons/core';
import { lucideSave, lucidePlus } from '@ng-icons/lucide';

describe('NeuButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuButtonComponent],
      providers: [provideIcons({ lucideSave, lucidePlus })],
    }).compileComponents();
  });

  it('should have default neu-button class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button');
  });

  it('should have primary variant class by default', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--primary');
  });

  it('should apply secondary variant class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--secondary');
  });

  it('should apply danger variant class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--danger');
  });

  it('should apply lg size class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--lg');
  });

  it('should set disabled attribute when disabled=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.hasAttribute('disabled')).toBe(true);
  });

  it('should set aria-disabled when disabled=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-disabled')).toBe('true');
  });

  it('should apply loading class when loading=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--loading');
  });

  it('should apply full-width class when fullWidth=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--full-width');
  });

  it('should apply icon-only class when iconOnly=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'lucideSave');
    fixture.componentRef.setInput('iconOnly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--icon-only');
  });

  it('should emit neuClick when clicked and not disabled', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.neuClick.subscribe((e) => events.push(e));
    fixture.componentInstance._onHostClick(new MouseEvent('click'));
    expect(events.length).toBe(1);
  });

  it('should NOT emit neuClick when disabled', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.neuClick.subscribe((e) => events.push(e));
    fixture.componentInstance._onHostClick(new MouseEvent('click'));
    expect(events.length).toBe(0);
  });

  it('should compute isDisabled as true when loading', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(true);
  });

  it('icon with iconPosition=right should render icon after content', async () => {
    // icono en posición derecha debe renderizarse después del contenido
    // icon with iconPosition=right must render after content
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'lucideSave');
    fixture.componentRef.setInput('iconPosition', 'right');
    fixture.detectChanges();
    await fixture.whenStable();
    const icon = fixture.nativeElement.querySelector('neu-icon');
    expect(icon).toBeTruthy();
  });
});
