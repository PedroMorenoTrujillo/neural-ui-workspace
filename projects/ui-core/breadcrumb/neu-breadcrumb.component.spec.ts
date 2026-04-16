import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuBreadcrumbComponent, NeuBreadcrumbItem } from './neu-breadcrumb.component';

const ITEMS: NeuBreadcrumbItem[] = [
  { label: 'Inicio', route: '/' },
  { label: 'Componentes', route: '/components' },
  { label: 'Breadcrumb' },
];

@Component({
  template: `<neu-breadcrumb [items]="items" [separator]="separator" />`,
  imports: [NeuBreadcrumbComponent],
})
class TestHostComponent {
  items = ITEMS;
  separator = '/';
}

describe('NeuBreadcrumbComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render a nav element', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeTruthy();
  });

  it('should render all item labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Inicio');
    expect(text).toContain('Componentes');
    expect(text).toContain('Breadcrumb');
  });

  it('should render links for items with routes', () => {
    const links = fixture.nativeElement.querySelectorAll('a.neu-breadcrumb__link');
    expect(links.length).toBe(2);
    expect(links[0].textContent.trim()).toBe('Inicio');
    expect(links[1].textContent.trim()).toBe('Componentes');
  });

  it('should render last item as current page', () => {
    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current).toBeTruthy();
    expect(current.textContent.trim()).toBe('Breadcrumb');
  });

  it('should use custom separator', async () => {
    const df = TestBed.createComponent(NeuBreadcrumbComponent);
    df.componentRef.setInput('items', ITEMS);
    df.componentRef.setInput('separator', '>');
    df.detectChanges();
    await df.whenStable();
    expect(df.nativeElement.textContent).toContain('>');
  });

  it('should display separator between items', () => {
    const separators = fixture.nativeElement.querySelectorAll('.neu-breadcrumb__separator');
    // 3 items → 2 separators
    expect(separators.length).toBe(2);
  });

  it('should render item with url as external anchor', async () => {
    // Ítems con url deben renderizarse como <a> con href y rel="noopener"
    // Items with url must render as <a> with href and rel="noopener"
    const urlItems: NeuBreadcrumbItem[] = [
      { label: 'Home', route: '/' },
      { label: 'Externo', url: 'https://neural.dev' },
      { label: 'Actual' },
    ];
    const df = TestBed.createComponent(NeuBreadcrumbComponent);
    df.componentRef.setInput('items', urlItems);
    df.detectChanges();
    await df.whenStable();
    const anchor = df.nativeElement.querySelector('a[href="https://neural.dev"]');
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toContain('noopener');
  });

  it('should render non-route, non-url middle item as span', async () => {
    // Ítems intermedios sin route ni url deben renderizarse como <span>
    // Middle items without route or url must render as <span>
    const spanItems: NeuBreadcrumbItem[] = [{ label: 'Catálogo' }, { label: 'Actual' }];
    const df = TestBed.createComponent(NeuBreadcrumbComponent);
    df.componentRef.setInput('items', spanItems);
    df.detectChanges();
    await df.whenStable();
    const spans = df.nativeElement.querySelectorAll('span.neu-breadcrumb__link');
    expect(spans.length).toBeGreaterThanOrEqual(1);
  });
});
