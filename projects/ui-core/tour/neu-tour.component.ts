import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, Overlay, type ConnectedPosition } from '@angular/cdk/overlay';
import { DomPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  afterRenderEffect,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuIdGenerator } from '@neural-ui/core/internal';

export interface NeuTourStep {
  readonly title: string;
  readonly description: string;
  readonly targetId: string;
}

const positions: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
];

@Component({
  selector: 'neu-tour',
  imports: [CdkConnectedOverlay, CdkTrapFocus, NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #spotlight>
      @if (marker(); as rect) {
        <div class="neu-tour__marker" aria-hidden="true"
          [style.left.px]="rect.left" [style.top.px]="rect.top"
          [style.width.px]="rect.width" [style.height.px]="rect.height"></div>
      }
    </ng-template>
    <ng-template cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin()"
      [cdkConnectedOverlayOpen]="!!target()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="12"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-backdrop-noop-animation'"
      (attach)="attachSpotlight()"
      (detach)="detachSpotlight()"
      [cdkConnectedOverlayDisableClose]="true"
      (positionChange)="updateMarker()"
      (overlayKeydown)="onKeydown($event)">
      @if (step(); as current) {
        <section role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="progressId + ' ' + descriptionId" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          <p class="neu-tour__progress" [id]="progressId">{{ labels.progress(index() + 1, steps().length) }}</p>
          <h2 [id]="titleId" tabindex="-1" cdkFocusInitial #heading>{{ current.title }}</h2>
          <p [id]="descriptionId">{{ current.description }}</p>
          <div class="neu-tour__actions">
            <button neu-button type="button" size="sm" tone="neutral" variant="ghost" (neuClick)="dismissed.emit()">{{ labels.skip }}</button>
            @if (index() > 0) {
              <button neu-button type="button" size="sm" tone="neutral" variant="outline" (neuClick)="indexChange.emit(index() - 1)">
                {{ labels.back }}
              </button>
            }
            @if (index() + 1 < steps().length) {
              <button neu-button type="button" size="sm" (neuClick)="indexChange.emit(index() + 1)">{{ labels.next }}</button>
            } @else {
              <button neu-button type="button" size="sm" (neuClick)="completed.emit()">{{ labels.done }}</button>
            }
          </div>
        </section>
      }
    </ng-template>
  `,
  styles: `
    section {
      box-sizing: border-box;
      inline-size: min(22rem, calc(100vw - 24px));
      max-block-size: calc(100dvh - 24px);
      overflow: auto;
      padding: 1rem;
      border: 1px solid var(--neu-border, currentColor);
      border-radius: .5rem;
      background: var(--neu-surface, Canvas);
      color: var(--neu-text, CanvasText);
    }
    h2 { margin: 0; font-size: 1.125rem; }
    p { margin-block: .5rem 1rem; }
    .neu-tour__progress { margin-block: 0 .4rem; color: var(--neu-text-muted, currentColor); font-size: .8125rem; font-weight: 600; }
    .neu-tour__actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .neu-tour__marker {
      position: fixed;
      pointer-events: none;
      outline: 2px solid var(--neu-border-focus, Highlight);
      outline-offset: 2px;
      border-radius: .25rem;
      box-shadow: 0 0 0 150vmax rgb(0 0 0 / .42);
    }
  `,
})
export class NeuTourComponent {
  readonly steps = input.required<readonly NeuTourStep[]>();
  readonly index = input(0);
  readonly open = input(false);
  readonly indexChange = output<number>();
  readonly dismissed = output<void>();
  readonly completed = output<void>();
  readonly targetMissing = output<string>();

  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly id = inject(NeuIdGenerator).getId('neu-tour-');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private readonly connectedOverlay = viewChild(CdkConnectedOverlay);
  private readonly spotlight = viewChild.required<TemplateRef<unknown>>('spotlight');
  private readonly viewContainer = inject(ViewContainerRef);
  private spotlightOutlet: DomPortalOutlet | null = null;
  protected readonly positions = positions;
  protected readonly scrollStrategy = inject(Overlay).scrollStrategies.reposition();
  protected readonly titleId = this.id + '-title';
  protected readonly descriptionId = this.id + '-description';
  protected readonly progressId = this.id + '-progress';
  protected readonly labels = /^es(?:-|$)/i.test(inject(NEURAL_LOCALE))
    ? { skip: 'Omitir', back: 'Anterior', next: 'Siguiente', done: 'Terminar',
        progress: (current: number, total: number) => `Paso ${current} de ${total}` }
    : { skip: 'Skip', back: 'Previous', next: 'Next', done: 'Done',
        progress: (current: number, total: number) => `Step ${current} of ${total}` };
  protected readonly step = computed(() => this.open() ? this.steps()[this.index()] : undefined);
  protected readonly target = signal<HTMLElement | null>(null);
  protected readonly marker = signal<Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> | null>(null);
  protected readonly origin = computed(() => this.target() ?? { x: 0, y: 0 });

  constructor() {
    this.destroyRef.onDestroy(() => this.detachSpotlight());
    afterRenderEffect((onCleanup) => {
      if (!this.browser) return;
      const step = this.step();
      if (!step) {
        this.target.set(null);
        this.marker.set(null);
        return;
      }
      const win = this.document.defaultView;
      const resizeObserver = win?.ResizeObserver ? new win.ResizeObserver(this.updateMarker) : null;
      let last: HTMLElement | null | undefined;
      const resolve = () => {
        const candidate = this.document.getElementById(step.targetId);
        if (candidate === last) return;
        resizeObserver?.disconnect();
        last = candidate;
        if (candidate) resizeObserver?.observe(candidate);
        this.target.set(candidate);
        if (candidate) candidate.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        else untracked(() => this.targetMissing.emit(step.targetId));
        this.updateMarker();
      };
      resolve();
      if (!win) return;
      const observer = new win.MutationObserver(resolve);
      observer.observe(this.document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
      win.addEventListener('scroll', this.updateMarker, { capture: true, passive: true });
      const onResize = () => {
        const anchor = untracked(this.target);
        const rect = anchor?.getBoundingClientRect();
        if (anchor && rect && (rect.top < 0 || rect.bottom > win.innerHeight || rect.left < 0 || rect.right > win.innerWidth)) {
          anchor.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        }
        this.updateMarker();
      };
      win.addEventListener('resize', onResize, { passive: true });
      onCleanup(() => {
        observer.disconnect();
        resizeObserver?.disconnect();
        win.removeEventListener('scroll', this.updateMarker, true);
        win.removeEventListener('resize', onResize);
      });
    });

    effect(() => {
      if (this.step()) this.heading()?.nativeElement.focus();
    });
  }

  protected attachSpotlight(): void {
    const backdrop = this.connectedOverlay()?.overlayRef?.backdropElement;
    if (!backdrop) return;
    // The backdrop spans the viewport and is independent of the translated coachmark pane.
    this.spotlightOutlet = new DomPortalOutlet(backdrop);
    this.spotlightOutlet.attach(new TemplatePortal(this.spotlight(), this.viewContainer));
    this.updateMarker();
  }

  protected detachSpotlight(): void {
    this.spotlightOutlet?.detach();
    this.spotlightOutlet = null;
  }

  protected readonly updateMarker = (): void => {
    if (this.destroyRef.destroyed) return;
    const next = untracked(this.target)?.getBoundingClientRect() ?? null;
    this.marker.update((previous) => previous?.left === next?.left && previous?.top === next?.top &&
      previous?.width === next?.width && previous?.height === next?.height ? previous : next);
  };

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.dismissed.emit();
    }
  }
}
