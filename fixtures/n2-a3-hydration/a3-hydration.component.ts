import { Component, signal } from '@angular/core';
import { NeuAvatarComponent } from '@neural-ui/core/avatar';
import { NeuAvatarGroupComponent } from '@neural-ui/core/avatar-group';
import { NeuCardComponent } from '@neural-ui/core/card';
import { NeuDividerComponent } from '@neural-ui/core/divider';
import { NeuSkeletonComponent } from '@neural-ui/core/skeleton';
import { NeuSpinnerComponent } from '@neural-ui/core/spinner';

@Component({
  selector: 'app-root',
  imports: [NeuAvatarComponent, NeuAvatarGroupComponent, NeuCardComponent, NeuDividerComponent, NeuSkeletonComponent, NeuSpinnerComponent],
  template: `
    <main>
      <neu-avatar-group ariaLabel="Team">
        <neu-avatar [name]="name()" />
        <neu-avatar name="Grace Hopper" />
      </neu-avatar-group>
      <neu-card>
        <h2 neu-card-header>Profile</h2>
        <p>Ready</p>
        <span neu-card-footer>Footer</span>
      </neu-card>
      <neu-divider label="Section" />
      <neu-skeleton />
      <neu-spinner ariaLabel="Loading profile" />
      <button id="a3-update" type="button" (click)="name.set('Alan Turing')">Update</button>
      <output id="a3-ready">{{ name() }}</output>
    </main>
  `,
})
export class H9HydrationComponent {
  readonly name = signal('Ada Lovelace');
}
