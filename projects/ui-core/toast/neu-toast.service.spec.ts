import { TestBed } from '@angular/core/testing';
import { NeuToastService } from './neu-toast.service';

describe('NeuToastService', () => {
  let service: NeuToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NeuToastService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a toast with show()', () => {
    service.show({ message: 'Hola', type: 'info', duration: 0 });
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hola');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add a success toast', () => {
    service.success('Guardado', { duration: 0 });
    expect(service.toasts()[0].type).toBe('success');
    expect(service.toasts()[0].message).toBe('Guardado');
  });

  it('should add an error toast', () => {
    service.error('Error crítico', { duration: 0 });
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add a warning toast', () => {
    service.warning('Atención', { duration: 0 });
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should add an info toast', () => {
    service.info('Información', { duration: 0 });
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should dismiss a specific toast by id', () => {
    const id = service.show({ message: 'A', type: 'info', duration: 0 });
    service.show({ message: 'B', type: 'success', duration: 0 });
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('B');
  });

  it('should clear all toasts', () => {
    service.success('1', { duration: 0 });
    service.error('2', { duration: 0 });
    service.clear();
    expect(service.toasts().length).toBe(0);
  });

  it('should return an id from show()', () => {
    const id = service.show({ message: 'Test', type: 'info', duration: 0 });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should set position', () => {
    service.setPosition('bottom-left');
    expect(service.position()).toBe('bottom-left');
  });

  it('success() should add a toast with type=success', () => {
    service.success('Exito', { duration: 0 });
    expect(service.toasts()[0].type).toBe('success');
  });

  it('error() should add a toast with type=error', () => {
    service.error('Error', { duration: 0 });
    expect(service.toasts()[0].type).toBe('error');
  });

  it('warning() should add a toast with type=warning', () => {
    service.warning('Aviso', { duration: 0 });
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('info() should add a toast with type=info', () => {
    service.info('Info', { duration: 0 });
    expect(service.toasts()[0].type).toBe('info');
  });

  it('dismiss after duration>0 auto-removes toast', async () => {
    vi.useFakeTimers();
    service.show({ message: 'Temp', type: 'info', duration: 100 });
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(200);
    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });

  it('show with title sets title on the toast', () => {
    service.show({ message: 'Msg', title: 'Title', type: 'info', duration: 0 });
    expect(service.toasts()[0].title).toBe('Title');
  });
});
