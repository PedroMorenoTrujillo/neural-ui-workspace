import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuAccordionComponent, NeuAccordionItem } from './neu-accordion.component';

const ITEMS: NeuAccordionItem[] = [
  { id: '1', title: '¿Qué es NeuralUI?', content: 'Una librería de componentes Angular.' },
  { id: '2', title: '¿Cómo se instala?', content: 'npm install @neural-ui/core' },
  { id: '3', title: '¿Es accesible?', content: 'Sí, cumple WCAG 2.1 AA.' },
];

@Component({
  template: `<neu-accordion
    [items]="items"
    [multiple]="multiple"
    (panelToggle)="lastToggle = $event"
  />`,
  imports: [NeuAccordionComponent],
})
class TestHostComponent {
  items = ITEMS;
  multiple = false;
  lastToggle: { id: string; expanded: boolean } | undefined;
}

describe('NeuAccordionComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render all item titles', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('¿Qué es NeuralUI?');
    expect(text).toContain('¿Cómo se instala?');
    expect(text).toContain('¿Es accesible?');
  });

  it('should have all panels collapsed by default', () => {
    const expanded = fixture.nativeElement.querySelectorAll('[aria-expanded="true"]');
    expect(expanded.length).toBe(0);
  });

  it('should expand panel when header is clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button[aria-expanded]');
    btns[0].click();
    fixture.detectChanges();
    expect(btns[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('should show content when panel is expanded', () => {
    const btns = fixture.nativeElement.querySelectorAll('button[aria-expanded]');
    btns[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Una librería de componentes Angular.');
  });

  it('should emit panelToggle when header clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button[aria-expanded]');
    btns[1].click();
    fixture.detectChanges();
    expect(host.lastToggle).toEqual({ id: '2', expanded: true });
  });

  it('should collapse other panels in single mode', () => {
    const btns = fixture.nativeElement.querySelectorAll('button[aria-expanded]');
    btns[0].click();
    fixture.detectChanges();
    btns[1].click();
    fixture.detectChanges();
    const expanded = fixture.nativeElement.querySelectorAll('[aria-expanded="true"]');
    expect(expanded.length).toBe(1);
  });

  it('should allow multiple panels when multiple=true', async () => {
    const df = TestBed.createComponent(NeuAccordionComponent);
    df.componentRef.setInput('items', ITEMS);
    df.componentRef.setInput('multiple', true);
    df.detectChanges();
    await df.whenStable();
    const btns = df.nativeElement.querySelectorAll('button[aria-expanded]');
    btns[0].click();
    df.detectChanges();
    btns[1].click();
    df.detectChanges();
    const expanded = df.nativeElement.querySelectorAll('[aria-expanded="true"]');
    expect(expanded.length).toBe(2);
  });

  it('should expand items with expanded=true initially', async () => {
    const df = TestBed.createComponent(NeuAccordionComponent);
    df.componentRef.setInput('items', [
      { id: 'a', title: 'Abierto', content: 'Contenido', expanded: true },
      { id: 'b', title: 'Cerrado', content: 'Otro', expanded: false },
    ]);
    df.detectChanges();
    await df.whenStable();
    const expanded = df.nativeElement.querySelectorAll('[aria-expanded="true"]');
    expect(expanded.length).toBe(1);
  });
});
