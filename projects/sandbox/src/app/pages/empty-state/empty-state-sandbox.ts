import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NeuEmptyStateComponent, NeuButtonComponent } from '@neural-ui/core';

@Component({
  selector: 'app-empty-state-sandbox',
  imports: [NeuEmptyStateComponent, NeuButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Empty State</h1>
        <p class="sb-page__desc">
          NeuEmptyStateComponent — icono, título, descripción, acción proyectada.
        </p>
      </div>

      <!-- Por defecto -->
      <section class="sb-section">
        <h2 class="sb-section__title">Por defecto</h2>
        <div class="sb-demo">
          <neu-empty-state title="Sin resultados" />
        </div>
      </section>

      <!-- Con descripción -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con descripción</h2>
        <div class="sb-demo">
          <neu-empty-state
            title="No hay datos disponibles"
            description="Aún no se han registrado elementos en esta sección. Crea uno nuevo para comenzar."
          />
        </div>
      </section>

      <!-- Con icono personalizado -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con icono personalizado</h2>
        <div class="sb-demo sb-demo--grid">
          <neu-empty-state
            icon="lucideInbox"
            title="Bandeja vacía"
            description="No tienes mensajes por ahora."
          />
          <neu-empty-state
            icon="lucideUsers"
            title="Sin usuarios"
            description="Aún no has invitado a ningún colaborador."
          />
          <neu-empty-state
            icon="lucideFileText"
            title="Sin documentos"
            description="Sube un documento para comenzar."
          />
        </div>
      </section>

      <!-- Con acción -->
      <section class="sb-section">
        <h2 class="sb-section__title">Con acción</h2>
        <div class="sb-demo">
          <neu-empty-state
            icon="lucidePackage"
            title="No hay productos"
            description="Empieza añadiendo tu primer producto al catálogo."
          >
            <button neu-button variant="primary" icon="lucidePlus">Añadir producto</button>
          </neu-empty-state>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo sb-demo--grid">
          <neu-empty-state title="" description="Solo descripción sin título" />
          <neu-empty-state
            icon="lucideSearch"
            title="Sin coincidencias para «angular component library with signals zoneless»"
            description="Prueba con otros términos de búsqueda o ajusta los filtros."
          >
            <button neu-button variant="ghost">Limpiar búsqueda</button>
          </neu-empty-state>
        </div>
      </section>
    </div>
  `,
})
export class EmptyStateSandboxComponent {}
