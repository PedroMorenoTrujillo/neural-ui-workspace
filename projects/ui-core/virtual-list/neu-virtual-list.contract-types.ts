import type { NeuVirtualListComponent } from './neu-virtual-list.component';
import type {
  NeuVirtualItemContext, NeuVirtualListKey, NeuVirtualListRange, NeuVirtualListScrollTarget,
} from './neu-virtual-list.types';

interface Row { readonly id: number; readonly label: string }
declare const list: NeuVirtualListComponent<Row, number>;
declare const context: NeuVirtualItemContext<Row, number>;
const rows: readonly Row[] = list.items();
const key: number = list.itemKey()(context.item);
const logicalIndex: number = context.index;
const range: NeuVirtualListRange = { start: 0, end: 10 };
const byKey: NeuVirtualListScrollTarget<number> = { key, align: 'nearest' };
const byIndex: NeuVirtualListScrollTarget<number> = { index: logicalIndex, align: 'center' };
const accepted: boolean = list.scrollTo(byKey) || list.scrollTo(byIndex);
const semanticKey: NeuVirtualListKey = context.key;
void [rows, range, accepted, semanticKey];

// @ts-expect-error key domain is numeric for this instance
list.scrollTo({ key: 'wrong' });
// @ts-expect-error applied items are readonly
rows.push({ id: 1, label: 'bad' });
// @ts-expect-error no raw DOM scroll event in the public range contract
const invalidRange: NeuVirtualListRange = { start: 0, end: 1, event: new Event('scroll') };
void invalidRange;
