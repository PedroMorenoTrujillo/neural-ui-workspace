import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuGalleryCaptionDirective, NeuGalleryComponent, NeuGalleryItemDirective } from './neu-gallery.component';

const ITEMS = [
  { src: 'a.jpg', alt: 'A', caption: 'First' },
  { src: 'b.jpg', alt: 'B', caption: 'Second' },
  { src: 'c.jpg', alt: 'C', caption: 'Third' },
];

@Component({ standalone: true, imports: [NeuGalleryComponent, NeuGalleryItemDirective, NeuGalleryCaptionDirective], template: `<neu-gallery [items]="items"><ng-template neuGalleryItem let-item let-index="index"><span class="custom-item">{{ index }} {{ item.alt }}</span></ng-template><ng-template neuGalleryCaption let-item><span class="custom-caption">{{ item.caption }}</span></ng-template></neu-gallery>` })
class GalleryTemplateHost { readonly items = ITEMS; }

describe('NeuGalleryComponent', () => {
  beforeEach(async () => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }).compileComponents());

  it('renders an accessible active image and changes only on user navigation', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.detectChanges();
    const emitted: number[] = []; fixture.componentInstance.activeIndexChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.next(); fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1); expect(emitted).toEqual([1]);
    expect((fixture.nativeElement.querySelector('.neu-gallery__image') as HTMLImageElement).alt).toBe('B');
  });

  it('honors controlled activeIndex silently and wraps when circular', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.componentRef.setInput('activeIndex', 2); fixture.detectChanges();
    const emitted: number[] = []; fixture.componentInstance.activeIndexChange.subscribe((value) => emitted.push(value));
    expect(fixture.componentInstance.activeIndex()).toBe(2); expect(emitted).toEqual([]);
    fixture.componentRef.setInput('circular', true); fixture.detectChanges(); fixture.componentInstance.next();
    expect(fixture.componentInstance.activeIndex()).toBe(0);
  });

  it('supports preview transforms and Escape close', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.detectChanges();
    fixture.componentInstance.openPreview(); fixture.detectChanges(); fixture.componentInstance.zoom(1); fixture.componentInstance.rotate(90); fixture.componentInstance.flip('x');
    expect(fixture.componentInstance.transform()).toContain('rotate(90deg)');
    fixture.componentInstance.onPreviewKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.isPreviewOpen()).toBe(false);
  });

  it('restores the preview trigger after its dialog is removed', async () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('.neu-gallery__preview') as HTMLButtonElement;
    trigger.focus(); fixture.componentInstance.openPreview(); fixture.detectChanges(); fixture.componentInstance.closePreview(); fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(trigger); fixture.destroy();
  });

  it('supports keyboard and swipe navigation without document listeners', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.detectChanges();
    fixture.componentInstance.onKeydown(new KeyboardEvent('keydown', { key: 'End' })); expect(fixture.componentInstance.activeIndex()).toBe(2);
    fixture.componentInstance.onPointerDown(new PointerEvent('pointerdown', { clientX: 100, clientY: 0 })); fixture.componentInstance.onPointerUp(new PointerEvent('pointerup', { clientX: 20, clientY: 0 }));
    expect(fixture.componentInstance.activeIndex()).toBe(2);
  });

  it('covers the gallery interaction contract and transform boundaries', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS); fixture.componentRef.setInput('maxZoom', 1.25); fixture.detectChanges();
    const component = fixture.componentInstance;
    const zoom: number[] = []; const rotate: number[] = []; const flips: Array<{ x: number; y: number }> = []; const errors: number[] = [];
    component.zoomChange.subscribe((value) => zoom.push(value)); component.rotationChange.subscribe((value) => rotate.push(value)); component.flipChange.subscribe((value) => flips.push(value)); component.imageError.subscribe((value) => errors.push(value.index));
    component.zoom(-1); component.zoom(4); component.rotate(-90); component.flip('y'); component.resetTransform(); component.onImageError();
    expect(zoom).toEqual([1, 1.25]); expect(rotate).toEqual([270]); expect(flips[0].y).toBe(-1); expect(errors).toEqual([0]);
    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' })); component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); component.onKeydown(new KeyboardEvent('keydown', { key: 'Home' }));
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Unknown' })); component.onPreviewKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.itemContext().active).toBe(true); expect(component.captionContext().index).toBe(1); expect(component.downloadName()).toBe('b.jpg');
    component.openPreview(); component.openPreview(); component.closePreview(); component.closePreview();
    component.setActiveIndex(component.activeIndex()); fixture.componentRef.setInput('items', []); fixture.detectChanges(); expect(component.activeIndex()).toBe(0); expect(component.activeItem().src).toBe('');
    fixture.componentRef.setInput('items', [ITEMS[0]]); fixture.detectChanges(); component.openPreview(); fixture.detectChanges(); expect(fixture.nativeElement.querySelector('.neu-gallery__lightbox-nav')).toBeNull(); component.closePreview();
  });

  it('wires every rendered gallery control', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent); fixture.componentRef.setInput('items', ITEMS); fixture.componentRef.setInput('circular', true); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('.neu-gallery__surface') as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    const stage = root.querySelector('.neu-gallery__stage') as HTMLElement; stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 })); stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 })); (root.querySelector('.neu-gallery__image') as HTMLImageElement).dispatchEvent(new Event('error'));
    (root.querySelector('.neu-gallery__nav--prev') as HTMLButtonElement).click(); (root.querySelector('.neu-gallery__nav--next') as HTMLButtonElement).click();
    (root.querySelectorAll('.neu-gallery__thumbnail')[2] as HTMLButtonElement).click(); (root.querySelector('.neu-gallery__preview') as HTMLButtonElement).click(); fixture.detectChanges();
    const lightbox = root.querySelector('.neu-gallery__lightbox') as HTMLElement; lightbox.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 })); lightbox.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 })); (root.querySelector('.neu-gallery__toolbar button[aria-label="Zoom in"]') as HTMLButtonElement).click(); fixture.detectChanges(); (root.querySelector('.neu-gallery__toolbar button[aria-label="Zoom out"]') as HTMLButtonElement).click();
    root.querySelectorAll<HTMLButtonElement>('.neu-gallery__toolbar button').forEach((button) => button.click());
    (root.querySelector('.neu-gallery__download') as HTMLAnchorElement).click(); (root.querySelector('.neu-gallery__lightbox-nav--prev') as HTMLButtonElement).click(); (root.querySelector('.neu-gallery__lightbox-nav--next') as HTMLButtonElement).click(); (root.querySelector('.neu-gallery__backdrop') as HTMLElement)?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges(); expect(root.querySelector('.neu-gallery__backdrop')).toBeNull(); fixture.componentInstance.openPreview(); fixture.detectChanges(); (root.querySelector('.neu-gallery__backdrop') as HTMLElement).click(); expect(fixture.componentInstance.isPreviewOpen()).toBe(false);
  });

  it('renders strict projected item and caption templates', () => {
    const fixture = TestBed.createComponent(GalleryTemplateHost); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-item')?.textContent).toContain('0 A'); expect(fixture.nativeElement.querySelector('.custom-caption')?.textContent).toContain('First');
  });
});
