import { NeuPanelComponent } from '@neural-ui/core/panel';
import { NeuSidebarComponent } from '@neural-ui/core/sidebar';
import {
  NeuTab,
  NeuTabKey,
  NeuTabLabelContext,
  NeuTabsComponent,
} from '@neural-ui/core/tabs';

interface AccountTab extends NeuTab<number> {
  readonly accountId: string;
}

declare const tabs: NeuTabsComponent<number, AccountTab>;
declare const panel: NeuPanelComponent;
declare const sidebar: NeuSidebarComponent;
declare const label: NeuTabLabelContext<AccountTab>;
const items: readonly AccountTab[] = tabs.tabs();
const active: number | null | undefined = tabs.activeId();
const initial: number | null = tabs.initialActiveId();
const collapsedPanel: boolean | undefined = panel.collapsed();
const collapsedSidebar: boolean | undefined = sidebar.collapsed();
const accountId: string = label.$implicit.accountId;

void items;
void active;
void initial;
void collapsedPanel;
void collapsedSidebar;
void accountId;

// @ts-expect-error boolean keys are outside the frozen semantic-key domain.
type InvalidTabs = NeuTabsComponent<boolean>;
// @ts-expect-error tabParam was removed; URL synchronization is external.
tabs.tabParam;
// @ts-expect-error the old tabChange output was removed.
tabs.tabChange;
void (null as unknown as InvalidTabs);
void (null as unknown as NeuTabKey);
