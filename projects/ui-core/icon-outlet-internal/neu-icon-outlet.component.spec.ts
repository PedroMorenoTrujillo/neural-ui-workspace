import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralIcon } from '@neural-icons/angular';
import { iconSave } from '@neural-icons/core/icons/save';
import { provideNeuIconResolver } from '@neural-ui/core/foundation';
import { InternalNeuIconOutletComponent } from './neu-icon-outlet.component';
import { neuSemanticIconText, neuStructuralIconPath } from './neu-icon-fallbacks';

describe('Core icon outlet without an icon provider', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalNeuIconOutletComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('renders its own minimal structural close affordance without an external library', () => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', 'close');
    fixture.componentRef.setInput('fallbackPath', neuStructuralIconPath('close'));
    fixture.componentRef.setInput('size', '18px');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg path')).toBeTruthy();
    expect(fixture.nativeElement.style.width).toBe('18px');
    expect(fixture.nativeElement.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it.each([
    'close', 'previous', 'next', 'disclosure-up', 'disclosure-down',
    'move-left', 'move-right', 'move-up', 'move-down', 'confirm', 'add', 'neutral-trend',
  ])('renders the %s structural intent without a provider', (key) => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', key);
    fixture.componentRef.setInput('fallbackPath', neuStructuralIconPath(key));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg path')?.getAttribute('d')).toBeTruthy();
  });

  it.each([
    'status-success', 'status-error', 'status-info', 'status-warning',
    'validation-error', 'notifications', 'empty-inbox', 'edit', 'upload', 'download',
    'zoom-in', 'zoom-out', 'rotate-clockwise', 'rotate-counterclockwise',
    'flip-horizontal', 'flip-vertical', 'drag-handle', 'format-bold',
    'format-italic', 'format-underline', 'list-unordered', 'list-ordered',
    'insert-link', 'insert-image', 'clear-format', 'external-link',
    'trend-up', 'trend-down', 'currency',
  ])('renders the %s non-structural affordance without a provider', (key) => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', key);
    fixture.componentRef.setInput('fallbackText', neuSemanticIconText(key));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('span')?.textContent?.trim()).toBeTruthy();
  });

  it('accepts a numeric size as pixels', () => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', 'close');
    fixture.componentRef.setInput('size', 20);
    fixture.detectChanges();

    expect(fixture.nativeElement.style.width).toBe('20px');
  });

  it('omits unknown optional geometry without leaking a vendor name', () => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', 'app-specific-icon');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('svg, span, neural-icon')).toBeNull();
    expect(fixture.nativeElement.textContent?.trim()).toBe('');
    expect(fixture.nativeElement.style.display).toBe('none');
  });

  it('preserves an explicit accessible label on a rendered affordance', () => {
    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', 'confirm');
    fixture.componentRef.setInput('fallbackPath', neuStructuralIconPath('confirm'));
    fixture.componentRef.setInput('label', 'Confirmed');
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('role')).toBe('img');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBe('Confirmed');
  });
});

describe('optional application-owned Neural Icons integration', () => {
  it('renders a selectively supplied Neural icon without a Core package dependency', async () => {
    await TestBed.configureTestingModule({
      imports: [InternalNeuIconOutletComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNeuIconResolver(({ key, size, strokeWidth }) =>
          key === 'save'
            ? { component: NeuralIcon, inputs: { icon: iconSave, size, strokeWidth } }
            : null,
        ),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(InternalNeuIconOutletComponent);
    fixture.componentRef.setInput('icon', 'save');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('neural-icon svg')).toBeTruthy();
  });
});
