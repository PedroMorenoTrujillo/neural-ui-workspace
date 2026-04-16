import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ChartComponent } from 'ng-apexcharts';
import { NeuChartComponent, NeuChartSeries } from './neu-chart.component';

/** Stub mínimo para evitar dependencia de ApexCharts en jsdom */
@Component({ selector: 'apx-chart', template: '', standalone: true })
class ApxChartStub {
  chart = input<any>();
  series = input<any>();
  labels = input<any>();
  xaxis = input<any>();
  yaxis = input<any>();
  colors = input<any>();
  stroke = input<any>();
  fill = input<any>();
  dataLabels = input<any>();
  grid = input<any>();
  legend = input<any>();
  tooltip = input<any>();
  plotOptions = input<any>();
}

function mk(inputs: Record<string, unknown> = {}) {
  const f = TestBed.createComponent(NeuChartComponent);
  for (const [k, v] of Object.entries(inputs)) {
    f.componentRef.setInput(k, v);
  }
  f.detectChanges();
  return { f, comp: f.componentInstance as any };
}

describe('NeuChartComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeuChartComponent],
    })
      .overrideComponent(NeuChartComponent, {
        remove: { imports: [ChartComponent] },
        add: { imports: [ApxChartStub] },
      })
      .compileComponents();
  });

  // ── Inputs básicos ────────────────────────────────────────────────────────

  it('should have neu-chart host class', () => {
    const { f } = mk();
    expect(f.nativeElement.classList).toContain('neu-chart');
  });

  it('should default to line type', () => {
    const { comp } = mk();
    expect(comp.type()).toBe('line');
  });

  it('should default height to 280', () => {
    const { comp } = mk();
    expect(comp.height()).toBe(280);
  });

  it('should accept type input', () => {
    const { comp } = mk({ type: 'bar' });
    expect(comp.type()).toBe('bar');
  });

  it('should accept series input', () => {
    const series: NeuChartSeries[] = [{ name: 'Ventas', data: [10, 20, 30] }];
    const { comp } = mk({ series });
    expect(comp.series()).toEqual(series);
  });

  it('should accept categories input', () => {
    const { comp } = mk({ categories: ['Ene', 'Feb', 'Mar'] });
    expect(comp.categories()).toEqual(['Ene', 'Feb', 'Mar']);
  });

  it('should accept height input', () => {
    const { comp } = mk({ height: 400 });
    expect(comp.height()).toBe(400);
  });

  it('should accept donut type with pieSeries', () => {
    const { comp } = mk({ type: 'donut', pieSeries: [30, 50, 20] });
    expect(comp.type()).toBe('donut');
    expect(comp.pieSeries()).toEqual([30, 50, 20]);
  });

  // ── resolvedColors ────────────────────────────────────────────────────────

  it('resolvedColors should use DEFAULT_COLORS when colors is empty', () => {
    const { comp } = mk();
    expect(comp.resolvedColors().length).toBeGreaterThan(0);
  });

  it('resolvedColors should use custom colors when provided', () => {
    const { comp } = mk({ colors: ['#ff0000', '#00ff00'] });
    expect(comp.resolvedColors()).toEqual(['#ff0000', '#00ff00']);
  });

  // ── resolvedSeries ────────────────────────────────────────────────────────

  it('resolvedSeries should return pieSeries for donut type', () => {
    const { comp } = mk({ type: 'donut', pieSeries: [10, 20, 30] });
    expect(comp.resolvedSeries()).toEqual([10, 20, 30]);
  });

  it('resolvedSeries should return pieSeries for pie type', () => {
    const { comp } = mk({ type: 'pie', pieSeries: [40, 60] });
    expect(comp.resolvedSeries()).toEqual([40, 60]);
  });

  it('resolvedSeries should return pareto combined series', () => {
    const series: NeuChartSeries[] = [{ name: 'Defectos', data: [30, 20, 10] }];
    const { comp } = mk({ type: 'pareto', series });
    const res = comp.resolvedSeries();
    expect(res.length).toBe(2);
    expect(res[0].type).toBe('bar');
    expect(res[1].type).toBe('line');
    expect(res[1].name).toBe('Acumulado %');
  });

  it('resolvedSeries pareto returns empty array when no series', () => {
    const { comp } = mk({ type: 'pareto', series: [] });
    expect(comp.resolvedSeries()).toEqual([]);
  });

  it('resolvedSeries should return series for line type', () => {
    const series: NeuChartSeries[] = [{ name: 'A', data: [1, 2, 3] }];
    const { comp } = mk({ type: 'line', series });
    expect(comp.resolvedSeries()).toEqual(series);
  });

  // ── chartConfig ───────────────────────────────────────────────────────────

  it('chartConfig type should be bar for bar input', () => {
    const { comp } = mk({ type: 'bar' });
    expect(comp.chartConfig().type).toBe('bar');
  });

  it('chartConfig stacked should be true for bar-stacked', () => {
    const { comp } = mk({ type: 'bar-stacked' });
    expect(comp.chartConfig().stacked).toBe(true);
  });

  it('chartConfig stacked should be false for plain bar', () => {
    const { comp } = mk({ type: 'bar' });
    expect(comp.chartConfig().stacked).toBe(false);
  });

  it('chartConfig height should match input', () => {
    const { comp } = mk({ height: 350 });
    expect(comp.chartConfig().height).toBe(350);
  });

  // ── strokeConfig ──────────────────────────────────────────────────────────

  it('strokeConfig for bar type should set show: false', () => {
    const { comp } = mk({ type: 'bar' });
    expect(comp.strokeConfig().show).toBe(false);
  });

  it('strokeConfig for area type returns gradient curve', () => {
    const { comp } = mk({ type: 'area' });
    expect(comp.strokeConfig().curve).toBe('smooth');
  });

  it('strokeConfig for pareto returns show:true with mixed width (bar+line)', () => {
    const { comp } = mk({ type: 'pareto' });
    expect(comp.strokeConfig().show).toBe(true);
    expect((comp.strokeConfig() as any).width).toEqual([0, 2]);
  });

  // ── fillConfig ────────────────────────────────────────────────────────────

  it('fillConfig for area type should return gradient', () => {
    const { comp } = mk({ type: 'area' });
    expect(comp.fillConfig().type).toBe('gradient');
  });

  it('fillConfig for non-area type should return opacity', () => {
    const { comp } = mk({ type: 'line' });
    expect(comp.fillConfig().opacity).toBeDefined();
  });

  // ── plotOptionsConfig ─────────────────────────────────────────────────────

  it('plotOptionsConfig for donut returns donut size', () => {
    const { comp } = mk({ type: 'donut' });
    expect(comp.plotOptionsConfig().pie?.donut?.size).toBeTruthy();
  });

  it('plotOptionsConfig for bar returns bar config', () => {
    const { comp } = mk({ type: 'bar' });
    expect(comp.plotOptionsConfig().bar).toBeDefined();
  });

  it('plotOptionsConfig for bar-horizontal sets horizontal: true', () => {
    const { comp } = mk({ type: 'bar-horizontal' });
    expect(comp.plotOptionsConfig().bar?.horizontal).toBe(true);
  });

  it('plotOptionsConfig for line returns empty object', () => {
    const { comp } = mk({ type: 'line' });
    expect(comp.plotOptionsConfig()).toEqual({});
  });

  // ── yaxisConfig ───────────────────────────────────────────────────────────

  it('yaxisConfig for pareto returns array with two axes', () => {
    const { comp } = mk({ type: 'pareto' });
    expect(Array.isArray(comp.yaxisConfig())).toBe(true);
    expect((comp.yaxisConfig() as any[]).length).toBe(2);
  });

  it('yaxisConfig for line returns single object', () => {
    const { comp } = mk({ type: 'line' });
    expect(Array.isArray(comp.yaxisConfig())).toBe(false);
  });

  // ── tooltipConfig ─────────────────────────────────────────────────────────

  it('tooltipConfig for pareto includes y formatters', () => {
    const { comp } = mk({ type: 'pareto' });
    expect(comp.tooltipConfig().y).toBeDefined();
  });

  it('tooltipConfig for non-pareto returns base config', () => {
    const { comp } = mk({ type: 'line' });
    expect(comp.tooltipConfig().theme).toBe('light');
  });

  // ── dataLabelsConfig ──────────────────────────────────────────────────────

  it('dataLabelsConfig enabled=false by default', () => {
    const { comp } = mk();
    expect(comp.dataLabelsConfig().enabled).toBe(false);
  });

  it('dataLabelsConfig enabled=true when showDataLabels=true', () => {
    const { comp } = mk({ showDataLabels: true });
    expect(comp.dataLabelsConfig().enabled).toBe(true);
  });

  // ── xaxisConfig ───────────────────────────────────────────────────────────

  it('xaxisConfig should contain provided categories', () => {
    const { comp } = mk({ categories: ['A', 'B'] });
    expect(comp.xaxisConfig().categories).toEqual(['A', 'B']);
  });

  // ── bar-stacked-horizontal ────────────────────────────────────────────────

  it('bar-horizontal-stacked should be stacked and horizontal', () => {
    const { comp } = mk({ type: 'bar-horizontal-stacked' });
    expect(comp.chartConfig().stacked).toBe(true);
    expect(comp.plotOptionsConfig().bar?.horizontal).toBe(true);
  });

  it('pareto type should have dual y-axis formatters', () => {
    const { comp } = mk({ type: 'pareto' });
    // yaxisConfig (lowercase 'a') returns an array for pareto
    const yAxis = (comp as any).yaxisConfig();
    expect(Array.isArray(yAxis)).toBe(true);
    expect(yAxis.length).toBe(2);
    // The second axis has a % formatter
    const fmt1 = yAxis[1].labels.formatter(75.5);
    expect(fmt1).toContain('%');
  });

  it('donut type should configure plotOptions with donut size', () => {
    const { comp } = mk({ type: 'donut' });
    const plots = comp.plotOptionsConfig();
    expect(plots.pie?.donut?.size).toBe('68%');
  });

  it('pie type should configure plotOptions same as donut (pie key)', () => {
    const { comp } = mk({ type: 'pie' });
    const plots = comp.plotOptionsConfig();
    expect(plots.pie).toBeDefined();
  });

  it('radialBar type should configure plotOptions with radialBar', () => {
    const { comp } = mk({ type: 'radialBar', series: [75] });
    const plots = comp.plotOptionsConfig();
    expect((plots as any).radialBar).toBeDefined();
    // Test the formatter function path
    const total = (plots as any).radialBar.dataLabels.total;
    expect(total.show).toBe(true);
    // Mock globals for formatter
    const result = total.formatter({ globals: { series: [60, 80] } });
    expect(result).toContain('%');
  });

  it('scatter type chartConfig has correct chart type', () => {
    const { comp } = mk({ type: 'scatter' });
    expect(comp.chartConfig().type).toBe('scatter');
  });

  it('bubble type chartConfig has correct chart type', () => {
    const { comp } = mk({ type: 'bubble' });
    expect(comp.chartConfig().type).toBe('bubble');
  });

  it('treemap type chartConfig has correct chart type', () => {
    const { comp } = mk({ type: 'treemap' });
    expect(comp.chartConfig().type).toBe('treemap');
  });

  it('pareto type chartConfig should have correct type and dual yaxis', () => {
    // El tipo pareto debe tener tipo bar+line y doble eje Y en la configuración
    // pareto type must have bar+line type and dual Y-axis in configuration
    const { comp } = mk({ type: 'pareto' });
    expect(comp.chartConfig().type).toBe('bar');
    const yaxis = comp.yaxisConfig();
    expect(Array.isArray(yaxis)).toBe(true);
    const yCfg = comp.tooltipConfig();
    expect(yCfg).toBeTruthy();
  });

  it('radialBar type plotOptionsConfig should have radialBar key', () => {
    // El tipo radialBar debe producir plotOptionsConfig con key \'radialBar\'
    // radialBar type must produce plotOptionsConfig with key \'radialBar\'
    const { comp } = mk({ type: 'radialBar' });
    const opts = comp.plotOptionsConfig();
    expect(opts).toHaveProperty('radialBar');
  });

  it('bar type should have _isBar class getter returning truthy series config', () => {
    // Tipo bar debe activar la configuración de barra
    // bar type must activate bar chart configuration
    const { comp } = mk({ type: 'bar' });
    expect(comp.chartConfig().type).toBe('bar');
    // strokeConfig for bar type
    const stroke = comp.strokeConfig();
    expect(stroke).toBeTruthy();
  });

  it('tooltipConfig pareto y[0].formatter should convert number to string', () => {
    // El formatter y[0] de pareto en tooltipConfig debe convertir número a string
    // pareto tooltipConfig y[0].formatter must convert number to string
    const { comp } = mk({ type: 'pareto' });
    const tooltip = comp.tooltipConfig();
    const result = tooltip.y[0].formatter(42);
    expect(result).toBe('42');
  });

  it('tooltipConfig pareto y[1].formatter should format as percentage', () => {
    // El formatter y[1] de pareto en tooltipConfig debe formatear como porcentaje
    // pareto tooltipConfig y[1].formatter must format as percentage
    const { comp } = mk({ type: 'pareto' });
    const tooltip = comp.tooltipConfig();
    const result = tooltip.y[1].formatter(75.5);
    expect(result).toContain('%');
    expect(result).toContain('75.5');
  });

  it('radialBar plotOptionsConfig value.formatter should format as percentage', () => {
    // El formatter de valor en radialBar debe formatear como porcentaje
    // radialBar plotOptionsConfig value.formatter must format as percentage
    const { comp } = mk({ type: 'radialBar' });
    const opts = comp.plotOptionsConfig() as any;
    const result = opts.radialBar.dataLabels.value.formatter(75.4);
    expect(result).toBe('75%');
  });
});
