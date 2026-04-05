import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuAvatarComponent } from '@neural-ui/core';

@Component({
  selector: 'app-avatar-demo',
  template: `
    <h1>Avatar</h1>
    <p>Componente circular para fotos de perfil o iniciales.</p>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:center;padding:2rem 0">
      <neu-avatar name="Pedro Moreno" color="blue" />
      <neu-avatar name="Ana García" color="green" size="lg" />
      <neu-avatar name="Test User" color="violet" size="xl" status="online" />
      <neu-avatar src="https://i.pravatar.cc/64" alt="Avatar" size="lg" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NeuAvatarComponent],
})
export class AvatarDemoComponent {}
