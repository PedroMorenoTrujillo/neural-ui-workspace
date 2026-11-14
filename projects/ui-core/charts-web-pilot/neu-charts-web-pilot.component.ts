import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface NeuChartPilotDatum {
  readonly id: string;
  readonly label: string;
  readonly value: number | null;
}

export type NeuChartPilotType = 'line' | 'bar' | 'donut';

const palette = [
  'var(--neu-primary, #2459ca)',
  'var(--neu-success-text, #137560)',
  'var(--neu-warning-text, #a74d00)',
  'var(--neu-error-text, #b3243b)',
  'var(--neu-info-text, #5244ad)',
];

@Component({
  selector: 'neu-charts-web-pilot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure>
      <figcaption>{{ heading() }}</figcaption>
      @if (points().length) {
        <svg viewBox="0 0 320 150" aria-hidden="true" focusable="false">
          @switch (type()) {
            @case ('line') {
              <path [attr.d]="line()" fill="none" stroke="currentColor" stroke-width="2" />
              @for (p of points(); track p.item.id) {
                @if (p.height !== null) {
                  <circle [attr.cx]="p.x" [attr.cy]="130 - p.height"
                    [attr.r]="selectedId() === p.item.id ? 6 : 3" fill="currentColor" />
                }
              }
            }
            @case ('bar') {
              @for (p of points(); track p.item.id) {
                @if (p.height !== null) {
                  <rect [attr.x]="p.x - barWidth()/2" [attr.y]="130 - p.height"
                    [attr.width]="barWidth()" [attr.height]="p.height"
                    [attr.opacity]="selectedId() && selectedId() !== p.item.id ? .55 : 1"
                    [attr.fill]="p.color" />
                }
              }
            }
            @case ('donut') {
              @for (arc of arcs(); track arc.item.id) {
                <circle cx="160" cy="75" r="53" pathLength="100" fill="none"
                  [attr.stroke]="arc.color" [attr.stroke-width]="selectedId() === arc.item.id ? 28 : 21"
                  [attr.stroke-dasharray]="arc.length + ' ' + (100 - arc.length)"
                  [attr.stroke-dashoffset]="-arc.offset" transform="rotate(-90 160 75)" />
              }
            }
          }
        </svg>
      }
      <table>
        <caption>{{ dataCaption() }}</caption>
        <thead><tr><th scope="col">{{ categoryLabel() }}</th><th scope="col">{{ valueLabel() }}</th></tr></thead>
        <tbody>
          @for (p of points(); track p.item.id) {
            <tr>
              <th scope="row">
                <button type="button" [attr.aria-pressed]="selectedId() === p.item.id"
                  (click)="selectedIdChange.emit(selectedId() === p.item.id ? null : p.item.id)">
                  {{ p.item.label }}
                </button>
              </th>
              <td>{{ p.printed }}</td>
            </tr>
          } @empty {
            <tr><td colspan="2">{{ missingLabel() }}</td></tr>
          }
        </tbody>
      </table>
    </figure>
  `,
  styles: `
    figure { margin: 0; }
    figcaption { font-weight: 700; margin-block-end: .5rem; }
    svg { display: block; inline-size: 100%; max-inline-size: 32rem; color: var(--neu-primary, #2459ca); }
    table { inline-size: 100%; border-collapse: collapse; }
    caption, th, td { padding: .35rem .5rem; text-align: start; }
    td, tbody th { border-block-start: 1px solid var(--neu-border, currentColor); }
    button { color: inherit; font: inherit; background: transparent; border: 1px solid transparent; }
    button[aria-pressed=true] { border-color: currentColor; font-weight: 700; }
    button:focus-visible { outline: 2px solid currentColor; }
  `,
})
export class NeuChartsWebPilotComponent {
  readonly type = input.required<NeuChartPilotType>();
  readonly heading = input.required<string>();
  readonly rows = input.required<readonly NeuChartPilotDatum[]>();
  readonly dataCaption = input('Chart values');
  readonly categoryLabel = input('Category');
  readonly valueLabel = input('Value');
  readonly missingLabel = input('No data');
  readonly locale = input('en-US');
  readonly selectedId = input<string | null>(null);
  readonly selectedIdChange = output<string | null>();

  private readonly numberFormatter = computed(() => {
    const options = { maximumFractionDigits: 2 };
    try {
      return new Intl.NumberFormat(this.locale(), options);
    } catch {
      return new Intl.NumberFormat('en-US', options);
    }
  });

  protected readonly barWidth = computed(() => Math.min(32, 224 / Math.max(1, this.rows().length)));

  protected readonly points = computed(() => {
    const rows = this.rows();
    const values = rows.map((row) => this.normalized(row.value));
    const max = values.reduce<number>((scale, value) => Math.max(scale, value ?? 0), 1);
    return rows.map((item, index) => {
      const value = values[index] ?? null;
      return {
        item,
        value,
        color: palette[index % palette.length],
        x: 20 + (index + .5) * 280 / rows.length,
        height: value === null ? null : 110 * (value / max),
        printed: value === null ? this.missingLabel() : this.numberFormatter().format(value),
      };
    });
  });

  protected readonly line = computed(() => {
    let connected = false;
    return this.points().map((point) => {
      if (point.height === null) {
        connected = false;
        return '';
      }
      const prefix = connected ? 'L' : 'M';
      connected = true;
      return prefix + point.x + ' ' + (130 - point.height);
    }).join(' ');
  });

  protected readonly arcs = computed(() => {
    const points = this.points().filter((point) => (point.value ?? 0) > 0);
    const scale = points.reduce((max, point) => Math.max(max, point.value!), 1);
    const total = points.reduce((sum, point) => sum + point.value! / scale, 0);
    let offset = 0;
    return points.map((point) => {
      const length = 100 * (point.value! / scale / total);
      const arc = { ...point, length, offset };
      offset += length;
      return arc;
    });
  });

  private normalized(value: number | null): number | null {
    return value !== null && Number.isFinite(value) && value >= 0 ? value : null;
  }
}
