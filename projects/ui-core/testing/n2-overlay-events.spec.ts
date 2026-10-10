import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNeuralIcons } from '@neural-icons/angular';
import { iconX } from '@neural-icons/core/icons/x';
import { NeuBottomSheetComponent } from '@neural-ui/core/bottom-sheet';
import { NeuCloseRequest } from '@neural-ui/core/foundation';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuSidebarComponent } from '@neural-ui/core/sidebar';

@Component({
  imports: [NeuDialogComponent, NeuBottomSheetComponent, NeuSidebarComponent],
  template: `
    <button id="origin" type="button">Origin</button>
    <neu-sidebar
      [open]="sidebarOpen()"
      [persistent]="sidebarPersistent()"
      (closeRequested)="sidebarRequests.push($event)"
      (opened)="sidebarOpened = sidebarOpened + 1"
      (closed)="sidebarClosed = sidebarClosed + 1"
    >
      <span neu-sidebar-header>Navigation</span>
      @if (childSheet()) {
        <neu-bottom-sheet
          [open]="sheetOpen()"
          title="Child sheet"
          (closeRequested)="sheetRequests.push($event)"
          (opened)="sheetOpened = sheetOpened + 1"
          (closed)="sheetClosed = sheetClosed + 1"
        />
      }
    </neu-sidebar>
    @if (outerDialog()) {
      <neu-dialog
        [open]="outerOpen()"
        title="Outer"
        (closeRequested)="outerRequests.push($event)"
        (opened)="outerOpened = outerOpened + 1"
        (closed)="outerClosed = outerClosed + 1"
      >
        @if (innerDialog()) {
          <neu-dialog
            [open]="innerOpen()"
            title="Inner"
            (closeRequested)="innerRequests.push($event)"
            (opened)="innerOpened = innerOpened + 1"
            (closed)="innerClosed = innerClosed + 1"
          />
        }
      </neu-dialog>
    }
  `,
})
class OverlayHostComponent {
  readonly sidebarOpen = signal(false);
  readonly sidebarPersistent = signal(false);
  readonly childSheet = signal(false);
  readonly sheetOpen = signal(false);
  readonly outerDialog = signal(false);
  readonly outerOpen = signal(false);
  readonly innerDialog = signal(false);
  readonly innerOpen = signal(false);
  readonly sidebarRequests: NeuCloseRequest[] = [];
  readonly sheetRequests: NeuCloseRequest[] = [];
  readonly outerRequests: NeuCloseRequest[] = [];
  readonly innerRequests: NeuCloseRequest[] = [];
  sidebarOpened = 0;
  sidebarClosed = 0;
  sheetOpened = 0;
  sheetClosed = 0;
  outerOpened = 0;
  outerClosed = 0;
  innerOpened = 0;
  innerClosed = 0;
}

@Component({
  imports: [NeuSidebarComponent],
  template: `
    <neu-sidebar [open]="open()" (closeRequested)="acceptClose($event)">
      <span neu-sidebar-header>URL-owned navigation</span>
    </neu-sidebar>
  `,
})
class ExternalUrlAdapterFixture {
  readonly open = signal(false);
  readonly url = signal('/account');
  readonly requests: NeuCloseRequest[] = [];
  writes = 0;

  applyUrl(url: string): void {
    this.url.set(url);
    this.open.set(url.includes('menu=open'));
  }

  acceptClose(request: NeuCloseRequest): void {
    this.requests.push(request);
    this.writes += 1;
    this.applyUrl('/account');
  }
}

describe('N2-022 overlay event integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OverlayHostComponent, ExternalUrlAdapterFixture],
      providers: [provideZonelessChangeDetection(), provideNeuralIcons(iconX)],
    }).compileComponents();
  });

  it('keeps initial state and hydration-equivalent render silent', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.componentInstance.outerDialog.set(true);
    fixture.componentInstance.outerOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.sidebarOpened).toBe(0);
    expect(fixture.componentInstance.outerOpened).toBe(0);
    expect(fixture.componentInstance.sidebarClosed).toBe(0);
    expect(fixture.componentInstance.outerClosed).toBe(0);
    expect(fixture.componentInstance.sidebarRequests).toEqual([]);
    expect(fixture.componentInstance.outerRequests).toEqual([]);
  });

  it('keeps a rejected Sidebar close intent mounted and emits closed only after acceptance', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.sidebarOpened).toBe(1);

    (fixture.nativeElement.querySelector('.neu-sidebar__overlay') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarRequests.map(({ reason }) => reason)).toEqual([
      'outside',
    ]);
    expect(fixture.componentInstance.sidebarClosed).toBe(0);
    expect(fixture.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();

    fixture.componentInstance.sidebarOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.sidebarClosed).toBe(1);
  });

  it('ends and recreates Sidebar overlay lifecycle across persistent transitions without intents', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.sidebarPersistent.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.sidebarClosed).toBe(1);
    expect(fixture.componentInstance.sidebarRequests).toEqual([]);
    expect(fixture.nativeElement.querySelector('[role="navigation"]')).toBeTruthy();

    fixture.componentInstance.sidebarPersistent.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.sidebarOpened).toBe(2);
    expect(fixture.componentInstance.sidebarOpen()).toBe(true);
  });

  it('routes nested Dialog Escape only to the top overlay', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.outerDialog.set(true);
    fixture.componentInstance.outerOpen.set(true);
    fixture.componentInstance.innerDialog.set(true);
    fixture.componentInstance.innerOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const panels = fixture.nativeElement.querySelectorAll('.neu-dialog__panel');

    panels[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );

    expect(fixture.componentInstance.innerRequests.map(({ reason }) => reason)).toEqual(['escape']);
    expect(fixture.componentInstance.outerRequests).toEqual([]);
  });

  it('prevents child BottomSheet Escape from dismissing the Sidebar beneath it', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.componentInstance.childSheet.set(true);
    fixture.componentInstance.sheetOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.nativeElement
      .querySelector('.neu-bottom-sheet')
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );

    expect(fixture.componentInstance.sheetRequests.map(({ reason }) => reason)).toEqual(['escape']);
    expect(fixture.componentInstance.sidebarRequests).toEqual([]);
  });

  it('retains the shared scroll lock until the last overlay closes', async () => {
    const fixture = TestBed.createComponent(OverlayHostComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarOpen.set(true);
    fixture.componentInstance.childSheet.set(true);
    fixture.componentInstance.sheetOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.sheetOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.componentInstance.sidebarOpen.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps URL synchronization external and never echoes back/forward parent writes', async () => {
    const fixture = TestBed.createComponent(ExternalUrlAdapterFixture);
    fixture.detectChanges();
    fixture.componentInstance.applyUrl('/account?menu=open');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.neu-sidebar--open')).toBeTruthy();
    expect(fixture.componentInstance.requests).toEqual([]);

    (fixture.nativeElement.querySelector('.neu-sidebar__close') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.writes).toBe(1);
    expect(fixture.componentInstance.requests.map(({ reason }) => reason)).toEqual(['action']);
    expect(fixture.componentInstance.url()).toBe('/account');

    fixture.componentInstance.applyUrl('/account?menu=open');
    fixture.detectChanges();
    fixture.componentInstance.applyUrl('/account');
    fixture.detectChanges();
    expect(fixture.componentInstance.requests).toHaveLength(1);
    expect(fixture.componentInstance.writes).toBe(1);
  });
});
