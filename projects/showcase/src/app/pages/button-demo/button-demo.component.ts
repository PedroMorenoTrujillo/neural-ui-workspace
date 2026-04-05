import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-button-demo',
  standalone: true,
  imports: [NeuButtonComponent],
  templateUrl: './button-demo.component.html',
  styleUrl: './button-demo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDemoComponent {
  readonly isLoading = signal(false);

  simulateLoad(): void {
    this.isLoading.set(true);
    setTimeout(() => this.isLoading.set(false), 2500);
  }
}
