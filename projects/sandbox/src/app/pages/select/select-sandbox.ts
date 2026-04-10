import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NeuSelectComponent } from '@neural-ui/core';
import type { NeuSelectOption } from '@neural-ui/core';

const COUNTRIES: NeuSelectOption[] = [
  { value: 'es', label: 'España' },
  { value: 'mx', label: 'México' },
  { value: 'ar', label: 'Argentina' },
  { value: 'co', label: 'Colombia' },
  { value: 'cl', label: 'Chile' },
  { value: 'pe', label: 'Perú' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'fr', label: 'Francia' },
  { value: 'de', label: 'Alemania' },
  { value: 'it', label: 'Italia' },
];

const ROLES: NeuSelectOption[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Visitante' },
];

interface User {
  id: number;
  name: string;
  role: string;
}

const USERS_AS_OPTIONS: NeuSelectOption[] = [
  { value: '1', label: 'Ana García', data: { id: 1, name: 'Ana García', role: 'admin' } as User },
  {
    value: '2',
    label: 'Pablo Martín',
    data: { id: 2, name: 'Pablo Martín', role: 'editor' } as User,
  },
  {
    value: '3',
    label: 'María López',
    data: { id: 3, name: 'María López', role: 'viewer' } as User,
  },
];

@Component({
  selector: 'app-select-sandbox',
  imports: [NeuSelectComponent, FormsModule, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Select</h1>
        <p class="sb-page__desc">NeuSelectComponent — variantes, búsqueda, clearable, URL state.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-select
              label="País"
              [options]="countries"
              [(ngModel)]="selectedCountry"
              (selectionChange)="onBasicCountryChange($event)"
            />
            <span class="sb-value">ngModel: {{ selectedCountry() ?? 'null' }}</span>
            <span class="sb-value">selectionChange: {{ selectedCountryObject() | json }}</span>
          </div>
          <div class="sb-field">
            <neu-select
              label="Rol"
              [options]="roles"
              [(ngModel)]="selectedRole"
              placeholder="Selecciona un rol"
            />
          </div>
        </div>
      </section>

      <!-- Floating label -->
      <section class="sb-section">
        <h2 class="sb-section__title">Floating label</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-select label="País (floating)" [options]="countries" [floatingLabel]="true" />
          <neu-select
            label="Rol (floating)"
            [options]="roles"
            [floatingLabel]="true"
            placeholder="Elige un rol"
          />
        </div>
      </section>

      <!-- Searchable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Searchable</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-select
            label="País (searchable)"
            [options]="countries"
            [searchable]="true"
            searchPlaceholder="Buscar país..."
          />
          <neu-select
            label="País (floating + searchable)"
            [options]="countries"
            [searchable]="true"
            [floatingLabel]="true"
            searchPlaceholder="Buscar..."
          />
        </div>
      </section>

      <!-- Clearable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Clearable</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-select
              label="País (clearable)"
              [options]="countries"
              [clearable]="true"
              [(ngModel)]="clearableVal"
            />
            <span class="sb-value">valor: {{ clearableVal() ?? 'null' }}</span>
          </div>
          <div class="sb-field">
            <neu-select
              label="País (searchable + clearable)"
              [options]="countries"
              [clearable]="true"
              [searchable]="true"
              [(ngModel)]="clearableSearchVal"
            />
          </div>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-select label="Deshabilitado" [options]="countries" [disabled]="true" />
          <neu-select label="Con error" [options]="countries" errorMessage="Selección requerida" />
          <neu-select
            label="Sin opciones"
            [options]="[]"
            noResultsMessage="No hay opciones disponibles"
          />
          <neu-select
            label="Sin resultados (busca 'zzz')"
            [options]="countries"
            [searchable]="true"
            noResultsMessage="Sin resultados para tu búsqueda"
          />
        </div>
      </section>

      <!-- URL State -->
      <section class="sb-section">
        <h2 class="sb-section__title">URL State</h2>
        <p class="sb-page__desc">
          Con <code>urlParam</code> el valor seleccionado se sincroniza con el query param indicado.
          Prueba a recargar la página — la selección se restaura desde la URL.
        </p>
        <div class="sb-demo--grid sb-demo">
          <!-- Básico: persiste en ?country= -->
          <div class="sb-field">
            <neu-select
              label='País (urlParam="country")'
              [options]="countries"
              urlParam="country"
            />
            <span class="sb-value">selección en ?country=...</span>
          </div>

          <!-- Clearable: ?role= se elimina de la URL al limpiar -->
          <div class="sb-field">
            <neu-select
              label='Rol (urlParam="role", clearable)'
              [options]="roles"
              urlParam="role"
              [clearable]="true"
            />
            <span class="sb-value">limpiar elimina ?role= de la URL</span>
          </div>

          <!-- Combinado con ngModel: URL + two-way binding coexisten -->
          <div class="sb-field">
            <neu-select
              label='País + ngModel (urlParam="country2")'
              [options]="countries"
              urlParam="country2"
              [(ngModel)]="urlCountry"
            />
            <span class="sb-value">ngModel: {{ urlCountry() ?? 'null' }}</span>
          </div>

          <!-- Searchable + URL State -->
          <div class="sb-field">
            <neu-select
              label='País searchable (urlParam="q")'
              [options]="countries"
              urlParam="q"
              [searchable]="true"
              [clearable]="true"
            />
          </div>
        </div>
      </section>

      <!-- selectionChange output -->
      <section class="sb-section">
        <h2 class="sb-section__title">selectionChange</h2>
        <p class="sb-page__desc">
          El output <code>(selectionChange)</code> emite el objeto
          <code>NeuSelectOption</code> completo al seleccionar (incluyendo el campo
          <code>data</code>), y <code>null</code> al limpiar. <code>ngModel</code> y URL siguen
          siendo strings.
        </p>
        <div class="sb-demo--grid sb-demo">
          <!-- emisión básica -->
          <div class="sb-field">
            <neu-select
              label="País (selectionChange básico)"
              [options]="countries"
              [clearable]="true"
              (selectionChange)="onCountryChange($event)"
            />
            <span class="sb-value">option: {{ selectedOption() | json }}</span>
          </div>

          <!-- con campo data: acceso al objeto de origen -->
          <div class="sb-field">
            <neu-select
              label="Usuario (con data)"
              [options]="usersAsOptions"
              [clearable]="true"
              (selectionChange)="onUserChange($event)"
            />
            <span class="sb-value">user.id: {{ selectedUser()?.id ?? 'null' }}</span>
            <span class="sb-value">user.role: {{ selectedUser()?.role ?? 'null' }}</span>
          </div>

          <!-- combinado: ngModel string + selectionChange objeto -->
          <div class="sb-field">
            <neu-select
              label="Rol (ngModel + selectionChange)"
              [options]="roles"
              [(ngModel)]="selectedRole"
              (selectionChange)="onRoleChange($event)"
            />
            <span class="sb-value">value (string): {{ selectedRole() ?? 'null' }}</span>
            <span class="sb-value">label: {{ selectedRoleLabel() ?? 'null' }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class SelectSandboxComponent {
  readonly countries = COUNTRIES;
  readonly roles = ROLES;
  readonly usersAsOptions = USERS_AS_OPTIONS;

  readonly selectedCountry = signal<string | null>(null);
  readonly selectedRole = signal<string | null>(null);
  readonly clearableVal = signal<string | null>('es');
  readonly clearableSearchVal = signal<string | null>(null);
  readonly urlCountry = signal<string | null>(null);

  readonly selectedOption = signal<NeuSelectOption | null>(null);
  readonly selectedCountryObject = signal<NeuSelectOption | null>(null);
  readonly selectedUser = signal<User | null>(null);
  readonly selectedRoleLabel = signal<string | null>(null);

  onBasicCountryChange(opt: NeuSelectOption | null): void {
    this.selectedCountryObject.set(opt);
  }

  onCountryChange(opt: NeuSelectOption | null): void {
    this.selectedOption.set(opt);
  }

  onUserChange(opt: NeuSelectOption | null): void {
    this.selectedUser.set(opt ? (opt.data as User) : null);
  }

  onRoleChange(opt: NeuSelectOption | null): void {
    this.selectedRoleLabel.set(opt?.label ?? null);
  }
}
