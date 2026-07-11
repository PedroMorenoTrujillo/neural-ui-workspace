import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NeuFieldsetComponent, NeuPanelComponent, NeuScrollAreaComponent } from './neu-panel.component';

describe('NeuPanelComponent', () => {
  let fixture: ComponentFixture<NeuPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NeuPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(NeuPanelComponent);
  });

  it('renders no header controls when the optional inputs are absent', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-panel__header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-panel__body')).toBeTruthy();
  });

  it('toggles collapsible content, labels and the public collapsed change', () => {
    const component = fixture.componentInstance;
    const emitted = vi.spyOn(component.collapsedChange, 'emit');
    fixture.componentRef.setInput('header', 'Settings');
    fixture.componentRef.setInput('collapsible', true);
    fixture.componentRef.setInput('expandLabel', 'Open');
    fixture.componentRef.setInput('collapseLabel', 'Close');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Close');
    expect(button.getAttribute('aria-expanded')).toBe('true');
    button.click();
    fixture.detectChanges();
    expect(component.collapsed()).toBe(true);
    expect(emitted).toHaveBeenCalledWith(true);
    expect(button.textContent).toContain('Open');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('.neu-panel__body')).toBeNull();
    component.toggle();
    expect(component.collapsed()).toBe(false);
  });
});

@Component({
  imports: [NeuFieldsetComponent, NeuScrollAreaComponent],
  template: `
    <neu-fieldset legend="Details"><input value="Ada" /></neu-fieldset>
    <neu-scroll-area maxHeight="12rem"><p>Scrollable</p></neu-scroll-area>
  `,
})
class PanelProjectionHostComponent {}

describe('NeuFieldsetComponent and NeuScrollAreaComponent', () => {
  it('renders optional legend and projects fieldset and scroll content', async () => {
    await TestBed.configureTestingModule({ imports: [PanelProjectionHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PanelProjectionHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('legend')?.textContent).toContain('Details');
    expect(fixture.nativeElement.querySelector('neu-fieldset input')).toBeTruthy();
    const viewport = fixture.nativeElement.querySelector('.neu-scroll-area__viewport') as HTMLElement;
    expect(viewport.style.maxHeight).toBe('12rem');
    expect(viewport.textContent).toContain('Scrollable');
  });

  it('omits an empty legend', async () => {
    await TestBed.configureTestingModule({ imports: [NeuFieldsetComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NeuFieldsetComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('legend')).toBeNull();
  });
});
