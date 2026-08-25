import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuButtonGroupComponent } from './neu-button-group.component';

describe('NeuButtonGroupComponent', () => {
  let fixture: ComponentFixture<NeuButtonGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuButtonGroupComponent, NeuButtonComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuButtonGroupComponent);
    fixture.detectChanges();
  });

  it('renders a native semantic group', () => {
    const group = fixture.nativeElement.querySelector('[role="group"]');
    expect(group).toBeTruthy();
  });

  it('reactively applies orientation, fluidness, and labelling', () => {
    fixture.componentRef.setInput('orientation', 'vertical');
    fixture.componentRef.setInput('fluid', true);
    fixture.componentRef.setInput('ariaLabel', 'Actions');
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('[role="group"]');
    expect(group.classList).toContain('neu-button-group--vertical');
    expect(group.classList).toContain('neu-button-group--fluid');
    expect(group.getAttribute('aria-label')).toBe('Actions');
  });
});
