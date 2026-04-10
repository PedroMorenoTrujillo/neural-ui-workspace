import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuAvatarComponent } from '@neural-ui/core';

@Component({
  selector: 'app-avatar-sandbox',
  imports: [NeuAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Avatar</h1>
        <p class="sb-page__desc">
          NeuAvatarComponent — imagen, iniciales, tamaños, formas, status.
        </p>
      </div>

      <!-- Con imagen -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con imagen</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-avatar src="https://i.pravatar.cc/150?img=1" alt="Alice" size="xs" />
          <neu-avatar src="https://i.pravatar.cc/150?img=2" alt="Bob" size="sm" />
          <neu-avatar src="https://i.pravatar.cc/150?img=3" alt="Carol" size="md" />
          <neu-avatar src="https://i.pravatar.cc/150?img=4" alt="Dave" size="lg" />
          <neu-avatar src="https://i.pravatar.cc/150?img=5" alt="Eve" size="xl" />
        </div>
      </section>

      <!-- Solo iniciales -->
      <section class="sb-section">
        <h2 class="sb-section__title">Iniciales (sin src)</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-avatar name="Ana García" size="xs" />
          <neu-avatar name="Pedro Moreno" size="sm" />
          <neu-avatar name="Carlos López" size="md" />
          <neu-avatar name="María Torres" size="lg" />
          <neu-avatar name="Juan Rodríguez" size="xl" />
        </div>
      </section>

      <!-- Formas -->
      <section class="sb-section">
        <h2 class="sb-section__title">Formas</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-avatar name="AB" shape="circle" size="lg" />
          <neu-avatar name="CD" shape="square" size="lg" />
        </div>
      </section>

      <!-- Status -->
      <section class="sb-section">
        <h2 class="sb-section__title">Estado (status)</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar name="En línea" status="online" size="lg" />
            <span class="sb-label">online</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar name="Ausente" status="away" size="lg" />
            <span class="sb-label">away</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar name="Ocupado" status="busy" size="lg" />
            <span class="sb-label">busy</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar name="Sin conexión" status="offline" size="lg" />
            <span class="sb-label">offline</span>
          </div>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo" style="align-items: center">
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar size="md" />
            <span class="sb-label">Sin nombre ni src</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar name="X" size="lg" status="online" />
            <span class="sb-label">1 inicial + status</span>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px">
            <neu-avatar src="https://broken-url.example.com/img.jpg" name="Fallback" size="lg" />
            <span class="sb-label">Img rota → fallback</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class AvatarSandboxComponent {}
