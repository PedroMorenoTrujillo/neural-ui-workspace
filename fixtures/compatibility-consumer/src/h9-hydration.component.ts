import { Component, afterNextRender, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NeuAutocompleteComponent } from '@neural-ui/core/autocomplete';
import { NeuInputTagsComponent } from '@neural-ui/core/input-tags';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuBottomSheetComponent } from '@neural-ui/core/bottom-sheet';
import { NeuColorPickerComponent } from '@neural-ui/core/color-picker';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuTextareaComponent } from '@neural-ui/core/textarea';
import { NeuTreeComponent, type NeuTreeNode } from '@neural-ui/core/tree';
import { NeuKanbanComponent, type NeuKanbanColumn } from '@neural-ui/core/kanban';
@Component({
  selector: 'app-root',
  imports: [
    JsonPipe,
    ReactiveFormsModule,
    NeuAutocompleteComponent,
    NeuInputTagsComponent,
    NeuDateInputComponent,
    NeuDialogComponent,
    NeuBottomSheetComponent,
    NeuColorPickerComponent,
    NeuInputComponent,
    NeuTextareaComponent,
    NeuTreeComponent,
    NeuKanbanComponent,
  ],
  template: `<output id="hydration-events">{{ events() | json }}</output
    ><output id="hydration-ime-events">{{ inputValues() | json }}</output
    ><span id="hydration-ready">{{ ready() }}</span>
    <neu-autocomplete [options]="['Alpha']" (select)="record('select')" />
    <neu-input-tags [options]="['Alpha']" [typeahead]="true" (optionActivated)="record('tagSelect')" />
    <neu-input id="hydration-input" label="Hydrated input" [formControl]="inputControl" />
    <neu-textarea id="hydration-textarea" label="Hydrated textarea" />
    <neu-tree id="hydration-tree" [nodes]="treeNodes" [expandedKeys]="['root']" />
    <neu-kanban
      id="hydration-kanban"
      [columns]="kanbanColumns()"
      stateMode="controlled"
      (columnsChange)="acceptKanban($event)"
    />
    <neu-date-input
      locale="en"
      (opened)="record('dateOpened')"
      (closed)="record('dateClosed')"
      (viewChange)="record('view')"
    />
    <neu-dialog
      [open]="open()"
      title="Hydrated dialog"
      (opened)="record('opened')"
      (hidden)="record('hidden')"
    >
      <button id="hydration-close" (click)="open.set(false)">Close owner</button>
    </neu-dialog>
    <neu-bottom-sheet
      [open]="false"
      (opened)="record('sheetOpened')"
      (hidden)="record('sheetHidden')"
    />
    <neu-color-picker
      id="hydration-color"
      mode="oklch"
      [showAlpha]="true"
      [showChannels]="true"
      (opened)="record('colorOpened')"
      (closed)="record('colorClosed')"
      (valueChange)="record('colorChange')"
      (valueCommitted)="record('colorEnd')"
    />`,
})
export class H9HydrationComponent {
  readonly events = signal<string[]>([]);
  readonly ready = signal(false);
  readonly open = signal(true);
  readonly inputControl = new FormControl('', { nonNullable: true });
  readonly inputValues = signal<string[]>([]);
  readonly treeNodes: NeuTreeNode[] = [
    { id: 'root', label: 'Hydrated root', children: [{ id: 'leaf', label: 'Hydrated leaf' }] },
  ];
  readonly kanbanColumns = signal<NeuKanbanColumn[]>([
    { id: 'one', title: 'One', cards: [{ id: 'hydrated-card', title: 'Hydrated card' }] },
    { id: 'two', title: 'Two', cards: [] },
  ]);
  constructor() {
    afterNextRender(() => this.ready.set(true));
    this.inputControl.valueChanges.subscribe((value) =>
      this.inputValues.update((values) => [...values, value]),
    );
  }
  record(name: string): void {
    this.events.update((events) => [...events, name]);
  }
  acceptKanban(columns: NeuKanbanColumn[]): void {
    this.kanbanColumns.set(columns);
    this.record('kanbanMove');
  }
}
