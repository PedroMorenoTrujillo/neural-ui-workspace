import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
  TestElement,
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
  private readonly field = this.locatorFor('.neu-date-input__field');
  private readonly openButton = this.locatorFor('.neu-date-input__open');
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.openButton()).click();
  }
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.field()).sendKeys(TestKey.ESCAPE);
  }
  async isOpen(): Promise<boolean> {
    return (await this.field()).getAttribute('aria-expanded').then((value) => value === 'true');
  }
  async getDisplayValue(): Promise<string> {
    return String(await (await this.field()).getProperty('value'));
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

export class NeuMenuHarness extends ComponentHarness {
  static hostSelector = 'neu-menu';
  private readonly items = this.locatorForAll('button[role="menuitem"]');

  async getItemTexts(): Promise<string[]> {
    return Promise.all((await this.items()).map((item) => this.itemText(item)));
  }

  async clickItem(text: string | RegExp): Promise<void> {
    const item = await findByText(await this.items(), (item) => this.itemText(item), text, 'menu item');
    await item.click();
  }

  private itemText(item: TestElement): Promise<string> {
    return item.text({ exclude: 'neu-badge, kbd, [aria-hidden="true"]' });
  }
}

export class NeuTabsHarness extends ComponentHarness {
  static hostSelector = 'neu-tabs';
  private readonly tabs = this.locatorForAll(':scope > .neu-tabs > [role="tablist"] > [role="tab"]');

  async getTabTexts(): Promise<string[]> {
    return Promise.all((await this.tabs()).map((tab) => this.tabText(tab)));
  }

  async getActiveTabText(): Promise<string | null> {
    for (const tab of await this.tabs()) {
      if ((await tab.getAttribute('aria-selected')) === 'true') return this.tabText(tab);
    }
    return null;
  }

  async selectTab(text: string | RegExp): Promise<void> {
    const tab = await findByText(await this.tabs(), (tab) => this.tabText(tab), text, 'tab');
    await tab.click();
  }

  private tabText(tab: TestElement): Promise<string> {
    return tab.text({ exclude: '.neu-tabs__tab-badge' });
  }
}

export class NeuTreeSelectHarness extends ComponentHarness {
  static hostSelector = 'neu-tree-select';
  private readonly trigger = this.locatorFor('[aria-haspopup="tree"]');

  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }

  async getValueText(): Promise<string> {
    return (await this.locatorFor('.neu-tree-select__value')()).text();
  }

  /** Gets the labels of the nodes currently rendered in this instance's overlay. */
  async getNodeTexts(): Promise<string[]> {
    return Promise.all((await this.nodes()).map((node) => this.nodeText(node)));
  }

  async selectNode(text: string | RegExp): Promise<void> {
    await this.open();
    const node = await findByText(await this.nodes(), (node) => this.nodeText(node), text, 'tree node');
    await node.click();
  }

  async setNodeExpanded(text: string | RegExp, expanded: boolean): Promise<void> {
    await this.open();
    const node = await findByText(await this.nodes(), (node) => this.nodeText(node), text, 'tree node');
    const current = await node.getAttribute('aria-expanded');
    if (current === null) throw new Error(`Neural UI tree node cannot expand: ${String(text)}`);
    if ((current === 'true') === expanded) return;

    const rtl = (await (await this.host()).getCssValue('direction')) === 'rtl';
    await node.sendKeys(expanded !== rtl ? TestKey.RIGHT_ARROW : TestKey.LEFT_ARROW);
  }

  private async nodes(): Promise<TestElement[]> {
    const treeId = await (await this.trigger()).getAttribute('aria-controls');
    return treeId
      ? this.documentRootLocatorFactory().locatorForAll(`#${treeId} [role="treeitem"]`)()
      : [];
  }

  private nodeText(node: TestElement): Promise<string> {
    return node.text({ exclude: '[aria-hidden="true"]' });
  }
}

export class NeuTreeTableHarness extends ComponentHarness {
  static hostSelector = 'neu-tree-table';
  private readonly rows = this.locatorForAll(TreeTableRowHarness);

  /** Counts currently rendered data rows, excluding structural and state rows. */
  async getRowCount(): Promise<number> {
    return (await this.rows()).length;
  }

  async getCellText(row: number, column: number): Promise<string> {
    return (await this.getRow(row)).getCellText(column);
  }

  async setRowExpanded(row: number, expanded: boolean): Promise<void> {
    await (await this.getRow(row)).setExpanded(expanded);
  }

  private async getRow(row: number): Promise<TreeTableRowHarness> {
    const selected = (await this.rows())[row];
    if (!selected) throw new Error(`Neural UI tree table row ${row} does not exist.`);
    return selected;
  }
}

class TreeTableRowHarness extends ComponentHarness {
  static hostSelector = '[role="treegrid"] > tbody > [role="row"][aria-level]';
  private readonly cells = this.locatorForAll('[role="gridcell"]');
  private readonly expander = this.locatorForOptional('button[aria-expanded]');

  async getCellText(column: number): Promise<string> {
    const cell = (await this.cells())[column];
    if (!cell) throw new Error(`Neural UI tree table column ${column} does not exist.`);
    return cell.text();
  }

  async setExpanded(expanded: boolean): Promise<void> {
    const current = await (await this.host()).getAttribute('aria-expanded');
    const button = await this.expander();
    if (current === null || !button) throw new Error('Neural UI tree table row cannot expand.');
    if ((current === 'true') !== expanded) await button.click();
  }
}

async function findByText(
  elements: readonly TestElement[],
  readText: (element: TestElement) => Promise<string>,
  text: string | RegExp,
  kind: string,
): Promise<TestElement> {
  for (const element of elements) {
    if (await HarnessPredicate.stringMatches(await readText(element), text)) return element;
  }
  throw new Error(`Neural UI ${kind} was not found: ${String(text)}`);
}
