import { TestBed } from '@angular/core/testing';
import {
  NEU_OVERLAY_DISMISS_GUARD,
  allowsNeuOverlayDismissal,
  provideNeuOverlayDismissGuard,
} from './neu-overlay-dismiss-policy';

describe('overlay dismissal policy', () => {
  it('allows by default, preserves explicit prevention and fails closed on exceptions', () => {
    const context = {
      source: 'dialog',
      reason: 'escape',
      originalEvent: new Event('keydown'),
    } as const;
    expect(allowsNeuOverlayDismissal(null, context)).toBe(true);
    expect(allowsNeuOverlayDismissal(() => false, context)).toBe(false);
    expect(allowsNeuOverlayDismissal(() => true, context)).toBe(true);
    expect(
      allowsNeuOverlayDismissal(() => {
        throw new Error('consumer guard');
      }, context),
    ).toBe(false);
  });

  it('provides one typed application policy without exposing overlay internals', () => {
    const guard = vi.fn(() => true);
    TestBed.configureTestingModule({ providers: [provideNeuOverlayDismissGuard(guard)] });
    expect(TestBed.inject(NEU_OVERLAY_DISMISS_GUARD)).toBe(guard);
  });
});
