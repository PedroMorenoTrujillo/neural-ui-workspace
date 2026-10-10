import {
  NeuAccordionBodyContext,
  NeuAccordionComponent,
  NeuAccordionHeaderContext,
  NeuAccordionItem,
  NeuAccordionPanelToggle,
} from '@neural-ui/core/accordion';

interface AccountItem extends NeuAccordionItem<number> {
  readonly accountId: string;
}

declare const accordion: NeuAccordionComponent<number, AccountItem>;
const items: readonly AccountItem[] = accordion.items();
const applied: readonly number[] | undefined = accordion.expandedKeys();
const initial: readonly number[] = accordion.initialExpandedKeys();
declare const header: NeuAccordionHeaderContext<AccountItem>;
declare const body: NeuAccordionBodyContext<AccountItem>;
declare const detail: NeuAccordionPanelToggle<number>;
const accountId: string = header.$implicit.accountId;
const bodyId: string = body.$implicit.accountId;
const key: number = detail.id;

void items;
void applied;
void initial;
void accountId;
void bodyId;
void key;

// @ts-expect-error boolean keys are outside the frozen semantic-key domain.
type InvalidKeyComponent = NeuAccordionComponent<boolean>;
// @ts-expect-error item-owned expansion was removed in N2-020.
const legacyItem: NeuAccordionItem = { id: 'legacy', title: 'Legacy', expanded: true };
void (null as unknown as InvalidKeyComponent);
void legacyItem;
