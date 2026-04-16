import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuToastContainerComponent } from './neu-toast.component';
import { NeuToastService } from './neu-toast.service';
import { NeuToastType } from './neu-toast.types';

describe('NeuToastContainerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    // Limpia toasts entre tests / Clear toasts between tests
    TestBed.inject(NeuToastService).clear();
  });

  function setup() {
    const service = TestBed.inject(NeuToastService);
    const f = TestBed.createComponent(NeuToastContainerComponent);
    f.detectChanges();
    return { f, service };
  }

  it('should create the component', () => {
    const { f } = setup();
    expect(f.componentInstance).toBeTruthy();
  });

  it('should render no toasts initially', () => {
    const { f } = setup();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(0);
  });

  it('should render a toast when service.show() is called', () => {
    const { f, service } = setup();
    service.show({ message: 'Hola', type: 'info', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(1);
  });

  it('should apply the type class to the toast element', () => {
    const { f, service } = setup();
    service.show({ message: 'Error', type: 'error', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.classList).toContain('neu-toast--error');
  });

  it('should render the toast message', () => {
    const { f, service } = setup();
    service.show({ message: 'Mensaje de prueba', type: 'success', duration: 0 });
    f.detectChanges();
    const messageEl = f.nativeElement.querySelector('.neu-toast__message');
    expect(messageEl.textContent).toContain('Mensaje de prueba');
  });

  it('should render toast title when provided', () => {
    const { f, service } = setup();
    service.show({ message: 'Msg', title: 'Título del toast', type: 'info', duration: 0 });
    f.detectChanges();
    const titleEl = f.nativeElement.querySelector('.neu-toast__title');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain('Título del toast');
  });

  it('should NOT render title element when title is not provided', () => {
    const { f, service } = setup();
    service.show({ message: 'Sin título', type: 'info', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-toast__title')).toBeNull();
  });

  it('should call service.dismiss() when close button is clicked', () => {
    const { f, service } = setup();
    const id = service.show({ message: 'Para descartar', type: 'warning', duration: 0 });
    f.detectChanges();
    const closeBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-toast__close');
    closeBtn.click();
    f.detectChanges();
    expect(service.toasts().find((t) => t.id === id)).toBeUndefined();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(0);
  });

  it('should have aria-live="polite" on host element', () => {
    const { f } = setup();
    expect(f.nativeElement.getAttribute('aria-live')).toBe('polite');
  });

  it('should have aria-atomic="false" on host element', () => {
    const { f } = setup();
    expect(f.nativeElement.getAttribute('aria-atomic')).toBe('false');
  });

  it('should apply position class when service.setPosition() is called', () => {
    const { f, service } = setup();
    service.setPosition('bottom-left');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-toast-container--bottom-left');
  });

  it('should apply top-right class for default position', () => {
    const { f, service } = setup();
    service.setPosition('top-right');
    f.detectChanges();
    expect(f.nativeElement.classList).toContain('neu-toast-container--top-right');
  });

  it('should render multiple toasts', () => {
    const { f, service } = setup();
    service.show({ message: 'Toast 1', type: 'success', duration: 0 });
    service.show({ message: 'Toast 2', type: 'error', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(2);
  });

  it('error toast should have role="alert"', () => {
    const { f, service } = setup();
    service.show({ message: 'Error!', type: 'error', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('warning toast should have role="alert"', () => {
    const { f, service } = setup();
    service.show({ message: 'Aviso!', type: 'warning', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('info toast should have role="status"', () => {
    const { f, service } = setup();
    service.show({ message: 'Info', type: 'info', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('success toast should have role="status"', () => {
    const { f, service } = setup();
    service.show({ message: 'Hecho', type: 'success', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('getIcon() should return correct icons for all types', () => {
    const { f } = setup();
    const comp = f.componentInstance;
    const cases: [NeuToastType, string][] = [
      ['success', 'lucideCheckCircle'],
      ['error', 'lucideXCircle'],
      ['warning', 'lucideAlertTriangle'],
      ['info', 'lucideInfo'],
    ];
    for (const [type, icon] of cases) {
      expect(comp.getIcon(type)).toBe(icon);
    }
  });

  it('should remove toast from list when service.dismiss() is called directly', () => {
    const { f, service } = setup();
    const id = service.show({ message: 'Directo', type: 'success', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(1);
    service.dismiss(id);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(0);
  });
});
