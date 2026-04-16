import { Component, input } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  NeuPopoverDirective,
  NeuPopoverOverlayComponent,
  NeuPopoverTrigger,
} from './neu-popover.component';

@Component({
  selector: 'test-host',
  template: `<button [neuPopover]="null" neuPopoverText="Hola" neuPopoverTrigger="click">
    Click
  </button>`,
  imports: [NeuPopoverDirective],
})
class TestHostComponent {}

@Component({
  selector: 'neu-popover-host',
  template: `<button
    [neuPopover]="null"
    neuPopoverText="Texto"
    [neuPopoverTrigger]="trigger()"
    [neuPopoverPosition]="position()"
  >
    Btn
  </button>`,
  imports: [NeuPopoverDirective],
})
class NeuPopoverHost {
  readonly trigger = input<NeuPopoverTrigger>('click');
  readonly position = input<'top' | 'bottom' | 'left' | 'right'>('bottom');
}

@Component({
  selector: 'neu-popover-template-host',
  template: `
    <button [neuPopover]="tpl" [neuPopoverContext]="{ name: 'Pedro' }">Template</button>
    <ng-template #tpl let-name="name">Hola {{ name }}</ng-template>
  `,
  imports: [NeuPopoverDirective],
})
class NeuPopoverTemplateHost {}

function mk() {
  return TestBed.configureTestingModule({
    imports: [OverlayModule],
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
}

describe('NeuPopoverDirective', () => {
  beforeEach(() => mk().compileComponents());

  it('should create', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.querySelector('button')).toBeTruthy();
  });

  it('open() should set _isOpen to true', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    expect(dir._isOpen()).toBe(true);
    dir.close();
  });

  it('close() should set _isOpen to false', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    dir.close();
    expect(dir._isOpen()).toBe(false);
  });

  it('toggle() should open then close', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.toggle();
    expect(dir._isOpen()).toBe(true);
    dir.toggle();
    expect(dir._isOpen()).toBe(false);
  });

  it('should emit popoverOpened and popoverClosed', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    const opened: unknown[] = [];
    const closed: unknown[] = [];
    dir.popoverOpened.subscribe(() => opened.push(1));
    dir.popoverClosed.subscribe(() => closed.push(1));
    dir.open();
    expect(opened.length).toBe(1);
    dir.close();
    expect(closed.length).toBe(1);
  });

  it('open() when disabled should not open', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    (dir as any).neuPopoverDisabled = () => true;
    dir.open();
    expect(dir._isOpen()).toBe(false);
  });

  it('should set aria-expanded attribute', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('click trigger should expose dialog semantics on the host', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'click');
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('hover trigger should not expose click-only aria state on the host', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'hover');
    f.detectChanges();
    await f.whenStable();
    const btn = f.nativeElement.querySelector('button');
    expect(btn.hasAttribute('aria-haspopup')).toBe(false);
    expect(btn.hasAttribute('aria-expanded')).toBe(false);
  });

  it('opening through click trigger should update aria-expanded to true', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'click');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    f.detectChanges();
    const btn = f.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    dir.close();
  });

  it('should render projected template content when a template is provided', async () => {
    const f = TestBed.createComponent(NeuPopoverTemplateHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    f.detectChanges();
    await f.whenStable();
    expect(document.body.textContent).toContain('Hola Pedro');
    dir.close();
  });

  it('clicking the host button should toggle the popover through the host listener', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();

    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    f.detectChanges();
    expect(dir._isOpen()).toBe(true);

    button.click();
    f.detectChanges();
    expect(dir._isOpen()).toBe(false);
  });

  it('backdrop click should close the popover for click trigger', async () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();
    await f.whenStable();

    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    f.detectChanges();
    await f.whenStable();

    const backdrop = document.body.querySelector('.neu-popover-backdrop') as HTMLDivElement;
    backdrop.click();
    f.detectChanges();

    expect(dir._isOpen()).toBe(false);
  });

  it('focus and blur DOM events should open and close the popover for focus trigger', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'focus');
    f.detectChanges();
    await f.whenStable();

    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    const button = f.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(dir._isOpen()).toBe(true);

    button.dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(dir._isOpen()).toBe(false);
  });
});

describe('NeuPopoverOverlayComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents(),
  );

  it('should render with neu-popover class', async () => {
    const f = TestBed.createComponent(NeuPopoverOverlayComponent);
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.classList).toContain('neu-popover');
  });

  it('should render text when _text is set', async () => {
    const f = TestBed.createComponent(NeuPopoverOverlayComponent);
    (f.componentInstance as any)._text.set('Contenido del popover');
    f.detectChanges();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Contenido del popover');
  });

  it('hover trigger: mouseenter should open the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'hover');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onMouseEnter();
    expect(dir._isOpen()).toBe(true);
    dir.onMouseLeave();
  });

  it('hover trigger: mouseleave should close the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'hover');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onMouseEnter();
    expect(dir._isOpen()).toBe(true);
    dir.onMouseLeave();
    expect(dir._isOpen()).toBe(false);
  });

  it('focus trigger: focus should open the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'focus');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onFocus();
    expect(dir._isOpen()).toBe(true);
  });

  it('focus trigger: blur should close the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'focus');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onFocus();
    dir.onBlur();
    expect(dir._isOpen()).toBe(false);
  });

  it('click trigger: mouseenter should NOT open the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onMouseEnter();
    expect(dir._isOpen()).toBe(false);
  });

  it('hover trigger: host click should NOT open the popover', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'hover');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onHostClick();
    expect(dir._isOpen()).toBe(false);
  });

  it('click trigger: mouseleave and focus/blur should be ignored', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'click');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);

    dir.onMouseLeave();
    dir.onFocus();
    dir.onBlur();

    expect(dir._isOpen()).toBe(false);
  });

  it('popoverOpened is emitted on open()', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    const opens: void[] = [];
    dir.popoverOpened.subscribe(() => opens.push(undefined as void));
    dir.open();
    expect(opens.length).toBe(1);
    dir.close();
  });

  it('popoverClosed is emitted on close()', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    const closes: void[] = [];
    dir.popoverClosed.subscribe(() => closes.push(undefined as void));
    dir.open();
    dir.close();
    expect(closes.length).toBe(1);
  });

  it('ngOnDestroy should dispose the overlayRef', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    expect(() => dir.ngOnDestroy()).not.toThrow();
  });

  it('click trigger: host click should toggle popover open/closed', async () => {
    // El clic en el host con trigger=click debe abrir/cerrar el popover
    // Host click with trigger=click must toggle the popover open/closed
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'click');
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.onHostClick();
    expect(dir._isOpen()).toBe(true);
    dir.onHostClick();
    expect(dir._isOpen()).toBe(false);
  });

  it('open() when already open should be idempotent', async () => {
    // Llamar open() cuando el popover ya está abierto no debe crear duplicados
    // Calling open() when already open must be idempotent
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective);
    dir.open();
    expect(dir._isOpen()).toBe(true);
    dir.open(); // second call should not change state or throw
    expect(dir._isOpen()).toBe(true);
    dir.close();
  });

  it('open() should dispose the previous overlay before creating a new one after close', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.detectChanges();
    await f.whenStable();
    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective) as any;

    dir.open();
    const firstOverlayRef = dir._overlayRef;
    const disposeSpy = vi.spyOn(firstOverlayRef, 'dispose');

    dir.close();
    dir.open();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
    dir.close();
  });

  it('open() should build fallback positions when the preferred position is not bottom', async () => {
    const f = TestBed.createComponent(NeuPopoverHost);
    f.componentRef.setInput('trigger', 'click');
    f.componentRef.setInput('position', 'left');
    f.detectChanges();
    await f.whenStable();

    const dir = f.debugElement.children[0].injector.get(NeuPopoverDirective) as any;
    const createSpy = vi.spyOn(dir._overlay, 'create');

    dir.open();

    const config = createSpy.mock.calls[0]?.[0] as any;
    const positions = config.positionStrategy._preferredPositions as Array<Record<string, unknown>>;

    expect(positions).toHaveLength(2);
    expect(positions[0]).toMatchObject({
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: -6,
    });
    expect(positions[1]).toMatchObject({
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: 6,
    });

    dir.close();
  });
});
