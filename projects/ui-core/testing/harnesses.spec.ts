import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NeuButtonComponent } from '@neural-ui/core/button';
import { NeuInputComponent } from '@neural-ui/core/input';
import { NeuMenuComponent, type NeuMenuItem } from '@neural-ui/core/menu';
import { NeuTabPanelComponent, NeuTabsComponent } from '@neural-ui/core/tabs';
import { NeuTreeSelectComponent, type NeuTreeSelectNode } from '@neural-ui/core/tree-select';
import {
  NeuTreeTableComponent,
  type NeuTreeLoadedRelation,
  type NeuTreeTableColumn,
  type NeuTreeTableHierarchy,
} from '@neural-ui/core/tree-table';
import {
  NeuButtonHarness,
  NeuCheckboxHarness,
  NeuDateInputHarness,
  NeuDialogHarness,
  NeuInputHarness,
  NeuMenuHarness,
  NeuSelectHarness,
  NeuSwitchHarness,
  NeuTableHarness,
  NeuTabsHarness,
  NeuTreeSelectHarness,
  NeuTreeTableHarness,
} from './harnesses';

@Component({
  imports: [NeuButtonComponent, NeuInputComponent],
  template: `<button neu-button [loading]="true">Save</button><neu-input label="Name" />`,
})
class HarnessHostComponent {}

type ProjectRow = { id: string; name: string };

function loadedRelation(keys: readonly string[]): NeuTreeLoadedRelation<string> {
  return {
    status: 'loaded',
    keys,
    relationRevision: 1,
    appliedRequestId: null,
    total: keys.length,
    completeness: 'complete',
  };
}

@Component({
  imports: [
    NeuMenuComponent,
    NeuTabsComponent,
    NeuTabPanelComponent,
    NeuTreeSelectComponent,
    NeuTreeTableComponent,
  ],
  template: `
    <neu-menu [items]="actions" (itemClick)="lastAction = $event.key" />
    <neu-tabs [tabs]="tabs" initialActiveId="overview">
      <neu-tab-panel tabId="overview">
        <neu-tabs [tabs]="[{ id: 'nested', label: 'Nested' }]" initialActiveId="nested" />
      </neu-tab-panel>
    </neu-tabs>
    <neu-tree-select
      id="department"
      [style.direction]="direction"
      [nodes]="departments"
      [expandedKeys]="departmentsExpanded"
      (expandedKeysChange)="departmentsExpanded = $event"
    />
    <neu-tree-select id="location" [nodes]="[{ value: 'ny', label: 'New York' }]" />
    <neu-tree-table
      [data]="rows"
      [columns]="columns"
      [rowKey]="rowKey"
      [hierarchy]="hierarchy"
      [hierarchyOptions]="{ treeColumnId: 'name', indentSize: 16 }"
      [expandedKeys]="rowsExpanded"
      (expandedKeysChange)="rowsExpanded = $event.next"
    />
  `,
})
class CompositeHarnessHostComponent {
  readonly actions: NeuMenuItem[] = [
    { key: 'create', label: 'Create', badge: 4, shortcut: 'Ctrl+N' },
    { key: 'files', label: 'Files', children: [{ key: 'import', label: 'Import' }] },
  ];
  readonly tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity', badge: '2' },
  ];
  readonly departments: readonly NeuTreeSelectNode[] = [
    {
      value: 'engineering',
      label: 'Engineering',
      children: [{ value: 'platform', label: 'Platform' }],
    },
  ];
  readonly rows: readonly ProjectRow[] = [
    { id: 'root', name: 'Portfolio' },
    { id: 'child', name: 'Project' },
  ];
  readonly columns: readonly NeuTreeTableColumn<ProjectRow, 'name'>[] = [
    { id: 'name', field: 'name', header: 'Name' },
  ];
  readonly rowKey = (row: ProjectRow): string => row.id;
  readonly hierarchy: NeuTreeTableHierarchy<string> = {
    hierarchyRevision: 1,
    queryRevision: 0,
    roots: loadedRelation(['root']),
    children: [
      { parentKey: 'root', relation: loadedRelation(['child']) },
      { parentKey: 'child', relation: loadedRelation([]) },
    ],
  };
  direction = 'ltr';
  departmentsExpanded: readonly string[] = [];
  rowsExpanded: readonly string[] = [];
  lastAction: string | undefined;
}

describe('Composite Neural UI component harnesses', () => {
  function createHost() {
    const fixture = TestBed.createComponent(CompositeHarnessHostComponent);
    return {
      loader: TestbedHarnessEnvironment.loader(fixture),
      instance: fixture.componentInstance,
    };
  }

  it('activates menu items by text without decorating the match with shortcuts or badges', async () => {
    const { loader, instance } = createHost();
    const menu = await loader.getHarness(NeuMenuHarness);
    expect(await menu.getItemTexts()).toEqual(['Create', 'Files', 'Import']);
    await menu.clickItem('Create');
    expect(instance.lastAction).toBe('create');
    await menu.clickItem(/Files/);
    expect(await menu.getItemTexts()).toEqual(['Create', 'Files']);
    await menu.clickItem('Files');
    expect(await menu.getItemTexts()).toEqual(['Create', 'Files', 'Import']);
    await menu.clickItem('Import');
    expect(instance.lastAction).toBe('import');
    await expect(menu.clickItem('Missing')).rejects.toThrow(/menu item.*Missing/);
  });

  it('reads and selects tabs without matching tabs from a nested tablist', async () => {
    const { loader } = createHost();
    const tabs = await loader.getHarness(NeuTabsHarness);
    expect(await tabs.getTabTexts()).toEqual(['Overview', 'Activity']);
    expect(await tabs.getActiveTabText()).toBe('Overview');
    await tabs.selectTab('Activity');
    expect(await tabs.getActiveTabText()).toBe('Activity');
    await expect(tabs.selectTab('Nested')).rejects.toThrow(/tab.*Nested/);
  });

  it('operates the TreeSelect instance overlay and expands a branch before selecting its child', async () => {
    const { loader, instance } = createHost();
    const [department, location] = await loader.getAllHarnesses(NeuTreeSelectHarness);
    expect(await department.isOpen()).toBe(false);
    expect(await department.getNodeTexts()).toEqual([]);
    await department.close();
    await location.open();
    expect(await location.getNodeTexts()).toEqual(['New York']);
    expect(await department.getNodeTexts()).toEqual([]);
    await location.close();
    expect(await location.isOpen()).toBe(false);
    await department.setNodeExpanded('Engineering', true);
    await department.setNodeExpanded('Engineering', true);
    expect(instance.departmentsExpanded).toEqual(['engineering']);
    expect(await department.getNodeTexts()).toEqual(['Engineering', 'Platform']);
    await expect(department.setNodeExpanded('Platform', true)).rejects.toThrow(/cannot expand/);
    await department.selectNode('Platform');
    expect(await department.getValueText()).toBe('Platform');
    expect(await department.isOpen()).toBe(false);
  });

  it('expands and collapses TreeSelect nodes with the keyboard in RTL', async () => {
    const { loader, instance } = createHost();
    instance.direction = 'rtl';
    const department = await loader.getHarness(NeuTreeSelectHarness);
    await department.setNodeExpanded('Engineering', true);
    expect(instance.departmentsExpanded).toEqual(['engineering']);
    await department.setNodeExpanded('Engineering', false);
    expect(instance.departmentsExpanded).toEqual([]);
  });

  it('reads only data rows in TreeTable and toggles expansion without selecting a row', async () => {
    const { loader, instance } = createHost();
    const table = await loader.getHarness(NeuTreeTableHarness);
    expect(await table.getRowCount()).toBe(1);
    expect(await table.getCellText(0, 0)).toBe('Portfolio');
    await table.setRowExpanded(0, false);
    await table.setRowExpanded(0, true);
    expect(instance.rowsExpanded).toEqual(['root']);
    expect(await table.getRowCount()).toBe(2);
    expect(await table.getCellText(1, 0)).toBe('Project');
    await expect(table.setRowExpanded(1, true)).rejects.toThrow(/cannot expand/);
    await expect(table.getCellText(2, 0)).rejects.toThrow(/row 2/);
    await expect(table.getCellText(0, 1)).rejects.toThrow(/column 1/);
    await table.setRowExpanded(0, false);
    expect(await table.getRowCount()).toBe(1);
  });
});

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
      ><div class="neu-date-input__trigger">
        <input class="neu-date-input__field" aria-expanded="true" value="May 14" /><button
          class="neu-date-input__open"
        >
          Open
        </button>
      </div></neu-date-input
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
    await select['selectOption'](/Two/);
    await select.close();

    const date = await loader.getHarness(NeuDateInputHarness);
    expect(await date.isOpen()).toBe(true);
    expect(await date.getDisplayValue()).toContain('May 14');
    await date.open();
    await date.selectDay(14);
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

  it('returns absent optional content and leaves already closed controls closed', async () => {
    const fixture = TestBed.createComponent(StaticHarnessHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector('.neu-input__static-label')?.remove();
    host.querySelector('.neu-input__error')?.remove();
    host.querySelector('.neu-dialog__title')?.remove();
    host.querySelector('.neu-dialog__body')?.remove();
    host.querySelector('.neu-dialog__close')?.remove();
    host.querySelector('.neu-dialog__panel')?.remove();
    host.querySelector('.neu-select__trigger')?.setAttribute('aria-expanded', 'false');
    host.querySelector('.neu-date-input__field')?.setAttribute('aria-expanded', 'false');

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const input = await loader.getHarness(NeuInputHarness);
    expect(await input.getLabel()).toBeNull();
    expect(await input.getError()).toBeNull();

    const select = await loader.getHarness(NeuSelectHarness);
    expect(await select.isOpen()).toBe(false);
    await select.close();
    const trigger = host.querySelector('.neu-select__trigger') as HTMLButtonElement;
    const selectClick = vi.fn();
    trigger.addEventListener('click', selectClick);
    await select.open();
    expect(selectClick).toHaveBeenCalledOnce();

    const date = await loader.getHarness(NeuDateInputHarness);
    expect(await date.isOpen()).toBe(false);
    await date.close();
    const openButton = host.querySelector('.neu-date-input__open') as HTMLButtonElement;
    const dateClick = vi.fn();
    openButton.addEventListener('click', dateClick);
    await date.open();
    expect(dateClick).toHaveBeenCalledOnce();

    const dialog = await loader.getHarness(NeuDialogHarness);
    expect(await dialog.isOpen()).toBe(false);
    expect(await dialog.getTitle()).toBeNull();
    expect(await dialog.getBodyText()).toBeNull();
    await dialog.close();
  });
});
