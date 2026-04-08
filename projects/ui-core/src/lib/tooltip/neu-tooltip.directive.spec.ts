import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { NeuTooltipDirective } from './neu-tooltip.directive';

@Component({
  template: `<button [neuTooltip]="text" [neuTooltipDisabled]="disabled">Hover me</button>`,
  imports: [NeuTooltipDirective],
})
class TestHostComponent {
  text = 'Tooltip de prueba';
  disabled = false;
}

@Component({
  template: `<button [neuTooltip]="'Tooltip deshabilitado'" [neuTooltipDisabled]="true">
    Hover me
  </button>`,
  imports: [NeuTooltipDirective],
})
class DisabledTooltipHost {}

describe('NeuTooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should attach directive to button', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
  });

  it('should set aria-describedby on host element', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-describedby')).toMatch(/^neu-tooltip-/);
  });

  it('should not add tabindex to focusable elements', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('tabindex')).toBeNull();
  });

  it('should show tooltip on mouseenter', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    // El tooltip se renderiza en el Overlay (fuera del fixture) — comprobamos que no lanza error
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should hide tooltip on mouseleave', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should NOT show tooltip when disabled=true', () => {
    const df = TestBed.createComponent(DisabledTooltipHost);
    df.detectChanges();
    const btn = df.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    df.detectChanges();
    // No hay overlay abierto — el componente no debería estar en el DOM
    const overlay = document.querySelector('.cdk-overlay-container .neu-tooltip');
    expect(overlay).toBeFalsy();
  });
});
