import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NeuBlockUIComponent, NeuBlockUIDirective } from './neu-block-ui.component';

function mk() {
  return TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
}

describe('NeuBlockUIComponent', () => {
  beforeEach(() => mk().compileComponents());

  it('should render with neu-block-ui class', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-block-ui');
  });

  it('should not render overlay when blocked=false', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-block-ui__overlay')).toBeNull();
  });

  it('should render overlay when blocked=true', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-block-ui__overlay')).toBeTruthy();
  });

  it('should render spinner inside overlay when blocked=true', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-block-ui__spinner')).toBeTruthy();
  });

  it('should render message when blocked=true and message is set', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', true);
    f.componentRef.setInput('message', 'Cargando...');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-block-ui__message')?.textContent.trim()).toBe(
      'Cargando...',
    );
  });

  it('should not render message element when message is empty', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', true);
    f.componentRef.setInput('message', '');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('.neu-block-ui__message')).toBeNull();
  });

  it('should apply dark variant class', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('variant', 'dark');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-block-ui--dark');
  });

  it('should apply light variant class', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('variant', 'light');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-block-ui--light');
  });

  it('should set aria-busy=true when blocked', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', true);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.getAttribute('aria-busy')).toBe('true');
  });

  it('should set aria-hidden=true when not blocked', async () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.componentRef.setInput('blocked', false);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.getAttribute('aria-hidden')).toBe('true');
  });
});

@Component({
  template: `
    <section>
      <button type="button">Action</button>
      <neu-block-ui [blocked]="blocked()" message="Loading" />
    </section>
  `,
  imports: [NeuBlockUIComponent],
})
class BlockUIComponentHostComponent {
  blocked = signal(false);
}

describe('NeuBlockUIComponent interaction blocking', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [BlockUIComponentHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('makes sibling content inert while blocked and restores its previous state', async () => {
    const f = TestBed.createComponent(BlockUIComponentHostComponent);
    f.detectChanges();
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.hasAttribute('inert')).toBe(false);

    f.componentInstance.blocked.set(true);
    f.detectChanges();
    await f.whenStable();
    expect(button.hasAttribute('inert')).toBe(true);
    expect(f.nativeElement.querySelector('.neu-block-ui__overlay')?.getAttribute('role')).toBe(
      'status',
    );

    f.componentInstance.blocked.set(false);
    f.detectChanges();
    await f.whenStable();
    expect(button.hasAttribute('inert')).toBe(false);
  });

  it('removes component-owned inert state carried through SSR hydration', async () => {
    const f = TestBed.createComponent(BlockUIComponentHostComponent);
    f.detectChanges();
    await f.whenStable();
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    button.setAttribute('inert', '');
    button.setAttribute('data-neu-block-ui-inert', '');

    f.componentInstance.blocked.set(true);
    f.detectChanges();
    await f.whenStable();
    f.componentInstance.blocked.set(false);
    f.detectChanges();
    await f.whenStable();

    expect(button.hasAttribute('inert')).toBe(false);
    expect(button.hasAttribute('data-neu-block-ui-inert')).toBe(false);
  });
});

// Host component para probar la directiva / Host component to test the directive
@Component({
  template: `<div [neuBlockUI]="blocked()"></div>`,
  imports: [NeuBlockUIDirective],
})
class BlockUIDirectiveHostComponent {
  blocked = signal(false);
}

describe('NeuBlockUIDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [BlockUIDirectiveHostComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents(),
  );

  it('should add neu-block-ui__host class to host', async () => {
    const f = TestBed.createComponent(BlockUIDirectiveHostComponent);
    f.detectChanges();
    await f.whenStable();
    const host = f.nativeElement.querySelector('div');
    expect(host.classList).toContain('neu-block-ui__host');
  });

  it('should toggle blocked class when input changes', async () => {
    const f = TestBed.createComponent(BlockUIDirectiveHostComponent);
    f.detectChanges();
    await f.whenStable();
    const host = f.nativeElement.querySelector('div');
    expect(host.classList).not.toContain('neu-block-ui__host--blocked');

    f.componentInstance.blocked.set(true);
    f.detectChanges();
    await f.whenStable();
    expect(host.classList).toContain('neu-block-ui__host--blocked');
    expect(host.getAttribute('aria-busy')).toBe('true');
    expect(host.hasAttribute('inert')).toBe(true);

    f.componentInstance.blocked.set(false);
    f.detectChanges();
    await f.whenStable();
    expect(host.hasAttribute('inert')).toBe(false);
  });

  it('safely skips sibling blocking when the host is detached', () => {
    const f = TestBed.createComponent(NeuBlockUIComponent);
    f.detectChanges();
    f.nativeElement.remove();
    expect(() => f.componentInstance['blockSiblingInteraction']()).not.toThrow();
  });
});
