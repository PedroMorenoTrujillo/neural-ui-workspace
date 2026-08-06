import { BaseHarnessFilters, ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';

export interface NeuTextHarnessFilters extends BaseHarnessFilters {
  text?: string | RegExp;
}

export class NeuButtonHarness extends ComponentHarness {
  static hostSelector = 'button[neu-button]';
  static with(options: NeuTextHarnessFilters = {}): HarnessPredicate<NeuButtonHarness> {
    return new HarnessPredicate(NeuButtonHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }
  async getText(): Promise<string> { return (await this.host()).text(); }
  async isDisabled(): Promise<boolean> { return (await this.host()).getAttribute('disabled').then((value) => value !== null); }
  async isLoading(): Promise<boolean> { return (await this.host()).getAttribute('aria-busy').then((value) => value === 'true'); }
  async click(): Promise<void> { await (await this.host()).click(); }
  async focus(): Promise<void> { await (await this.host()).focus(); }
}

export class NeuInputHarness extends ComponentHarness {
  static hostSelector = 'neu-input';
  private readonly field = this.locatorFor('input.neu-input__field');
  private readonly error = this.locatorForOptional('.neu-input__error');
  async getValue(): Promise<string> { return (await this.field()).getProperty<string>('value'); }
  async setValue(value: string): Promise<void> { await (await this.field()).setInputValue(value); }
  async getLabel(): Promise<string | null> {
    const label = await this.locatorForOptional('.neu-input__static-label, .neu-input__label')();
    return label ? label.text() : null;
  }
  async getError(): Promise<string | null> { const node = await this.error(); return node ? node.text() : null; }
  async isDisabled(): Promise<boolean> { return (await this.field()).getAttribute('disabled').then((value) => value !== null); }
  async focus(): Promise<void> { await (await this.field()).focus(); }
  async blur(): Promise<void> { await (await this.field()).blur(); }
}

export class NeuCheckboxHarness extends ComponentHarness {
  static hostSelector = 'neu-checkbox';
  private readonly control = this.locatorFor('input.neu-checkbox__input');
  async isChecked(): Promise<boolean> { return (await this.control()).getProperty<boolean>('checked'); }
  async isDisabled(): Promise<boolean> { return (await this.control()).getProperty<boolean>('disabled'); }
  async toggle(): Promise<void> { await (await this.control()).click(); }
  async getLabel(): Promise<string> { return (await this.locatorFor('.neu-checkbox__label')()).text(); }
}

export class NeuSwitchHarness extends ComponentHarness {
  static hostSelector = 'neu-switch';
  private readonly control = this.locatorFor('input.neu-switch__input');
  async isChecked(): Promise<boolean> { return (await this.control()).getProperty<boolean>('checked'); }
  async isDisabled(): Promise<boolean> { return (await this.control()).getProperty<boolean>('disabled'); }
  async toggle(): Promise<void> { await (await this.control()).click(); }
  async getLabel(): Promise<string> { return (await this.locatorFor('.neu-switch__label')()).text(); }
}

export class NeuSelectHarness extends ComponentHarness {
  static hostSelector = 'neu-select';
  private readonly trigger = this.locatorFor('.neu-select__trigger');
  async open(): Promise<void> { if (!(await this.isOpen())) await (await this.trigger()).click(); }
  async close(): Promise<void> { if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE); }
  async isOpen(): Promise<boolean> { return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true'); }
  async getValueText(): Promise<string> { return (await this.locatorFor('.neu-select__value')()).text(); }
  async getOptions(): Promise<string[]> {
    return Promise.all((await this.documentRootLocatorFactory().locatorForAll('.neu-select__option')()).map((option) => option.text()));
  }
  async selectOption(text: string | RegExp): Promise<void> {
    await this.open();
    const options = await this.documentRootLocatorFactory().locatorForAll('.neu-select__option')();
    for (const option of options) {
      if (await HarnessPredicate.stringMatches(await option.text(), text)) { await option.click(); return; }
    }
    throw new Error(`Neural UI select option was not found: ${String(text)}`);
  }
}

export class NeuDateInputHarness extends ComponentHarness {
  static hostSelector = 'neu-date-input';
  private readonly trigger = this.locatorFor('.neu-date-input__trigger, .neu-drp__trigger');
  async open(): Promise<void> { if (!(await this.isOpen())) await (await this.trigger()).click(); }
  async close(): Promise<void> { if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE); }
  async isOpen(): Promise<boolean> { return (await this.trigger()).getAttribute('aria-expanded').then((value) => value === 'true'); }
  async getDisplayValue(): Promise<string> { return (await this.trigger()).text(); }
  async selectDay(day: number): Promise<void> {
    await this.open();
    const days = await this.documentRootLocatorFactory().locatorForAll('.neu-date-input__cal-day:not(:disabled), .neu-drp__cell:not(:disabled)')();
    for (const cell of days) {
      if ((await cell.text()).trim() === String(day)) { await cell.click(); return; }
    }
    throw new Error(`Selectable Neural UI calendar day was not found: ${day}`);
  }
}

export class NeuTableHarness extends ComponentHarness {
  static hostSelector = 'neu-table';
  private readonly rows = this.locatorForAll(NeuTableRowHarness);
  async getRowCount(): Promise<number> { return (await this.rows()).length; }
  async getHeaderTexts(): Promise<string[]> { return Promise.all((await this.locatorForAll('thead th')()).map((cell) => cell.text())); }
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
  getCells(): Promise<CellHarness[]> { return this.cells(); }
}

class CellHarness extends ComponentHarness {
  static hostSelector = 'td';
  async getText(): Promise<string> { return (await this.host()).text(); }
}

export class NeuDialogHarness extends ComponentHarness {
  static hostSelector = 'neu-dialog';
  async isOpen(): Promise<boolean> { return Boolean(await this.locatorForOptional('.neu-dialog__panel')()); }
  async getTitle(): Promise<string | null> { const title = await this.locatorForOptional('.neu-dialog__title')(); return title ? title.text() : null; }
  async getBodyText(): Promise<string | null> { const body = await this.locatorForOptional('.neu-dialog__body')(); return body ? body.text() : null; }
  async close(): Promise<void> { const close = await this.locatorForOptional('.neu-dialog__close')(); if (close) await close.click(); }
}
