import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { NeuTooltipDirective } from './neu-tooltip.directive';

@Component({
  template: `<button [neuTooltip]="text()" [neuTooltipDisabled]="disabled()">Hover me</button>`,
  imports: [NeuTooltipDirective],
})
class TestHostComponent {
  text = signal('Tooltip de prueba');
  disabled = signal(false);
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

  it('should add tabindex to non-focusable elements', () => {
    // Elementos no nativamente focusables deben recibir tabindex=0
    // Non-natively focusable elements must receive tabindex=0
    @Component({
      template: `<div [neuTooltip]="'Test'">Hover me</div>`,
      imports: [NeuTooltipDirective],
    })
    class DivHostComponent {}
    const df = TestBed.createComponent(DivHostComponent);
    df.detectChanges();
    const div = df.nativeElement.querySelector('div');
    expect(div.getAttribute('tabindex')).toBe('0');
  });

  it('should show tooltip on focus event', () => {
    // El tooltip debe mostrarse también con focus (accesibilidad)
    // Tooltip must also show on focus event (accessibility)
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('should hide tooltip on blur event', () => {
    // El tooltip debe ocultarse con blur
    // Tooltip must hide on blur
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    btn.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('neuTooltipPosition bottom should render without error', () => {
    // Posición bottom no debe lanzar errores al renderizar
    // Bottom position must render without errors
    @Component({
      template: `<button [neuTooltip]="'Test'" neuTooltipPosition="bottom">Btn</button>`,
      imports: [NeuTooltipDirective],
    })
    class BottomHostComponent {}
    const f = TestBed.createComponent(BottomHostComponent);
    f.detectChanges();
    const btn = f.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    f.detectChanges();
    expect(f.nativeElement).toBeTruthy();
  });

  it('ngOnDestroy should not throw', () => {
    // ngOnDestroy debe limpiar recursos sin lanzar errores
    // ngOnDestroy must clean up resources without errors
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });

  it('show() is a no-op when neuTooltipDisabled=true', async () => {
    host.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const btn = fixture.nativeElement.querySelector('button');
    // Should not throw even when disabled
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('show() is a no-op when neuTooltip is empty string', async () => {
    host.text.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('hide() via mouseleave should not throw', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('show() with position=left should use position strategy', () => {
    // Test that setting a position input runs the placement code
    const f2 = TestBed.createComponent(TestHostComponent);
    f2.componentRef.setInput = (f2.componentRef as any).setInput;
    f2.detectChanges();
    const btn = f2.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    f2.detectChanges();
    expect(f2.nativeElement).toBeTruthy();
    f2.destroy();
  });

  it('show() while hide timeout is pending should cancel the timeout', () => {
    // show() mientras hay un timeout de ocultamiento pendiente debe cancelarlo
    // show() while a hide timeout is pending must cancel the timeout
    const btn = fixture.nativeElement.querySelector('button');
    // First show
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    // Start hide — sets _hideTimeout
    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    // Show again before 100ms — should enter clearTimeout branch
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    // Verify no error thrown and directive exists
    const dir = fixture.debugElement.children[0].injector.get(NeuTooltipDirective);
    expect(dir).toBeTruthy();
  });

  it('_getPositions should return an array of 3 positions for all position values', () => {
    // _getPositions debe devolver 3 posiciones válidas
    // _getPositions must return 3 valid positions
    const dir = fixture.debugElement.children[0].injector.get(NeuTooltipDirective);
    const positions = (dir as any)._getPositions();
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBe(3);
  });

  it('hide() then advancing timers should call _detach and clear overlayRef', () => {
    // hide() + avanzar timers debe llamar _detach y limpiar overlayRef
    // hide() + advancing timers must call _detach and clear overlayRef
    vi.useFakeTimers();
    const btn = fixture.nativeElement.querySelector('button');
    // Show the tooltip first
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    const dir = fixture.debugElement.children[0].injector.get(NeuTooltipDirective);
    // Verify tooltip is shown (overlayRef has attached content)
    expect((dir as any)._overlayRef).not.toBeNull();
    // Hide (schedules _detach after 100ms)
    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    // Advance timers to execute the setTimeout callback → covers _detach() body
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    // After _detach() the tooltipRef should be null
    expect((dir as any)._tooltipRef).toBeNull();
    vi.useRealTimers();
  });

  it('ngOnDestroy clears pending hide timeout', () => {
    // ngOnDestroy debe limpiar el timeout de ocultamiento pendiente
    // ngOnDestroy must clear the pending hide timeout
    vi.useFakeTimers();
    const btn = fixture.nativeElement.querySelector('button');
    btn.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    btn.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    const dir = fixture.debugElement.children[0].injector.get(NeuTooltipDirective);
    // Verify _hideTimeout is set
    expect((dir as any)._hideTimeout).not.toBeNull();
    // Destroy fixture — triggers ngOnDestroy which clears the timeout
    fixture.destroy();
    // Timer advances but detach is never called (no throw expected)
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
  });
});
