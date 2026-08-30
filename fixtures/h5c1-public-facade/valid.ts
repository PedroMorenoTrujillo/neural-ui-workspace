import type { NeuCompareComponent, NeuCompareOrientation } from '@neural-ui/core/compare';
import type { NeuContextMenuDirective } from '@neural-ui/core/context-menu';
import type { NeuImageViewerDirective } from '@neural-ui/core/image-viewer';
import type { NeuOptionFilterConfig } from '@neural-ui/core/option-api';
import type { NeuPopoverDirective } from '@neural-ui/core/popover';
import type { NeuRadioGroupComponent } from '@neural-ui/core/radio';
import type { NeuRichTextEditorComponent } from '@neural-ui/core/rich-text-editor';
import type { NeuTabsComponent } from '@neural-ui/core/tabs';
import type { NeuTooltipDirective } from '@neural-ui/core/tooltip';
import type { NeuVirtualListComponent } from '@neural-ui/core/virtual-list';

export type H5C1SupportedFacade = readonly [
  NeuCompareComponent,
  NeuCompareOrientation,
  NeuContextMenuDirective,
  NeuImageViewerDirective,
  NeuOptionFilterConfig<unknown>,
  NeuPopoverDirective,
  NeuRadioGroupComponent,
  NeuRichTextEditorComponent,
  NeuTabsComponent,
  NeuTooltipDirective,
  NeuVirtualListComponent,
];
