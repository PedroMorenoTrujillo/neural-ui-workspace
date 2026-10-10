import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { NeuUrlStateService } from './neu-url-state.service';

describe('NeuUrlStateService', () => {
  let service: NeuUrlStateService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();
    service = TestBed.inject(NeuUrlStateService);
    router = TestBed.inject(Router);
    await router.navigateByUrl('/');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clears an optimistic patch after its navigation settles', async () => {
    let finish!: (value: boolean) => void;
    vi.spyOn(router, 'navigate').mockReturnValue(new Promise<boolean>((resolve) => { finish = resolve; }));

    service.patchParams({ view: 'details' }, false);
    expect(service.params()['view']).toBe('details');
    finish(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.params()['view']).toBeUndefined();
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ replaceUrl: false }));
  });

  it('keeps a queued optimistic parameter visible while navigation is unresolved', async () => {
    let finish!: (value: boolean) => void;
    vi.spyOn(router, 'navigate').mockReturnValue(new Promise<boolean>((resolve) => { finish = resolve; }));
    service.setParam('view', 'details');
    await Promise.resolve();
    expect(service.params()['view']).toBe('details');
    finish(false);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.params()['view']).toBeUndefined();
  });

  it('does not let an older navigation clear a newer optimistic value', async () => {
    const finishes: Array<(value: boolean) => void> = [];
    vi.spyOn(router, 'navigate').mockImplementation(() => new Promise<boolean>((resolve) => { finishes.push(resolve); }));

    service.patchParams({ view: 'first' });
    service.patchParams({ view: 'second' });
    finishes[0](true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.params()['view']).toBe('second');
    finishes[1](true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.params()['view']).toBeUndefined();
  });

  it('preserves a queued write when a previous navigation finishes in the same turn', async () => {
    const finishes: Array<(value: boolean) => void> = [];
    vi.spyOn(router, 'navigate').mockImplementation(() => new Promise<boolean>((resolve) => { finishes.push(resolve); }));

    service.patchParams({ view: 'first' });
    finishes[0](true);
    service.setParam('view', 'queued', false);
    await Promise.resolve();
    expect(service.params()['view']).toBe('queued');
    expect(router.navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { view: 'queued' }, replaceUrl: false }));
    finishes[1](true);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.params()['view']).toBeUndefined();
  });

  it('should return null for non-existent param', () => {
    const val = service.getParam('nonexistent')();
    expect(val).toBeNull();
  });

  it('should set and get a param', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.setParam('tab', 'preview');

    expect(service.getParam('tab')()).toBe('preview');

    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should remove a param when set to null', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await router.navigateByUrl('/?menu=open');
    service.setParam('menu', null);

    expect(service.getParam('menu')()).toBeNull();

    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should patch multiple params at once', async () => {
    await router.navigateByUrl('/');
    await router.navigate([], {
      queryParams: { page: '2', q: 'angular' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    await router.navigateByUrl('/?page=2&q=angular');
    expect(service.getParam('page')()).toBe('2');
    expect(service.getParam('q')()).toBe('angular');
  });

  it('should read initial params from URL', async () => {
    await router.navigateByUrl('/?view=list');
    expect(service.getParam('view')()).toBe('list');
  });

  it('clearParams should remove all query params from URL', async () => {
    // clearParams debe eliminar todos los query params de la URL
    // clearParams must remove all query params from the URL
    await router.navigateByUrl('/?a=1&b=2');
    service.clearParams();
    await router.navigateByUrl('/');
    expect(service.getParam('a')()).toBeNull();
    expect(service.getParam('b')()).toBeNull();
  });

  it('should batch consecutive setParam calls into one navigation', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.setParam('page', '2');
    service.setParam('sort', 'name');

    expect(navigateSpy).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: '2', sort: 'name' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );
  });

  it('should flush pending setParam calls when patchParams runs', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.setParam('page', '2');
    service.patchParams({ sort: 'name', sortDir: 'asc' });

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: '2', sort: 'name', sortDir: 'asc' },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }),
    );

    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
  });

  it('should keep replaceUrl=false if any pending update requires history entry', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    service.setParam('page', '2');
    service.setParam('tab', 'details', false);

    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { page: '2', tab: 'details' },
        queryParamsHandling: 'merge',
        replaceUrl: false,
      }),
    );
  });
});
