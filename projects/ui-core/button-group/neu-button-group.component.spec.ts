import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuButtonGroupComponent } from './neu-button-group.component';

@Component({
  imports: [NeuButtonGroupComponent, NeuButtonComponent],
  template: `<neu-button-group ariaLabel="Actions" dir="rtl">
    <button neu-button id="first">First</button>
    <button neu-button id="second" [disabled]="true">Second</button>
    <button neu-button id="third">Third</button>
  </neu-button-group>`,
})
class ButtonGroupHost {}

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

  it('preserves projected native button order, disabled state and normal tab stops in RTL', () => {
    const host = TestBed.createComponent(ButtonGroupHost);
    host.detectChanges();
    const root = host.nativeElement as HTMLElement;
    const group = root.querySelector('[role="group"]')!;
    const buttons = [...group.querySelectorAll('button')] as HTMLButtonElement[];
    expect(buttons.map((button) => button.id)).toEqual(['first', 'second', 'third']);
    expect(group.getAttribute('aria-label')).toBe('Actions');
    expect(root.querySelector('neu-button-group')?.getAttribute('dir')).toBe('rtl');
    expect(buttons.map((button) => button.disabled)).toEqual([false, true, false]);
    expect(buttons.map((button) => button.getAttribute('tabindex'))).toEqual([null, null, null]);
  });
});
