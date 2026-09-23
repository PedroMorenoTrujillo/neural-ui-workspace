import { CSP_NONCE } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { provideNeuralUI } from './provide-neural-ui';
import {
  NEURAL_LOCALE,
  NEURAL_NOW,
  NEURAL_TIME_ZONE,
  defineNeuPreset,
} from '@neural-ui/core/foundation';

describe('provideNeuralUI', () => {
  afterEach(() => {
    document.querySelectorAll('style[data-neu-preset-style]').forEach((style) => style.remove());
    document.documentElement.removeAttribute('data-neu-preset');
  });

  it('should return EnvironmentProviders without error', () => {
    const providers = provideNeuralUI();
    expect(providers).toBeTruthy();
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

  it('registers and activates a typed preset from app config', () => {
    const forest = defineNeuPreset({
      name: 'forest-test',
      light: { '--neu-primary': '#166534' },
      dark: { '--neu-primary': '#86efac' },
    });
    TestBed.configureTestingModule({
      providers: [provideNeuralUI({ theme: { preset: forest } })],
    });

    const document = TestBed.inject(DOCUMENT);
    const style = document.head.querySelector<HTMLStyleElement>(
      'style[data-neu-preset-style="forest-test"]',
    );

    expect(document.documentElement.getAttribute('data-neu-preset')).toBe('forest-test');
    expect(style?.textContent).toContain('--neu-primary: #166534;');
    expect(style?.textContent).toContain('@media not (forced-colors: active)');
  });

  it('uses Angular CSP_NONCE when registering preset styles', () => {
    const preset = defineNeuPreset({
      name: 'nonce-test',
      light: { '--neu-primary': '#166534' },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: CSP_NONCE, useValue: 'test-nonce' },
        provideNeuralUI({ theme: { preset } }),
      ],
    });

    const document = TestBed.inject(DOCUMENT);
    expect(
      document.head
        .querySelector<HTMLStyleElement>('style[data-neu-preset-style="nonce-test"]')
        ?.getAttribute('nonce'),
    ).toBe('test-nonce');
  });
});
