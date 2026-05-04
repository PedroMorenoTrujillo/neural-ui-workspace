import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NeuImageGalleryComponent } from './neu-image-gallery.component';

const ITEMS = [
  { src: 'https://picsum.photos/seed/gallery-a/800/600', alt: 'A', caption: 'First' },
  { src: 'https://picsum.photos/seed/gallery-b/800/600', alt: 'B', caption: 'Second' },
  { src: 'https://picsum.photos/seed/gallery-c/800/600', alt: 'C', caption: 'Third' },
];

describe('NeuImageGalleryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should render the first image by default', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();

    const image = f.nativeElement.querySelector('.neu-image-gallery__image') as HTMLImageElement;
    expect(image.src).toContain('gallery-a');
  });

  it('should honor initialIndex', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('initialIndex', 2);
    f.detectChanges();
    await f.whenStable();

    expect(f.componentInstance.activeIndex()).toBe(2);
  });

  it('goNext should advance and emit activeIndexChange', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();

    const emitted: number[] = [];
    f.componentInstance.activeIndexChange.subscribe((index) => emitted.push(index));
    f.componentInstance.goNext();

    expect(f.componentInstance.activeIndex()).toBe(1);
    expect(emitted).toEqual([1]);
  });

  it('goPrev should not go below zero', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();

    f.componentInstance.goPrev();
    expect(f.componentInstance.activeIndex()).toBe(0);
  });

  it('thumbnail click should activate the clicked item', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.detectChanges();
    await f.whenStable();

    const thumbs = f.nativeElement.querySelectorAll('.neu-image-gallery__thumb');
    (thumbs[1] as HTMLButtonElement).click();
    f.detectChanges();

    expect(f.componentInstance.activeIndex()).toBe(1);
  });

  it('should hide thumbnails when showThumbnails=false', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('showThumbnails', false);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-image-gallery__thumbs')).toBeFalsy();
  });

  it('should apply left thumbnail layout', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('thumbnailPosition', 'left');
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-image-gallery--left')).toBeTruthy();
  });

  it('should hide counter when showCounter=false', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('showCounter', false);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-image-gallery__counter')).toBeFalsy();
  });

  it('should render non-clickable image when viewerEnabled=false', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('viewerEnabled', false);
    f.detectChanges();
    await f.whenStable();

    expect(f.nativeElement.querySelector('.neu-image-gallery__viewer-trigger')).toBeFalsy();
    expect(f.nativeElement.querySelector('.neu-image-gallery__image')).toBeTruthy();
  });

  it('next button should be disabled on the last item', async () => {
    const f = TestBed.createComponent(NeuImageGalleryComponent);
    f.componentRef.setInput('items', ITEMS);
    f.componentRef.setInput('initialIndex', 2);
    f.detectChanges();
    await f.whenStable();

    const next = f.nativeElement.querySelector(
      '.neu-image-gallery__nav--next',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });
});
