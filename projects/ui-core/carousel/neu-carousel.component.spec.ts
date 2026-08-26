import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuCarouselComponent, NeuCarouselFooterDirective, NeuCarouselHeaderDirective, NeuCarouselItemDirective } from './neu-carousel.component';

@Component({ standalone: true, imports: [NeuCarouselComponent, NeuCarouselHeaderDirective, NeuCarouselItemDirective, NeuCarouselFooterDirective], template: `<neu-carousel [items]="items"><ng-template neuCarouselHeader><strong class="custom-header">Header</strong></ng-template><ng-template neuCarouselItem let-item let-index="index"><span class="custom-item">{{ index }} {{ item }}</span></ng-template><ng-template neuCarouselFooter><strong class="custom-footer">Footer</strong></ng-template></neu-carousel>` })
class CarouselTemplateHost { readonly items = [1, 2]; }

describe('NeuCarouselComponent', () => {
  beforeEach(async () => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }).compileComponents());

  it('pages generic items truthfully, including a final partial page', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<string>);
    fixture.componentRef.setInput('items', ['a', 'b', 'c', 'd', 'e']); fixture.componentRef.setInput('numVisible', 2); fixture.componentRef.setInput('numScroll', 2); fixture.detectChanges();
    expect(fixture.componentInstance.pageCount()).toBe(3); fixture.componentInstance.next();
    expect(fixture.componentInstance.visibleItems()).toEqual(['c', 'd']); fixture.componentInstance.next();
    expect(fixture.componentInstance.visibleItems()).toEqual(['d', 'e']);
  });

  it('keeps controlled page updates silent, emits semantic user page changes, and reconciles items', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3, 4]); fixture.componentRef.setInput('page', 1); fixture.detectChanges();
    const emitted: number[] = []; fixture.componentInstance.pageChange.subscribe((event) => emitted.push(event.page));
    expect(fixture.componentInstance.page()).toBe(1); expect(emitted).toEqual([]);
    fixture.componentInstance.previous(); expect(emitted).toEqual([0]);
    fixture.componentRef.setInput('items', [1]); fixture.detectChanges(); expect(fixture.componentInstance.page()).toBe(0);
  });

  it('supports circular, keyboard, and swipe movement with disabled navigation state', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', [1, 2, 3]); fixture.componentRef.setInput('circular', true); fixture.detectChanges();
    fixture.componentInstance.previous(); expect(fixture.componentInstance.page()).toBe(2);
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'Home' })); expect(fixture.componentInstance.page()).toBe(0);
    fixture.componentInstance.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 0 })); fixture.componentInstance.onPointerUp(new PointerEvent('pointerup', { clientX: 20, clientY: 0 }));
    expect(fixture.componentInstance.page()).toBe(1);
  });

  it('covers carousel labels, edge states, orientation, and dynamic page reconciliation', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>);
    fixture.componentRef.setInput('items', []); fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.pageCount()).toBe(1); expect(component.canNext()).toBe(false); expect(component.itemLabel(0)).toContain('0'); expect(component.pageLabel(0)).toContain('1');
    fixture.componentRef.setInput('items', [1, 2, 3, 4, 5]); fixture.componentRef.setInput('numVisible', 9); fixture.componentRef.setInput('numScroll', 0); fixture.componentRef.setInput('orientation', 'vertical'); fixture.detectChanges();
    expect(component.effectiveVisible()).toBe(5); expect(component.effectiveScroll()).toBe(1); component.setPage(0, true); component.onKeydown(new KeyboardEvent('keydown', { key: 'End' })); component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' })); component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' })); component.onKeydown(new KeyboardEvent('keydown', { key: 'Unknown' }));
    component.onPointerDown(new PointerEvent('pointerdown', { clientX: 0, clientY: 100 })); component.onPointerUp(new PointerEvent('pointerup', { clientX: 0, clientY: 20 })); component.onPointerUp(new PointerEvent('pointerup', { clientX: 0, clientY: 20 }));
    fixture.componentRef.setInput('circular', false); fixture.componentRef.setInput('page', 100); fixture.detectChanges(); expect(component.page()).toBe(0);
  });

  it('wires navigation and indicator controls in the rendered generic surface', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2, 3]); fixture.componentRef.setInput('circular', true); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement; const surface = root.querySelector('.neu-carousel__root') as HTMLElement; surface.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); surface.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 })); surface.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 })); root.querySelectorAll<HTMLButtonElement>('.neu-carousel__nav').forEach((button) => button.click()); root.querySelectorAll<HTMLButtonElement>('.neu-carousel__indicators button').forEach((button) => button.click());
    expect(fixture.componentInstance.page()).toBe(2);
  });

  it('can hide navigators without affecting the semantic paging surface', () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2]); fixture.componentRef.setInput('showNavigators', false); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-carousel__nav')).toBeNull();
  });

  it('renders strict projected item, header, and footer templates', () => {
    const fixture = TestBed.createComponent(CarouselTemplateHost); fixture.detectChanges(); const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.custom-header')?.textContent).toContain('Header'); expect(root.querySelector('.custom-item')?.textContent).toContain('0 1'); expect(root.querySelector('.custom-footer')?.textContent).toContain('Footer');
  });

  it('advances with autoplay and cleans its interval on destruction', async () => {
    const fixture = TestBed.createComponent(NeuCarouselComponent<number>); fixture.componentRef.setInput('items', [1, 2]); fixture.componentRef.setInput('autoplayInterval', 1); fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 8)); expect(fixture.componentInstance.page()).toBe(1); fixture.destroy();
  });
});
