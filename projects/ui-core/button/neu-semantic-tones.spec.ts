import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuralIcon } from '@neural-icons/angular';
import { provideNeuIconResolver } from '@neural-ui/core/foundation';
import { iconInfo } from '@neural-icons/core/icons/info';
import { iconCircleCheck } from '@neural-icons/core/icons/circle-check';
import { iconCircleX } from '@neural-icons/core/icons/circle-x';
import { iconWarning } from '@neural-icons/core/icons/warning';
import { NeuButtonComponent, type NeuButtonTone, type NeuButtonVariant } from './neu-button.component';
import { NeuChipComponent } from '../chip/neu-chip.component';
import { NeuToolbarComponent } from '../toolbar/neu-toolbar.component';
import { NeuProgressBarComponent } from '../progress-bar/neu-progress-bar.component';
import { NeuSpinnerComponent } from '../spinner/neu-spinner.component';
import { NeuAlertComponent } from '../alert/neu-alert.component';
import { NeuSplitButtonComponent } from '../split-button/neu-split-button.component';
import { NeuCalendarComponent, type NeuCalendarEventTone } from '../calendar/neu-calendar.component';
import { NeuToastContainerComponent } from '../toast/neu-toast.component';
import { NeuToastService } from '../toast/neu-toast.service';
import { NeuNotificationCenterComponent, NeuNotificationService, type NeuNotificationTone } from '../notification-center/neu-notification-center.component';
import type { NeuToastTone } from '../toast/neu-toast.types';

const SEMANTIC_TONES = ['neutral', 'success', 'info', 'warning', 'danger'] as const satisfies readonly (NeuButtonTone & NeuCalendarEventTone & NeuToastTone & NeuNotificationTone)[];
const BUTTON_TONES = [...SEMANTIC_TONES, 'brand'] as const satisfies readonly NeuButtonTone[];
const VARIANTS = ['solid', 'outline', 'ghost'] as const satisfies readonly NeuButtonVariant[];

@Component({
  imports: [NeuButtonComponent, NeuChipComponent, NeuToolbarComponent, NeuProgressBarComponent, NeuSpinnerComponent, NeuAlertComponent, NeuSplitButtonComponent],
  template: `
    @for (tone of tones; track tone) {
      <section [attr.data-tone]="tone">
        <button neu-button [tone]="tone">Action</button>
        <neu-chip [tone]="tone">Status</neu-chip>
        <neu-toolbar [tone]="tone">Tools</neu-toolbar>
        <neu-progress-bar [tone]="tone" [value]="50" />
        <neu-spinner [tone]="tone" />
        <neu-alert [tone]="tone">Status message</neu-alert>
        <neu-split-button [tone]="tone" label="Save" [actions]="actions" />
      </section>
    }
  `,
})
class SemanticToneHost {
  readonly tones = SEMANTIC_TONES;
  readonly actions = [{ id: 'draft', label: 'Save draft' }];
}

describe('shared semantic tone palette', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideNeuIconResolver(({ key, size, strokeWidth }) => {
      const icon = key === 'status-info' ? iconInfo : key === 'status-success' ? iconCircleCheck : key === 'status-warning' ? iconWarning : key === 'status-error' ? iconCircleX : null;
      return icon ? { component: NeuralIcon, inputs: { icon, size, strokeWidth } } : null;
    })],
  }));
  for (const tone of SEMANTIC_TONES) {
    it(`renders ${tone} in all tone-input components and both SplitButton controls`, async () => {
      const fixture = TestBed.createComponent(SemanticToneHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const row = fixture.nativeElement.querySelector(`[data-tone="${tone}"]`) as HTMLElement;
      for (const prefix of ['neu-button', 'neu-chip', 'neu-toolbar', 'neu-progress', 'neu-spinner', 'neu-alert']) {
        expect(row.querySelector(`.${prefix}--${tone}`), prefix).not.toBeNull();
      }
      expect(row.querySelectorAll(`neu-split-button .neu-button--${tone}`)).toHaveLength(2);
      const alert = row.querySelector('.neu-alert');
      expect(alert?.getAttribute('role')).toBe(tone === 'danger' ? 'alert' : 'status');
      expect(alert?.querySelector('neu-icon-outlet svg')).not.toBeNull();
    });
  }

  for (const tone of BUTTON_TONES) for (const variant of VARIANTS) {
    it(`preserves Button activation and disabled/loading behavior for ${tone}/${variant}`, () => {
      const fixture = TestBed.createComponent(NeuButtonComponent);
      fixture.componentRef.setInput('tone', tone);
      fixture.componentRef.setInput('variant', variant);
      fixture.detectChanges();
      const button = fixture.nativeElement as HTMLButtonElement;
      let events = 0;
      fixture.componentInstance.neuClick.subscribe(() => events++);
      expect(button.classList).toContain(`neu-button--${tone}`);
      expect(button.classList).toContain(`neu-button--${variant}`);
      button.click();
      expect(events).toBe(1);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      button.click();
      expect(events).toBe(1);
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      button.click();
      expect(events).toBe(1);
      expect(button.getAttribute('aria-busy')).toBe('true');
    });
  }

  it('renders all five Calendar event tones without changing event activation', async () => {
    const fixture = TestBed.createComponent(NeuCalendarComponent);
    fixture.componentRef.setInput('selectedDate', '2026-05-14');
    fixture.componentRef.setInput('events', SEMANTIC_TONES.map(tone => ({ id: tone, title: tone, start: '2026-05-14T09:00:00', tone })));
    fixture.detectChanges();
    await fixture.whenStable();
    for (const tone of SEMANTIC_TONES) expect(fixture.nativeElement.querySelector(`.neu-calendar__event--${tone}`)).not.toBeNull();
  });

  it('renders and dismisses a neutral Toast with a real icon and polite status', async () => {
    const fixture = TestBed.createComponent(NeuToastContainerComponent);
    const service = TestBed.inject(NeuToastService);
    const id = service.show({ tone: 'neutral', message: 'Saved draft', duration: 0 });
    fixture.detectChanges();
    await fixture.whenStable();
    const toast = fixture.nativeElement.querySelector('.neu-toast--neutral') as HTMLElement;
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.querySelector('.neu-toast__icon-wrap svg')).not.toBeNull();
    toast.querySelector<HTMLButtonElement>('.neu-toast__close')?.click();
    expect(service.toasts().some(item => item.id === id)).toBe(false);
  });

  it('keeps all five Notification tones and supplies a neutral icon', async () => {
    const fixture = TestBed.createComponent(NeuNotificationCenterComponent);
    const service = TestBed.inject(NeuNotificationService);
    for (const tone of SEMANTIC_TONES) service.push({ tone, message: tone, duration: 0 });
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.neu-nc__bell')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    for (const tone of SEMANTIC_TONES) {
      const item = document.querySelector(`.neu-nc__item--${tone}`);
      expect(item).not.toBeNull();
      expect(item?.querySelector('.neu-nc__item-icon svg')).not.toBeNull();
    }
    service.clearAll();
    fixture.destroy();
  });
});
