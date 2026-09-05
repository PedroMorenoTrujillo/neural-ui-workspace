import { Component, afterNextRender, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NeuAutocompleteComponent, NeuAutocompleteSelectEvent } from '@neural-ui/core/autocomplete';
import { NeuInputTagsComponent, NeuInputTagsSelectEvent } from '@neural-ui/core/input-tags';
import { NeuTreeSelectComponent } from '@neural-ui/core/tree-select';
import { NeuCascadeSelectComponent } from '@neural-ui/core/cascade-select';
import { NeuDateInputComponent, NeuDateViewChangeEvent } from '@neural-ui/core/date-input';
import { NeuChartComponent, NeuChartDataSelectEvent } from '@neural-ui/core/chart';
import { NeuVirtualListComponent } from '@neural-ui/core/virtual-list';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuBottomSheetComponent } from '@neural-ui/core/bottom-sheet';
import { NeuColorPickerComponent } from '@neural-ui/core/color-picker';
import { NeuPickListComponent } from '@neural-ui/core/pick-list';
import { NeuSplitterComponent } from '@neural-ui/core/splitter';
import { NeuSplitButtonComponent } from '@neural-ui/core/split-button';
import { NeuImageViewerDirective } from '@neural-ui/core/image-viewer';
import { NeuNumberInputComponent } from '@neural-ui/core/number-input';

interface Option {
  value: string;
  label: string;
  children?: Option[];
}
@Component({
  selector: 'h9-event-contract',
  imports: [
    JsonPipe,
    NeuAutocompleteComponent,
    NeuInputTagsComponent,
    NeuTreeSelectComponent,
    NeuCascadeSelectComponent,
    NeuDateInputComponent,
    NeuChartComponent,
    NeuVirtualListComponent,
    NeuDialogComponent,
    NeuBottomSheetComponent,
    NeuColorPickerComponent,
    NeuPickListComponent,
    NeuSplitterComponent,
    NeuSplitButtonComponent,
    NeuImageViewerDirective,
    NeuNumberInputComponent,
  ],
  template: `
    <h1>H9-A2 isolated event consumer</h1>
    <button id="h9-reset" (click)="events.set([])">Reset log</button>
    <button id="h9-destroy" (click)="mounted.set(false)">Destroy controls</button>
    <button id="h9-native-select" (click)="selectText()">Select input text programmatically</button>
    <button id="h9-dialog-toggle" (click)="dialogOpen.set(!dialogOpen())">Toggle dialog</button>
    <button id="h9-sheet-toggle" (click)="sheetOpen.set(!sheetOpen())">Toggle sheet</button>
    <button id="h9-write" (click)="writeValues()">Programmatic CVA writes</button>
    <output id="h9-events">{{ events() | json }}</output>
    @if (mounted()) {
      <section id="h9-autocomplete">
        <neu-autocomplete
          [options]="options"
          optionLabel="label"
          optionValue="value"
          [delay]="0"
          (select)="onSelect($event)"
        />
      </section>
      <section id="h9-tags">
        <neu-input-tags
          [suggestions]="options"
          [typeahead]="true"
          optionLabel="label"
          optionValue="value"
          [delay]="0"
          (select)="onTagSelect($event)"
        />
      </section>
      <section id="h9-tree">
        <neu-tree-select
          [nodes]="tree"
          [clearable]="true"
          (filter)="record('filter', $event.query)"
          (opened)="record('treeOpened')"
          (closed)="record('treeClosed')"
          (cleared)="record('treeCleared')"
          (nodeExpansionChange)="record('expansion', $event)"
        />
      </section>
      <section id="h9-cascade">
        <neu-cascade-select
          [nodes]="tree"
          (groupChange)="record('group', $event)"
          (opened)="record('cascadeOpened')"
          (closed)="record('cascadeClosed')"
        />
      </section>
      <section id="h9-date">
        <neu-date-input
          locale="en"
          [showMonthYearPicker]="true"
          (viewChange)="onView($event)"
          (opened)="record('dateOpened')"
          (closed)="record('dateClosed')"
          (cleared)="record('dateCleared')"
        />
      </section>
      <section id="h9-chart">
        <neu-chart
          type="bar"
          [series]="series"
          [categories]="['Jan', 'Feb']"
          (dataSelect)="onData($event)"
        />
      </section>
      <section id="h9-pie">
        <neu-chart
          type="pie"
          [pieSeries]="[25, 75]"
          [labels]="['A', 'B']"
          (dataSelect)="record('pieSelect', $event)"
        />
      </section>
      <section id="h9-virtual">
        <neu-virtual-list
          [items]="items"
          [itemSize]="32"
          [visibleRows]="4"
          (rangeChange)="onRange($event)"
        />
      </section>
      <neu-dialog
        [open]="dialogOpen()"
        title="Event dialog"
        (opened)="record('dialogOpened')"
        (hidden)="record('dialogHidden')"
        (closed)="record('dialogRequest')"
      >
        <button id="h9-dialog-close-owner" (click)="dialogOpen.set(false)">
          Owner closes dialog
        </button>
      </neu-dialog>
      <neu-bottom-sheet
        [open]="sheetOpen()"
        title="Event sheet"
        (opened)="record('sheetOpened')"
        (hidden)="record('sheetHidden')"
        (closed)="record('sheetRequest')"
      >
        <button id="h9-sheet-close-owner" (click)="sheetOpen.set(false)">Owner closes sheet</button>
      </neu-bottom-sheet>
      <section id="h9-color">
        <neu-color-picker
          mode="oklch"
          [showAlpha]="true"
          [showChannels]="true"
          (opened)="record('colorOpened')"
          (closed)="record('colorClosed')"
          (colorChange)="record('colorChange', $event)"
          (colorChangeEnd)="record('colorEnd', $event)"
        />
      </section>
      <neu-pick-list
        [source]="options"
        [target]="[]"
        (sourceSelectionChange)="record('sourceSelection', $event)"
        (targetSelectionChange)="record('targetSelection', $event)"
      />
      <neu-splitter
        [panes]="[{ size: 50 }, { size: 50 }]"
        (resizeStart)="record('resizeStart', $event)"
        (resize)="record('resize', $event)"
      />
      <neu-split-button
        label="Actions"
        [actions]="[{ id: 'save', label: 'Save' }]"
        (opened)="record('splitOpened')"
        (closed)="record('splitClosed')"
      />
      <img
        id="h9-image"
        [neuImageViewer]="image"
        alt="Test image"
        width="40"
        height="40"
        [src]="image"
        (opened)="record('imageOpened')"
        (closed)="record('imageClosed')"
      />
      <section id="h9-number">
        <neu-number-input [nullable]="true" (inputDetail)="onNumber($event)" />
      </section>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 20px;
      }
      section {
        margin: 16px 0;
        max-width: 600px;
      }
      output {
        display: block;
        max-height: 160px;
        overflow: auto;
        white-space: pre;
      }
      neu-splitter {
        display: block;
        height: 60px;
        width: 600px;
      }
    `,
  ],
})
export class H9EventContractComponent {
  readonly events = signal<{ name: string; payload?: unknown }[]>([]);
  readonly mounted = signal(true);
  readonly dialogOpen = signal(false);
  readonly sheetOpen = signal(false);
  readonly options: Option[] = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];
  readonly tree: Option[] = [{ value: 'root', label: 'Root', children: this.options }];
  readonly series = [{ name: 'Revenue', data: [10, 30] }];
  readonly items = Array.from({ length: 300 }, (_, i) => `Row ${i}`);
  readonly image =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="blue"/%3E%3C/svg%3E';
  readonly autocomplete = viewChild(NeuAutocompleteComponent);
  readonly tags = viewChild(NeuInputTagsComponent);
  readonly date = viewChild(NeuDateInputComponent);
  readonly treeSelect = viewChild(NeuTreeSelectComponent);
  readonly number = viewChild(NeuNumberInputComponent);
  readonly color = viewChild(NeuColorPickerComponent);
  readonly cascade = viewChild(NeuCascadeSelectComponent);
  constructor() {
    afterNextRender(() => {
      this.autocomplete()?.select.subscribe((value) => this.record('acDirect', value));
      this.tags()?.select.subscribe((value) => this.record('tagsDirect', value));
      this.record('ready');
    });
  }
  record(name: string, payload?: unknown): void {
    this.events.update((values) => [...values, { name, payload }]);
  }
  onSelect(value: NeuAutocompleteSelectEvent<Option, string>): void {
    this.record('acSelect', value);
  }
  onTagSelect(value: NeuInputTagsSelectEvent<Option>): void {
    this.record('tagsSelect', value);
  }
  onView(value: NeuDateViewChangeEvent): void {
    this.record('view', value);
  }
  onData(value: NeuChartDataSelectEvent): void {
    this.record('dataSelect', value);
  }
  onRange(value: { start: number; end: number }): void {
    this.record('range', value);
  }
  onNumber(value: {
    rawText: string;
    value: number | null;
    state: 'valid' | 'empty' | 'invalid';
  }): void {
    this.record('number', value);
  }
  selectText(): void {
    document
      .querySelectorAll<HTMLInputElement>('#h9-autocomplete input, #h9-tags input')
      .forEach((input) => {
        input.value = 'Alpha';
        input.focus();
        input.setSelectionRange(0, 3);
      });
  }
  writeValues(): void {
    this.autocomplete()?.writeValue('a');
    this.tags()?.writeValue([]);
    this.treeSelect()?.writeValue(null);
    this.cascade()?.writeValue(null);
    this.date()?.writeValue('2026-01-01');
    this.color()?.writeValue('oklch(0.7 0.12 280 / 0.65)');
    this.number()?.writeValue(null);
  }
}
