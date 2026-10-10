import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  APP_ID,
  AfterRenderRef,
  DestroyRef,
  EffectRef,
  Injectable,
  Injector,
  PLATFORM_ID,
  Signal,
  TransferState,
  WritableSignal,
  afterNextRender,
  effect,
  inject,
  isSignal,
  makeStateKey,
  signal,
} from '@angular/core';
import { NEURAL_NOW, NEURAL_TIME_ZONE } from '@neural-ui/core/foundation';

interface InitialTemporalState {
  epoch: number;
  localDate: string;
  timeZone?: string;
}

/** @internal Request/client hydration bridge for initial “now” and “today” state. */
@Injectable({ providedIn: 'root' })
export class NeuInitialTemporalState {
  private readonly state = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly appId = inject(APP_ID);
  private readonly nowSource = inject(NEURAL_NOW);
  private readonly configuredTimeZone = inject(NEURAL_TIME_ZONE);
  private readonly key = makeStateKey<InitialTemporalState>(`neu-temporal-state-${this.appId}`);
  private readonly initial = this.readInitialState();
  private readonly hydrated = signal(false);

  constructor() {
    afterNextRender(() => this.hydrated.set(true));
  }

  now(): Date {
    return new Date(this.initial.epoch);
  }

  today(): Date {
    const [year, month, day] = this.initial.localDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /** Explicit application timezone, or the server timezone transferred for hydration. */
  timeZone(): string | undefined {
    return this.configuredTimeZone ?? this.initial.timeZone;
  }

  /** Initial transferred time during hydration, then the live configured clock. */
  currentNow(): Date {
    return this.hydrated() ? this.nowSource() : this.now();
  }

  private readInitialState(): InitialTemporalState {
    const transferred = this.state.get<InitialTemporalState | null>(this.key, null);
    if (transferred) return transferred;

    const sampled = this.nowSource();
    const initial = {
      epoch: sampled.getTime(),
      localDate: [
        String(sampled.getFullYear()).padStart(4, '0'),
        String(sampled.getMonth() + 1).padStart(2, '0'),
        String(sampled.getDate()).padStart(2, '0'),
      ].join('-'),
      timeZone:
        this.configuredTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? undefined,
    };
    if (isPlatformServer(this.platformId)) this.state.set(this.key, initial);
    return initial;
  }
}

interface MediaRecord {
  readonly matches: WritableSignal<boolean>;
  readonly subscribers: Set<WritableSignal<boolean>>;
  dispose(): void;
}

/** @internal Shared, lazy, post-hydration media-query state. */
@Injectable({ providedIn: 'root' })
export class NeuResponsiveState {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly records = new Map<string, MediaRecord>();

  observe(
    query: string | Signal<string>,
    destroyRef: DestroyRef = inject(DestroyRef),
  ): WritableSignal<boolean> {
    const result = signal(false);
    if (destroyRef.destroyed) return result;

    let destroyed = false;
    let pendingRender: AfterRenderRef | undefined;
    let queryEffect: EffectRef | undefined;
    let release: (() => void) | undefined;

    destroyRef.onDestroy(() => {
      if (destroyed) return;
      destroyed = true;
      pendingRender?.destroy();
      pendingRender = undefined;
      queryEffect?.destroy();
      queryEffect = undefined;
      const dispose = release;
      release = undefined;
      dispose?.();
    });

    pendingRender = afterNextRender(
      () => {
        pendingRender = undefined;
        if (destroyed || !isPlatformBrowser(this.platformId)) return;
        queryEffect = effect(
          () => {
            if (destroyed) return;
            const nextQuery = isSignal(query) ? query() : query;
            const dispose = release;
            release = undefined;
            dispose?.();
            if (destroyed) return;
            const nextRelease = this.acquire(nextQuery, result);
            if (destroyed) nextRelease();
            else release = nextRelease;
          },
          { injector: this.injector, manualCleanup: true },
        );
      },
      { injector: this.injector, manualCleanup: true },
    );

    return result;
  }

  private acquire(query: string, target: WritableSignal<boolean>): () => void {
    let record = this.records.get(query);
    if (!record) {
      const view = this.document.defaultView;
      const media =
        view && typeof view.matchMedia === 'function' ? view.matchMedia(query) : undefined;
      const matches = signal(media?.matches ?? false);
      const subscribers = new Set<WritableSignal<boolean>>();
      const update = (event?: MediaQueryListEvent) => {
        const next = event?.matches ?? media?.matches ?? false;
        matches.set(next);
        for (const subscriber of subscribers) subscriber.set(next);
      };
      if (typeof media?.addEventListener === 'function') media.addEventListener('change', update);
      else if (typeof media?.addListener === 'function') media.addListener(update);
      record = {
        matches,
        subscribers,
        dispose: () => {
          if (typeof media?.removeEventListener === 'function')
            media.removeEventListener('change', update);
          else if (typeof media?.removeListener === 'function') media.removeListener(update);
        },
      };
      this.records.set(query, record);
    }

    record.subscribers.add(target);
    target.set(record.matches());
    return () => {
      const current = this.records.get(query);
      if (!current) return;
      current.subscribers.delete(target);
      if (!current.subscribers.size) {
        current.dispose();
        this.records.delete(query);
      }
    };
  }
}
