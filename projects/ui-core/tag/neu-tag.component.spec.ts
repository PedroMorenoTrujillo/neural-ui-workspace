import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuTagComponent, NeuTagIconDirective } from './neu-tag.component';

@Component({
  imports: [NeuTagComponent],
  template: '<neu-tag [value]="value" [severity]="severity" [rounded]="rounded">Projected</neu-tag>',
})
class HostComponent {
  value: string | number | null | undefined = null;
  severity: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null = null;
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

  it('updates severity and rounded classes dynamically', async () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('severity', 'warn');
    direct.componentRef.setInput('rounded', true);
    direct.detectChanges();
    expect(direct.nativeElement.classList).toContain('neu-tag--warn');
    expect(direct.nativeElement.classList).toContain('neu-tag--rounded');
  });

  it('uses the registered icon and an explicit accessible name', () => {
    const direct = TestBed.createComponent(NeuTagComponent);
    direct.componentRef.setInput('value', 'Deploying');
    direct.componentRef.setInput('icon', 'lucideCheck');
    direct.componentRef.setInput('ariaLabel', 'Deployment status');
    direct.detectChanges();

    expect(direct.nativeElement.querySelector('neu-icon')).toBeTruthy();
    expect(direct.nativeElement.getAttribute('aria-label')).toBe('Deployment status');
    expect(direct.componentInstance.iconTemplate).toBeUndefined();
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
