import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuChipComponent } from '@neural-ui/core';

@Component({
  selector: 'app-chip-sandbox',
  imports: [NeuChipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Chip</h1>
        <p class="sb-page__desc">NeuChipComponent — variantes, seleccionable, removible.</p>
      </div>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo">
          <neu-chip variant="default">Default</neu-chip>
          <neu-chip variant="primary">Primary</neu-chip>
          <neu-chip variant="success">Success</neu-chip>
          <neu-chip variant="warning">Warning</neu-chip>
          <neu-chip variant="danger">Danger</neu-chip>
        </div>
      </section>

      <!-- Tamaños -->
      <section class="sb-section">
        <h2 class="sb-section__title">Tamaños</h2>
        <div class="sb-demo" style="align-items: center">
          <neu-chip variant="primary" size="sm">Small</neu-chip>
          <neu-chip variant="primary" size="md">Medium</neu-chip>
        </div>
      </section>

      <!-- Seleccionable -->
      <section class="sb-section">
        <h2 class="sb-section__title">Seleccionable</h2>
        <div class="sb-demo">
          @for (tag of selectableTags(); track tag.id) {
            <neu-chip
              [variant]="tag.selected ? 'primary' : 'default'"
              [selected]="tag.selected"
              (selectedChange)="toggleTag(tag.id)"
            >
              {{ tag.label }}
            </neu-chip>
          }
        </div>
        <span class="sb-value" style="margin-top: 8px">
          seleccionados: {{ selectedTagLabels() }}
        </span>
      </section>

      <!-- Removible -->
      <section class="sb-section">
        <h2 class="sb-section__title">Removible</h2>
        <div class="sb-demo">
          @for (tag of removableTags(); track tag) {
            <neu-chip variant="primary" [removable]="true" (removed)="removeTag(tag)">
              {{ tag }}
            </neu-chip>
          }
          @if (removableTags().length === 0) {
            <span style="font-size: var(--neu-text-sm); color: var(--neu-text-muted)">
              Todos los chips eliminados — recarga la página
            </span>
          }
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo">
          <neu-chip [disabled]="true">Disabled</neu-chip>
          <neu-chip variant="danger" [disabled]="true" [removable]="true"
            >Disabled removible</neu-chip
          >
          <neu-chip variant="success" [selected]="true">Preseleccionado</neu-chip>
        </div>
      </section>
    </div>
  `,
})
export class ChipSandboxComponent {
  readonly selectableTags = signal([
    { id: 1, label: 'Angular', selected: false },
    { id: 2, label: 'TypeScript', selected: true },
    { id: 3, label: 'RxJS', selected: false },
    { id: 4, label: 'Signals', selected: true },
    { id: 5, label: 'CSS', selected: false },
  ]);

  readonly removableTags = signal(['Vue', 'React', 'Angular', 'Svelte', 'Solid']);

  toggleTag(id: number): void {
    this.selectableTags.update((tags) =>
      tags.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }

  removeTag(label: string): void {
    this.removableTags.update((tags) => tags.filter((t) => t !== label));
  }

  selectedTagLabels(): string {
    const sel = this.selectableTags()
      .filter((t) => t.selected)
      .map((t) => t.label);
    return sel.length ? sel.join(', ') : 'ninguno';
  }
}
