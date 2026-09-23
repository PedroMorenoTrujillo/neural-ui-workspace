import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideCheckCircle,
  lucideInfo,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';
import { NeuToastContainerComponent } from './neu-toast.component';
import { NeuToastService } from './neu-toast.service';
import { NeuToastTone } from './neu-toast.types';

describe('NeuToastContainerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideIcons({
          lucideCheckCircle,
          lucideXCircle,
          lucideAlertTriangle,
          lucideInfo,
          lucideX,
        }),
      ],
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
    service.show({ message: 'Hola', tone: 'info', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(1);
  });

  it('should apply the type class to the toast element', () => {
    const { f, service } = setup();
    service.show({ message: 'Error', tone: 'danger', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.classList).toContain('neu-toast--danger');
  });

  it('should render the toast message', () => {
    const { f, service } = setup();
    service.show({ message: 'Mensaje de prueba', tone: 'success', duration: 0 });
    f.detectChanges();
    const messageEl = f.nativeElement.querySelector('.neu-toast__message');
    expect(messageEl.textContent).toContain('Mensaje de prueba');
  });

  it('should render toast title when provided', () => {
    const { f, service } = setup();
    service.show({ message: 'Msg', title: 'Título del toast', tone: 'info', duration: 0 });
    f.detectChanges();
    const titleEl = f.nativeElement.querySelector('.neu-toast__title');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain('Título del toast');
  });

  it('should NOT render title element when title is not provided', () => {
    const { f, service } = setup();
    service.show({ message: 'Sin título', tone: 'info', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelector('.neu-toast__title')).toBeNull();
  });

  it('should call service.dismiss() when close button is clicked', () => {
    const { f, service } = setup();
    const id = service.show({ message: 'Para descartar', tone: 'warning', duration: 0 });
    f.detectChanges();
    const closeBtn: HTMLButtonElement = f.nativeElement.querySelector('.neu-toast__close');
    closeBtn.click();
    f.detectChanges();
    expect(service.toasts().find((t) => t.id === id)).toBeUndefined();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(0);
  });

  it('should avoid nesting a container live region around semantic toast items', () => {
    const { f } = setup();
    expect(f.nativeElement.getAttribute('aria-live')).toBeNull();
    expect(f.nativeElement.getAttribute('aria-atomic')).toBeNull();
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
    service.show({ message: 'Toast 1', tone: 'success', duration: 0 });
    service.show({ message: 'Toast 2', tone: 'danger', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(2);
  });

  it('error toast should have role="alert"', () => {
    const { f, service } = setup();
    service.show({ message: 'Error!', tone: 'danger', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('warning toast should have role="alert"', () => {
    const { f, service } = setup();
    service.show({ message: 'Aviso!', tone: 'warning', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('info toast should have role="status"', () => {
    const { f, service } = setup();
    service.show({ message: 'Info', tone: 'info', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('success toast should have role="status"', () => {
    const { f, service } = setup();
    service.show({ message: 'Hecho', tone: 'success', duration: 0 });
    f.detectChanges();
    const toast = f.nativeElement.querySelector('.neu-toast');
    expect(toast.getAttribute('role')).toBe('status');
  });

  it('getIcon() should return correct icons for all types', () => {
    const { f } = setup();
    const comp = f.componentInstance;
    const cases: [NeuToastTone, string][] = [
      ['success', 'lucideCheckCircle'],
      ['danger', 'lucideXCircle'],
      ['warning', 'lucideAlertTriangle'],
      ['info', 'lucideInfo'],
    ];
    for (const [type, icon] of cases) {
      expect(comp.getIcon(type)).toBe(icon);
    }
  });

  it('should remove toast from list when service.dismiss() is called directly', () => {
    const { f, service } = setup();
    const id = service.show({ message: 'Directo', tone: 'success', duration: 0 });
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(1);
    service.dismiss(id);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('.neu-toast').length).toBe(0);
  });
});
