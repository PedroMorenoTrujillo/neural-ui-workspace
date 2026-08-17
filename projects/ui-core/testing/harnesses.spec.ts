import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';
import {
  NeuAccordionHarness,
  NeuAlertHarness,
  NeuAutocompleteHarness,
  NeuBottomSheetHarness,
  NeuBreadcrumbHarness,
  NeuButtonHarness,
  NeuCheckboxHarness,
  NeuCalendarHarness,
  NeuCarouselHarness,
  NeuCascadeSelectHarness,
  NeuChipHarness,
  NeuCodeBlockHarness,
  NeuColorPickerHarness,
  NeuCommandPaletteHarness,
  NeuConfirmDialogHarness,
  NeuConfirmPopupHarness,
  NeuContextMenuHarness,
  NeuDataViewHarness,
  NeuDashboardGridHarness,
  NeuDateInputHarness,
  NeuDialogHarness,
  NeuDockHarness,
  NeuFilterBarHarness,
  NeuImageGalleryHarness,
  NeuImageCompareHarness,
  NeuImageViewerHarness,
  NeuInputHarness,
  NeuInputMaskHarness,
  NeuInputOtpHarness,
  NeuInlineEditorHarness,
  NeuKnobHarness,
  NeuKanbanHarness,
  NeuListboxHarness,
  NeuMenuHarness,
  NeuMegaMenuHarness,
  NeuMultiselectHarness,
  NeuNavHarness,
  NeuNotificationCenterHarness,
  NeuNumberInputHarness,
  NeuOrgChartHarness,
  NeuPaginationHarness,
  NeuPanelMenuHarness,
  NeuPasswordHarness,
  NeuPickListHarness,
  NeuPopoverHarness,
  NeuRadioGroupHarness,
  NeuRatingHarness,
  NeuRichTextEditorHarness,
  NeuSchedulerGanttHarness,
  NeuSelectHarness,
  NeuSidebarHarness,
  NeuSliderHarness,
  NeuSpeedDialHarness,
  NeuSplitButtonHarness,
  NeuSplitterHarness,
  NeuStepperHarness,
  NeuSwitchHarness,
  NeuTableHarness,
  NeuTabsHarness,
  NeuTagsHarness,
  NeuTerminalHarness,
  NeuTextareaHarness,
  NeuToggleButtonGroupHarness,
  NeuToastHarness,
  NeuTimelineGridHarness,
  NeuTreeSelectHarness,
  NeuTreeHarness,
  NeuTreeTableHarness,
  NeuTooltipHarness,
  NeuUploaderHarness,
  NeuVirtualListHarness,
} from './harnesses';

@Component({
  imports: [NeuButtonComponent, NeuInputComponent],
  template: `<button neu-button [loading]="true">Save</button><neu-input label="Name" />`,
})
class HarnessHostComponent {}

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <button neu-button disabled aria-busy="true">Save</button>
    <neu-input
      ><label class="neu-input__static-label">Name</label
      ><input class="neu-input__field" value="Ada" disabled />
      <p class="neu-input__error">Required</p></neu-input
    >
    <neu-checkbox
      ><label
        ><input class="neu-checkbox__input" type="checkbox" checked /><span
          class="neu-checkbox__label"
          >Accept</span
        ></label
      ></neu-checkbox
    >
    <neu-switch
      ><label
        ><input class="neu-switch__input" type="checkbox" /><span class="neu-switch__label"
          >Enabled</span
        ></label
      ></neu-switch
    >
    <neu-select
      ><button class="neu-select__trigger" aria-expanded="true"></button
      ><span class="neu-select__value">One</span></neu-select
    >
    <div class="neu-select__panel">
      <button class="neu-select__option">One</button><button class="neu-select__option">Two</button>
    </div>
    <neu-date-input
      ><button class="neu-date-input__trigger" aria-expanded="true">May 14</button></neu-date-input
    >
    <div class="neu-date-input__panel"><button class="neu-date-input__cal-day">14</button></div>
    <neu-table
      ><table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ada</td>
          </tr>
        </tbody>
      </table></neu-table
    >
    <neu-dialog
      ><section class="neu-dialog__panel">
        <h2 class="neu-dialog__title">Confirm</h2>
        <div class="neu-dialog__body">Continue?</div>
        <button class="neu-dialog__close">Close</button>
      </section></neu-dialog
    >
    <neu-textarea
      ><label class="neu-textarea__label">Notes</label
      ><textarea class="neu-textarea__field">Hello</textarea
      ><span class="neu-textarea__error">Too long</span></neu-textarea
    >
    <neu-number-input
      ><button class="neu-number-input__btn neu-number-input__btn--dec">−</button
      ><input
        class="neu-number-input__field"
        value="5"
        aria-valuemin="0"
        aria-valuemax="10"
      /><button class="neu-number-input__btn neu-number-input__btn--inc">
        +
      </button></neu-number-input
    >
    <neu-slider
      ><input
        class="neu-slider__input"
        type="range"
        min="0"
        max="100"
        value="25"
        aria-label="Volume"
    /></neu-slider>
    <neu-radio-group aria-disabled="false"
      ><label
        ><input class="neu-radio__input" type="radio" checked /><span class="neu-radio__label"
          >One</span
        ></label
      ><label
        ><input class="neu-radio__input" type="radio" /><span class="neu-radio__label"
          >Two</span
        ></label
      ></neu-radio-group
    >
    <neu-rating
      ><button class="neu-rating__star" aria-checked="false"></button
      ><button class="neu-rating__star" aria-checked="true"></button
      ><button class="neu-rating__star" aria-checked="false"></button
    ></neu-rating>
    <neu-accordion
      ><button class="neu-accordion__header" aria-expanded="true">First</button
      ><button class="neu-accordion__header" aria-expanded="false">Second</button></neu-accordion
    >
    <neu-autocomplete
      ><input class="neu-autocomplete__input" value="Ada" aria-expanded="true" /><button
        class="neu-autocomplete__clear"
      >
        Clear
      </button></neu-autocomplete
    >
    <div>
      <button class="neu-autocomplete__option">Ada</button
      ><button class="neu-autocomplete__option">Grace</button>
    </div>
    <neu-multiselect
      ><button class="neu-multiselect__trigger" aria-expanded="true"></button
      ><span class="neu-multiselect__chip">Ada</span></neu-multiselect
    >
    <div>
      <button class="neu-multiselect__option">Ada</button
      ><button class="neu-multiselect__option">Grace</button>
    </div>
    <neu-listbox
      ><input class="neu-listbox__search" /><button
        class="neu-listbox__option"
        aria-selected="true"
      >
        Ada</button
      ><button class="neu-listbox__option" aria-selected="false">Grace</button></neu-listbox
    >
    <neu-tree-select
      ><button class="neu-tree-select__trigger" aria-expanded="true">Ada</button></neu-tree-select
    >
    <div>
      <button class="neu-tree-select__node">Ada</button
      ><button class="neu-tree-select__node">Grace</button>
    </div>
    <neu-chip class="neu-chip neu-chip--selected" aria-pressed="true"
      >Angular<button class="neu-chip__remove">Remove</button></neu-chip
    >
    <neu-password
      ><label class="neu-password__label">Password</label
      ><input class="neu-password__control" type="password" value="secret" /><button
        class="neu-password__toggle"
      >
        Show
      </button></neu-password
    >
    <neu-pagination
      ><button class="neu-pagination__btn neu-pagination__btn--nav">Previous</button
      ><button class="neu-pagination__btn">1</button
      ><button class="neu-pagination__btn" aria-current="page">2</button
      ><button class="neu-pagination__btn neu-pagination__btn--nav">Next</button></neu-pagination
    >
    <neu-code-block
      ><span class="neu-code-block__lang">TypeScript</span
      ><button class="neu-code-block__copy">Copy</button
      ><code class="neu-code-block__code">const answer = 42;</code></neu-code-block
    >
    <neu-color-picker
      ><button class="neu-cp__trigger" aria-expanded="true"></button
      ><span class="neu-cp__hex-label">#336699</span></neu-color-picker
    >
    <div><input class="neu-cp__text-input" /><button class="neu-cp__sw">Red</button></div>
    <neu-command-palette
      ><div class="neu-cmd" role="dialog">
        <input class="neu-cmd__input" /><button class="neu-cmd__item">
          <span class="neu-cmd__item-label">Open</span>
        </button>
      </div></neu-command-palette
    >
    <neu-tags
      ><div class="neu-tags__box">
        <span class="neu-tags__tag">Angular<button>Remove</button></span><input value="" /></div
    ></neu-tags>
    <neu-toggle-button-group
      ><div class="neu-toggle-group" aria-disabled="false">
        <button class="neu-toggle-group__btn" aria-pressed="true">Grid</button
        ><button class="neu-toggle-group__btn" aria-pressed="false">List</button>
      </div></neu-toggle-button-group
    >
    <neu-uploader
      ><input class="neu-uploader__native-input" type="file" /><button
        class="neu-uploader__picker-trigger"
      >
        Choose</button
      ><span class="neu-uploader__item-name">report.pdf</span
      ><button class="neu-uploader__remove">Remove</button>
      <p class="neu-uploader__error">Too large</p></neu-uploader
    >
    <neu-stepper
      ><div class="neu-stepper__step neu-stepper__step--active">
        <button class="neu-stepper__step-btn">Account</button>
      </div>
      <div class="neu-stepper__step">
        <button class="neu-stepper__step-btn">Review</button>
      </div></neu-stepper
    >
    <neu-input-mask
      ><label class="neu-input-mask__label">Phone</label
      ><input class="neu-input-mask__control" value="123-456"
    /></neu-input-mask>
    <neu-input-otp
      ><input class="neu-input-otp__cell" value="1" /><input
        class="neu-input-otp__cell"
        value="2" /><input class="neu-input-otp__cell" value="3"
    /></neu-input-otp>
    <neu-inline-editor
      ><button class="neu-inline-editor__display">
        <span class="neu-inline-editor__value">Ada</span>
      </button>
      <div class="neu-inline-editor__edit">
        <div class="neu-inline-editor__actions"><button>Save</button><button>Cancel</button></div>
      </div></neu-inline-editor
    >
    <neu-knob
      ><div
        class="neu-knob__dial"
        aria-valuenow="40"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-disabled="false"
        tabindex="0"
      ></div
    ></neu-knob>
    <neu-menu
      ><button class="neu-menu__item">Open</button
      ><button class="neu-menu__item">Save</button></neu-menu
    >
    <neu-nav
      ><div class="neu-nav-wrapper">
        <button class="neu-nav__item">Home</button><button class="neu-nav__item">Settings</button
        ><button class="neu-nav__toggle-tab">Collapse</button>
      </div></neu-nav
    >
    <neu-pick-list
      ><section class="neu-pick-list__column"><button>Ada</button><button>Grace</button></section>
      <div class="neu-pick-list__actions"><button>To target</button><button>To source</button></div>
      <section class="neu-pick-list__column"><button>Linus</button></section></neu-pick-list
    >
    <neu-rich-text-editor
      ><label class="neu-rich-text-editor__label">Message</label>
      <div class="neu-rich-text-editor__toolbar"><button aria-label="Bold"></button></div>
      <div class="neu-rich-text-editor__surface" contenteditable="true">
        <p>Hello</p>
      </div></neu-rich-text-editor
    >
    <neu-split-button
      ><button class="neu-split-button__main">Save</button
      ><button class="neu-split-button__chevron" aria-expanded="true"></button
    ></neu-split-button>
    <div><button class="neu-split-button__dropdown-item">Save as</button></div>
    <neu-splitter
      ><div class="neu-splitter__pane"></div>
      <div class="neu-splitter__handle" aria-valuenow="40" tabindex="0"></div>
      <div class="neu-splitter__pane"></div
    ></neu-splitter>
    <neu-alert
      ><strong class="neu-alert__title">Warning</strong>
      <div class="neu-alert__body"><div class="neu-alert__content">Check data</div></div>
      <button class="neu-alert__close">Close</button></neu-alert
    >
    <neu-bottom-sheet
      ><section class="neu-bottom-sheet">
        <div class="neu-bottom-sheet__body">Details</div>
        <button class="neu-bottom-sheet__close">Close</button>
      </section></neu-bottom-sheet
    >
    <neu-breadcrumb
      ><ol>
        <li class="neu-breadcrumb__item"><button class="neu-breadcrumb__link">Home</button></li>
        <li class="neu-breadcrumb__item"><span class="neu-breadcrumb__current">Settings</span></li>
      </ol></neu-breadcrumb
    >
    <neu-calendar
      ><h3 class="neu-calendar__title">August 2026</h3>
      <button class="neu-calendar__nav-btn">Previous</button
      ><button class="neu-calendar__today">Today</button
      ><button class="neu-calendar__nav-btn">Next</button
      ><button class="neu-calendar__day-select">16</button
      ><button class="neu-calendar__event">Review</button></neu-calendar
    >
    <neu-confirm-dialog
      ><h2 class="neu-confirm-dialog__title">Delete?</h2>
      <p class="neu-confirm-dialog__message">This cannot be undone.</p>
      <div class="neu-confirm-dialog__actions">
        <button class="neu-confirm-dialog__btn neu-confirm-dialog__btn--reject">Cancel</button
        ><button class="neu-confirm-dialog__btn">Delete</button>
      </div></neu-confirm-dialog
    >
    <neu-confirm-popup
      ><div class="neu-confirm-popup" role="alertdialog">
        <p>Continue?</p>
        <button class="neu-confirm-popup__reject">No</button
        ><button class="neu-confirm-popup__accept">Yes</button>
      </div></neu-confirm-popup
    >
    <neu-toast-container
      ><article class="neu-toast">
        <p class="neu-toast__title">Saved</p>
        <p class="neu-toast__message">Changes stored</p>
        <button class="neu-toast__close">Close</button>
      </article></neu-toast-container
    >
    <button neuTooltip aria-describedby="tip-1">Help</button
    ><neu-tooltip-overlay><span class="neu-tooltip__text">Helpful text</span></neu-tooltip-overlay>
    <button neuContextMenu>Context target</button
    ><neu-context-menu-overlay
      ><button class="neu-context-menu__item">Rename</button></neu-context-menu-overlay
    >
    <neu-data-view
      ><label class="neu-data-view__search"><input /></label
      ><button class="neu-data-view__mode" aria-label="Grid"></button
      ><button class="neu-data-view__mode" aria-label="List"></button>
      <div class="neu-data-view__item">Ada</div></neu-data-view
    >
    <neu-filter-bar
      ><button class="neu-filter-bar__chip neu-filter-bar__chip--active">Active</button
      ><button class="neu-filter-bar__chip">Archived</button
      ><button class="neu-filter-bar__clear">Clear</button></neu-filter-bar
    >
    <neu-image-gallery
      ><button class="neu-image-gallery__nav--prev">Previous</button
      ><button class="neu-image-gallery__nav--next">Next</button
      ><button class="neu-image-gallery__thumb">One</button
      ><button class="neu-image-gallery__viewer-trigger">View</button
      ><span class="neu-image-gallery__counter">1 / 2</span
      ><span class="neu-image-gallery__caption">Portrait</span></neu-image-gallery
    >
    <button neuImageViewer>Image</button
    ><neu-image-viewer-overlay
      ><span class="neu-iv__counter">1 / 2</span
      ><button class="neu-iv__btn" aria-label="Zoom in"></button
      ><button class="neu-iv__btn" aria-label="Zoom out"></button
      ><button class="neu-iv__btn" aria-label="Reset zoom"></button
      ><button class="neu-iv__arrow--prev">Previous</button
      ><button class="neu-iv__arrow--next">Next</button
      ><button class="neu-iv__btn--close">Close</button></neu-image-viewer-overlay
    >
    <neu-notification-center
      ><button class="neu-nc__bell" aria-expanded="true">Bell</button>
      <div class="neu-nc__panel">
        <button class="neu-nc__action-btn">Read all</button
        ><button class="neu-nc__action-btn">Clear all</button>
        <article class="neu-nc__item">
          Update<button class="neu-nc__item-close">Dismiss</button>
        </article>
      </div></neu-notification-center
    >
    <button neuPopover>Popover target</button
    ><neu-popover-overlay
      ><div class="neu-popover__inner">Popover content</div></neu-popover-overlay
    >
    <neu-sidebar
      ><aside class="neu-sidebar neu-sidebar--open">
        <div class="neu-sidebar__title">Menu</div>
        <div class="neu-sidebar__content">Navigation</div>
        <button class="neu-sidebar__close">Close</button>
      </aside></neu-sidebar
    >
    <neu-dashboard-grid
      ><div class="neu-dg__tile">
        <div class="neu-dg__tile-title">Sales</div>
        <div class="neu-dg__tile-content" tabindex="0"></div></div
    ></neu-dashboard-grid>
    <neu-kanban
      ><section class="neu-kanban__column">
        <h3 class="neu-kanban__column-name">Todo</h3>
        <article class="neu-kanban__card"><h4 class="neu-kanban__title">Audit</h4></article>
      </section></neu-kanban
    >
    <neu-scheduler-gantt
      ><span class="neu-scheduler-gantt__title">Roadmap</span
      ><span class="neu-scheduler-gantt__range">August</span
      ><button class="neu-timeline-grid__item">Release</button></neu-scheduler-gantt
    >
    <neu-tabs
      ><button class="neu-tabs__tab neu-tabs__tab--active">Overview</button
      ><button class="neu-tabs__tab">API</button></neu-tabs
    >
    <neu-timeline-grid
      ><section class="neu-timeline-grid__row" aria-label="Team A">
        <button class="neu-timeline-grid__slot-button">Empty</button
        ><button class="neu-timeline-grid__item">Design</button>
      </section></neu-timeline-grid
    >
    <neu-tree
      ><input class="neu-tree__search-input" />
      <div class="neu-tree__row">
        <button class="neu-tree__toggle">Toggle</button><span class="neu-tree__label">Root</span>
      </div></neu-tree
    >
    <neu-tree-table
      ><table>
        <tbody>
          <tr>
            <td>
              <button class="neu-tree-table__toggle">Toggle</button
              ><span class="neu-tree-table__label">Root</span>
            </td>
          </tr>
        </tbody>
      </table></neu-tree-table
    >
    <neu-virtual-list
      ><div class="neu-virtual-list__viewport" tabindex="0">
        <neu-virtual-list-row>Ada</neu-virtual-list-row
        ><neu-virtual-list-row>Grace</neu-virtual-list-row>
      </div></neu-virtual-list
    >
    <neu-cascade-select
      ><button class="neu-cascade-select__trigger" aria-expanded="true"></button
      ><span class="neu-cascade-select__value">Europe / Spain</span></neu-cascade-select
    >
    <div><button class="neu-cascade-select__option">Europe</button><button class="neu-cascade-select__option">Spain</button></div>
    <neu-org-chart
      ><button class="neu-org-chart__node">CEO</button><button class="neu-org-chart__toggle">Toggle</button></neu-org-chart
    >
    <neu-carousel
      ><article class="neu-carousel__slide">One</article><button class="neu-carousel__nav--previous">Previous</button
      ><button class="neu-carousel__nav--next">Next</button><button class="neu-carousel__indicator">Page 1</button></neu-carousel
    >
    <neu-image-compare
      ><span class="neu-image-compare__label">Before</span><span class="neu-image-compare__label">After</span
      ><input class="neu-image-compare__range" type="range" value="50" /></neu-image-compare
    >
    <neu-mega-menu
      ><button class="neu-mega-menu__trigger">Products</button><button class="neu-mega-menu__item">Docs</button></neu-mega-menu
    >
    <neu-panel-menu><button class="neu-panel-menu__item">Account</button></neu-panel-menu>
    <neu-speed-dial
      ><button class="neu-speed-dial__trigger" aria-expanded="true"></button
      ><button class="neu-speed-dial__action" aria-label="Create">Create</button></neu-speed-dial
    >
    <neu-dock><button class="neu-dock__item" aria-label="Home">Home</button></neu-dock>
    <neu-terminal
      ><section class="neu-terminal" aria-busy="false"><div class="neu-terminal__line">Ready</div
      ><input class="neu-terminal__input" /></section></neu-terminal
    >
  `,
})
class StaticHarnessHostComponent {}

describe('Neural UI public harnesses', () => {
  it('queries controls without exposing their internal DOM to consumers', async () => {
    const fixture = TestBed.createComponent(HarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const button = await loader.getHarness(NeuButtonHarness.with({ text: /Save/ }));
    const input = await loader.getHarness(NeuInputHarness);
    expect(await button.isLoading()).toBe(true);
    expect(await input.getLabel()).toBe('Name');
    await input.setValue('Ada');
    expect(await input.getValue()).toBe('Ada');
  });

  it('provides stable interactions for the principal public controls', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const button = await loader.getHarness(NeuButtonHarness);
    expect(await button.getText()).toBe('Save');
    expect(await button.isDisabled()).toBe(true);
    expect(await button.isLoading()).toBe(true);
    await button.focus();
    await button.click();

    const input = await loader.getHarness(NeuInputHarness);
    expect(await input.getLabel()).toBe('Name');
    expect(await input.getError()).toBe('Required');
    expect(await input.isDisabled()).toBe(true);
    await input.focus();
    await input.blur();

    const checkbox = await loader.getHarness(NeuCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(true);
    expect(await checkbox.isDisabled()).toBe(false);
    expect(await checkbox.getLabel()).toBe('Accept');
    await checkbox.toggle();

    const toggle = await loader.getHarness(NeuSwitchHarness);
    expect(await toggle.isChecked()).toBe(false);
    expect(await toggle.isDisabled()).toBe(false);
    expect(await toggle.getLabel()).toBe('Enabled');
    await toggle.toggle();

    const select = await loader.getHarness(NeuSelectHarness);
    expect(await select.isOpen()).toBe(true);
    expect(await select.getValueText()).toBe('One');
    expect(await select.getOptions()).toEqual(['One', 'Two']);
    await select.open();
    await select.selectOption(/Two/);
    await expect(select.selectOption('Missing')).rejects.toThrow(/was not found/);
    await select.close();

    const date = await loader.getHarness(NeuDateInputHarness);
    expect(await date.isOpen()).toBe(true);
    expect(await date.getDisplayValue()).toContain('May 14');
    await date.open();
    await date.selectDay(14);
    await expect(date.selectDay(31)).rejects.toThrow(/day was not found/);
    await date.close();

    const table = await loader.getHarness(NeuTableHarness);
    expect(await table.getRowCount()).toBe(1);
    expect(await table.getHeaderTexts()).toEqual(['Name']);
    expect(await table.getCellText(0, 0)).toBe('Ada');
    await expect(table.getCellText(3, 0)).rejects.toThrow(/row 3/);
    await expect(table.getCellText(0, 3)).rejects.toThrow(/column 3/);

    const dialog = await loader.getHarness(NeuDialogHarness);
    expect(await dialog.isOpen()).toBe(true);
    expect(await dialog.getTitle()).toBe('Confirm');
    expect(await dialog.getBodyText()).toBe('Continue?');
    await dialog.close();
  });

  it('provides stable interactions for common form and selection controls', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const textarea = await loader.getHarness(NeuTextareaHarness);
    expect(await textarea.getLabel()).toBe('Notes');
    expect(await textarea.getError()).toBe('Too long');
    expect(await textarea.getValue()).toBe('Hello');
    await textarea.setValue('Updated');
    expect(await textarea.getValue()).toBe('Updated');
    expect(await textarea.isDisabled()).toBe(false);
    await textarea.focus();
    await textarea.blur();

    const number = await loader.getHarness(NeuNumberInputHarness);
    expect(await number.getValue()).toBe(5);
    expect(await number.getMinimum()).toBe(0);
    expect(await number.getMaximum()).toBe(10);
    expect(await number.isDisabled()).toBe(false);
    await number.setValue(6);
    await number.increment();
    await number.decrement();

    const slider = await loader.getHarness(NeuSliderHarness);
    expect(await slider.getValue()).toBe(25);
    expect(await slider.getMinimum()).toBe(0);
    expect(await slider.getMaximum()).toBe(100);
    expect(await slider.getLabel()).toBe('Volume');
    expect(await slider.isDisabled()).toBe(false);
    await slider.setValue(50);

    const radio = await loader.getHarness(NeuRadioGroupHarness);
    expect(await radio.getOptionCount()).toBe(2);
    expect(await radio.getLabels()).toEqual(['One', 'Two']);
    expect(await radio.getCheckedIndex()).toBe(0);
    expect(await radio.isDisabled()).toBe(false);
    await radio.selectOption(1);
    await expect(radio.selectOption(3)).rejects.toThrow(/option 3/);

    const rating = await loader.getHarness(NeuRatingHarness);
    expect(await rating.getStarCount()).toBe(3);
    expect(await rating.getValue()).toBe(2);
    expect(await rating.isReadonly()).toBe(false);
    await rating.select(3);
    await expect(rating.select(4)).rejects.toThrow(/value 4/);

    const accordion = await loader.getHarness(NeuAccordionHarness);
    expect(await accordion.getItemCount()).toBe(2);
    expect(await accordion.getTitles()).toEqual(['First', 'Second']);
    expect(await accordion.isExpanded(0)).toBe(true);
    await accordion.toggleItem(1);
    await expect(accordion.toggleItem(3)).rejects.toThrow(/item 3/);

    const autocomplete = await loader.getHarness(NeuAutocompleteHarness);
    expect(await autocomplete.getValue()).toBe('Ada');
    expect(await autocomplete.isOpen()).toBe(true);
    expect(await autocomplete.getOptions()).toEqual(['Ada', 'Grace']);
    await autocomplete.setValue('Grace');
    await autocomplete.selectOption(/Grace/);
    await expect(autocomplete.selectOption('Missing')).rejects.toThrow(/was not found/);
    await autocomplete.clear();

    const multiselect = await loader.getHarness(NeuMultiselectHarness);
    expect(await multiselect.isOpen()).toBe(true);
    expect(await multiselect.getSelectedLabels()).toEqual(['Ada']);
    expect(await multiselect.getOptions()).toEqual(['Ada', 'Grace']);
    await multiselect.open();
    await multiselect.toggleOption('Grace');
    await expect(multiselect.toggleOption('Missing')).rejects.toThrow(/was not found/);
    await multiselect.close();

    const listbox = await loader.getHarness(NeuListboxHarness);
    expect(await listbox.getOptions()).toEqual(['Ada', 'Grace']);
    expect(await listbox.getSelectedOptions()).toEqual(['Ada']);
    await listbox.selectOption('Grace');
    await expect(listbox.selectOption('Missing')).rejects.toThrow(/was not found/);
    await listbox.setSearch('Gr');

    const treeSelect = await loader.getHarness(NeuTreeSelectHarness);
    expect(await treeSelect.isOpen()).toBe(true);
    expect(await treeSelect.getValueText()).toBe('Ada');
    expect(await treeSelect.getNodes()).toEqual(['Ada', 'Grace']);
    await treeSelect.open();
    await treeSelect.selectNode('Grace');
    await expect(treeSelect.selectNode('Missing')).rejects.toThrow(/was not found/);
    await treeSelect.close();
  });

  it('provides stable interactions for common actions and composite controls', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const chip = await loader.getHarness(NeuChipHarness);
    expect(await chip.getText()).toContain('Angular');
    expect(await chip.isSelected()).toBe(true);
    expect(await chip.isDisabled()).toBe(false);
    await chip.toggle();
    await chip.remove();

    const password = await loader.getHarness(NeuPasswordHarness);
    expect(await password.getLabel()).toBe('Password');
    expect(await password.getValue()).toBe('secret');
    expect(await password.isPasswordVisible()).toBe(false);
    expect(await password.isDisabled()).toBe(false);
    await password.setValue('changed');
    await password.toggleVisibility();

    const pagination = await loader.getHarness(NeuPaginationHarness);
    expect(await pagination.getPageNumbers()).toEqual([1, 2]);
    expect(await pagination.getCurrentPage()).toBe(2);
    await pagination.goToPreviousPage();
    await pagination.goToPage(1);
    await pagination.goToNextPage();
    await expect(pagination.goToPage(8)).rejects.toThrow(/page 8/);

    const code = await loader.getHarness(NeuCodeBlockHarness);
    expect(await code.getLanguage()).toBe('TypeScript');
    expect(await code.getCode()).toBe('const answer = 42;');
    await code.copy();

    const color = await loader.getHarness(NeuColorPickerHarness);
    expect(await color.isOpen()).toBe(true);
    expect(await color.getValue()).toBe('#336699');
    await color.open();
    await color.setValue('#ffffff');
    await color.selectSwatch(0);
    await expect(color.selectSwatch(3)).rejects.toThrow(/swatch 3/);
    await color.close();

    const commands = await loader.getHarness(NeuCommandPaletteHarness);
    expect(await commands.isOpen()).toBe(true);
    expect(await commands.getCommands()).toEqual(['Open']);
    await commands.setQuery('Op');
    await commands.execute('Open');
    await expect(commands.execute('Missing')).rejects.toThrow(/was not found/);
    await commands.close();

    const tags = await loader.getHarness(NeuTagsHarness);
    expect((await tags.getTags())[0]).toContain('Angular');
    expect(await tags.getDraft()).toBe('');
    expect(await tags.isDisabled()).toBe(false);
    await tags.addTag('Signals');
    await tags.removeTag(0);
    await expect(tags.removeTag(3)).rejects.toThrow(/tag 3/);

    const toggles = await loader.getHarness(NeuToggleButtonGroupHarness);
    expect(await toggles.getOptions()).toEqual(['Grid', 'List']);
    expect(await toggles.getSelectedOptions()).toEqual(['Grid']);
    expect(await toggles.isDisabled()).toBe(false);
    await toggles.toggleOption('List');
    await expect(toggles.toggleOption('Missing')).rejects.toThrow(/was not found/);

    const uploader = await loader.getHarness(NeuUploaderHarness);
    expect(await uploader.getFileNames()).toEqual(['report.pdf']);
    expect(await uploader.getError()).toBe('Too large');
    expect(await uploader.isDisabled()).toBe(false);
    await uploader.openFilePicker();
    await uploader.removeFile(0);
    await expect(uploader.removeFile(3)).rejects.toThrow(/file 3/);

    const stepper = await loader.getHarness(NeuStepperHarness);
    expect(await stepper.getSteps()).toEqual(['Account', 'Review']);
    expect(await stepper.getActiveStepIndex()).toBe(0);
    await stepper.selectStep(1);
    await expect(stepper.selectStep(3)).rejects.toThrow(/step 3/);
  });

  it('provides stable interactions for editing, navigation and layout controls', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const mask = await loader.getHarness(NeuInputMaskHarness);
    expect(await mask.getLabel()).toBe('Phone');
    expect(await mask.getValue()).toBe('123-456');
    expect(await mask.isDisabled()).toBe(false);
    await mask.setValue('987-654');

    const otp = await loader.getHarness(NeuInputOtpHarness);
    expect(await otp.getLength()).toBe(3);
    expect(await otp.getValue()).toBe('123');
    expect(await otp.isDisabled()).toBe(false);
    await otp.setCell(1, '8');
    await expect(otp.setCell(4, '0')).rejects.toThrow(/cell 4/);

    const editor = await loader.getHarness(NeuInlineEditorHarness);
    expect(await editor.isEditing()).toBe(true);
    expect(await editor.getDisplayValue()).toBe('Ada');
    await editor.beginEdit();
    await editor.save();
    await editor.cancel();

    const knob = await loader.getHarness(NeuKnobHarness);
    expect(await knob.getValue()).toBe(40);
    expect(await knob.getMinimum()).toBe(0);
    expect(await knob.getMaximum()).toBe(100);
    expect(await knob.isDisabled()).toBe(false);
    await knob.increment();
    await knob.decrement();

    const menu = await loader.getHarness(NeuMenuHarness);
    expect(await menu.getItems()).toEqual(['Open', 'Save']);
    await menu.clickItem('Save');
    await expect(menu.clickItem('Missing')).rejects.toThrow(/was not found/);

    const nav = await loader.getHarness(NeuNavHarness);
    expect(await nav.getItems()).toEqual(['Home', 'Settings']);
    expect(await nav.isCollapsed()).toBe(false);
    await nav.clickItem('Home');
    await expect(nav.clickItem('Missing')).rejects.toThrow(/was not found/);
    await nav.toggleCollapsed();

    const pickList = await loader.getHarness(NeuPickListHarness);
    expect(await pickList.getSourceItems()).toEqual(['Ada', 'Grace']);
    expect(await pickList.getTargetItems()).toEqual(['Linus']);
    await pickList.selectSourceItem('Grace');
    await expect(pickList.selectSourceItem('Missing')).rejects.toThrow(/was not found/);
    await pickList.moveSelectedToTarget();
    await pickList.moveSelectedToSource();

    const richText = await loader.getHarness(NeuRichTextEditorHarness);
    expect(await richText.getLabel()).toBe('Message');
    expect(await richText.getHtml()).toContain('Hello');
    expect(await richText.getToolbarActions()).toEqual(['Bold']);
    expect(await richText.isDisabled()).toBe(false);
    await richText.setText('Updated');

    const splitButton = await loader.getHarness(NeuSplitButtonHarness);
    expect(await splitButton.getLabel()).toBe('Save');
    expect(await splitButton.isOpen()).toBe(true);
    expect(await splitButton.getActions()).toEqual(['Save as']);
    await splitButton.clickPrimary();
    await splitButton.open();
    await splitButton.clickAction('Save as');
    await expect(splitButton.clickAction('Missing')).rejects.toThrow(/was not found/);
    await splitButton.close();

    const splitter = await loader.getHarness(NeuSplitterHarness);
    expect(await splitter.getPaneCount()).toBe(2);
    expect(await splitter.getHandleValues()).toEqual([40]);
    await splitter.moveHandle(0, 'increase');
    await splitter.moveHandle(0, 'decrease');
    await expect(splitter.moveHandle(3, 'increase')).rejects.toThrow(/handle 3/);
  });

  it('provides stable interactions for feedback, navigation and overlay controls', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const alert = await loader.getHarness(NeuAlertHarness);
    expect(await alert.getTitle()).toBe('Warning');
    expect(await alert.getMessage()).toBe('Check data');
    expect(await alert.isDismissed()).toBe(false);
    await alert.dismiss();

    const sheet = await loader.getHarness(NeuBottomSheetHarness);
    expect(await sheet.isOpen()).toBe(true);
    expect(await sheet.getBodyText()).toBe('Details');
    await sheet.close();

    const breadcrumb = await loader.getHarness(NeuBreadcrumbHarness);
    expect(await breadcrumb.getItems()).toEqual(['Home', 'Settings']);
    expect(await breadcrumb.getCurrentItem()).toBe('Settings');
    await breadcrumb.followItem('Home');
    await expect(breadcrumb.followItem('Missing')).rejects.toThrow(/was not found/);

    const calendar = await loader.getHarness(NeuCalendarHarness);
    expect(await calendar.getTitle()).toBe('August 2026');
    expect(await calendar.getEvents()).toEqual(['Review']);
    await calendar.goToPreviousPeriod();
    await calendar.goToToday();
    await calendar.goToNextPeriod();
    await calendar.selectDay(16);
    await expect(calendar.selectDay(31)).rejects.toThrow(/day 31/);

    const dialog = await loader.getHarness(NeuConfirmDialogHarness);
    expect(await dialog.getTitle()).toBe('Delete?');
    expect(await dialog.getMessage()).toBe('This cannot be undone.');
    await dialog.reject();
    await dialog.accept();

    const popup = await loader.getHarness(NeuConfirmPopupHarness);
    expect(await popup.isOpen()).toBe(true);
    expect(await popup.getMessage()).toBe('Continue?');
    await popup.reject();
    await popup.accept();

    const toast = await loader.getHarness(NeuToastHarness);
    expect(await toast.getTitles()).toEqual(['Saved']);
    expect(await toast.getMessages()).toEqual(['Changes stored']);
    await toast.dismiss(0);
    await expect(toast.dismiss(3)).rejects.toThrow(/toast 3/);

    const tooltip = await loader.getHarness(NeuTooltipHarness);
    expect(await tooltip.getDescriptionId()).toBe('tip-1');
    expect(await tooltip.getText()).toBe('Helpful text');
    await tooltip.show();
    await tooltip.hide();
  });

  it('provides stable interactions for contextual, data and navigation surfaces', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const contextMenu = await loader.getHarness(NeuContextMenuHarness);
    expect(await contextMenu.getItems()).toEqual(['Rename']);
    await contextMenu.open();
    await contextMenu.clickItem('Rename');
    await expect(contextMenu.clickItem('Missing')).rejects.toThrow(/was not found/);

    const dataView = await loader.getHarness(NeuDataViewHarness);
    expect(await dataView.getItemCount()).toBe(1);
    expect(await dataView.getModes()).toEqual(['Grid', 'List']);
    await dataView.setSearch('Ada');
    await dataView.selectMode('List');
    await expect(dataView.selectMode('Missing')).rejects.toThrow(/was not found/);

    const filterBar = await loader.getHarness(NeuFilterBarHarness);
    expect(await filterBar.getFilters()).toEqual(['Active', 'Archived']);
    expect(await filterBar.getActiveFilters()).toEqual(['Active']);
    await filterBar.toggleFilter('Archived');
    await expect(filterBar.toggleFilter('Missing')).rejects.toThrow(/was not found/);
    await filterBar.clear();

    const gallery = await loader.getHarness(NeuImageGalleryHarness);
    expect(await gallery.getCounter()).toBe('1 / 2');
    expect(await gallery.getCaption()).toBe('Portrait');
    await gallery.previous();
    await gallery.next();
    await gallery.selectThumbnail(0);
    await expect(gallery.selectThumbnail(4)).rejects.toThrow(/thumbnail 4/);
    await gallery.openViewer();

    const viewer = await loader.getHarness(NeuImageViewerHarness);
    expect(await viewer.getCounter()).toBe('1 / 2');
    await viewer.open();
    await viewer.zoomIn();
    await viewer.zoomOut();
    await viewer.resetZoom();
    await viewer.previous();
    await viewer.next();
    await viewer.close();

    const notifications = await loader.getHarness(NeuNotificationCenterHarness);
    expect(await notifications.isOpen()).toBe(true);
    expect((await notifications.getNotifications())[0]).toContain('Update');
    await notifications.open();
    await notifications.markAllRead();
    await notifications.clearAll();
    await notifications.dismiss(0);
    await expect(notifications.dismiss(3)).rejects.toThrow(/notification 3/);
    await notifications.close();

    const popover = await loader.getHarness(NeuPopoverHarness);
    expect(await popover.getText()).toBe('Popover content');
    await popover.toggle();

    const sidebar = await loader.getHarness(NeuSidebarHarness);
    expect(await sidebar.isOpen()).toBe(true);
    expect(await sidebar.getTitle()).toBe('Menu');
    expect(await sidebar.getContentText()).toBe('Navigation');
    await sidebar.close();
  });

  it('provides stable interactions for complex data and virtualized surfaces', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const dashboard = await loader.getHarness(NeuDashboardGridHarness);
    expect(await dashboard.getTileCount()).toBe(1);
    expect(await dashboard.getTileTitles()).toEqual(['Sales']);
    await dashboard.focusTile(0);
    await expect(dashboard.focusTile(3)).rejects.toThrow(/tile 3/);

    const kanban = await loader.getHarness(NeuKanbanHarness);
    expect(await kanban.getColumns()).toEqual(['Todo']);
    expect(await kanban.getCards()).toEqual(['Audit']);
    expect(await kanban.getCardCount()).toBe(1);

    const scheduler = await loader.getHarness(NeuSchedulerGanttHarness);
    expect(await scheduler.getTitle()).toBe('Roadmap');
    expect(await scheduler.getRange()).toBe('August');
    expect(await scheduler.getTasks()).toEqual(['Release']);
    await scheduler.clickTask('Release');
    await expect(scheduler.clickTask('Missing')).rejects.toThrow(/was not found/);

    const tabs = await loader.getHarness(NeuTabsHarness);
    expect(await tabs.getTabs()).toEqual(['Overview', 'API']);
    expect(await tabs.getActiveTab()).toBe('Overview');
    await tabs.selectTab('API');
    await expect(tabs.selectTab('Missing')).rejects.toThrow(/was not found/);

    const timeline = await loader.getHarness(NeuTimelineGridHarness);
    expect(await timeline.getRows()).toEqual(['Team A']);
    expect(await timeline.getItems()).toEqual(['Design']);
    await timeline.selectItem('Design');
    await expect(timeline.selectItem('Missing')).rejects.toThrow(/was not found/);
    await timeline.selectEmptySlot(0);
    await expect(timeline.selectEmptySlot(3)).rejects.toThrow(/slot 3/);

    const tree = await loader.getHarness(NeuTreeHarness);
    expect(await tree.getNodes()).toEqual(['Root']);
    await tree.setSearch('Root');
    await tree.selectNode('Root');
    await expect(tree.selectNode('Missing')).rejects.toThrow(/was not found/);
    await tree.toggleNode(0);
    await expect(tree.toggleNode(3)).rejects.toThrow(/toggle 3/);

    const treeTable = await loader.getHarness(NeuTreeTableHarness);
    expect((await treeTable.getRows())[0]).toContain('Root');
    expect(await treeTable.getLabels()).toEqual(['Root']);
    await treeTable.toggleRow(0);
    await expect(treeTable.toggleRow(3)).rejects.toThrow(/toggle 3/);

    const virtualList = await loader.getHarness(NeuVirtualListHarness);
    expect(await virtualList.getRenderedItems()).toEqual(['Ada', 'Grace']);
    expect(await virtualList.getRenderedItemCount()).toBe(2);
    expect(await virtualList.getEmptyText()).toBeNull();
    await virtualList.focusViewport();
  });

  it('provides harnesses for the extended navigation and content suite', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const cascade = await loader.getHarness(NeuCascadeSelectHarness);
    expect(await cascade.isOpen()).toBe(true);
    expect(await cascade.getValueText()).toBe('Europe / Spain');
    expect(await cascade.getOptions()).toEqual(['Europe', 'Spain']);
    await cascade.open();
    await cascade.selectPath(['Europe', /Spain/]);
    await expect(cascade.selectPath(['Missing'])).rejects.toThrow(/was not found/);
    await cascade.close();

    const org = await loader.getHarness(NeuOrgChartHarness);
    expect(await org.getNodes()).toEqual(['CEO']);
    await org.selectNode('CEO');
    await expect(org.selectNode('Missing')).rejects.toThrow(/was not found/);
    await org.toggleNode(0);
    await expect(org.toggleNode(2)).rejects.toThrow(/toggle 2/);

    const carousel = await loader.getHarness(NeuCarouselHarness);
    expect(await carousel.getSlides()).toEqual(['One']);
    await carousel.previous();
    await carousel.next();
    await carousel.goToPage(0);
    await expect(carousel.goToPage(2)).rejects.toThrow(/page 2/);

    const compare = await loader.getHarness(NeuImageCompareHarness);
    expect(await compare.getPosition()).toBe(50);
    expect(await compare.getLabels()).toEqual(['Before', 'After']);
    await compare.setPosition(70);

    const mega = await loader.getHarness(NeuMegaMenuHarness);
    expect(await mega.getTopItems()).toEqual(['Products']);
    await mega.openItem('Products');
    await mega.selectItem('Docs');
    await expect(mega.openItem('Missing')).rejects.toThrow(/was not found/);
    await expect(mega.selectItem('Missing')).rejects.toThrow(/was not found/);

    const panel = await loader.getHarness(NeuPanelMenuHarness);
    expect(await panel.getItems()).toEqual(['Account']);
    await panel.activateItem('Account');
    await expect(panel.activateItem('Missing')).rejects.toThrow(/was not found/);

    const speedDial = await loader.getHarness(NeuSpeedDialHarness);
    expect(await speedDial.isOpen()).toBe(true);
    expect(await speedDial.getActions()).toEqual(['Create']);
    await speedDial.open();
    await speedDial.selectAction('Create');
    await expect(speedDial.selectAction('Missing')).rejects.toThrow(/was not found/);

    const dock = await loader.getHarness(NeuDockHarness);
    expect(await dock.getItems()).toEqual(['Home']);
    await dock.selectItem('Home');
    await expect(dock.selectItem('Missing')).rejects.toThrow(/was not found/);

    const terminal = await loader.getHarness(NeuTerminalHarness);
    expect(await terminal.getLines()).toEqual(['Ready']);
    expect(await terminal.isBusy()).toBe(false);
    await terminal.run('help');
  });
});
