import { Directive, TemplateRef } from '@angular/core';
import type { NeuIconKey } from '@neural-ui/core/foundation';

export interface NeuMenuItem {
  key: string;
  label: string;
  icon?: NeuIconKey;
  badge?: string | number;
  active?: boolean;
  command?: (event: { originalEvent: Event; item: NeuMenuItem }) => void;
  routerLink?: string | unknown[];
  url?: string;
  target?: string;
  rel?: string;
  tooltip?: string;
  visible?: boolean;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: NeuMenuItem[];
  data?: unknown;
}

/** Custom visual content for each menu item; menu semantics remain owned by the component. */
@Directive({ selector: 'ng-template[neuMenuItem]' })
export class NeuMenuItemDirective {
  constructor(readonly templateRef: TemplateRef<{ $implicit: NeuMenuItem }>) {}
}
