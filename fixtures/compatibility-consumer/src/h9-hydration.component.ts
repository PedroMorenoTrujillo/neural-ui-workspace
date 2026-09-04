import { Component, afterNextRender, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { NeuAutocompleteComponent } from '@neural-ui/core/autocomplete';
import { NeuInputTagsComponent } from '@neural-ui/core/input-tags';
import { NeuDateInputComponent } from '@neural-ui/core/date-input';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuBottomSheetComponent } from '@neural-ui/core/bottom-sheet';
@Component({
 selector: 'app-root',
 imports: [JsonPipe, NeuAutocompleteComponent, NeuInputTagsComponent, NeuDateInputComponent, NeuDialogComponent, NeuBottomSheetComponent],
 template: `<output id="hydration-events">{{ events() | json }}</output><span id="hydration-ready">{{ ready() }}</span>
 <neu-autocomplete [options]="['Alpha']" (select)="record('select')" />
 <neu-input-tags [suggestions]="['Alpha']" [typeahead]="true" (select)="record('tagSelect')" />
 <neu-date-input locale="en" (opened)="record('dateOpened')" (closed)="record('dateClosed')" (viewChange)="record('view')" />
 <neu-dialog [open]="open()" title="Hydrated dialog" (opened)="record('opened')" (hidden)="record('hidden')">
   <button id="hydration-close" (click)="open.set(false)">Close owner</button>
 </neu-dialog>
 <neu-bottom-sheet [open]="false" (opened)="record('sheetOpened')" (hidden)="record('sheetHidden')" />`,
})
export class H9HydrationComponent {
 readonly events = signal<string[]>([]);
 readonly ready = signal(false);
 readonly open = signal(true);
 constructor() { afterNextRender(() => this.ready.set(true)); }
 record(name: string): void { this.events.update(events => [...events, name]); }
}
