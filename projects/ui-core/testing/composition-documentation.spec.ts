import { TestBed } from '@angular/core/testing';
import { afterEach } from 'vitest';
import { NeuStepperComponent } from '../stepper/neu-stepper.component';
import { NeuSplitterComponent } from '../splitter/neu-splitter.component';
import { NeuScrollAreaComponent } from '../panel/neu-panel.component';
import { NeuPaginationComponent } from '../pagination/neu-pagination.component';
import { NeuFormFieldComponent } from '../form-field/neu-form-field.component';

describe('composition documentation regressions', () => {
  const originalLang = document.documentElement.lang;
  afterEach(() => { document.documentElement.lang = originalLang; });

  it('localizes step position and completion without losing the visible label', async () => {
    document.documentElement.lang = 'es';
    const f = TestBed.createComponent(NeuStepperComponent);
    f.componentRef.setInput('steps', [{ label: 'Contacto', completed: true }, { label: 'Entrega' }]);
    f.detectChanges();
    const button = f.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Contacto, paso 1 de 2, completado');
    document.documentElement.lang = 'en'; await Promise.resolve(); f.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Contacto, step 1 of 2, completed');
  });

  it('next proposes a step without marking the current one completed', () => {
    const f = TestBed.createComponent(NeuStepperComponent);
    const steps = [{ label: 'Contact' }, { label: 'Delivery' }];
    f.componentRef.setInput('steps', steps); f.detectChanges();
    const proposed: number[] = [];
    f.componentInstance.stepChange.subscribe(v => proposed.push(v));
    f.componentInstance.next();
    expect(proposed).toEqual([1]);
    expect(f.componentInstance.activeStep()).toBe(0);
    expect(steps[0]).not.toHaveProperty('completed');
  });

  it('localizes the splitter separator', async () => {
    document.documentElement.lang = 'en';
    const f = TestBed.createComponent(NeuSplitterComponent);
    f.componentRef.setInput('panes', [{ size: 50 }, { size: 50 }]); f.detectChanges();
    const handle = f.nativeElement.querySelector('[role=separator]');
    expect(handle.getAttribute('aria-label')).toBe('Separator 1');
    document.documentElement.lang = 'es'; await Promise.resolve(); f.detectChanges();
    expect(handle.getAttribute('aria-label')).toBe('Separador 1');
  });

  it('names enhanced scrollbars with the viewport label', () => {
    const f = TestBed.createComponent(NeuScrollAreaComponent);
    f.componentRef.setInput('enhanced', true);
    f.componentRef.setInput('ariaLabel', 'Recent orders'); f.detectChanges();
    const bars = [...f.nativeElement.querySelectorAll('[role=scrollbar]')] as HTMLElement[];
    expect(bars).toHaveLength(2);
    expect(bars.every(b => b.getAttribute('aria-label') === 'Recent orders')).toBe(true);
    expect(bars.every(b => b.getAttribute('aria-controls') === f.componentInstance.viewportId)).toBe(true);
  });

  it('renders both pagination gaps without duplicate-key warnings', () => {
    const warn = vi.spyOn(console, 'warn');
    const f = TestBed.createComponent(NeuPaginationComponent);
    f.componentRef.setInput('total', 1000); f.componentRef.setInput('page', 50); f.detectChanges();
    expect(f.componentInstance.pages().filter(p => p === -1)).toHaveLength(2);
    expect(warn.mock.calls.flat().some(v => String(v).includes('NG0955'))).toBe(false);
    warn.mockRestore();
  });

  it('keeps FormField description IDs stable, deduplicated and application-owned', () => {
    const f = TestBed.createComponent(NeuFormFieldComponent);
    f.componentRef.setInput('id', 'amount'); f.componentRef.setInput('hint', 'Before tax');
    f.componentRef.setInput('error', 'Required'); f.detectChanges();
    expect(f.componentInstance.mergeDescribedBy('external amount-hint', 'external')).toBe('external amount-hint amount-error');
    f.componentRef.setInput('error', ''); f.detectChanges();
    expect(f.componentInstance.mergeDescribedBy('external')).toBe('external amount-hint');
  });
});
