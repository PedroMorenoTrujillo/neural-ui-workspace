import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output, signal } from '@angular/core';

@Component({
  selector: 'neu-panel',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-panel' },
  template: `
    <section class="neu-panel__surface">
      @if (header()) {
        <header class="neu-panel__header">
          <h3>{{ header() }}</h3>
          @if (collapsible()) {
            <button type="button" (click)="toggle()" [attr.aria-expanded]="!collapsed()">
              {{ collapsed() ? expandLabel() : collapseLabel() }}
            </button>
          }
        </header>
      }
      @if (!collapsed()) {
        <div class="neu-panel__body"><ng-content /></div>
      }
    </section>
  `,
  styleUrl: './neu-panel.component.scss',
})
export class NeuPanelComponent {
  readonly header = input('');
  readonly collapsible = input(false);
  readonly expandLabel = input('Expand');
  readonly collapseLabel = input('Collapse');
  readonly collapsedChange = output<boolean>();
  readonly collapsed = signal(false);

  toggle(): void {
    this.collapsed.set(!this.collapsed());
    this.collapsedChange.emit(this.collapsed());
  }
}

@Component({
  selector: 'neu-fieldset',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-fieldset-host' },
  template: `
    <fieldset class="neu-fieldset">
      @if (legend()) {
        <legend>{{ legend() }}</legend>
      }
      <ng-content />
    </fieldset>
  `,
  styleUrl: './neu-panel.component.scss',
})
export class NeuFieldsetComponent {
  readonly legend = input('');
}

@Component({
  selector: 'neu-scroll-area',
  imports: [],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'neu-scroll-area' },
  template: `<div class="neu-scroll-area__viewport" [style.max-height]="maxHeight()"><ng-content /></div>`,
  styleUrl: './neu-panel.component.scss',
})
export class NeuScrollAreaComponent {
  readonly maxHeight = input('240px');
}
