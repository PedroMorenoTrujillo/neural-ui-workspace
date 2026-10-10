import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuButtonComponent } from './neu-button.component';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconSave } from '@neural-icons/core/icons/save';
import { iconPlus } from '@neural-icons/core/icons/plus';

@Component({
  imports: [NeuButtonComponent],
  template: '<button neu-button id="default">Default</button><button neu-button id="submit" type="submit">Submit</button>',
})
class ButtonTypeHost {}

@Component({
  imports: [NeuButtonComponent],
  template: '<button neu-button [disabled]="disabled()" [loading]="loading()" (neuClick)="onAction()">Action</button>',
})
class ButtonActionHost {
  readonly disabled = signal(false);
  readonly loading = signal(false);
  events = 0;
  onAction(): void { this.events += 1; }
}

describe('NeuButtonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuButtonComponent],
      providers: [provideNeuralIcons(iconSave, iconPlus)],
    }).compileComponents();
  });

  it('defaults to native type=button while preserving an explicit submit type', () => {
    const fixture = TestBed.createComponent(ButtonTypeHost);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('#default') as HTMLButtonElement).type).toBe('button');
    expect((fixture.nativeElement.querySelector('#submit') as HTMLButtonElement).type).toBe('submit');
  });

  it('should have default neu-button class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button');
  });

  it('should have brand tone and solid variant classes by default', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--brand');
    expect(fixture.nativeElement.classList).toContain('neu-button--solid');
  });

  it('should apply neutral solid treatment', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('tone', 'neutral');
    fixture.componentRef.setInput('variant', 'solid');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--neutral');
    expect(fixture.nativeElement.classList).toContain('neu-button--solid');
  });

  it('should apply danger tone class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('tone', 'danger');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--danger');
  });

  it('should apply lg size class', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--lg');
  });

  it('should set disabled attribute when disabled=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.hasAttribute('disabled')).toBe(true);
  });

  it('should set aria-disabled when disabled=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('aria-disabled')).toBe('true');
  });

  it('should apply loading class when loading=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--loading');
    expect(fixture.nativeElement.querySelector('.neu-button__spinner svg')?.namespaceURI)
      .toBe('http://www.w3.org/2000/svg');
  });

  it('should apply full-width class when fullWidth=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('fullWidth', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--full-width');
  });

  it('should apply icon-only class when iconOnly=true', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'save');
    fixture.componentRef.setInput('iconOnly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList).toContain('neu-button--icon-only');
  });

  it('should render only the icon content when iconOnly=true', async () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'plus');
    fixture.componentRef.setInput('iconOnly', true);
    fixture.componentRef.setInput('ariaLabel', 'Crear');
    fixture.detectChanges();
    await fixture.whenStable();

    const host: HTMLButtonElement = fixture.nativeElement;
    const icon = host.querySelector('neu-icon-outlet');

    expect(host.classList).toContain('neu-button--icon-only');
    expect(host.getAttribute('aria-label')).toBe('Crear');
    expect(icon).toBeTruthy();
    expect(host.textContent?.trim()).toBe('');
  });

  it('sizes the provider-neutral icon outlet in iconOnly mode', async () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'add');
    fixture.componentRef.setInput('iconOnly', true);
    fixture.componentRef.setInput('size', 'md');
    fixture.detectChanges();
    await fixture.whenStable();

    const icon = fixture.nativeElement.querySelector('neu-icon-outlet');

    expect(icon?.style.width).toBe('16px');
    expect(icon?.querySelector('svg')).toBeTruthy();
  });

  it('should emit neuClick when clicked and not disabled', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.neuClick.subscribe((e) => events.push(e));
    fixture.componentInstance['_onHostClick'](new MouseEvent('click'));
    expect(events.length).toBe(1);
  });

  it('should NOT emit neuClick when disabled', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const events: MouseEvent[] = [];
    fixture.componentInstance.neuClick.subscribe((e) => events.push(e));
    fixture.componentInstance['_onHostClick'](new MouseEvent('click'));
    expect(events.length).toBe(0);
  });

  it('should compute isDisabled as true when loading', () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.componentInstance.isDisabled()).toBe(true);
  });

  it('emits one action per native click and blocks disabled or loading activation', () => {
    const fixture = TestBed.createComponent(ButtonActionHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    expect(fixture.componentInstance.events).toBe(1);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.click();
    expect(fixture.componentInstance.events).toBe(1);

    fixture.componentInstance.loading.set(false);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.events).toBe(1);
  });

  it('keeps a named text button icon decorative', async () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'save');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('neu-icon-outlet')?.getAttribute('aria-hidden')).toBe('true');
    expect(fixture.nativeElement.getAttribute('aria-label')).toBeNull();
  });

  it('icon with iconPosition=end should render icon after content', async () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'save');
    fixture.componentRef.setInput('iconPosition', 'end');
    fixture.detectChanges();
    await fixture.whenStable();
    const icon = fixture.nativeElement.querySelector('neu-icon-outlet');
    expect(icon).toBeTruthy();
  });

  it('does not render geometry for an unregistered canonical name', async () => {
    const fixture = TestBed.createComponent(NeuButtonComponent);
    fixture.componentRef.setInput('icon', 'trash');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('neu-icon-outlet svg')).toBeNull();
  });
});
