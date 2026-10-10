import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { NeuDialogComponent } from '@neural-ui/core/modal';

@Component({
  selector: 'n2-modal-focus',
  imports: [NeuDialogComponent],
  template: `
    <button id="origin" (click)="parent.set(true)">Open parent</button>
    <button id="underlying">Underlying application</button>
    @if (parentMounted()) {
      <neu-dialog title="Parent" [open]="parent()" (closeRequested)="parent.set(false)">
        <button id="open-child" (click)="childMounted.set(true); child.set(true)">Open child</button>
        <button id="open-two" (click)="openingTransition.set(true); childMounted.set(true); child.set(true)">Open two levels</button>
        <input id="parent-input" aria-label="Parent input" />
      </neu-dialog>
    }
    @if (childMounted()) {
      <neu-dialog title="Child" [open]="child()" (closeRequested)="child.set(false)" (opened)="onChildOpened()">
        <button id="open-third" (click)="third.set(true)">Open third</button>
        <input id="child-input" aria-label="Child input" />
        <button id="child-last">Child last</button>
        <button id="disabled" disabled>Disabled</button>
        <button id="hidden" hidden>Hidden</button>
        <div inert><input id="inert" aria-label="Inert input" /></div>
        <button id="toggle-dynamic" (click)="dynamic.set(!dynamic())">Toggle dynamic</button>
        <button id="destroy-child" (click)="childMounted.set(false); child.set(false)">Destroy child</button>
        <button id="destroy-parent" (click)="parentMounted.set(false); parent.set(false)">Destroy parent</button>
        @if (dynamic()) { <button id="dynamic" (keydown.delete)="dynamic.set(false)">Dynamic</button> }
      </neu-dialog>
    }
    <neu-dialog title="Third" [open]="third()" (closeRequested)="third.set(false)">
      <input id="third-input" aria-label="Third input" />
      <button id="third-last">Third last</button>
    </neu-dialog>
    <output id="ready">ready</output>
  `,
})
class ModalFocusConsumer {
  readonly parent = signal(false);
  readonly child = signal(false);
  readonly third = signal(false);
  readonly parentMounted = signal(true);
  readonly childMounted = signal(true);
  readonly dynamic = signal(false);
  readonly openingTransition = signal(false);

  protected onChildOpened(): void {
    if (!this.openingTransition()) return;
    this.openingTransition.set(false);
    this.third.set(true);
  }
}

bootstrapApplication(ModalFocusConsumer, { providers: [provideZonelessChangeDetection()] })
  .catch((error: unknown) => console.error(error));
