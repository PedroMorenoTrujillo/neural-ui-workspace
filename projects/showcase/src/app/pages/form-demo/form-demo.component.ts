import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { NeuTextareaComponent, NeuSwitchComponent, NeuCheckboxComponent, NeuRadioGroupComponent, NeuRadioComponent } from '@neural-ui/core';

@Component({
  selector: 'app-form-demo',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    NeuTextareaComponent,
    NeuSwitchComponent,
    NeuCheckboxComponent,
    NeuRadioGroupComponent,
    NeuRadioComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './form-demo.component.html',
  styleUrl: './form-demo.component.scss',
})
export class FormDemoComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    bio: ['', [Validators.maxLength(300)]],
    notifications: [true],
    newsletter: [false],
    theme: ['system'],
  });

  submitted = signal(false);

  onSubmit(): void {
    this.submitted.set(true);
  }
}
