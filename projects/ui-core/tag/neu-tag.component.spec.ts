import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuTagComponent, NeuTagIconDirective } from './neu-tag.component';

@Component({
  imports: [NeuTagComponent],
  template: '<neu-tag [value]="value" [tone]="tone" [variant]="variant" [rounded]="rounded">Projected</neu-tag>',
})
class HostComponent {
  value: string | number | null | undefined = null;
  tone: 'neutral' | 'success' | 'info' | 'warning' | 'danger' = 'neutral';
  variant: 'soft' | 'solid' = 'soft';
  rounded = false;
}

describe('NeuTagComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('uses projected content only when value is nullish', async () => {
    expect(fixture.nativeElement.textContent).toContain('Projected');
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('value', 'Current');
    direct.detectChanges();
    expect(direct.nativeElement.textContent).toContain('Current');
  });

  it('renders zero and empty string without falling back to projection', async () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('value', 0);
    direct.detectChanges();
    expect(direct.nativeElement.textContent).toContain('0');
    direct.componentRef.setInput('value', '');
    direct.detectChanges();
    expect(direct.nativeElement.textContent).not.toContain('Projected');
  });

  it('updates tone, variant and rounded classes dynamically', async () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('tone', 'warning');
    direct.componentRef.setInput('variant', 'solid');
    direct.componentRef.setInput('rounded', true);
    direct.detectChanges();
    expect(direct.nativeElement.classList).toContain('neu-tag--warning');
    expect(direct.nativeElement.classList).toContain('neu-tag--solid');
    expect(direct.nativeElement.classList).toContain('neu-tag--rounded');
  });

  it('uses a provider-neutral affordance and an explicit accessible name', () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('value', 'Deploying');
    direct.componentRef.setInput('icon', 'confirm');
    direct.componentRef.setInput('ariaLabel', 'Deployment status');
    direct.detectChanges();

    expect(direct.nativeElement.querySelector('neu-icon-outlet')).toBeTruthy();
    expect(direct.nativeElement.querySelector('neu-icon-outlet svg')).toBeNull();
    expect(direct.nativeElement.querySelector('neu-icon-outlet')?.getAttribute('aria-hidden')).toBe('true');
    expect(direct.nativeElement.getAttribute('aria-label')).toBe('Deployment status');
    expect(direct.componentInstance.iconTemplate).toBeUndefined();
  });

  it('remains presentational without a remove control or local dismissal', () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('value', 'Stable');
    direct.detectChanges();
    expect(direct.nativeElement.textContent).toContain('Stable');
    expect(direct.nativeElement.querySelector('button')).toBeNull();
    expect(direct.nativeElement.getAttribute('tabindex')).toBeNull();
  });

  it('renders a supplied icon template ahead of its value', async () => {
    @Component({
      imports: [NeuTagComponent, NeuTagIconDirective],
      template: '<neu-tag value="Custom"><ng-template neuTagIcon><span data-test-icon>!</span></ng-template></neu-tag>',
    })
    class TemplateHost {}

    const templateFixture = TestBed.createComponent(TemplateHost);
    templateFixture.detectChanges();
    expect(templateFixture.nativeElement.querySelector('[data-test-icon]')).toBeTruthy();
    expect(templateFixture.nativeElement.textContent).toContain('Custom');
  });
});
