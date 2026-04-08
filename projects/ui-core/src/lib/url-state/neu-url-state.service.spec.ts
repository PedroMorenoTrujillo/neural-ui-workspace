import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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

  it('should return null for non-existent param', () => {
    const val = service.getParam('nonexistent')();
    expect(val).toBeNull();
  });

  it('should set and get a param', async () => {
    service.setParam('tab', 'preview');
    await TestBed.inject(Router).navigateByUrl('/?tab=preview');
    expect(service.getParam('tab')()).toBe('preview');
  });

  it('should remove a param when set to null', async () => {
    await router.navigateByUrl('/?menu=open');
    service.setParam('menu', null);
    await router.navigateByUrl('/');
    expect(service.getParam('menu')()).toBeNull();
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
});
