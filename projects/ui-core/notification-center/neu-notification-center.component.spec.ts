import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NEURAL_LOCALE } from '@neural-ui/core/foundation';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconBell } from '@neural-icons/core/icons/bell';
import {
  NeuNotificationCenterComponent,
  NeuNotificationService,
} from './neu-notification-center.component';

function mkSvc() {
  return TestBed.inject(NeuNotificationService);
}

function setup() {
  const f = TestBed.createComponent(NeuNotificationCenterComponent);
  f.detectChanges();
  return f;
}

beforeEach(() =>
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: NEURAL_LOCALE, useValue: 'es-ES' },
      NeuNotificationService,
      provideNeuralIcons(iconBell),
    ],
  }).compileComponents(),
);

afterEach(() => {
  vi.useRealTimers();
});

describe('NeuNotificationService', () => {
  it('push should add a notification', () => {
    const svc = mkSvc();
    const id = svc.push({ message: 'Hola' });
    expect(svc.notifications().length).toBe(1);
    expect(svc.notifications()[0].id).toBe(id);
  });

  it('push should default type to info', () => {
    const svc = mkSvc();
    svc.push({ message: 'Test' });
    expect(svc.notifications()[0].tone).toBe('info');
  });

  it('push should default duration to 5000ms', () => {
    const svc = mkSvc();
    svc.push({ message: 'Timed' });
    expect(svc.notifications()[0].duration).toBe(5000);
  });

  it('push with named tone leaves the default icon to the renderer', () => {
    const svc = mkSvc();
    svc.push({ tone: 'success', message: 'OK' });
    expect(svc.notifications()[0].icon).toBeUndefined();
  });

  it('push should preserve a custom icon', () => {
    const svc = mkSvc();
    svc.push({ tone: 'info', message: 'Custom', icon: 'bell', duration: 0 });
    expect(svc.notifications()[0].icon).toBe('bell');
  });

  it('push with positive duration should auto-dismiss after timeout', () => {
    vi.useFakeTimers();
    const svc = mkSvc();

    svc.push({ message: 'Temporal', duration: 1000 });
    expect(svc.notifications().length).toBe(1);

    vi.advanceTimersByTime(1000);
    expect(svc.notifications().length).toBe(0);

    vi.useRealTimers();
  });

  it('does not schedule auto-dismiss timers during server rendering', () => {
    vi.useFakeTimers();
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const svc = mkSvc();
    const baselineTimers = vi.getTimerCount();
    svc.push({ message: 'SSR', duration: 1000 });
    expect(vi.getTimerCount()).toBe(baselineTimers);
    expect(svc.notifications()).toHaveLength(1);
  });

  it('remove should delete the notification', () => {
    const svc = mkSvc();
    const id = svc.push({ message: 'Remove me' });
    svc.remove(id);
    expect(svc.notifications().length).toBe(0);
  });

  it('markAllRead should set read=true on all', () => {
    const svc = mkSvc();
    svc.push({ message: 'A' });
    svc.push({ message: 'B' });
    svc.markAllRead();
    expect(svc.notifications().every((n) => n.read)).toBe(true);
  });

  it('clearAll should empty the list', () => {
    const svc = mkSvc();
    svc.push({ message: 'A' });
    svc.push({ message: 'B' });
    svc.clearAll();
    expect(svc.notifications().length).toBe(0);
  });

  it('clearAll should cancel pending auto-dismiss timers', () => {
    vi.useFakeTimers();
    const svc = mkSvc();
    svc.push({ message: 'Timed', duration: 100 });

    svc.clearAll();
    vi.advanceTimersByTime(200);

    expect(svc.notifications().length).toBe(0);
  });

  it('unreadCount should count unread notifications', () => {
    const svc = mkSvc();
    svc.push({ message: 'A', duration: 0 });
    svc.push({ message: 'B', duration: 0 });
    expect(svc.unreadCount()).toBe(2);
    svc.markAllRead();
    expect(svc.unreadCount()).toBe(0);
  });

  it('notifications should be in reverse-push order', () => {
    const svc = mkSvc();
    const id1 = svc.push({ message: 'First' });
    const id2 = svc.push({ message: 'Second' });
    expect(svc.notifications()[0].id).toBe(id2); // newest first
  });
});

describe('NeuNotificationCenterComponent', () => {
  it('should create', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should render bell button', async () => {
    const f = setup();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nc__bell')).toBeTruthy();
  });

  it('should show badge when there are unread', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ message: 'Hola', duration: 0 });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nc__badge')).toBeTruthy();
  });

  it('should not show badge when no unread', async () => {
    const f = setup();
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nc__badge')).toBeNull();
  });

  it('_toggle should open panel', async () => {
    const f = setup();
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['_isOpen']()).toBe(true);
    expect(document.querySelector('.neu-nc__panel')).toBeTruthy();
  });

  it('opens from the rendered bell and closes from the CDK backdrop', async () => {
    const f = setup();
    (f.nativeElement.querySelector('.neu-nc__bell') as HTMLButtonElement).click();
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['_isOpen']()).toBe(true);
    (document.querySelector('.cdk-overlay-backdrop') as HTMLElement).click();
    f.detectChanges();
    await f.whenStable();
    expect(f.componentInstance['_isOpen']()).toBe(false);
  });

  it('_toggle again should close panel', async () => {
    const f = setup();
    f.componentInstance['_toggle']();
    f.componentInstance['_toggle']();
    expect(f.componentInstance['_isOpen']()).toBe(false);
  });

  it('_toggle should mark notifications as read after opening delay', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');

    svc.push({ message: 'Unread', duration: 0 });
    expect(svc.notifications()[0].read).toBe(false);

    f.componentInstance['_toggle']();
    vi.advanceTimersByTime(500);

    expect(svc.notifications()[0].read).toBe(true);
    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('cancels the delayed mutation when destroyed before 500ms', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');
    svc.push({ message: 'Unread', duration: 0 });

    f.componentInstance['_toggle']();
    f.destroy();
    vi.advanceTimersByTime(1000);

    expect(svc.unreadCount()).toBe(1);
    expect(markAllRead).not.toHaveBeenCalled();
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('cancels the current open-session mutation when closed before 500ms', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');
    svc.push({ message: 'Unread', duration: 0 });

    f.componentInstance['_toggle']();
    f.componentInstance['_toggle']();
    vi.advanceTimersByTime(1000);

    expect(f.componentInstance['_isOpen']()).toBe(false);
    expect(svc.unreadCount()).toBe(1);
    expect(markAllRead).not.toHaveBeenCalled();
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('replaces superseded open-session work across open-close-open', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');
    svc.push({ message: 'Unread', duration: 0 });

    f.componentInstance['_toggle']();
    vi.advanceTimersByTime(250);
    f.componentInstance['_toggle']();
    f.componentInstance['_toggle']();
    vi.advanceTimersByTime(250);

    expect(svc.unreadCount()).toBe(1);
    expect(markAllRead).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    vi.advanceTimersByTime(1000);

    expect(svc.unreadCount()).toBe(0);
    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('is safe to destroy after the delayed mutation already completed', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');
    svc.push({ message: 'Unread', duration: 0 });

    f.componentInstance['_toggle']();
    vi.advanceTimersByTime(500);
    f.destroy();
    vi.advanceTimersByTime(1000);

    expect(svc.unreadCount()).toBe(0);
    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('survives 100 destroy-before-delay cycles without a service mutation', async () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');

    for (let cycle = 0; cycle < 100; cycle += 1) {
      svc.push({ message: `Unread ${cycle}`, duration: 0 });
      const f = setup();
      f.componentInstance['_toggle']();
      f.detectChanges();
      f.destroy();
      vi.advanceTimersByTime(501);
      expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
      await Promise.resolve();
    }

    expect(svc.unreadCount()).toBe(100);
    expect(markAllRead).not.toHaveBeenCalled();
  });

  it('runs exactly one delayed mutation for each of 100 surviving opens', () => {
    vi.useFakeTimers();
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    const markAllRead = vi.spyOn(svc, 'markAllRead');

    for (let cycle = 0; cycle < 100; cycle += 1) {
      svc.push({ message: `Unread ${cycle}`, duration: 0 });
      f.componentInstance['_toggle']();
      vi.advanceTimersByTime(500);
      expect(svc.unreadCount()).toBe(0);
      f.componentInstance['_toggle']();
    }

    vi.advanceTimersByTime(1000);
    expect(markAllRead).toHaveBeenCalledTimes(100);
    expect(f.componentInstance['pendingMarkReadTimer']).toBeNull();
  });

  it('_relativeTime should return "Ahora" for recent dates', () => {
    const f = setup();
    const result = f.componentInstance['_relativeTime'](new Date());
    expect(result).toBe('Ahora');
  });

  it('_relativeTime should return minutes for > 1 min ago', () => {
    const f = setup();
    const past = new Date(Date.now() - 5 * 60000);
    expect(f.componentInstance['_relativeTime'](past)).toContain('5 min');
  });

  it('_relativeTime should return hours for > 60 min ago', () => {
    const f = setup();
    const past = new Date(Date.now() - 2 * 60 * 60000);
    expect(f.componentInstance['_relativeTime'](past)).toContain('2h');
  });

  it('_relativeTime should return days for > 24h ago', () => {
    const f = setup();
    const past = new Date(Date.now() - 3 * 24 * 60 * 60000);
    expect(f.componentInstance['_relativeTime'](past)).toContain('3d');
  });

  it('should render notification items when panel is open with notifications', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'success', title: 'Título', message: 'Cuerpo', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__item')).toBeTruthy();
    expect(document.body.textContent).toContain('Cuerpo');
  });

  it('should render item title when present', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'info', title: 'Mi título', message: 'msg', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(document.body.textContent).toContain('Mi título');
  });

  it('should not render title element when notification has no title', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'info', message: 'Solo mensaje', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__item-title')).toBeNull();
  });

  it('should mark notification as unread with class', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'warning', message: 'Alerta', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__item--unread')).toBeTruthy();
  });

  it('close button should remove the notification', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'danger', message: 'Error!', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const closeBtn = document.querySelector('.neu-nc__item-close') as HTMLButtonElement;
    closeBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(svc.notifications().length).toBe(0);
  });

  it('close button should expose an accessible aria-label', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'danger', message: 'Error!', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const closeBtn = document.querySelector('.neu-nc__item-close') as HTMLButtonElement;
    expect(closeBtn.getAttribute('aria-label')).toContain('Cerrar notificación:');
  });

  it('markAllRead button should appear and work when there are unread', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'info', message: 'A', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const readAllBtn = Array.from(document.querySelectorAll('.neu-nc__action-btn')).find((b: any) =>
      b.textContent.includes('Leer'),
    ) as HTMLButtonElement;
    expect(readAllBtn).toBeTruthy();
    readAllBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(svc.notifications()[0].read).toBe(true);
  });

  it('clearAll button should appear and remove all notifications', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ tone: 'info', message: 'A', duration: 0 });
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const clearBtn = Array.from(document.querySelectorAll('.neu-nc__action-btn')).find((b: any) =>
      b.textContent.includes('Limpiar'),
    ) as HTMLButtonElement;
    expect(clearBtn).toBeTruthy();
    clearBtn.click();
    f.detectChanges();
    await f.whenStable();
    expect(svc.notifications().length).toBe(0);
  });

  it('badge should show 99+ when unread count > 99', async () => {
    const f = setup();
    const svc = TestBed.inject(NeuNotificationService);
    for (let i = 0; i < 101; i++) svc.push({ message: `N${i}`, duration: 0 });
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-nc__badge').textContent.trim()).toBe('99+');
  });

  it('should show empty state in panel when no notifications', async () => {
    const f = setup();
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__empty')).toBeTruthy();
    expect(document.querySelector('.neu-nc__list')?.getAttribute('role')).toBeNull();
    const svc = mkSvc();
    svc.push({ message: 'Persistent notification', duration: 0 });
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__list')?.getAttribute('role')).toBe('list');
    expect(document.querySelector('.neu-nc__list > [role="listitem"]')).toBeTruthy();
    svc.clearAll();
    f.detectChanges();
    await f.whenStable();
    expect(document.querySelector('.neu-nc__list')?.getAttribute('role')).toBeNull();
    expect(document.querySelector('.neu-nc__empty')?.getAttribute('role')).toBe('status');
  });

  it('push with duration=0 should NOT auto-dismiss', async () => {
    const svc = TestBed.inject(NeuNotificationService);
    svc.push({ message: 'Persistente', duration: 0 });
    expect(svc.notifications().length).toBe(1);
  });

  it('moves focus into the panel and restores it to the bell on Escape', async () => {
    const f = setup();
    const bell = f.nativeElement.querySelector('.neu-nc__bell') as HTMLButtonElement;
    bell.focus();
    bell.click();
    f.detectChanges();
    await f.whenStable();
    await Promise.resolve();

    const panel = document.querySelector('.neu-nc__panel') as HTMLElement;
    expect(document.activeElement).toBe(panel);
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    f.componentInstance['_onOverlayKeydown'](escape);
    f.detectChanges();
    await Promise.resolve();

    expect(escape.defaultPrevented).toBe(true);
    expect(f.componentInstance['_isOpen']()).toBe(false);
    expect(document.activeElement).toBe(bell);
  });

  it('covers template Escape handling and close paths without focus restoration', async () => {
    const f = setup();
    f.componentInstance['_toggle']();
    f.detectChanges();
    await f.whenStable();
    const panel = document.querySelector('.neu-nc__panel') as HTMLElement;
    panel.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    f.detectChanges();
    await Promise.resolve();
    expect(f.componentInstance['_isOpen']()).toBe(false);

    f.componentInstance['_toggle']();
    f.componentInstance['_close'](false);
    expect(f.componentInstance['_isOpen']()).toBe(false);
    f.componentInstance['_onOverlayDetach']();
    f.componentInstance['_onOverlayKeydown'](new KeyboardEvent('keydown', { key: 'Enter' }));
  });
});
