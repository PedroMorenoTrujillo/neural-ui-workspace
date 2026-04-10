import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NeuMultiselectComponent } from '@neural-ui/core';
import type { NeuSelectOption } from '@neural-ui/core';

interface User {
  id: number;
  role: string;
}

const USERS_AS_OPTIONS: NeuSelectOption[] = [
  { value: '1', label: 'Ana García', data: { id: 1, role: 'admin' } as User },
  { value: '2', label: 'Pablo Martín', data: { id: 2, role: 'editor' } as User },
  { value: '3', label: 'María López', data: { id: 3, role: 'viewer' } as User },
];

const SKILLS: NeuSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

const TAGS: NeuSelectOption[] = [
  { value: 'ui', label: 'UI/UX' },
  { value: 'backend', label: 'Backend' },
  { value: 'devops', label: 'DevOps' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'data', label: 'Data Science' },
];

@Component({
  selector: 'app-multiselect-sandbox',
  imports: [NeuMultiselectComponent, FormsModule, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Multiselect</h1>
        <p class="sb-page__desc">
          NeuMultiselectComponent — selección múltiple, búsqueda, URL state.
        </p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-multiselect
              label="Tecnologías"
              [options]="skills"
              [(ngModel)]="selectedSkills"
              (selectionChange)="onBasicSkillsChange($event)"
            />
            <span class="sb-value">ngModel: {{ selectedSkills() | json }}</span>
            <span class="sb-value">selectionChange: {{ selectedSkillsObjects() | json }}</span>
          </div>
          <div class="sb-field">
            <neu-multiselect
              label="Tags"
              [options]="tags"
              placeholder="Selecciona tags"
              [(ngModel)]="selectedTags"
            />
          </div>
        </div>
      </section>

      <!-- Floating label -->
      <section class="sb-section">
        <h2 class="sb-section__title">Floating label</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-multiselect
            label="Tecnologías (floating)"
            [options]="skills"
            [floatingLabel]="true"
          />
          <neu-multiselect label="Tags (floating)" [options]="tags" [floatingLabel]="true" />
        </div>
      </section>

      <!-- Searchable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Searchable</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-multiselect
            label="Tecnologías (searchable)"
            [options]="skills"
            [searchable]="true"
            searchPlaceholder="Buscar..."
          />
          <neu-multiselect
            label="Skills (floating + searchable)"
            [options]="skills"
            [searchable]="true"
            [floatingLabel]="true"
          />
        </div>
      </section>

      <!-- Clearable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Clearable</h2>
        <div class="sb-demo--grid sb-demo">
          <div class="sb-field">
            <neu-multiselect
              label="Clearable"
              [options]="skills"
              [clearable]="true"
              [(ngModel)]="clearableSkills"
            />
            <span class="sb-value">{{ clearableSkills() | json }}</span>
          </div>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--grid sb-demo">
          <neu-multiselect label="Deshabilitado" [options]="skills" [disabled]="true" />
          <neu-multiselect
            label="Con error"
            [options]="skills"
            errorMessage="Selecciona al menos una opción"
          />
          <neu-multiselect
            label="Sin opciones"
            [options]="[]"
            noResultsMessage="No hay opciones disponibles"
          />
        </div>
      </section>

      <!-- URL State -->
      <section class="sb-section">
        <h2 class="sb-section__title">URL State</h2>
        <p class="sb-page__desc">
          Con <code>urlParam</code> los valores se sincronizan con el query param indicado
          (separados por coma). Prueba a recargar — la selección se restaura desde la URL.
        </p>
        <div class="sb-demo--grid sb-demo">
          <!-- Básico: ?skills=angular,typescript -->
          <div class="sb-field">
            <neu-multiselect
              label='Skills (urlParam="skills")'
              [options]="skills"
              urlParam="skills"
            />
            <span class="sb-value">?skills=val1,val2,...</span>
          </div>

          <!-- Clearable: limpiar elimina el param -->
          <div class="sb-field">
            <neu-multiselect
              label='Tags (urlParam="tags", clearable)'
              [options]="tags"
              urlParam="tags"
              [clearable]="true"
            />
            <span class="sb-value">clearable elimina ?tags= de la URL</span>
          </div>

          <!-- Combinado con ngModel: URL + two-way binding -->
          <div class="sb-field">
            <neu-multiselect
              label='Skills + ngModel (urlParam="s2")'
              [options]="skills"
              urlParam="s2"
              [(ngModel)]="urlSkills"
            />
            <span class="sb-value">ngModel: {{ urlSkills() | json }}</span>
          </div>

          <!-- Searchable + URL State -->
          <div class="sb-field">
            <neu-multiselect
              label='Skills searchable (urlParam="tech")'
              [options]="skills"
              urlParam="tech"
              [searchable]="true"
              [clearable]="true"
              searchPlaceholder="Buscar tecnología..."
            />
          </div>
        </div>
      </section>

      <!-- selectionChange output -->
      <section class="sb-section">
        <h2 class="sb-section__title">selectionChange</h2>
        <p class="sb-page__desc">
          El output <code>(selectionChange)</code> emite el array<code>NeuSelectOption[]</code>
          completo al cambiar la selección, incluyendo el campo <code>data</code>. Emite
          <code>[]</code> al limpiar todo.
        </p>
        <div class="sb-demo--grid sb-demo">
          <!-- emisión de objetos completos -->
          <div class="sb-field">
            <neu-multiselect
              label="Skills (selectionChange objetos)"
              [options]="skills"
              (selectionChange)="onSkillsChange($event)"
            />
            <span class="sb-value">{{ selectedSkillObjects() | json }}</span>
          </div>

          <!-- con campo data: acceso a ids -->
          <div class="sb-field">
            <neu-multiselect
              label="Usuarios (con data)"
              [options]="usersAsOptions"
              [clearable]="true"
              (selectionChange)="onUsersChange($event)"
            />
            <span class="sb-value">ids: {{ selectedUserIds() | json }}</span>
          </div>

          <!-- clearAll emite [] -->
          <div class="sb-field">
            <neu-multiselect
              label="Tags (clearable — clearAll emite [])"
              [options]="tags"
              [clearable]="true"
              (selectionChange)="onTagsChange($event)"
            />
            <span class="sb-value">count: {{ selectedTagCount() }}</span>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class MultiselectSandboxComponent {
  readonly skills = SKILLS;
  readonly tags = TAGS;
  readonly usersAsOptions = USERS_AS_OPTIONS;

  readonly selectedSkills = signal<string[]>([]);
  readonly selectedTags = signal<string[]>([]);
  readonly clearableSkills = signal<string[]>(['angular', 'typescript']);
  readonly urlSkills = signal<string[]>([]);

  readonly selectedSkillsObjects = signal<NeuSelectOption[]>([]);
  readonly selectedSkillObjects = signal<NeuSelectOption[]>([]);
  readonly selectedSkillLabels = signal<string[]>([]);
  readonly selectedUserIds = signal<number[]>([]);
  readonly selectedTagCount = signal<number>(0);

  onBasicSkillsChange(opts: NeuSelectOption[]): void {
    this.selectedSkillsObjects.set(opts);
  }

  onSkillsChange(opts: NeuSelectOption[]): void {
    this.selectedSkillObjects.set(opts);
  }

  onUsersChange(opts: NeuSelectOption[]): void {
    this.selectedUserIds.set(opts.map((o) => (o.data as User).id));
  }

  onTagsChange(opts: NeuSelectOption[]): void {
    this.selectedTagCount.set(opts.length);
  }
}
