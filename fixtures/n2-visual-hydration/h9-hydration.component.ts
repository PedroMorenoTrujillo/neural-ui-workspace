import { Component, afterNextRender, signal } from '@angular/core';
import { NeuAlertComponent } from '@neural-ui/core/alert';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuCodeBlockComponent } from '@neural-ui/core/code-block';
import { NeuTagComponent } from '@neural-ui/core/tag';
import { NeuToolbarComponent } from '@neural-ui/core/toolbar';

@Component({
  selector: 'app-root',
  imports: [
    NeuAlertComponent,
    NeuButtonComponent,
    NeuCodeBlockComponent,
    NeuTagComponent,
    NeuToolbarComponent,
  ],
  template: `
    <span id="visual-ready">{{ ready() }}</span>
    <span id="visual-count">{{ count() }}</span>
    <button
      neu-button
      id="visual-toggle"
      [tone]="alternate() ? 'neutral' : 'brand'"
      [variant]="alternate() ? 'ghost' : 'solid'"
      (click)="toggle()"
    >Toggle</button>
    <neu-alert tone="danger" variant="outline">Hydrated warning</neu-alert>
    <neu-tag tone="success" variant="soft">Hydrated tag</neu-tag>
    <neu-toolbar tone="brand" variant="soft" density="relaxed">
      Hydrated toolbar
    </neu-toolbar>
    <neu-code-block code="const hydrated = true;" density="compact" />
  `,
})
export class H9HydrationComponent {
  readonly ready = signal(false);
  readonly alternate = signal(false);
  readonly count = signal(0);

  constructor() {
    afterNextRender(() => this.ready.set(true));
  }

  toggle(): void {
    this.alternate.update((value) => !value);
    this.count.update((value) => value + 1);
  }
}
