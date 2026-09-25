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
import { NeuTreeComponent, type NeuTreeHierarchy, type NeuTreeNode } from '@neural-ui/core/tree';
import { NeuKanbanComponent, type NeuKanbanCardMove, type NeuKanbanColumn } from '@neural-ui/core/kanban';
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
    <neu-autocomplete [options]="['Alpha']" (optionActivated)="record('select')" />
    <neu-input-tags
      [options]="['Alpha']"
      [typeahead]="true"
      (optionActivated)="record('tagSelect')"
    />
    <neu-input id="hydration-input" label="Hydrated input" [formControl]="inputControl" />
    <neu-textarea id="hydration-textarea" label="Hydrated textarea" />
    <neu-tree id="hydration-tree" [nodes]="treeNodes" [hierarchy]="treeHierarchy" [expandedKeys]="treeExpandedKeys" />
    <neu-kanban
      id="hydration-kanban"
      [columns]="kanbanColumns()"
      (cardMove)="acceptKanban($event)"
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
      (closed)="record('closed')"
    >
      <button id="hydration-close" (click)="open.set(false)">Close owner</button>
      <button id="hydration-sheet-open" type="button" (click)="sheetOpen.set(true)">
        Open sheet
      </button>
    </neu-dialog>
    <button id="hydration-open" type="button" (click)="open.set(true)">Open dialog</button>
    <neu-bottom-sheet
      [open]="sheetOpen()"
      (opened)="record('sheetOpened')"
      (closed)="record('sheetClosed')"
      (closeRequested)="acceptSheetClose()"
      title="Hydrated sheet"
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
  readonly sheetOpen = signal(false);
  readonly inputControl = new FormControl('', { nonNullable: true });
  readonly inputValues = signal<string[]>([]);
  readonly treeNodes: readonly NeuTreeNode<{ readonly id: string }>[] = [
    { key: 'root', data: { id: 'root' }, label: 'Hydrated root' },
    { key: 'leaf', data: { id: 'leaf' }, label: 'Hydrated leaf' },
  ];
  readonly treeHierarchy: NeuTreeHierarchy<string> = {
    revision: 1,
    roots: ['root'],
    children: [{ parentKey: 'root', state: 'loaded', keys: ['leaf'] }],
  };
  readonly treeExpandedKeys: readonly string[] = ['root'];
  readonly kanbanColumns = signal<readonly NeuKanbanColumn[]>([
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
  acceptKanban(move: NeuKanbanCardMove): void {
    this.kanbanColumns.update((columns) => {
      const sourceId = move.kind === 'reorder' ? move.columnId : move.fromColumnId;
      const targetId = move.kind === 'reorder' ? move.columnId : move.toColumnId;
      const next = columns.map((column) => ({ ...column, cards: [...column.cards] }));
      const source = next.find((column) => column.id === sourceId);
      const target = next.find((column) => column.id === targetId);
      if (!source || !target) return columns;
      const [card] = source.cards.splice(move.fromIndex, 1);
      if (!card || card.id !== move.cardId) return columns;
      target.cards.splice(move.toIndex, 0, card);
      return next;
    });
    this.record('kanbanMove');
  }
  acceptSheetClose(): void {
    this.record('sheetRequest');
    this.sheetOpen.set(false);
  }
}
