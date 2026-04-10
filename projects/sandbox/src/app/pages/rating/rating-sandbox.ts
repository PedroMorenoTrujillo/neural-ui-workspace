import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NeuRatingComponent } from '@neural-ui/core';

@Component({
  selector: 'app-rating-sandbox',
  imports: [NeuRatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sb-page">
      <div>
        <h1 class="sb-page__title">Rating</h1>
        <p class="sb-page__desc">NeuRatingComponent — estrellas, readonly, número de estrellas.</p>
      </div>

      <!-- Básico -->
      <section class="sb-section">
        <h2 class="sb-section__title">Básico</h2>
        <div class="sb-demo--column sb-demo">
          <neu-rating [value]="stars()" [stars]="5" (valueChange)="stars.set($event)" />
          <span class="sb-value">estrellas: {{ stars() }} / 5</span>
        </div>
      </section>

      <!-- Variantes -->
      <section class="sb-section">
        <h2 class="sb-section__title">Variantes</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">3 de 5 (editable)</span>
            <neu-rating [value]="rating3()" [stars]="5" (valueChange)="rating3.set($event)" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Rating de 10 estrellas</span>
            <neu-rating [value]="bigRating()" [stars]="10" (valueChange)="bigRating.set($event)" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Solo lectura (4.5 → redondeado a 4)</span>
            <neu-rating [value]="4" [stars]="5" [readonly]="true" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Solo lectura full (5/5)</span>
            <neu-rating [value]="5" [stars]="5" [readonly]="true" />
          </div>
        </div>
      </section>

      <!-- Casos límite -->
      <section class="sb-section">
        <h2 class="sb-section__title">Casos límite</h2>
        <div class="sb-demo--column sb-demo">
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">Valor 0 (sin calificación)</span>
            <neu-rating [value]="0" [stars]="5" [readonly]="true" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <span class="sb-label">1 sola estrella</span>
            <neu-rating [value]="star1()" [stars]="1" (valueChange)="star1.set($event)" />
          </div>
        </div>
      </section>
    </div>
  `,
})
export class RatingSandboxComponent {
  readonly stars = signal(0);
  readonly rating3 = signal(3);
  readonly bigRating = signal(7);
  readonly star1 = signal(0);
}
