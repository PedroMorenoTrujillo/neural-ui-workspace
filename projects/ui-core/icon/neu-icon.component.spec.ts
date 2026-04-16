import { TestBed } from '@angular/core/testing';
import { NeuIconComponent } from './neu-icon.component';
import { provideIcons } from '@ng-icons/core';
import { lucideSave, lucideTrash2 } from '@ng-icons/lucide';

describe('NeuIconComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuIconComponent],
      providers: [provideIcons({ lucideSave, lucideTrash2 })],
    }).compileComponents();
  });

  it('should have neu-icon host class', () => {
    const fixture = TestBed.createComponent(NeuIconComponent);
    fixture.componentRef.setInput('name', 'lucideSave');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-icon');
  });

  it('should render an icon element inside', () => {
    const fixture = TestBed.createComponent(NeuIconComponent);
    fixture.componentRef.setInput('name', 'lucideSave');
    fixture.detectChanges();
    expect(fixture.nativeElement.innerHTML).toBeTruthy();
  });

  it('should use default CSS-variable size when no size given', () => {
    const fixture = TestBed.createComponent(NeuIconComponent);
    fixture.componentRef.setInput('name', 'lucideSave');
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedSize()).toBe('var(--neu-icon-size, 1.25rem)');
  });

  it('should use the provided size value', () => {
    const fixture = TestBed.createComponent(NeuIconComponent);
    fixture.componentRef.setInput('name', 'lucideSave');
    fixture.componentRef.setInput('size', '32px');
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedSize()).toBe('32px');
  });

  it('should use the provided strokeWidth', () => {
    const fixture = TestBed.createComponent(NeuIconComponent);
    fixture.componentRef.setInput('name', 'lucideSave');
    fixture.componentRef.setInput('strokeWidth', '3');
    fixture.detectChanges();
    expect(fixture.componentInstance.strokeWidth()).toBe('3');
  });
});
