import { NeuBottomSheetComponent } from '@neural-ui/core/bottom-sheet';
import { NeuCalendarComponent } from '@neural-ui/core/calendar';
import { NeuCloseReason, NeuCloseRequest } from '@neural-ui/core/foundation';
import { NeuDialogComponent } from '@neural-ui/core/modal';
import { NeuSidebarComponent } from '@neural-ui/core/sidebar';

declare const sidebar: NeuSidebarComponent;
declare const dialog: NeuDialogComponent;
declare const sheet: NeuBottomSheetComponent;
declare const calendar: NeuCalendarComponent;

const reason: NeuCloseReason = 'outside';
const request: NeuCloseRequest = { reason, originalEvent: new Event('click') };
const sidebarOpen: boolean = sidebar.open();

sidebar.closeRequested.subscribe((event: NeuCloseRequest) => void event.reason);
sidebar.opened.subscribe(() => undefined);
sidebar.closed.subscribe(() => undefined);
dialog.closeRequested.subscribe((event: NeuCloseRequest) => void event.originalEvent);
sheet.closeRequested.subscribe((event: NeuCloseRequest) => void event.reason);
calendar.selectedDateChange.subscribe((date: Date) => void date);

void request;
void sidebarOpen;

// @ts-expect-error close reasons are a closed union.
const invalidReason: NeuCloseReason = 'backdrop';
// @ts-expect-error Sidebar URL ownership was removed.
sidebar.urlParam;
// @ts-expect-error Sidebar has no applied-state mutation method.
sidebar.close();
// @ts-expect-error Sidebar has no two-way open channel.
sidebar.openChange;
// @ts-expect-error Dialog hidden was renamed to the closed lifecycle.
dialog.hidden;
// @ts-expect-error BottomSheet hidden was renamed to the closed lifecycle.
sheet.hidden;
// @ts-expect-error Calendar duplicate event was removed.
calendar.dateSelect;
void invalidReason;
