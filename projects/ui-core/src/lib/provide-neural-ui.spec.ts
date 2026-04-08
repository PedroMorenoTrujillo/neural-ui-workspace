import { TestBed } from '@angular/core/testing';
import { provideNeuralUI } from './provide-neural-ui';
import { NgIconsToken, provideNgIconsConfig } from '@ng-icons/core';

describe('provideNeuralUI', () => {
  it('should return EnvironmentProviders without error', () => {
    const providers = provideNeuralUI();
    expect(providers).toBeTruthy();
  });

  it('should return EnvironmentProviders with custom config', () => {
    const providers = provideNeuralUI({ iconSize: '1rem', iconStrokeWidth: '1.5' });
    expect(providers).toBeTruthy();
  });

  it('should register icons in TestBed', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralUI()],
    });
    // Verificar que los iconos se han registrado (no lanza error de inyección)
    const icons = TestBed.inject(NgIconsToken, null, { optional: true });
    expect(icons).toBeTruthy();
  });

  it('should register icons with custom config in TestBed', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralUI({ iconSize: '2rem' })],
    });
    const icons = TestBed.inject(NgIconsToken, null, { optional: true });
    expect(icons).toBeTruthy();
  });
});
