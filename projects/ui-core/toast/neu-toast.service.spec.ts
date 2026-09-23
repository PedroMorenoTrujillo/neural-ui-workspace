import { PLATFORM_ID } from '@angular/core';
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
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts().length).toBe(0);
  });

  it('should add a toast with show()', () => {
    service.show({ message: 'Hola', tone: 'info', duration: 0 });
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Hola');
    expect(service.toasts()[0].tone).toBe('info');
  });

  it('should add a success toast', () => {
    service.success('Guardado', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('success');
    expect(service.toasts()[0].message).toBe('Guardado');
  });

  it('should add an error toast', () => {
    service.error('Error crítico', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('danger');
  });

  it('should add a warning toast', () => {
    service.warning('Atención', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('warning');
  });

  it('should add an info toast', () => {
    service.info('Información', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('info');
  });

  it('should dismiss a specific toast by id', () => {
    const id = service.show({ message: 'A', tone: 'info', duration: 0 });
    service.show({ message: 'B', tone: 'success', duration: 0 });
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
    const id = service.show({ message: 'Test', tone: 'info', duration: 0 });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should set position', () => {
    service.setPosition('bottom-left');
    expect(service.position()).toBe('bottom-left');
  });

  it('success() should add a toast with type=success', () => {
    service.success('Exito', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('success');
  });

  it('error() should add a toast with tone=danger', () => {
    service.error('Error', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('danger');
  });

  it('warning() should add a toast with type=warning', () => {
    service.warning('Aviso', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('warning');
  });

  it('info() should add a toast with type=info', () => {
    service.info('Info', { duration: 0 });
    expect(service.toasts()[0].tone).toBe('info');
  });

  it('dismiss after duration>0 auto-removes toast', async () => {
    vi.useFakeTimers();
    service.show({ message: 'Temp', tone: 'info', duration: 100 });
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(200);
    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });

  it('clear should cancel pending auto-dismiss timers', () => {
    vi.useFakeTimers();
    service.show({ message: 'Temp', tone: 'info', duration: 100 });

    service.clear();
    vi.advanceTimersByTime(200);

    expect(service.toasts().length).toBe(0);
    vi.useRealTimers();
  });

  it('manual dismissal cancels its only timer and cannot emit late work', () => {
    vi.useFakeTimers();
    const id = service.show({ message: 'Temp', duration: 100 });
    expect(vi.getTimerCount()).toBe(1);
    service.dismiss(id);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(200);
    expect(service.toasts()).toEqual([]);
  });

  it('destroy clears pending timers', () => {
    vi.useFakeTimers();
    service.show({ message: 'Temp', duration: 100 });
    expect(vi.getTimerCount()).toBe(1);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('show with title sets title on the toast', () => {
    service.show({ message: 'Msg', title: 'Title', tone: 'info', duration: 0 });
    expect(service.toasts()[0].title).toBe('Title');
  });

  it('show should apply default duration, title and type when omitted', () => {
    service.show({ message: 'Defaulted' });

    expect(service.toasts()[0].duration).toBe(4000);
    expect(service.toasts()[0].title).toBe('');
    expect(service.toasts()[0].tone).toBe('info');
  });

  it('dismiss should keep the list unchanged when the id does not exist', () => {
    service.show({ message: 'A', tone: 'info', duration: 0 });

    service.dismiss('missing-id');

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('A');
  });
});

describe('NeuToastService SSR', () => {
  afterEach(() => vi.useRealTimers());

  it('does not schedule auto-dismiss on the server', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(NeuToastService);
    service.show({ message: 'SSR', duration: 100 });
    expect(service.toasts()).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
