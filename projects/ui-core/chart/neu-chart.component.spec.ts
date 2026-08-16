import { TestBed } from '@angular/core/testing';
import { NeuChartComponent, NeuChartSeries } from './neu-chart.component';
import { Directionality } from '@angular/cdk/bidi';

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
    await TestBed.configureTestingModule({ imports: [NeuChartComponent] }).compileComponents();
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
    expect(res[1].name).toBe('Cumulative %');
  });

  it('resolvedSeries should keep cumulative values at zero when pareto total is zero', () => {
    const series: NeuChartSeries[] = [{ name: 'Defectos', data: [0, 0, 0] }];
    const { comp } = mk({ type: 'pareto', series });
    const res = comp.resolvedSeries();
    expect(res[1].data).toEqual([0, 0, 0]);
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

  it('keeps legacy grid and legend configuration contracts available', () => {
    const { comp } = mk();
    expect(comp.gridConfig().yaxis.lines.show).toBe(true);
    expect(comp.legendConfig().position).toBe('bottom');
  });

  // ── xaxisConfig ───────────────────────────────────────────────────────────

  it('xaxisConfig should contain provided categories', () => {
    const { comp } = mk({ categories: ['A', 'B'] });
    expect(comp.xaxisConfig().categories).toEqual(['A', 'B']);
  });

  it('renders an accessible canvas and data-table fallback with computed bindings', () => {
    const series: NeuChartSeries[] = [{ name: 'Revenue', data: [4, 8] }];
    const { f, comp } = mk({
      type: 'bar-horizontal-stacked',
      series,
      categories: ['Q1', 'Q2'],
      colors: ['#111111'],
      showDataLabels: true,
      height: 320,
    });
    const canvas = f.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const table = f.nativeElement.querySelector('.neu-chart__data') as HTMLTableElement;
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBe('bar-horizontal-stacked chart');
    expect(table.textContent).toContain('Revenue');
    expect(table.textContent).toContain('Q1');
    expect(table.textContent).toContain('4');
    expect(comp.chartJsConfig().type).toBe('bar');
    expect(comp.chartJsConfig().options.indexAxis).toBe('y');
    expect(comp.chartJsConfig().options.scales.x.stacked).toBe(true);
  });

  it('uses the title as the visible and accessible chart name', () => {
    const { f, comp } = mk({ title: 'Quarterly revenue' });
    expect(f.nativeElement.querySelector('.neu-chart__title').textContent).toContain(
      'Quarterly revenue',
    );
    expect(comp.accessibleLabel()).toBe('Quarterly revenue');
  });

  it('supports localized accessible labels and table headers', () => {
    const { f, comp } = mk({
      type: 'pareto',
      ariaLabel: 'Defectos por causa',
      categoryHeader: 'Causa',
      valueHeader: 'Valor',
      cumulativeLabel: 'Acumulado %',
      series: [{ name: 'Defectos', data: [3, 1] }],
      categories: ['Interfaz', 'Red'],
    });
    const canvas = f.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const table = f.nativeElement.querySelector('table') as HTMLTableElement;
    expect(canvas.getAttribute('aria-label')).toBe('Defectos por causa');
    expect(table.textContent).toContain('Causa');
    expect(table.textContent).toContain('Acumulado %');
    expect(comp.chartJsConfig().data.datasets[1].label).toBe('Acumulado %');
  });

  it('builds pie and donut datasets with stable colors and cutouts', () => {
    const { comp: pie } = mk({
      type: 'pie',
      pieSeries: [40, 60],
      labels: ['Direct', 'Search'],
      colors: ['#112233', '#445566'],
    });
    expect(pie.chartJsConfig().type).toBe('pie');
    expect(pie.chartJsConfig().options.cutout).toBe(0);
    expect(pie.chartJsConfig().data.datasets[0].backgroundColor).toEqual(['#112233', '#445566']);

    const { comp: donut } = mk({ type: 'donut', pieSeries: [100] });
    expect(donut.chartJsConfig().type).toBe('doughnut');
    expect(donut.chartJsConfig().options.cutout).toBe('68%');
  });

  it('clamps radial values and only exposes the value arc to the tooltip', () => {
    const { comp } = mk({
      type: 'radialBar',
      pieSeries: [-10, 140],
      labels: ['Low', 'High'],
    });
    const config = comp.chartJsConfig();
    expect(config.data.datasets[0].data).toEqual([0, 100]);
    expect(config.data.datasets[1].data).toEqual([100, 0]);
    expect(config.options.plugins.legend.display).toBe(false);
    expect(config.options.plugins.tooltip.filter({ dataIndex: 0 })).toBe(true);
    expect(config.options.plugins.tooltip.filter({ dataIndex: 1 })).toBe(false);
    expect(
      config.options.plugins.tooltip.callbacks.label({ dataset: { label: 'High' }, raw: 100 }),
    ).toBe('High: 100%');
  });

  it('builds an empty Pareto chart safely and formats its percentage axis', () => {
    const { comp } = mk({ type: 'pareto', series: [], categories: [] });
    const config = comp.chartJsConfig();
    expect(config.data.datasets).toEqual([]);
    expect(config.options.scales.y1.ticks.callback(42)).toBe('42%');
  });

  it('builds Pareto bar and cumulative line datasets', () => {
    const { comp } = mk({
      type: 'pareto',
      series: [{ name: 'Defects', data: [3, 1] }],
      categories: ['A', 'B'],
      colors: ['#112233'],
    });
    const datasets = comp.chartJsConfig().data.datasets;
    expect(datasets[0].type).toBe('bar');
    expect(datasets[1].type).toBe('line');
    expect(datasets[1].data).toEqual([75, 100]);
    expect(datasets[1].borderColor).toBe('#112233');
  });

  it('builds line and area datasets including non-hex color fallback', () => {
    const { comp: line } = mk({
      type: 'line',
      series: [{ name: 'Users', data: [1, 2] }],
      colors: ['rebeccapurple'],
    });
    expect(line.chartJsConfig().type).toBe('line');
    expect(line.chartJsConfig().data.datasets[0].fill).toBe(false);

    const { comp: area } = mk({
      type: 'area',
      series: [
        { name: 'A', data: [1] },
        { name: 'B', data: [2] },
      ],
      colors: ['#112233', 'rebeccapurple'],
    });
    expect(area.chartJsConfig().data.datasets[0].backgroundColor).toBe('rgba(17, 34, 51, 0.2)');
    expect(area.chartJsConfig().data.datasets[1].backgroundColor).toBe('rebeccapurple');
    expect(area.chartJsConfig().data.datasets[0].fill).toBe(true);
  });

  it('builds non-stacked and stacked bar datasets', () => {
    const series = [{ name: 'Revenue', data: [1] }];
    const { comp: bar } = mk({ type: 'bar', series });
    expect(bar.chartJsConfig().data.datasets[0].borderRadius).toBe(4);

    const { comp: stacked } = mk({ type: 'bar-stacked', series });
    expect(stacked.chartJsConfig().data.datasets[0].borderRadius).toBe(0);
    expect(stacked.chartJsConfig().options.scales.y.stacked).toBe(true);
  });

  it('exposes complete accessible rows for uneven series and circular data', () => {
    const { comp: axes } = mk({
      series: [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [3] },
      ],
      categories: ['First'],
    });
    expect(axes.accessibleRows()).toEqual([
      { label: 'First', values: [1, 3] },
      { label: '2', values: [2, ''] },
    ]);

    const { comp: pie } = mk({
      type: 'pie',
      pieSeries: [7, 8],
      labels: ['Known'],
      valueHeader: 'Amount',
    });
    expect(pie.accessibleSeriesNames()).toEqual(['Amount']);
    expect(pie.accessibleRows()).toEqual([
      { label: 'Known', values: [7] },
      { label: '2', values: [8] },
    ]);
  });

  it('draws enabled data labels and skips tracks and missing values', () => {
    const { comp } = mk({ showDataLabels: true });
    const plugin = comp.chartJsConfig().plugins[0];
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      font: '',
      textAlign: '',
      textBaseline: '',
    };
    const elements = [
      { tooltipPosition: () => ({ x: 10, y: 20 }) },
      { tooltipPosition: () => ({ x: 30, y: 40 }) },
    ];
    const chart = {
      ctx,
      data: {
        datasets: [{ data: [5, null] }, { data: [9, 10], neuRadialTrack: true }],
      },
      getDatasetMeta: () => ({ data: elements }),
    };
    plugin.afterDatasetsDraw(chart, {}, { enabled: false });
    expect(ctx.save).not.toHaveBeenCalled();
    plugin.afterDatasetsDraw(chart, {}, { enabled: true });
    expect(ctx.fillText).toHaveBeenCalledTimes(2);
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '5', 10, 20);
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '9', 10, 20);
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('schedules browser rendering and cancels pending work on destroy', () => {
    const scheduled: FrameRequestCallback[] = [];
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      scheduled.push(callback);
      return scheduled.length;
    });
    const cancelFrame = vi.fn();
    vi.stubGlobal('ResizeObserver', class ResizeObserverStub {});
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    const contextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { f } = mk({
      series: [{ name: 'Revenue', data: [1] }],
      categories: ['Q1'],
    });
    const initialFrames = requestFrame.mock.calls.length;
    expect(initialFrames).toBeGreaterThan(0);
    scheduled.at(-1)!(0);
    expect(consoleError).toHaveBeenCalled();

    f.componentRef.setInput('type', 'area');
    f.detectChanges();
    const updatedFrames = requestFrame.mock.calls.length;
    expect(updatedFrames).toBeGreaterThan(initialFrames);
    expect(cancelFrame).toHaveBeenCalled();

    f.destroy();
    expect(cancelFrame).toHaveBeenCalledWith(updatedFrames);
    contextSpy.mockRestore();
    consoleError.mockRestore();
    vi.unstubAllGlobals();
  });

  it('mirrors axes, legend and tooltip when direction changes dynamically', () => {
    const { f, comp } = mk({
      type: 'bar',
      series: [{ name: 'Revenue', data: [1, 2] }],
      categories: ['Q1', 'Q2'],
    });
    expect(comp.chartJsConfig().options.scales.x.reverse).toBe(false);
    expect(comp.chartJsConfig().options.plugins.legend.rtl).toBe(false);

    TestBed.inject(Directionality).valueSignal.set('rtl');
    f.detectChanges();

    expect(comp.chartJsConfig().options.scales.x.reverse).toBe(true);
    expect(comp.chartJsConfig().options.plugins.legend.rtl).toBe(true);
    expect(comp.chartJsConfig().options.plugins.tooltip.rtl).toBe(true);
  });

  it('mirrors horizontal and Pareto axis placement in RTL', () => {
    TestBed.inject(Directionality).valueSignal.set('rtl');
    const { comp: horizontal } = mk({ type: 'bar-horizontal' });
    expect(horizontal.chartJsConfig().options.scales.x.position).toBe('top');
    expect(horizontal.chartJsConfig().options.scales.y.position).toBe('right');

    const { comp: pareto } = mk({
      type: 'pareto',
      series: [{ name: 'Defects', data: [1] }],
    });
    expect(pareto.chartJsConfig().options.scales.y.position).toBe('right');
    expect(pareto.chartJsConfig().options.scales.y1.position).toBe('left');
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
