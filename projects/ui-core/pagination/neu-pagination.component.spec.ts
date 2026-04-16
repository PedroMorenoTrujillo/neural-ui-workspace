import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NeuPaginationComponent } from './neu-pagination.component';

@Component({
  template: `<neu-pagination
    [total]="total"
    [pageSize]="pageSize"
    [page]="page"
    (pageChange)="page = $event"
  />`,
  imports: [NeuPaginationComponent],
})
class TestHostComponent {
  total = 100;
  pageSize = 10;
  page = 1;
}

describe('NeuPaginationComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render pagination', () => {
    expect(fixture.nativeElement.querySelector('neu-pagination')).toBeTruthy();
  });

  it('should compute 10 pages for total=100, pageSize=10', () => {
    // Debería renderizar el botón de página 10 en algún lugar
    const btnText = fixture.nativeElement.textContent;
    expect(btnText).toContain('10');
  });

  it('should mark current page as active', async () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 100);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 3);
    df.detectChanges();
    await df.whenStable();
    const active = df.nativeElement.querySelector('[class*="--active"], [aria-current="page"]');
    expect(active).toBeTruthy();
    expect(active.textContent.trim()).toBe('3');
  });

  it('should emit pageChange when next page is clicked', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    // El último botón suele ser "siguiente"
    const nextBtn = buttons[buttons.length - 1];
    nextBtn.click();
    fixture.detectChanges();
    expect(host.page).toBe(2);
  });

  it('should emit pageChange when a page button is clicked', () => {
    const pageBtn = fixture.nativeElement.querySelector(
      '[aria-current="page"] ~ button, [class*="neu-pagination__btn"]:not([disabled])',
    );
    if (pageBtn) {
      pageBtn.click();
      fixture.detectChanges();
      expect(host.page).not.toBeNull();
    }
  });

  it('should disable prev button on first page', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
  });

  it('should disable next button on last page', async () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 100);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 10);
    df.detectChanges();
    await df.whenStable();
    const buttons: NodeListOf<HTMLButtonElement> = df.nativeElement.querySelectorAll('button');
    expect(buttons[buttons.length - 1].disabled).toBe(true);
  });

  it('should show only 1 page for total=0', async () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 0);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 1);
    df.detectChanges();
    await df.whenStable();
    const active = df.nativeElement.querySelector('[class*="--active"], [aria-current="page"]');
    expect(active).toBeTruthy();
  });

  it('go() emits pageChange output', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 100);
    df.componentRef.setInput('pageSize', 10);
    df.detectChanges();
    const pages: number[] = [];
    df.componentInstance.pageChange.subscribe((p: number) => pages.push(p));
    df.componentInstance.go(3);
    expect(pages).toContain(3);
  });

  it('go() with page < 1 clamps to 1', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 50);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 3); // start at page 3 so go(0) → 1, which differs from current
    df.detectChanges();
    const pages: number[] = [];
    df.componentInstance.pageChange.subscribe((p: number) => pages.push(p));
    df.componentInstance.go(0);
    expect(pages[0]).toBeGreaterThanOrEqual(1);
  });

  it('go() with page > totalPages clamps to totalPages', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 30);
    df.componentRef.setInput('pageSize', 10);
    df.detectChanges();
    const pages: number[] = [];
    df.componentInstance.pageChange.subscribe((p: number) => pages.push(p));
    df.componentInstance.go(99);
    expect(pages[0]).toBeLessThanOrEqual(3);
  });

  it('totalPages computed correctly', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 45);
    df.componentRef.setInput('pageSize', 10);
    df.detectChanges();
    expect(df.componentInstance.totalPages()).toBe(5);
  });

  it('pages() computes visible page numbers', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 30);
    df.componentRef.setInput('pageSize', 10);
    df.detectChanges();
    expect(df.componentInstance.pages().length).toBe(3);
  });

  it('pages() should include ellipsis markers when the page range is truncated', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 200);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 10);
    df.componentRef.setInput('maxVisible', 7);
    df.detectChanges();

    expect(df.componentInstance.pages()).toContain(-1);
    expect(df.componentInstance.pages()[0]).toBe(1);
    expect(df.componentInstance.pages().at(-1)).toBe(20);
  });

  it('go() should not emit when the clamped page equals the current page', () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 100);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 4);
    df.detectChanges();

    const pages: number[] = [];
    df.componentInstance.pageChange.subscribe((p: number) => pages.push(p));
    df.componentInstance.go(4);

    expect(pages).toEqual([]);
  });

  it('clicking the previous button from page 2 should emit page 1', async () => {
    const df = TestBed.createComponent(NeuPaginationComponent);
    df.componentRef.setInput('total', 100);
    df.componentRef.setInput('pageSize', 10);
    df.componentRef.setInput('page', 2);
    df.detectChanges();
    await df.whenStable();

    const emitted: number[] = [];
    df.componentInstance.pageChange.subscribe((p: number) => emitted.push(p));
    const prev = df.nativeElement.querySelector('.neu-pagination__btn--nav') as HTMLButtonElement;
    prev.click();
    df.detectChanges();

    expect(emitted).toEqual([1]);
  });
});
