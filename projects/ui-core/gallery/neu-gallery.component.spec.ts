import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconChevronLeft } from '@neural-icons/core/icons/chevron-left';
import { iconChevronRight } from '@neural-icons/core/icons/chevron-right';
import { iconDownload } from '@neural-icons/core/icons/download';
import { iconFlipHorizontal } from '@neural-icons/core/icons/flip-horizontal';
import { iconFlipVertical } from '@neural-icons/core/icons/flip-vertical';
import { iconRotateCcw } from '@neural-icons/core/icons/rotate-ccw';
import { iconRotateCw } from '@neural-icons/core/icons/rotate-cw';
import { iconX } from '@neural-icons/core/icons/x';
import { iconZoomIn } from '@neural-icons/core/icons/zoom-in';
import { iconZoomOut } from '@neural-icons/core/icons/zoom-out';
import {
  NeuGalleryCaptionDirective,
  NeuGalleryComponent,
  NeuGalleryItemDirective,
} from './neu-gallery.component';

const ITEMS = [
  { src: 'a.jpg', alt: 'A', caption: 'First' },
  { src: 'b.jpg', alt: 'B', caption: 'Second' },
  { src: 'c.jpg', alt: 'C', caption: 'Third' },
];

@Component({
  standalone: true,
  imports: [NeuGalleryComponent, NeuGalleryItemDirective, NeuGalleryCaptionDirective],
  template: `<neu-gallery [items]="items"
    ><ng-template neuGalleryItem let-item let-index="index"
      ><span class="custom-item">{{ index }} {{ item.alt }}</span></ng-template
    ><ng-template neuGalleryCaption let-item
      ><span class="custom-caption">{{ item.caption }}</span></ng-template
    ></neu-gallery
  >`,
})
class GalleryTemplateHost {
  readonly items = ITEMS;
}

describe('NeuGalleryComponent', () => {
  beforeEach(async () =>
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNeuralIcons(iconChevronLeft, iconChevronRight, iconDownload, iconFlipHorizontal, iconFlipVertical, iconRotateCcw, iconRotateCw, iconX, iconZoomIn, iconZoomOut),
      ],
    }).compileComponents(),
  );

  it('ignores cancelled and short swipes, then navigates in both directions', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const gallery = fixture.componentInstance;
    gallery.onPointerUp(new PointerEvent('pointerup', { clientX: 20 }));
    gallery.onPointerDown(new PointerEvent('pointerdown', { clientX: 100 }));
    gallery.onPointerUp(new PointerEvent('pointerup', { clientX: 80 }));
    expect(gallery.activeIndex()).toBe(0);
    gallery.onPointerDown(new PointerEvent('pointerdown', { clientX: 100 }));
    gallery.onPointerCancel();
    gallery.onPointerUp(new PointerEvent('pointerup', { clientX: 20 }));
    expect(gallery.activeIndex()).toBe(0);
    gallery.onPointerDown(new PointerEvent('pointerdown', { clientX: 100 }));
    gallery.onPointerUp(new PointerEvent('pointerup', { clientX: 20 }));
    expect(gallery.activeIndex()).toBe(1);
    gallery.onPointerDown(new PointerEvent('pointerdown', { clientX: 20 }));
    gallery.onPointerUp(new PointerEvent('pointerup', { clientX: 100 }));
    expect(gallery.activeIndex()).toBe(0);
  });

  it('handles absent and malformed items without emitting false image errors', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.detectChanges();
    const gallery = fixture.componentInstance;
    const errors: number[] = [];
    gallery.imageError.subscribe((event) => errors.push(event.index));
    gallery.onImageError();
    gallery.setActiveIndex(Number.POSITIVE_INFINITY);
    expect(gallery.activeIndex()).toBe(0);
    expect(gallery.downloadName()).toBe('image');
    expect(errors).toEqual([]);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    gallery.onImageError();
    expect(errors).toEqual([0]);
  });

  it('keeps preview status events idempotent', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const gallery = fixture.componentInstance;
    const states: boolean[] = [];
    gallery.previewChange.subscribe((value) => states.push(value));
    gallery.openPreview();
    gallery.openPreview();
    gallery.closePreview();
    gallery.closePreview();
    expect(states).toEqual([true, false]);
  });

  it('renders an accessible active image and changes only on user navigation', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.activeIndexChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    expect(emitted).toEqual([1]);
    expect(
      (fixture.nativeElement.querySelector('.neu-gallery__image') as HTMLImageElement).alt,
    ).toBe('B');
  });

  it('honors controlled activeIndex silently and wraps when circular', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('activeIndex', 2);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.activeIndexChange.subscribe((value) => emitted.push(value));
    expect(fixture.componentInstance.activeIndex()).toBe(2);
    expect(emitted).toEqual([]);
    fixture.componentRef.setInput('circular', true);
    fixture.detectChanges();
    fixture.componentInstance.next();
    expect(fixture.componentInstance.activeIndex()).toBe(2);
    expect(emitted).toEqual([0]);
    fixture.componentRef.setInput('activeIndex', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(0);
  });

  it('preserves an uncontrolled proposal across item replacement and clamps it silently', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.activeIndexChange.subscribe((value) => emitted.push(value));
    fixture.componentInstance.setActiveIndex(2, true);
    fixture.componentRef.setInput('items', ITEMS.slice(0, 2));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1);
    expect(emitted).toEqual([2]);
  });

  it('supports preview transforms and delegates Escape close to the modal focus policy', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    fixture.componentInstance.zoom(1);
    fixture.componentInstance.rotate(90);
    fixture.componentInstance.flip('x');
    expect(fixture.componentInstance.transform()).toContain('rotate(90deg)');
    (document.querySelector('.neu-iv') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(fixture.componentInstance.isPreviewOpen()).toBe(false);
  });

  it('uses shared initial focus, containment, and restoration for preview', async () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector(
      '.neu-gallery__preview',
    ) as HTMLButtonElement;
    fixture.componentInstance.openPreview(trigger);
    expect(document.activeElement).toBe(trigger);
    fixture.detectChanges();
    await fixture.whenStable();
    const preview = document.querySelector('.neu-iv') as HTMLElement;
    const controls = Array.from(preview.querySelectorAll<HTMLElement>('button, a[href]')).filter(
      (control) => !control.hasAttribute('disabled'),
    );
    expect(document.activeElement).toBe(controls[0]);
    controls[controls.length - 1].focus();
    controls[controls.length - 1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    expect(document.activeElement).toBe(controls[0]);
    fixture.componentInstance.closePreview();
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(trigger);
    fixture.destroy();
  });

  it('supports keyboard and swipe navigation without document listeners', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    fixture.componentInstance['onKeydown'](new KeyboardEvent('keydown', { key: 'End' }));
    expect(fixture.componentInstance.activeIndex()).toBe(2);
    fixture.componentInstance.onPointerDown(
      new PointerEvent('pointerdown', { clientX: 100, clientY: 0 }),
    );
    fixture.componentInstance.onPointerUp(
      new PointerEvent('pointerup', { clientX: 20, clientY: 0 }),
    );
    expect(fixture.componentInstance.activeIndex()).toBe(2);
  });

  it('covers the gallery interaction contract and transform boundaries', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('maxZoom', 1.25);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const zoom: number[] = [];
    const rotate: number[] = [];
    const flips: Array<{ x: number; y: number }> = [];
    const errors: number[] = [];
    component.zoomChange.subscribe((value) => zoom.push(value));
    component.rotationChange.subscribe((value) => rotate.push(value));
    component.flipChange.subscribe((value) => flips.push(value));
    component.imageError.subscribe((value) => errors.push(value.index));
    component.openPreview();
    component.zoom(-1);
    component.zoom(4);
    component.rotate(-90);
    component.flip('y');
    component.resetTransform();
    component.onImageError();
    expect(zoom).toEqual([0.25, 1.25]);
    expect(rotate).toEqual([270]);
    expect(flips[0].y).toBe(-1);
    expect(errors).toEqual([0]);
    component['onKeydown'](new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    component['onKeydown'](new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    component['onKeydown'](new KeyboardEvent('keydown', { key: 'Home' }));
    component['onKeydown'](new KeyboardEvent('keydown', { key: 'Unknown' }));
    component.onPreviewKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.itemContext().active).toBe(true);
    expect(component.captionContext().index).toBe(1);
    expect(component.downloadName()).toBe('b.jpg');
    component.openPreview();
    component.openPreview();
    component.closePreview();
    component.closePreview();
    component.setActiveIndex(component.activeIndex());
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(0);
    expect(component.activeItem().src).toBe('');
    fixture.componentRef.setInput('items', [ITEMS[0]]);
    fixture.detectChanges();
    component.openPreview();
    fixture.detectChanges();
    expect(document.querySelector('.neu-iv__arrow')).toBeNull();
    component.closePreview();
  });

  it('wires every rendered gallery control', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('circular', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('.neu-gallery__surface') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight' }),
    );
    const stage = root.querySelector('.neu-gallery__stage') as HTMLElement;
    stage.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 }));
    stage.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 }));
    (root.querySelector('.neu-gallery__image') as HTMLImageElement).dispatchEvent(
      new Event('error'),
    );
    (root.querySelector('.neu-gallery__nav--prev') as HTMLButtonElement).click();
    (root.querySelector('.neu-gallery__nav--next') as HTMLButtonElement).click();
    (root.querySelectorAll('.neu-gallery__thumbnail')[2] as HTMLButtonElement).click();
    (root.querySelector('.neu-gallery__preview') as HTMLButtonElement).click();
    fixture.detectChanges();
    const lightbox = document.querySelector('.neu-iv__stage') as HTMLElement;
    lightbox.dispatchEvent(new PointerEvent('pointerdown', { clientX: 90, clientY: 0 }));
    lightbox.dispatchEvent(new PointerEvent('pointerup', { clientX: 20, clientY: 0 }));
    (
      document.querySelector('.neu-iv__toolbar button[aria-label="Zoom in"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (
      document.querySelector('.neu-iv__toolbar button[aria-label="Zoom out"]') as HTMLButtonElement
    ).click();
    document
      .querySelectorAll<HTMLButtonElement>('.neu-iv__toolbar button:not(.neu-iv__btn--close)')
      .forEach((button) => button.click());
    (document.querySelector('.neu-iv__btn[download]') as HTMLAnchorElement).click();
    (document.querySelector('.neu-iv__arrow--prev') as HTMLButtonElement).click();
    (document.querySelector('.neu-iv__arrow--next') as HTMLButtonElement).click();
    (document.querySelector('.neu-iv') as HTMLElement)?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape' }),
    );
    fixture.detectChanges();
    expect(document.querySelector('.neu-iv')).toBeNull();
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    (document.querySelector('.neu-iv') as HTMLElement).click();
    expect(fixture.componentInstance.isPreviewOpen()).toBe(false);
  });

  it('renders uniform icon-only toolbar controls with accessible labels and tooltips', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('zoomOutLabel', 'Alejar');
    fixture.componentRef.setInput('zoomInLabel', 'Acercar');
    fixture.componentRef.setInput('rotateLeftLabel', 'Girar a la izquierda');
    fixture.componentRef.setInput('rotateRightLabel', 'Girar a la derecha');
    fixture.componentRef.setInput('flipHorizontalLabel', 'Voltear horizontalmente');
    fixture.componentRef.setInput('flipVerticalLabel', 'Voltear verticalmente');
    fixture.componentRef.setInput('resetLabel', 'Restablecer imagen');
    fixture.componentRef.setInput('downloadLabel', 'Descargar imagen');
    fixture.componentRef.setInput('closeLabel', 'Cerrar vista ampliada');
    fixture.detectChanges();
    fixture.componentInstance.openPreview();
    fixture.detectChanges();

    const controls = Array.from(
      document.querySelectorAll<HTMLElement>('.neu-iv__toolbar .neu-iv__btn'),
    );
    expect(controls).toHaveLength(9);
    expect(controls.map((control) => control.getAttribute('aria-label'))).toEqual([
      'Acercar',
      'Alejar',
      'Girar a la izquierda',
      'Girar a la derecha',
      'Voltear horizontalmente',
      'Voltear verticalmente',
      'Descargar imagen',
      'Restablecer imagen',
      'Cerrar vista ampliada',
    ]);
    expect(controls.map((control) => control.getAttribute('title'))).toEqual(
      controls.map((control) => control.getAttribute('aria-label')),
    );
    expect(controls.map((control) => control.getAttribute('title'))).toEqual(
      controls.map((control) => control.getAttribute('aria-label')),
    );
    expect(controls.every((control) => control.querySelector('neu-icon-outlet'))).toBe(true);
    expect(controls.every((control) => !!control.getAttribute('aria-label'))).toBe(true);
  });

  it('renders strict projected item and caption templates', () => {
    const fixture = TestBed.createComponent(GalleryTemplateHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.custom-item')?.textContent).toContain('0 A');
    expect(fixture.nativeElement.querySelector('.custom-caption')?.textContent).toContain('First');
    fixture.nativeElement.querySelector('.neu-gallery__preview').click();
    fixture.detectChanges();
    expect(document.querySelector('.neu-iv__caption .custom-caption')?.textContent).toContain('First');
  });

  it('keeps the main counter opt-in and the preview counter always present', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-gallery__stage-counter')).toBeNull();
    fixture.componentRef.setInput('showCounter', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-gallery__stage-counter')?.textContent).toContain('1 / 3');
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    expect(document.querySelector('.neu-iv__counter')?.textContent).toContain('1 / 3');
  });

  it('makes previewEnabled=false noninteractive without disabling thumbnail navigation', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('previewEnabled', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.neu-gallery__preview')).toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-gallery__preview--static')).not.toBeNull();
    fixture.componentInstance.openPreview();
    expect(document.querySelector('.neu-iv')).toBeNull();
    (fixture.nativeElement.querySelectorAll('.neu-gallery__thumbnail')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(1);
  });

  it('keeps decorative alt empty and gives its thumbnail an explicit name', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', [{ src: 'decorative.jpg', alt: '' }, ITEMS[1]]);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.neu-gallery__image') as HTMLImageElement).alt).toBe('');
    expect(fixture.nativeElement.querySelector('.neu-gallery__thumbnail')?.getAttribute('aria-label')).toBe('Gallery thumbnails 1');
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    expect((document.querySelector('.neu-iv__img') as HTMLImageElement).alt).toBe('');
  });

  it('uses a logical start thumbnail strip and preserves contain by default', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('thumbnailPosition', 'start');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-gallery__surface--start')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-gallery__thumbnails--start')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.neu-gallery__image--contain')).not.toBeNull();
    fixture.componentRef.setInput('objectFit', 'cover');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.neu-gallery__image--contain')).toBeNull();
  });

  it('shares wheel zoom, below-one zoom, pan/swipe precedence and transform reset', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const proposals: number[] = [];
    const zooms: number[] = [];
    fixture.componentInstance.activeIndexChange.subscribe((value) => proposals.push(value));
    fixture.componentInstance.zoomChange.subscribe((value) => zooms.push(value));
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    const stage = document.querySelector('.neu-iv__stage') as HTMLElement;
    const wheel = new WheelEvent('wheel', { deltaY: -1, cancelable: true, bubbles: true });
    stage.dispatchEvent(wheel);
    fixture.detectChanges();
    expect(wheel.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.zoomLevel()).toBe(1.1);
    expect(zooms).toEqual([1.1]);
    const pointer = (type: string, x: number) =>
      stage.dispatchEvent(Object.assign(new Event(type, { bubbles: true }), { button: 0, pointerId: 7, clientX: x, clientY: 10 }));
    pointer('pointerdown', 100);
    pointer('pointermove', 20);
    pointer('pointerup', 20);
    fixture.detectChanges();
    expect(proposals).toEqual([]);
    expect(fixture.componentInstance.transform()).toContain('-80px');
    fixture.componentInstance.zoom(-0.2);
    fixture.detectChanges();
    expect(fixture.componentInstance.zoomLevel()).toBe(0.9);
    expect(fixture.componentInstance.transform()).toContain('translate(0px, 0px)');
    pointer('pointerdown', 100);
    pointer('pointerup', 20);
    fixture.detectChanges();
    expect(proposals).toEqual([1]);
    expect(fixture.componentInstance.zoomLevel()).toBe(1);
    expect(fixture.componentInstance.transform()).toContain('rotate(0deg)');
  });

  it('keeps controlled preview on the applied item until parent acceptance', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.componentRef.setInput('activeIndex', 0);
    fixture.detectChanges();
    const proposals: number[] = [];
    fixture.componentInstance.activeIndexChange.subscribe((value) => proposals.push(value));
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    fixture.componentInstance.next();
    fixture.detectChanges();
    expect(proposals).toEqual([1]);
    expect((document.querySelector('.neu-iv__img') as HTMLImageElement).getAttribute('src')).toBe('a.jpg');
    fixture.componentRef.setInput('activeIndex', 1);
    fixture.detectChanges();
    expect((document.querySelector('.neu-iv__img') as HTMLImageElement).getAttribute('src')).toBe('b.jpg');
  });

  it('resets transforms when a new item occupies the same positional index', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    fixture.componentInstance.openPreview();
    fixture.detectChanges();
    fixture.componentInstance.zoom(0.5);
    fixture.componentInstance.rotate(90);
    expect(fixture.componentInstance.zoomLevel()).toBe(1.5);
    fixture.componentRef.setInput('items', [{ src: 'replaced.jpg', alt: 'Replacement' }, ...ITEMS.slice(1)]);
    fixture.detectChanges();
    expect(fixture.componentInstance.zoomLevel()).toBe(1);
    expect(fixture.componentInstance.transform()).toContain('rotate(0deg)');
  });

  it('keeps one preview engine across 50 open/close cycles and destroys without an overlay', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const changes: boolean[] = [];
    fixture.componentInstance.previewChange.subscribe((value) => changes.push(value));
    for (let index = 0; index < 50; index++) {
      fixture.componentInstance.openPreview();
      fixture.detectChanges();
      expect(document.querySelectorAll('.neu-iv')).toHaveLength(1);
      fixture.componentInstance.next();
      fixture.detectChanges();
      fixture.componentInstance.zoom(0.25);
      expect(fixture.componentInstance.zoomLevel()).toBe(1.25);
      fixture.componentInstance.closePreview();
      fixture.detectChanges();
      expect(document.querySelectorAll('.neu-iv')).toHaveLength(0);
    }
    expect(changes).toHaveLength(100);
    fixture.destroy();
    expect(document.querySelector('.neu-iv')).toBeNull();
  });

  it('reports a failed active image and cancels a swipe without changing selection', () => {
    const fixture = TestBed.createComponent(NeuGalleryComponent);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const errors: unknown[] = [];
    fixture.componentInstance.imageError.subscribe((event) => errors.push(event));
    const stage = fixture.nativeElement.querySelector('.neu-gallery__stage') as HTMLElement;
    stage.querySelector('img')!.dispatchEvent(new Event('error'));
    expect(errors).toEqual([{ item: ITEMS[0], index: 0 }]);
    const down = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(down, 'clientX', { value: 20 });
    Object.defineProperty(down, 'clientY', { value: 0 });
    stage.dispatchEvent(down);
    stage.dispatchEvent(new Event('pointercancel', { bubbles: true }));
    const up = new Event('pointerup', { bubbles: true });
    Object.defineProperty(up, 'clientX', { value: 100 });
    stage.dispatchEvent(up);
    expect(fixture.componentInstance.activeIndex()).toBe(0);
  });
});
