import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NeuButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
