import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
  TestKey,
} from '@angular/cdk/testing';

export interface NeuTextHarnessFilters extends BaseHarnessFilters {
  text?: string | RegExp;
}

export class NeuButtonHarness extends ComponentHarness {
  static hostSelector = 'button[neu-button]';
  static with(options: NeuTextHarnessFilters = {}): HarnessPredicate<NeuButtonHarness> {
    return new HarnessPredicate(NeuButtonHarness, options).addOption(
      'text',
      options.text,
      (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getAttribute('disabled').then((value) => value !== null);
  }
  async isLoading(): Promise<boolean> {
    return (await this.host()).getAttribute('aria-busy').then((value) => value === 'true');
  }
  async click(): Promise<void> {
    await (await this.host()).click();
  }
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }
}

export class NeuInputHarness extends ComponentHarness {
  static hostSelector = 'neu-input';
  private readonly field = this.locatorFor('input.neu-input__field');
  private readonly error = this.locatorForOptional('.neu-input__error');
  async getValue(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.field()).setInputValue(value);
  }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional('.neu-input__static-label, .neu-input__label')();
    return label ? label.text() : null;
  }
  async getError(): Promise<string | null> {
    const node = await this.error();
    return node ? node.text() : null;
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getAttribute('disabled').then((value) => value !== null);
  }
  async focus(): Promise<void> {
    await (await this.field()).focus();
  }
  async blur(): Promise<void> {
    await (await this.field()).blur();
  }
}

export class NeuTextareaHarness extends ComponentHarness {
  static hostSelector = 'neu-textarea';
  private readonly field = this.locatorFor('textarea.neu-textarea__field');
  private readonly error = this.locatorForOptional('.neu-textarea__error');
  async getValue(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.field()).setInputValue(value);
  }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional('.neu-textarea__label')();
    return label ? label.text() : null;
  }
  async getError(): Promise<string | null> {
    const node = await this.error();
    return node ? node.text() : null;
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getProperty<boolean>('disabled');
  }
  async focus(): Promise<void> {
    await (await this.field()).focus();
  }
  async blur(): Promise<void> {
    await (await this.field()).blur();
  }
}

export class NeuNumberInputHarness extends ComponentHarness {
  static hostSelector = 'neu-number-input';
  private readonly field = this.locatorFor('input.neu-number-input__field');
  private readonly incrementButton = this.locatorFor('.neu-number-input__btn--inc');
  private readonly decrementButton = this.locatorFor('.neu-number-input__btn--dec');
  async getValue(): Promise<number> {
    return Number(await (await this.field()).getProperty<string>('value'));
  }
  async setValue(value: number): Promise<void> {
    await (await this.field()).setInputValue(String(value));
  }
  async getMinimum(): Promise<number | null> {
    const value = await (await this.field()).getAttribute('aria-valuemin');
    return value === null ? null : Number(value);
  }
  async getMaximum(): Promise<number | null> {
    const value = await (await this.field()).getAttribute('aria-valuemax');
    return value === null ? null : Number(value);
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getProperty<boolean>('disabled');
  }
  async increment(): Promise<void> {
    await (await this.incrementButton()).click();
  }
  async decrement(): Promise<void> {
    await (await this.decrementButton()).click();
  }
}

export class NeuSliderHarness extends ComponentHarness {
  static hostSelector = 'neu-slider';
  private readonly control = this.locatorFor('input.neu-slider__input');
  async getValue(): Promise<number> {
    return Number(await (await this.control()).getProperty<string>('value'));
  }
  async setValue(value: number): Promise<void> {
    await (await this.control()).setInputValue(String(value));
  }
  async getMinimum(): Promise<number> {
    return Number(await (await this.control()).getAttribute('min'));
  }
  async getMaximum(): Promise<number> {
    return Number(await (await this.control()).getAttribute('max'));
  }
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }
  async getLabel(): Promise<string | null> {
    return (await this.control()).getAttribute('aria-label');
  }
}

export class NeuRadioGroupHarness extends ComponentHarness {
  static hostSelector = 'neu-radio-group';
  private readonly controls = this.locatorForAll('input.neu-radio__input');
  async getOptionCount(): Promise<number> {
    return (await this.controls()).length;
  }
  async getLabels(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-radio__label')()).map((label) => label.text()),
    );
  }
  async getCheckedIndex(): Promise<number> {
    const controls = await this.controls();
    const states = await Promise.all(
      controls.map((control) => control.getProperty<boolean>('checked')),
    );
    return states.findIndex(Boolean);
  }
  async selectOption(index: number): Promise<void> {
    const controls = await this.controls();
    if (!controls[index]) throw new Error(`Neural UI radio option ${index} does not exist.`);
    await controls[index].click();
  }
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getAttribute('aria-disabled').then((value) => value === 'true');
  }
}

export class NeuRatingHarness extends ComponentHarness {
  static hostSelector = 'neu-rating';
  private readonly stars = this.locatorForAll('.neu-rating__star');
  async getStarCount(): Promise<number> {
    return (await this.stars()).length;
  }
  async getValue(): Promise<number> {
    const stars = await this.stars();
    const states = await Promise.all(stars.map((star) => star.getAttribute('aria-checked')));
    const index = states.findIndex((state) => state === 'true');
    return index < 0 ? 0 : index + 1;
  }
  async select(value: number): Promise<void> {
    const stars = await this.stars();
    if (!stars[value - 1]) throw new Error(`Neural UI rating value ${value} does not exist.`);
    await stars[value - 1].click();
  }
  async isReadonly(): Promise<boolean> {
    const stars = await this.stars();
    return stars.length > 0 && (await stars[0].getProperty<boolean>('disabled'));
  }
}

export class NeuAccordionHarness extends ComponentHarness {
  static hostSelector = 'neu-accordion';
  private readonly headers = this.locatorForAll('.neu-accordion__header');
  async getItemCount(): Promise<number> {
    return (await this.headers()).length;
  }
  async getTitles(): Promise<string[]> {
    return Promise.all((await this.headers()).map((header) => header.text()));
  }
  async isExpanded(index: number): Promise<boolean> {
    const headers = await this.headers();
    if (!headers[index]) throw new Error(`Neural UI accordion item ${index} does not exist.`);
    return (await headers[index].getAttribute('aria-expanded')) === 'true';
  }
  async toggleItem(index: number): Promise<void> {
    const headers = await this.headers();
    if (!headers[index]) throw new Error(`Neural UI accordion item ${index} does not exist.`);
    await headers[index].click();
  }
}

export class NeuAutocompleteHarness extends ComponentHarness {
  static hostSelector = 'neu-autocomplete';
  private readonly field = this.locatorFor('input.neu-autocomplete__input');
  async getValue(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.field()).setInputValue(value);
  }
  async isOpen(): Promise<boolean> {
    return (await this.field()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getOptions(): Promise<string[]> {
    return Promise.all(
      (await this.documentRootLocatorFactory().locatorForAll('.neu-autocomplete__option')()).map(
        (option) => option.text(),
      ),
    );
  }
  async selectOption(text: string | RegExp): Promise<void> {
    const options = await this.documentRootLocatorFactory().locatorForAll(
      '.neu-autocomplete__option',
    )();
    for (const option of options) {
      if (await HarnessPredicate.stringMatches(await option.text(), text)) {
        await option.click();
        return;
      }
    }
    throw new Error(`Neural UI autocomplete option was not found: ${String(text)}`);
  }
  async clear(): Promise<void> {
    const clear = await this.locatorForOptional('.neu-autocomplete__clear')();
    if (clear) await clear.click();
  }
}

export class NeuMultiselectHarness extends ComponentHarness {
  static hostSelector = 'neu-multiselect';
  private readonly trigger = this.locatorFor('.neu-multiselect__trigger');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getSelectedLabels(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-multiselect__chip')()).map((chip) => chip.text()),
    );
  }
  async getOptions(): Promise<string[]> {
    return Promise.all(
      (await this.documentRootLocatorFactory().locatorForAll('.neu-multiselect__option')()).map(
        (option) => option.text(),
      ),
    );
  }
  async toggleOption(text: string | RegExp): Promise<void> {
    await this.open();
    const options = await this.documentRootLocatorFactory().locatorForAll(
      '.neu-multiselect__option',
    )();
    for (const option of options) {
      if (await HarnessPredicate.stringMatches(await option.text(), text)) {
        await option.click();
        return;
      }
    }
    throw new Error(`Neural UI multiselect option was not found: ${String(text)}`);
  }
}

export class NeuListboxHarness extends ComponentHarness {
  static hostSelector = 'neu-listbox';
  private readonly options = this.locatorForAll('.neu-listbox__option');
  async getOptions(): Promise<string[]> {
    return Promise.all((await this.options()).map((option) => option.text()));
  }
  async getSelectedOptions(): Promise<string[]> {
    const options = await this.options();
    const selected = await Promise.all(
      options.map(async (option) => ({
        option,
        selected: (await option.getAttribute('aria-selected')) === 'true',
      })),
    );
    return Promise.all(selected.filter((item) => item.selected).map((item) => item.option.text()));
  }
  async selectOption(text: string | RegExp): Promise<void> {
    for (const option of await this.options()) {
      if (await HarnessPredicate.stringMatches(await option.text(), text)) {
        await option.click();
        return;
      }
    }
    throw new Error(`Neural UI listbox option was not found: ${String(text)}`);
  }
  async setSearch(value: string): Promise<void> {
    const search = await this.locatorForOptional('input.neu-listbox__search')();
    if (!search) throw new Error('Neural UI listbox search is not enabled.');
    await search.setInputValue(value);
  }
}

export class NeuTreeSelectHarness extends ComponentHarness {
  static hostSelector = 'neu-tree-select';
  private readonly trigger = this.locatorFor('.neu-tree-select__trigger');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getValueText(): Promise<string> {
    return (await this.trigger()).text();
  }
  async getNodes(): Promise<string[]> {
    return Promise.all(
      (await this.documentRootLocatorFactory().locatorForAll('.neu-tree-select__node')()).map(
        (node) => node.text(),
      ),
    );
  }
  async selectNode(text: string | RegExp): Promise<void> {
    await this.open();
    const nodes = await this.documentRootLocatorFactory().locatorForAll('.neu-tree-select__node')();
    for (const node of nodes) {
      if (await HarnessPredicate.stringMatches(await node.text(), text)) {
        await node.click();
        return;
      }
    }
    throw new Error(`Neural UI tree-select node was not found: ${String(text)}`);
  }
}

export class NeuChipHarness extends ComponentHarness {
  static hostSelector = 'neu-chip';
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
  async isSelected(): Promise<boolean> {
    return (await this.host()).getAttribute('aria-pressed').then((value) => value === 'true');
  }
  async isDisabled(): Promise<boolean> {
    return (await this.host()).hasClass('neu-chip--disabled');
  }
  async toggle(): Promise<void> {
    await (await this.host()).click();
  }
  async remove(): Promise<void> {
    const button = await this.locatorForOptional('.neu-chip__remove')();
    if (!button) throw new Error('Neural UI chip is not removable.');
    await button.click();
  }
}

export class NeuPasswordHarness extends ComponentHarness {
  static hostSelector = 'neu-password';
  private readonly field = this.locatorFor('input.neu-password__control');
  async getValue(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.field()).setInputValue(value);
  }
  async isPasswordVisible(): Promise<boolean> {
    return (await this.field()).getAttribute('type').then((type) => type === 'text');
  }
  async toggleVisibility(): Promise<void> {
    const toggle = await this.locatorForOptional('.neu-password__toggle')();
    if (!toggle) throw new Error('Neural UI password visibility toggle is not enabled.');
    await toggle.click();
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getProperty<boolean>('disabled');
  }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional(
      '.neu-password__label, .neu-password__floating-label',
    )();
    return label ? label.text() : null;
  }
}

export class NeuPaginationHarness extends ComponentHarness {
  static hostSelector = 'neu-pagination';
  private readonly pageButtons = this.locatorForAll(
    '.neu-pagination__btn:not(.neu-pagination__btn--nav)',
  );
  async getPageNumbers(): Promise<number[]> {
    return Promise.all(
      (await this.pageButtons()).map(async (button) => Number((await button.text()).trim())),
    );
  }
  async getCurrentPage(): Promise<number | null> {
    const current = await this.locatorForOptional('.neu-pagination__btn[aria-current="page"]')();
    return current ? Number((await current.text()).trim()) : null;
  }
  async goToPage(page: number): Promise<void> {
    for (const button of await this.pageButtons()) {
      if (Number((await button.text()).trim()) === page) {
        await button.click();
        return;
      }
    }
    throw new Error(`Neural UI pagination page ${page} is not available.`);
  }
  async goToPreviousPage(): Promise<void> {
    const buttons = await this.locatorForAll('.neu-pagination__btn--nav')();
    if (!buttons[0]) throw new Error('Neural UI pagination previous button is missing.');
    await buttons[0].click();
  }
  async goToNextPage(): Promise<void> {
    const buttons = await this.locatorForAll('.neu-pagination__btn--nav')();
    if (!buttons[1]) throw new Error('Neural UI pagination next button is missing.');
    await buttons[1].click();
  }
}

export class NeuCodeBlockHarness extends ComponentHarness {
  static hostSelector = 'neu-code-block';
  async getCode(): Promise<string> {
    return (await this.locatorFor('.neu-code-block__code')()).text();
  }
  async getLanguage(): Promise<string | null> {
    const language = await this.locatorForOptional('.neu-code-block__lang')();
    return language ? language.text() : null;
  }
  async copy(): Promise<void> {
    const button = await this.locatorForOptional('.neu-code-block__copy')();
    if (!button) throw new Error('Neural UI code block copy action is not enabled.');
    await button.click();
  }
}

export class NeuColorPickerHarness extends ComponentHarness {
  static hostSelector = 'neu-color-picker';
  private readonly trigger = this.locatorFor('.neu-cp__trigger');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getValue(): Promise<string> {
    return (await this.locatorFor('.neu-cp__hex-label')()).text();
  }
  async setValue(value: string): Promise<void> {
    await this.open();
    const field = await this.documentRootLocatorFactory().locatorFor('.neu-cp__text-input')();
    await field.setInputValue(value);
  }
  async selectSwatch(index: number): Promise<void> {
    await this.open();
    const swatches = await this.documentRootLocatorFactory().locatorForAll('.neu-cp__sw')();
    if (!swatches[index]) throw new Error(`Neural UI color swatch ${index} does not exist.`);
    await swatches[index].click();
  }
}

export class NeuCommandPaletteHarness extends ComponentHarness {
  static hostSelector = 'neu-command-palette';
  async isOpen(): Promise<boolean> {
    return Boolean(await this.locatorForOptional('.neu-cmd[role="dialog"]')());
  }
  async getCommands(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-cmd__item-label')()).map((label) => label.text()),
    );
  }
  async setQuery(value: string): Promise<void> {
    const input = await this.locatorForOptional('.neu-cmd__input')();
    if (!input) throw new Error('Neural UI command palette is closed.');
    await input.setInputValue(value);
  }
  async execute(text: string | RegExp): Promise<void> {
    const items = await this.locatorForAll('.neu-cmd__item')();
    for (const item of items) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI command was not found: ${String(text)}`);
  }
  async close(): Promise<void> {
    const input = await this.locatorForOptional('.neu-cmd__input')();
    if (input) await input.sendKeys(TestKey.ESCAPE);
  }
}

export class NeuTagsHarness extends ComponentHarness {
  static hostSelector = 'neu-tags';
  private readonly field = this.locatorFor('.neu-tags__box input');
  async getTags(): Promise<string[]> {
    return Promise.all((await this.locatorForAll('.neu-tags__tag')()).map((tag) => tag.text()));
  }
  async getDraft(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async addTag(value: string): Promise<void> {
    const field = await this.field();
    await field.setInputValue(value);
    await field.sendKeys(TestKey.ENTER);
  }
  async removeTag(index: number): Promise<void> {
    const buttons = await this.locatorForAll('.neu-tags__tag button')();
    if (!buttons[index]) throw new Error(`Neural UI tag ${index} does not exist.`);
    await buttons[index].click();
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getProperty<boolean>('disabled');
  }
}

export class NeuToggleButtonGroupHarness extends ComponentHarness {
  static hostSelector = 'neu-toggle-button-group';
  private readonly buttons = this.locatorForAll('.neu-toggle-group__btn');
  async getOptions(): Promise<string[]> {
    return Promise.all((await this.buttons()).map((button) => button.text()));
  }
  async getSelectedOptions(): Promise<string[]> {
    const buttons = await this.buttons();
    const selected = await Promise.all(
      buttons.map(async (button) => ({
        button,
        selected: (await button.getAttribute('aria-pressed')) === 'true',
      })),
    );
    return Promise.all(selected.filter((item) => item.selected).map((item) => item.button.text()));
  }
  async toggleOption(text: string | RegExp): Promise<void> {
    for (const button of await this.buttons()) {
      if (await HarnessPredicate.stringMatches(await button.text(), text)) {
        await button.click();
        return;
      }
    }
    throw new Error(`Neural UI toggle option was not found: ${String(text)}`);
  }
  async isDisabled(): Promise<boolean> {
    const group = await this.locatorFor('.neu-toggle-group')();
    return (await group.getAttribute('aria-disabled')) === 'true';
  }
}

export class NeuUploaderHarness extends ComponentHarness {
  static hostSelector = 'neu-uploader';
  async getFileNames(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-uploader__item-name')()).map((name) => name.text()),
    );
  }
  async getError(): Promise<string | null> {
    const error = await this.locatorForOptional('.neu-uploader__error')();
    return error ? error.text() : null;
  }
  async openFilePicker(): Promise<void> {
    const trigger = await this.locatorForOptional('.neu-uploader__picker-trigger')();
    if (!trigger) throw new Error('Neural UI uploader picker action is missing.');
    await trigger.click();
  }
  async removeFile(index: number): Promise<void> {
    const buttons = await this.locatorForAll('.neu-uploader__remove')();
    if (!buttons[index]) throw new Error(`Neural UI uploader file ${index} does not exist.`);
    await buttons[index].click();
  }
  async isDisabled(): Promise<boolean> {
    const input = await this.locatorFor('.neu-uploader__native-input')();
    return input.getProperty<boolean>('disabled');
  }
}

export class NeuStepperHarness extends ComponentHarness {
  static hostSelector = 'neu-stepper';
  private readonly steps = this.locatorForAll('.neu-stepper__step-btn');
  async getSteps(): Promise<string[]> {
    return Promise.all((await this.steps()).map((step) => step.text()));
  }
  async getActiveStepIndex(): Promise<number> {
    const containers = await this.locatorForAll('.neu-stepper__step')();
    const states = await Promise.all(
      containers.map((step) => step.hasClass('neu-stepper__step--active')),
    );
    return states.findIndex(Boolean);
  }
  async selectStep(index: number): Promise<void> {
    const steps = await this.steps();
    if (!steps[index]) throw new Error(`Neural UI step ${index} does not exist.`);
    await steps[index].click();
  }
}

export class NeuInputMaskHarness extends ComponentHarness {
  static hostSelector = 'neu-input-mask';
  private readonly field = this.locatorFor('input.neu-input-mask__control');
  async getValue(): Promise<string> {
    return (await this.field()).getProperty<string>('value');
  }
  async setValue(value: string): Promise<void> {
    await (await this.field()).setInputValue(value);
  }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional('.neu-input-mask__label')();
    return label ? label.text() : null;
  }
  async isDisabled(): Promise<boolean> {
    return (await this.field()).getProperty<boolean>('disabled');
  }
}

export class NeuInputOtpHarness extends ComponentHarness {
  static hostSelector = 'neu-input-otp';
  private readonly cells = this.locatorForAll('input.neu-input-otp__cell');
  async getLength(): Promise<number> {
    return (await this.cells()).length;
  }
  async getValue(): Promise<string> {
    return (
      await Promise.all((await this.cells()).map((cell) => cell.getProperty<string>('value')))
    ).join('');
  }
  async setCell(index: number, value: string): Promise<void> {
    const cells = await this.cells();
    if (!cells[index]) throw new Error(`Neural UI OTP cell ${index} does not exist.`);
    await cells[index].setInputValue(value);
  }
  async isDisabled(): Promise<boolean> {
    const cells = await this.cells();
    return cells.length > 0 && (await cells[0].getProperty<boolean>('disabled'));
  }
}

export class NeuInlineEditorHarness extends ComponentHarness {
  static hostSelector = 'neu-inline-editor';
  async isEditing(): Promise<boolean> {
    return Boolean(await this.locatorForOptional('.neu-inline-editor__edit')());
  }
  async getDisplayValue(): Promise<string | null> {
    const value = await this.locatorForOptional('.neu-inline-editor__value')();
    return value ? value.text() : null;
  }
  async beginEdit(): Promise<void> {
    const display = await this.locatorForOptional('.neu-inline-editor__display')();
    if (!display) throw new Error('Neural UI inline editor is already editing.');
    await display.click();
  }
  async save(): Promise<void> {
    const actions = await this.locatorForAll('.neu-inline-editor__actions button')();
    if (!actions[0]) throw new Error('Neural UI inline editor save action is unavailable.');
    await actions[0].click();
  }
  async cancel(): Promise<void> {
    const actions = await this.locatorForAll('.neu-inline-editor__actions button')();
    if (!actions[1]) throw new Error('Neural UI inline editor cancel action is unavailable.');
    await actions[1].click();
  }
}

export class NeuKnobHarness extends ComponentHarness {
  static hostSelector = 'neu-knob';
  private readonly dial = this.locatorFor('.neu-knob__dial');
  async getValue(): Promise<number> {
    return Number(await (await this.dial()).getAttribute('aria-valuenow'));
  }
  async getMinimum(): Promise<number> {
    return Number(await (await this.dial()).getAttribute('aria-valuemin'));
  }
  async getMaximum(): Promise<number> {
    return Number(await (await this.dial()).getAttribute('aria-valuemax'));
  }
  async increment(): Promise<void> {
    await (await this.dial()).sendKeys(TestKey.UP_ARROW);
  }
  async decrement(): Promise<void> {
    await (await this.dial()).sendKeys(TestKey.DOWN_ARROW);
  }
  async isDisabled(): Promise<boolean> {
    return (await this.dial()).getAttribute('aria-disabled').then((value) => value === 'true');
  }
}

export class NeuMenuHarness extends ComponentHarness {
  static hostSelector = 'neu-menu';
  private readonly items = this.locatorForAll('.neu-menu__item');
  async getItems(): Promise<string[]> {
    return Promise.all((await this.items()).map((item) => item.text()));
  }
  async clickItem(text: string | RegExp): Promise<void> {
    for (const item of await this.items()) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI menu item was not found: ${String(text)}`);
  }
}

export class NeuNavHarness extends ComponentHarness {
  static hostSelector = 'neu-nav';
  private readonly items = this.locatorForAll('.neu-nav__item');
  async getItems(): Promise<string[]> {
    return Promise.all((await this.items()).map((item) => item.text()));
  }
  async clickItem(text: string | RegExp): Promise<void> {
    for (const item of await this.items()) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI navigation item was not found: ${String(text)}`);
  }
  async isCollapsed(): Promise<boolean> {
    return (await this.locatorFor('.neu-nav-wrapper')()).hasClass('neu-nav-wrapper--collapsed');
  }
  async toggleCollapsed(): Promise<void> {
    await (await this.locatorFor('.neu-nav__toggle-tab')()).click();
  }
}

export class NeuPickListHarness extends ComponentHarness {
  static hostSelector = 'neu-pick-list';
  async getSourceItems(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-pick-list__column:first-of-type button')()).map((item) =>
        item.text(),
      ),
    );
  }
  async getTargetItems(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-pick-list__column:last-of-type button')()).map((item) =>
        item.text(),
      ),
    );
  }
  async selectSourceItem(text: string | RegExp): Promise<void> {
    const items = await this.locatorForAll('.neu-pick-list__column:first-of-type button')();
    for (const item of items) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI pick-list source item was not found: ${String(text)}`);
  }
  async moveSelectedToTarget(): Promise<void> {
    const actions = await this.locatorForAll('.neu-pick-list__actions button')();
    if (!actions[0]) throw new Error('Neural UI pick-list target action is missing.');
    await actions[0].click();
  }
  async moveSelectedToSource(): Promise<void> {
    const actions = await this.locatorForAll('.neu-pick-list__actions button')();
    if (!actions[1]) throw new Error('Neural UI pick-list source action is missing.');
    await actions[1].click();
  }
}

export class NeuRichTextEditorHarness extends ComponentHarness {
  static hostSelector = 'neu-rich-text-editor';
  private readonly surface = this.locatorFor('.neu-rich-text-editor__surface');
  async getHtml(): Promise<string> {
    return (await this.surface()).getProperty<string>('innerHTML');
  }
  async setText(value: string): Promise<void> {
    await (await this.surface()).setContenteditableValue(value);
  }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional('.neu-rich-text-editor__label')();
    return label ? label.text() : null;
  }
  async getToolbarActions(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-rich-text-editor__toolbar button')()).map(
        async (button) => (await button.getAttribute('aria-label')) ?? (await button.text()),
      ),
    );
  }
  async isDisabled(): Promise<boolean> {
    return (await this.surface())
      .getAttribute('contenteditable')
      .then((value) => value === 'false');
  }
}

export class NeuSplitButtonHarness extends ComponentHarness {
  static hostSelector = 'neu-split-button';
  private readonly main = this.locatorFor('.neu-split-button__main');
  private readonly trigger = this.locatorFor('.neu-split-button__chevron');
  async getLabel(): Promise<string> {
    return (await this.main()).text();
  }
  async clickPrimary(): Promise<void> {
    await (await this.main()).click();
  }
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getActions(): Promise<string[]> {
    return Promise.all(
      (
        await this.documentRootLocatorFactory().locatorForAll('.neu-split-button__dropdown-item')()
      ).map((item) => item.text()),
    );
  }
  async clickAction(text: string | RegExp): Promise<void> {
    await this.open();
    const items = await this.documentRootLocatorFactory().locatorForAll(
      '.neu-split-button__dropdown-item',
    )();
    for (const item of items) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI split-button action was not found: ${String(text)}`);
  }
}

export class NeuSplitterHarness extends ComponentHarness {
  static hostSelector = 'neu-splitter';
  private readonly handles = this.locatorForAll('.neu-splitter__handle');
  async getPaneCount(): Promise<number> {
    return (await this.locatorForAll('.neu-splitter__pane')()).length;
  }
  async getHandleValues(): Promise<number[]> {
    return Promise.all(
      (await this.handles()).map(async (handle) =>
        Number(await handle.getAttribute('aria-valuenow')),
      ),
    );
  }
  async moveHandle(index: number, direction: 'decrease' | 'increase'): Promise<void> {
    const handles = await this.handles();
    if (!handles[index]) throw new Error(`Neural UI splitter handle ${index} does not exist.`);
    await handles[index].sendKeys(
      direction === 'increase' ? TestKey.RIGHT_ARROW : TestKey.LEFT_ARROW,
    );
  }
}

export class NeuAlertHarness extends ComponentHarness {
  static hostSelector = 'neu-alert';
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-alert__title')();
    return title ? title.text() : null;
  }
  async getMessage(): Promise<string | null> {
    const message = await this.locatorForOptional('.neu-alert__content')();
    return message ? message.text() : null;
  }
  async isDismissed(): Promise<boolean> {
    return !(await this.locatorForOptional('.neu-alert__body')());
  }
  async dismiss(): Promise<void> {
    const close = await this.locatorForOptional('.neu-alert__close')();
    if (!close) throw new Error('Neural UI alert is not closable.');
    await close.click();
  }
}

export class NeuBottomSheetHarness extends ComponentHarness {
  static hostSelector = 'neu-bottom-sheet';
  async isOpen(): Promise<boolean> {
    return Boolean(await this.locatorForOptional('.neu-bottom-sheet')());
  }
  async getBodyText(): Promise<string | null> {
    const body = await this.locatorForOptional('.neu-bottom-sheet__body')();
    return body ? body.text() : null;
  }
  async close(): Promise<void> {
    const close = await this.locatorForOptional('.neu-bottom-sheet__close')();
    if (!close) throw new Error('Neural UI bottom sheet close action is unavailable.');
    await close.click();
  }
}

export class NeuBreadcrumbHarness extends ComponentHarness {
  static hostSelector = 'neu-breadcrumb';
  async getItems(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-breadcrumb__item')()).map((item) => item.text()),
    );
  }
  async getCurrentItem(): Promise<string | null> {
    const current = await this.locatorForOptional('.neu-breadcrumb__current')();
    return current ? current.text() : null;
  }
  async followItem(text: string | RegExp): Promise<void> {
    for (const link of await this.locatorForAll('.neu-breadcrumb__link')()) {
      if (await HarnessPredicate.stringMatches(await link.text(), text)) {
        await link.click();
        return;
      }
    }
    throw new Error(`Neural UI breadcrumb item was not found: ${String(text)}`);
  }
}

export class NeuCalendarHarness extends ComponentHarness {
  static hostSelector = 'neu-calendar';
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-calendar__title')();
    return title ? title.text() : null;
  }
  async goToPreviousPeriod(): Promise<void> {
    const buttons = await this.locatorForAll('.neu-calendar__nav-btn')();
    if (!buttons[0]) throw new Error('Neural UI calendar previous navigation is missing.');
    await buttons[0].click();
  }
  async goToNextPeriod(): Promise<void> {
    const buttons = await this.locatorForAll('.neu-calendar__nav-btn')();
    if (!buttons[1]) throw new Error('Neural UI calendar next navigation is missing.');
    await buttons[1].click();
  }
  async goToToday(): Promise<void> {
    await (await this.locatorFor('.neu-calendar__today')()).click();
  }
  async selectDay(day: number): Promise<void> {
    for (const button of await this.locatorForAll('.neu-calendar__day-select')()) {
      if (Number((await button.text()).trim()) === day) {
        await button.click();
        return;
      }
    }
    throw new Error(`Neural UI calendar day ${day} was not found.`);
  }
  async getEvents(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-calendar__event')()).map((event) => event.text()),
    );
  }
}

export class NeuConfirmDialogHarness extends ComponentHarness {
  static hostSelector = 'neu-confirm-dialog';
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-confirm-dialog__title')();
    return title ? title.text() : null;
  }
  async getMessage(): Promise<string> {
    return (await this.locatorFor('.neu-confirm-dialog__message')()).text();
  }
  async accept(): Promise<void> {
    await (
      await this.locatorFor(
        '.neu-confirm-dialog__actions .neu-confirm-dialog__btn:not(.neu-confirm-dialog__btn--reject)',
      )()
    ).click();
  }
  async reject(): Promise<void> {
    await (await this.locatorFor('.neu-confirm-dialog__btn--reject')()).click();
  }
}

export class NeuConfirmPopupHarness extends ComponentHarness {
  static hostSelector = 'neu-confirm-popup';
  async isOpen(): Promise<boolean> {
    return Boolean(await this.locatorForOptional('.neu-confirm-popup[role="alertdialog"]')());
  }
  async getMessage(): Promise<string | null> {
    const message = await this.locatorForOptional('.neu-confirm-popup p')();
    return message ? message.text() : null;
  }
  async accept(): Promise<void> {
    await (await this.locatorFor('.neu-confirm-popup__accept')()).click();
  }
  async reject(): Promise<void> {
    await (await this.locatorFor('.neu-confirm-popup__reject')()).click();
  }
}

export class NeuToastHarness extends ComponentHarness {
  static hostSelector = 'neu-toast-container';
  async getMessages(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-toast__message')()).map((message) => message.text()),
    );
  }
  async getTitles(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-toast__title')()).map((title) => title.text()),
    );
  }
  async dismiss(index: number): Promise<void> {
    const buttons = await this.locatorForAll('.neu-toast__close')();
    if (!buttons[index]) throw new Error(`Neural UI toast ${index} does not exist.`);
    await buttons[index].click();
  }
}

export class NeuTooltipHarness extends ComponentHarness {
  static hostSelector = '[neuTooltip]';
  async show(): Promise<void> {
    await (await this.host()).focus();
  }
  async hide(): Promise<void> {
    await (await this.host()).blur();
  }
  async getText(): Promise<string | null> {
    const tooltip =
      await this.documentRootLocatorFactory().locatorForOptional('.neu-tooltip__text')();
    return tooltip ? tooltip.text() : null;
  }
  async getDescriptionId(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-describedby');
  }
}

export class NeuContextMenuHarness extends ComponentHarness {
  static hostSelector = '[neuContextMenu]';
  async open(): Promise<void> {
    await (await this.host()).rightClick(1, 1);
  }
  async getItems(): Promise<string[]> {
    return Promise.all(
      (await this.documentRootLocatorFactory().locatorForAll('.neu-context-menu__item')()).map(
        (item) => item.text(),
      ),
    );
  }
  async clickItem(text: string | RegExp): Promise<void> {
    for (const item of await this.documentRootLocatorFactory().locatorForAll(
      '.neu-context-menu__item',
    )()) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI context-menu item was not found: ${String(text)}`);
  }
}

export class NeuDataViewHarness extends ComponentHarness {
  static hostSelector = 'neu-data-view';
  async getItemCount(): Promise<number> {
    return (await this.locatorForAll('.neu-data-view__item')()).length;
  }
  async setSearch(value: string): Promise<void> {
    await (await this.locatorFor('.neu-data-view__search input')()).setInputValue(value);
  }
  async getModes(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-data-view__mode')()).map(
        async (mode) => (await mode.getAttribute('aria-label')) ?? (await mode.text()),
      ),
    );
  }
  async selectMode(text: string | RegExp): Promise<void> {
    for (const mode of await this.locatorForAll('.neu-data-view__mode')()) {
      const label = (await mode.getAttribute('aria-label')) ?? (await mode.text());
      if (await HarnessPredicate.stringMatches(label, text)) {
        await mode.click();
        return;
      }
    }
    throw new Error(`Neural UI data-view mode was not found: ${String(text)}`);
  }
}

export class NeuFilterBarHarness extends ComponentHarness {
  static hostSelector = 'neu-filter-bar';
  private readonly filters = this.locatorForAll('.neu-filter-bar__chip');
  async getFilters(): Promise<string[]> {
    return Promise.all((await this.filters()).map((filter) => filter.text()));
  }
  async getActiveFilters(): Promise<string[]> {
    const filters = await this.filters();
    const states = await Promise.all(
      filters.map(async (filter) => ({
        filter,
        active: await filter.hasClass('neu-filter-bar__chip--active'),
      })),
    );
    return Promise.all(states.filter((item) => item.active).map((item) => item.filter.text()));
  }
  async toggleFilter(text: string | RegExp): Promise<void> {
    for (const filter of await this.filters()) {
      if (await HarnessPredicate.stringMatches(await filter.text(), text)) {
        await filter.click();
        return;
      }
    }
    throw new Error(`Neural UI filter was not found: ${String(text)}`);
  }
  async clear(): Promise<void> {
    await (await this.locatorFor('.neu-filter-bar__clear')()).click();
  }
}

export class NeuImageGalleryHarness extends ComponentHarness {
  static hostSelector = 'neu-image-gallery';
  async getCounter(): Promise<string | null> {
    const counter = await this.locatorForOptional('.neu-image-gallery__counter')();
    return counter ? counter.text() : null;
  }
  async getCaption(): Promise<string | null> {
    const caption = await this.locatorForOptional('.neu-image-gallery__caption')();
    return caption ? caption.text() : null;
  }
  async previous(): Promise<void> {
    await (await this.locatorFor('.neu-image-gallery__nav--prev')()).click();
  }
  async next(): Promise<void> {
    await (await this.locatorFor('.neu-image-gallery__nav--next')()).click();
  }
  async selectThumbnail(index: number): Promise<void> {
    const thumbnails = await this.locatorForAll('.neu-image-gallery__thumb')();
    if (!thumbnails[index]) throw new Error(`Neural UI gallery thumbnail ${index} does not exist.`);
    await thumbnails[index].click();
  }
  async openViewer(): Promise<void> {
    await (await this.locatorFor('.neu-image-gallery__viewer-trigger')()).click();
  }
}

export class NeuImageViewerHarness extends ComponentHarness {
  static hostSelector = '[neuImageViewer]';
  async open(): Promise<void> {
    await (await this.host()).click();
  }
  async getCounter(): Promise<string | null> {
    const counter =
      await this.documentRootLocatorFactory().locatorForOptional('.neu-iv__counter')();
    return counter ? counter.text() : null;
  }
  async zoomIn(): Promise<void> {
    await this.clickToolbarAction('Zoom in');
  }
  async zoomOut(): Promise<void> {
    await this.clickToolbarAction('Zoom out');
  }
  async resetZoom(): Promise<void> {
    await this.clickToolbarAction('Reset zoom');
  }
  async previous(): Promise<void> {
    await (await this.documentRootLocatorFactory().locatorFor('.neu-iv__arrow--prev')()).click();
  }
  async next(): Promise<void> {
    await (await this.documentRootLocatorFactory().locatorFor('.neu-iv__arrow--next')()).click();
  }
  async close(): Promise<void> {
    await (await this.documentRootLocatorFactory().locatorFor('.neu-iv__btn--close')()).click();
  }
  private async clickToolbarAction(label: string): Promise<void> {
    await (
      await this.documentRootLocatorFactory().locatorFor(`.neu-iv__btn[aria-label="${label}"]`)()
    ).click();
  }
}

export class NeuNotificationCenterHarness extends ComponentHarness {
  static hostSelector = 'neu-notification-center';
  private readonly trigger = this.locatorFor('.neu-nc__bell');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getNotifications(): Promise<string[]> {
    return Promise.all((await this.locatorForAll('.neu-nc__item')()).map((item) => item.text()));
  }
  async dismiss(index: number): Promise<void> {
    const buttons = await this.locatorForAll('.neu-nc__item-close')();
    if (!buttons[index]) throw new Error(`Neural UI notification ${index} does not exist.`);
    await buttons[index].click();
  }
  async markAllRead(): Promise<void> {
    const actions = await this.locatorForAll('.neu-nc__action-btn')();
    if (actions[0]) await actions[0].click();
  }
  async clearAll(): Promise<void> {
    const actions = await this.locatorForAll('.neu-nc__action-btn')();
    if (actions[1]) await actions[1].click();
  }
}

export class NeuPopoverHarness extends ComponentHarness {
  static hostSelector = '[neuPopover]';
  async toggle(): Promise<void> {
    await (await this.host()).click();
  }
  async getText(): Promise<string | null> {
    const content =
      await this.documentRootLocatorFactory().locatorForOptional('.neu-popover__inner')();
    return content ? content.text() : null;
  }
}

export class NeuSidebarHarness extends ComponentHarness {
  static hostSelector = 'neu-sidebar';
  async isOpen(): Promise<boolean> {
    return (await this.locatorFor('.neu-sidebar')()).hasClass('neu-sidebar--open');
  }
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-sidebar__title')();
    return title ? title.text() : null;
  }
  async getContentText(): Promise<string> {
    return (await this.locatorFor('.neu-sidebar__content')()).text();
  }
  async close(): Promise<void> {
    await (await this.locatorFor('.neu-sidebar__close')()).click();
  }
}

export class NeuDashboardGridHarness extends ComponentHarness {
  static hostSelector = 'neu-dashboard-grid';
  async getTileTitles(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-dg__tile-title')()).map((title) => title.text()),
    );
  }
  async getTileCount(): Promise<number> {
    return (await this.locatorForAll('.neu-dg__tile')()).length;
  }
  async focusTile(index: number): Promise<void> {
    const tiles = await this.locatorForAll('.neu-dg__tile-content')();
    if (!tiles[index]) throw new Error(`Neural UI dashboard tile ${index} does not exist.`);
    await tiles[index].focus();
  }
}

export class NeuKanbanHarness extends ComponentHarness {
  static hostSelector = 'neu-kanban';
  async getColumns(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-kanban__column-name')()).map((column) => column.text()),
    );
  }
  async getCards(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-kanban__title')()).map((card) => card.text()),
    );
  }
  async getCardCount(): Promise<number> {
    return (await this.locatorForAll('.neu-kanban__card')()).length;
  }
}

export class NeuSchedulerGanttHarness extends ComponentHarness {
  static hostSelector = 'neu-scheduler-gantt';
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-scheduler-gantt__title')();
    return title ? title.text() : null;
  }
  async getRange(): Promise<string | null> {
    const range = await this.locatorForOptional('.neu-scheduler-gantt__range')();
    return range ? range.text() : null;
  }
  async getTasks(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-timeline-grid__item')()).map((task) => task.text()),
    );
  }
  async clickTask(text: string | RegExp): Promise<void> {
    for (const task of await this.locatorForAll('.neu-timeline-grid__item')()) {
      if (await HarnessPredicate.stringMatches(await task.text(), text)) {
        await task.click();
        return;
      }
    }
    throw new Error(`Neural UI scheduler task was not found: ${String(text)}`);
  }
}

export class NeuTabsHarness extends ComponentHarness {
  static hostSelector = 'neu-tabs';
  private readonly tabs = this.locatorForAll('.neu-tabs__tab');
  async getTabs(): Promise<string[]> {
    return Promise.all((await this.tabs()).map((tab) => tab.text()));
  }
  async getActiveTab(): Promise<string | null> {
    for (const tab of await this.tabs()) {
      if (await tab.hasClass('neu-tabs__tab--active')) return tab.text();
    }
    return null;
  }
  async selectTab(text: string | RegExp): Promise<void> {
    for (const tab of await this.tabs()) {
      if (await HarnessPredicate.stringMatches(await tab.text(), text)) {
        await tab.click();
        return;
      }
    }
    throw new Error(`Neural UI tab was not found: ${String(text)}`);
  }
}

export class NeuTimelineGridHarness extends ComponentHarness {
  static hostSelector = 'neu-timeline-grid';
  async getRows(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-timeline-grid__row')()).map(
        async (row) => (await row.getAttribute('aria-label')) ?? '',
      ),
    );
  }
  async getItems(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-timeline-grid__item')()).map((item) => item.text()),
    );
  }
  async selectItem(text: string | RegExp): Promise<void> {
    for (const item of await this.locatorForAll('.neu-timeline-grid__item')()) {
      if (await HarnessPredicate.stringMatches(await item.text(), text)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Neural UI timeline item was not found: ${String(text)}`);
  }
  async selectEmptySlot(index: number): Promise<void> {
    const slots = await this.locatorForAll('.neu-timeline-grid__slot-button')();
    if (!slots[index]) throw new Error(`Neural UI timeline slot ${index} does not exist.`);
    await slots[index].click();
  }
}

export class NeuTreeHarness extends ComponentHarness {
  static hostSelector = 'neu-tree';
  async getNodes(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-tree__label')()).map((label) => label.text()),
    );
  }
  async setSearch(value: string): Promise<void> {
    const search = await this.locatorForOptional('.neu-tree__search-input')();
    if (!search) throw new Error('Neural UI tree search is not enabled.');
    await search.setInputValue(value);
  }
  async selectNode(text: string | RegExp): Promise<void> {
    const labels = await this.locatorForAll('.neu-tree__label')();
    for (const label of labels) {
      if (await HarnessPredicate.stringMatches(await label.text(), text)) {
        await label.click();
        return;
      }
    }
    throw new Error(`Neural UI tree node was not found: ${String(text)}`);
  }
  async toggleNode(index: number): Promise<void> {
    const toggles = await this.locatorForAll(
      '.neu-tree__toggle:not(.neu-tree__toggle--placeholder)',
    )();
    if (!toggles[index]) throw new Error(`Neural UI tree toggle ${index} does not exist.`);
    await toggles[index].click();
  }
}

export class NeuTreeTableHarness extends ComponentHarness {
  static hostSelector = 'neu-tree-table';
  async getRows(): Promise<string[]> {
    return Promise.all((await this.locatorForAll('tbody tr')()).map((row) => row.text()));
  }
  async getLabels(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('.neu-tree-table__label')()).map((label) => label.text()),
    );
  }
  async toggleRow(index: number): Promise<void> {
    const toggles = await this.locatorForAll(
      '.neu-tree-table__toggle:not(.neu-tree-table__toggle--placeholder)',
    )();
    if (!toggles[index]) throw new Error(`Neural UI tree-table toggle ${index} does not exist.`);
    await toggles[index].click();
  }
}

export class NeuVirtualListHarness extends ComponentHarness {
  static hostSelector = 'neu-virtual-list';
  async getRenderedItems(): Promise<string[]> {
    return Promise.all(
      (await this.locatorForAll('neu-virtual-list-row')()).map((row) => row.text()),
    );
  }
  async getRenderedItemCount(): Promise<number> {
    return (await this.locatorForAll('neu-virtual-list-row')()).length;
  }
  async getEmptyText(): Promise<string | null> {
    const empty = await this.locatorForOptional('.neu-virtual-list__empty')();
    return empty ? empty.text() : null;
  }
  async focusViewport(): Promise<void> {
    await (await this.locatorFor('.neu-virtual-list__viewport')()).focus();
  }
}

export class NeuCheckboxHarness extends ComponentHarness {
  static hostSelector = 'neu-checkbox';
  private readonly control = this.locatorFor('input.neu-checkbox__input');
  async isChecked(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('checked');
  }
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }
  async toggle(): Promise<void> {
    await (await this.control()).click();
  }
  async getLabel(): Promise<string> {
    return (await this.locatorFor('.neu-checkbox__label')()).text();
  }
}

export class NeuSwitchHarness extends ComponentHarness {
  static hostSelector = 'neu-switch';
  private readonly control = this.locatorFor('input.neu-switch__input');
  async isChecked(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('checked');
  }
  async isDisabled(): Promise<boolean> {
    return (await this.control()).getProperty<boolean>('disabled');
  }
  async toggle(): Promise<void> {
    await (await this.control()).click();
  }
  async getLabel(): Promise<string> {
    return (await this.locatorFor('.neu-switch__label')()).text();
  }
}

export class NeuSelectHarness extends ComponentHarness {
  static hostSelector = 'neu-select';
  private readonly trigger = this.locatorFor('.neu-select__trigger');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getValueText(): Promise<string> {
    return (await this.locatorFor('.neu-select__value')()).text();
  }
  async getOptions(): Promise<string[]> {
    return Promise.all(
      (await this.documentRootLocatorFactory().locatorForAll('.neu-select__option')()).map(
        (option) => option.text(),
      ),
    );
  }
  async selectOption(text: string | RegExp): Promise<void> {
    await this.open();
    const options = await this.documentRootLocatorFactory().locatorForAll('.neu-select__option')();
    for (const option of options) {
      if (await HarnessPredicate.stringMatches(await option.text(), text)) {
        await option.click();
        return;
      }
    }
    throw new Error(`Neural UI select option was not found: ${String(text)}`);
  }
}

export class NeuDateInputHarness extends ComponentHarness {
  static hostSelector = 'neu-date-input';
  private readonly trigger = this.locatorFor('.neu-date-input__trigger, .neu-drp__trigger');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getDisplayValue(): Promise<string> {
    return (await this.trigger()).text();
  }
  async selectDay(day: number): Promise<void> {
    await this.open();
    const days = await this.documentRootLocatorFactory().locatorForAll(
      '.neu-date-input__cal-day:not(:disabled), .neu-drp__cell:not(:disabled)',
    )();
    for (const cell of days) {
      if ((await cell.text()).trim() === String(day)) {
        await cell.click();
        return;
      }
    }
    throw new Error(`Selectable Neural UI calendar day was not found: ${day}`);
  }
}

export class NeuTableHarness extends ComponentHarness {
  static hostSelector = 'neu-table';
  private readonly rows = this.locatorForAll(NeuTableRowHarness);
  async getRowCount(): Promise<number> {
    return (await this.rows()).length;
  }
  async getHeaderTexts(): Promise<string[]> {
    return Promise.all((await this.locatorForAll('thead th')()).map((cell) => cell.text()));
  }
  async getCellText(row: number, column: number): Promise<string> {
    const rows = await this.rows();
    if (!rows[row]) throw new Error(`Neural UI table row ${row} does not exist.`);
    const cells = await rows[row].getCells();
    if (!cells[column]) throw new Error(`Neural UI table column ${column} does not exist.`);
    return cells[column].getText();
  }
}

class NeuTableRowHarness extends ComponentHarness {
  static hostSelector = 'tbody tr';
  private readonly cells = this.locatorForAll(CellHarness);
  getCells(): Promise<CellHarness[]> {
    return this.cells();
  }
}

class CellHarness extends ComponentHarness {
  static hostSelector = 'td';
  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}

export class NeuDialogHarness extends ComponentHarness {
  static hostSelector = 'neu-dialog';
  async isOpen(): Promise<boolean> {
    return Boolean(await this.locatorForOptional('.neu-dialog__panel')());
  }
  async getTitle(): Promise<string | null> {
    const title = await this.locatorForOptional('.neu-dialog__title')();
    return title ? title.text() : null;
  }
  async getBodyText(): Promise<string | null> {
    const body = await this.locatorForOptional('.neu-dialog__body')();
    return body ? body.text() : null;
  }
  async close(): Promise<void> {
    const close = await this.locatorForOptional('.neu-dialog__close')();
    if (close) await close.click();
  }
}
