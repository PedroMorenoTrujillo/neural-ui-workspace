import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  NeuCardComponent,
  NeuDividerComponent,
  NeuInputComponent,
  NeuSwitchComponent,
  NeuTextareaComponent,
  NeuToastService,
} from '@neural-ui/core';

interface ProfileForm {
  name: string;
  email: string;
  bio: string;
}

interface PrefsForm {
  notifications: boolean;
  newsletter: boolean;
  darkMode: boolean;
}

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    TranslocoPipe,
    NeuCardComponent,
    NeuInputComponent,
    NeuTextareaComponent,
    NeuSwitchComponent,
    NeuDividerComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly toast = inject(NeuToastService);

  readonly saving = signal(false);

  readonly profile = signal<ProfileForm>({
    name: 'Admin User',
    email: 'admin@neuralui.dev',
    bio: 'Administrador principal del panel Neural Admin Pro.',
  });

  readonly prefs = signal<PrefsForm>({
    notifications: true,
    newsletter: false,
    darkMode: true,
  });

  updateProfile(field: keyof ProfileForm, value: string): void {
    this.profile.update((p) => ({ ...p, [field]: value }));
  }

  updatePref(field: keyof PrefsForm, value: boolean): void {
    this.prefs.update((p) => ({ ...p, [field]: value }));
  }

  save(): void {
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.toast.success('Configuración guardada correctamente');
    }, 800);
  }
}
