import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, Overlay, type ConnectedPosition } from '@angular/cdk/overlay';
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
    <ng-template cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin()"
      [cdkConnectedOverlayOpen]="!!target()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="12"
      [cdkConnectedOverlayHasBackdrop]="true"
      [cdkConnectedOverlayDisableClose]="true"
      (positionChange)="updateMarker()"
      (overlayKeydown)="onKeydown($event)">
      @if (step(); as current) {
        @if (marker(); as rect) {
          <div class="neu-tour__marker" aria-hidden="true"
            [style.left.px]="rect.left" [style.top.px]="rect.top"
            [style.width.px]="rect.width" [style.height.px]="rect.height"></div>
        }
        <section role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId" cdkTrapFocus [cdkTrapFocusAutoCapture]="true">
          <h2 [id]="titleId" tabindex="-1" cdkFocusInitial #heading>{{ current.title }}</h2>
          <p [id]="descriptionId">{{ current.description }}</p>
          <div class="neu-tour__actions">
            <button neu-button type="button" variant="outline" (neuClick)="dismissed.emit()">{{ labels.skip }}</button>
            @if (index() > 0) {
              <button neu-button type="button" variant="outline" (neuClick)="indexChange.emit(index() - 1)">
                {{ labels.back }}
              </button>
            }
            @if (index() + 1 < steps().length) {
              <button neu-button type="button" (neuClick)="indexChange.emit(index() + 1)">{{ labels.next }}</button>
            } @else {
              <button neu-button type="button" (neuClick)="completed.emit()">{{ labels.done }}</button>
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
    .neu-tour__actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .neu-tour__marker {
      position: fixed;
      pointer-events: none;
      outline: 2px solid var(--neu-color-primary, currentColor);
      outline-offset: 2px;
      border-radius: .25rem;
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
  protected readonly positions = positions;
  protected readonly scrollStrategy = inject(Overlay).scrollStrategies.reposition();
  protected readonly titleId = this.id + '-title';
  protected readonly descriptionId = this.id + '-description';
  protected readonly labels = /^es(?:-|$)/i.test(inject(NEURAL_LOCALE))
    ? { skip: 'Omitir', back: 'Anterior', next: 'Siguiente', done: 'Terminar' }
    : { skip: 'Skip', back: 'Previous', next: 'Next', done: 'Done' };
  protected readonly step = computed(() => this.open() ? this.steps()[this.index()] : undefined);
  protected readonly target = signal<HTMLElement | null>(null);
  protected readonly marker = signal<DOMRect | null>(null);
  protected readonly origin = computed(() => this.target() ?? { x: 0, y: 0 });

  constructor() {
    afterRenderEffect((onCleanup) => {
      if (!this.browser) return;
      const step = this.step();
      if (!step) {
        this.target.set(null);
        this.marker.set(null);
        return;
      }
      let last: HTMLElement | null | undefined;
      const resolve = () => {
        const candidate = this.document.getElementById(step.targetId);
        if (candidate === last) return;
        last = candidate;
        this.target.set(candidate);
        if (candidate) candidate.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        else untracked(() => this.targetMissing.emit(step.targetId));
        this.updateMarker();
      };
      resolve();
      const win = this.document.defaultView;
      if (!win) return;
      const observer = new win.MutationObserver(resolve);
      observer.observe(this.document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['id'] });
      win.addEventListener('scroll', this.updateMarker, { capture: true, passive: true });
      win.addEventListener('resize', this.updateMarker, { passive: true });
      onCleanup(() => {
        observer.disconnect();
        win.removeEventListener('scroll', this.updateMarker, true);
        win.removeEventListener('resize', this.updateMarker);
      });
    });

    effect(() => {
      if (this.step()) this.heading()?.nativeElement.focus();
    });
  }

  protected readonly updateMarker = (): void => {
    if (this.destroyRef.destroyed) return;
    const next = untracked(this.target)?.getBoundingClientRect() ?? null;
    this.marker.update((previous) => previous?.x === next?.x && previous?.y === next?.y &&
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
