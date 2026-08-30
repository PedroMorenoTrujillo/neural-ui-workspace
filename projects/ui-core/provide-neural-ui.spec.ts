import { TestBed } from '@angular/core/testing';
import { provideNeuralUI } from './provide-neural-ui';
import { NgIconsToken, provideNgIconsConfig } from '@ng-icons/core';
import { NEURAL_LOCALE, NEURAL_NOW, NEURAL_TIME_ZONE } from '@neural-ui/core/foundation';

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

  it('registers every deterministic component-owned default icon', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralUI()],
    });
    const iconSets = TestBed.inject(NgIconsToken);
    const icons = Object.assign({}, ...iconSets);

    expect(Object.keys(icons).sort()).toEqual(
      [
        'lucideAlertCircle',
        'lucideAlertTriangle',
        'lucideBold',
        'lucideCheck',
        'lucideCheckCircle',
        'lucideChevronLeft',
        'lucideChevronRight',
        'lucideChevronUp',
        'lucideEraser',
        'lucideExternalLink',
        'lucideImage',
        'lucideInbox',
        'lucideInfo',
        'lucideItalic',
        'lucideLink',
        'lucideList',
        'lucideListOrdered',
        'lucideMinus',
        'lucidePencil',
        'lucidePlus',
        'lucideTrendingDown',
        'lucideTrendingUp',
        'lucideUnderline',
        'lucideUpload',
        'lucideX',
        'lucideXCircle',
      ].sort(),
    );
  });

  it('should register icons with custom config in TestBed', () => {
    TestBed.configureTestingModule({
      providers: [provideNeuralUI({ iconSize: '2rem' })],
    });
    const icons = TestBed.inject(NgIconsToken, null, { optional: true });
    expect(icons).toBeTruthy();
  });

  it('registers deterministic locale, timezone, and clock overrides', () => {
    const fixedNow = () => new Date('2026-08-26T12:00:00.000Z');
    TestBed.configureTestingModule({
      providers: [provideNeuralUI({ locale: 'fr-FR', timeZone: 'Europe/Paris', now: fixedNow })],
    });

    expect(TestBed.inject(NEURAL_LOCALE)).toBe('fr-FR');
    expect(TestBed.inject(NEURAL_TIME_ZONE)).toBe('Europe/Paris');
    expect(TestBed.inject(NEURAL_NOW)).toBe(fixedNow);
  });
});
